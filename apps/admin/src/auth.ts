import { useSyncExternalStore } from 'react';
import type { AuthResult, AuthUser, TokenPair, UserRole } from '@chess/types';
import { UserRole as UserRoleValues } from '@chess/types';
import { LocalStore, type UserAccount } from './api/localStore';

const STORAGE_KEY = 'grand_chess_player_session';
const FALLBACK_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface PlayerSession {
  user: AuthUser;
  account?: UserAccount;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn?: number | undefined;
}

export function isStaffRole(_role?: UserRole): boolean {
  return true; // All players are permitted
}

export function userAccountToAuthUser(acc: UserAccount): AuthUser {
  return {
    id: acc.id,
    username: acc.username,
    email: acc.email,
    displayName: acc.displayName,
    avatarUrl: acc.avatarUrl ?? null,
    role: UserRoleValues.USER,
    status: 'ACTIVE',
    createdAt: acc.createdAt,
  };
}

function readStoredSession(): PlayerSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const record = JSON.parse(raw) as Partial<PlayerSession>;
      if (record.user && record.accessToken && (record.expiresAt ?? 0) > Date.now()) {
        return record as PlayerSession;
      }
    }

    // Fallback: check LocalStore
    const localUser = LocalStore.getCurrentUser();
    if (localUser) {
      return {
        user: userAccountToAuthUser(localUser),
        account: localUser,
        accessToken: `local_token_${localUser.id}`,
        refreshToken: `local_refresh_${localUser.id}`,
        expiresAt: Date.now() + FALLBACK_TTL_SECONDS * 1000,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function persist(next: PlayerSession | null): void {
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

const listeners = new Set<() => void>();
let session: PlayerSession | null = readStoredSession();
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

function emit(): void {
  for (const listener of [...listeners]) listener();
}

const MAX_TIMER_MS = 2147483647; // setTimeout overflow limit (~24.8 days)

function armExpiryTimer(next: PlayerSession | null): void {
  if (expiryTimer !== undefined) clearTimeout(expiryTimer);
  expiryTimer = undefined;
  if (!next) return;
  const delay = Math.max(0, next.expiresAt - Date.now());
  // Expiries beyond the timer limit are enforced by getSnapshot on read instead.
  if (delay > MAX_TIMER_MS) return;
  expiryTimer = setTimeout(() => {
    session = null;
    persist(null);
    emit();
  }, delay);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): PlayerSession | null {
  if (session && session.expiresAt <= Date.now()) {
    session = null;
    persist(null);
  }
  return session;
}

export function setSession(next: PlayerSession | null): void {
  session = next;
  persist(next);
  armExpiryTimer(next);
  emit();
}

function ttlSeconds(accessExpiresIn: number | undefined): number {
  return typeof accessExpiresIn === 'number' && accessExpiresIn > 0 ? accessExpiresIn : FALLBACK_TTL_SECONDS;
}

export function isTokenPair(value: AuthResult | TokenPair): value is TokenPair {
  return typeof (value as TokenPair).accessToken === 'string' && !('user' in value);
}

export function signIn(result: AuthResult): void {
  if (!result?.tokens) return;
  setSession({
    user: result.user,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    expiresAt: Date.now() + ttlSeconds(result.tokens.accessExpiresIn) * 1000,
  });
}

export function applyTokens(tokens: SessionTokens, user?: AuthUser | null): void {
  const target = user ?? session?.user ?? null;
  if (!target) return;
  setSession({
    user: target,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + ttlSeconds(tokens.accessExpiresIn) * 1000,
  });
}

export function signOut(): void {
  LocalStore.signOut();
  setSession(null);
}

export function useSession(): PlayerSession | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useCurrentUser(): AuthUser | null {
  return useSession()?.user ?? null;
}

export function getAccessToken(): string | null {
  return getSnapshot()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return getSnapshot()?.refreshToken ?? null;
}
