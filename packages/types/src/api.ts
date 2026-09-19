import type { BoardTheme, GameType, RatingType, ReportReason, TimeControl } from './enums.js';
import type { AuthUser, FriendRequestDto, GameListItem, LeaderboardEntry, NotificationDto, PublicProfile, SessionDto, UserSettingsDto, UserSummary } from './entities.js';

// ---------- Pagination ----------
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface OffsetPage<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ---------- Auth ----------
export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  /** Email or username */
  identifier: string;
  password: string;
  deviceLabel?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
}

export interface AuthResult {
  user: AuthUser;
  tokens: TokenPair;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}

// ---------- Users / profiles ----------
export interface UpdateMeInput {
  displayName?: string | null;
  bio?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailInput {
  email: string;
  password: string;
}

export interface UsernameAvailability {
  username: string;
  available: boolean;
}

// ---------- Games ----------
export interface CreateGameInput {
  type: Extract<GameType, 'PRIVATE' | 'CHALLENGE'>;
  timeControlId: string;
  opponentUserId?: string;
  spectatorEnabled?: boolean;
}

export interface CreatedGame {
  gameId: string;
  gameCode: string;
  shareLink: string;
  status: 'WAITING';
  timeControl: TimeControl;
}

export interface JoinByCodeInput {
  gameCode: string;
}

export interface ActiveGameEntry {
  gameId: string;
  opponentName: string;
  myColor: 'w' | 'b';
  remainingMs: number;
  myTurn: boolean;
  status: 'ACTIVE' | 'WAITING';
}

// ---------- Matchmaking ----------
export interface EnqueueInput {
  timeControlId: string;
}

export interface QueueStatus {
  inQueue: boolean;
  timeControlId: string | null;
  estimatedWaitSec: number | null;
  position: number | null;
}

// ---------- Friends ----------
export interface FriendsList {
  online: UserSummary[];
  offline: UserSummary[];
  requests: FriendRequestDto[];
  blocked: UserSummary[];
}

export interface SendFriendRequestInput {
  username: string;
}

// ---------- Leaderboard ----------
export type LeaderboardScope = 'global' | 'friends' | 'country';
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

export interface LeaderboardQuery {
  ratingType: RatingType;
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  country?: string;
  cursor?: string;
  limit?: number;
}

export interface LeaderboardPage extends CursorPage<LeaderboardEntry> {
  myRank: number | null;
}

// ---------- Settings ----------
export interface UpdateSettingsInput extends Partial<UserSettingsDto> {}

// ---------- Notifications ----------
export interface NotificationList extends OffsetPage<NotificationDto> {}

// ---------- Reports ----------
export interface CreateReportInput {
  reportedUserId: string;
  gameId?: string;
  reason: ReportReason;
  description?: string;
}

// ---------- Sessions / security ----------
export interface SessionList {
  sessions: SessionDto[];
}

// ---------- Uploads ----------
export interface UploadUrlResult {
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
}

// ---------- Users search ----------
export interface UserSearchResult extends OffsetPage<UserSummary> {
  query: string;
}

// ---------- Home ----------
export interface OnlineCount {
  playersOnline: number;
}

export interface DailyChallenge {
  fen: string;
  solution: string[];
  theme: string | null;
}

export interface HomeData {
  me: AuthUser;
  onlineCount: number;
  activeGames: ActiveGameEntry[];
  topPlayers: LeaderboardEntry[];
  recentGames: GameListItem[];
  dailyChallenge: DailyChallenge | null;
  friendsOnline: UserSummary[];
}
