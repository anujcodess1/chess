import type {
  AccountStatus,
  BoardTheme,
  FinishReason,
  GameResult,
  GameStatus,
  GameType,
  ChessColor,
  NotificationType,
  RatingType,
  TimeControl,
  UserRole,
} from './enums.js';

export interface UserSummary {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  online: boolean;
}

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  country: string | null;
  createdAt: string;
  ratings: Record<RatingType, RatingEntry>;
  stats: PlayerStats;
  achievements: Achievement[];
  favoriteOpening: string | null;
}

export interface RatingEntry {
  type: RatingType;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  bestRating: number;
  currentStreak: number;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  bestRating: number;
  longestStreak: number;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
}

export interface GamePlayerInfo {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  rating: number;
  ratingChange?: number;
  color: ChessColor;
  connected: boolean;
  remainingMs: number;
}

export interface MoveRecord {
  id: string;
  ply: number;
  moveNumber: number;
  san: string;
  from: string;
  to: string;
  promotion: string | null;
  fenAfter: string;
  playedByUserId: string;
  playedAt: string;
  clockAfterMs: number;
}

export interface GameListItem {
  id: string;
  type: GameType;
  status: GameStatus;
  result: GameResult;
  reason: FinishReason | null;
  timeControl: TimeControl;
  white: UserSummary & { rating: number };
  black: UserSummary & { rating: number };
  myColor: ChessColor | null;
  ratingChange: number | null;
  moveCount: number;
  opening: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface GameDetail extends GameListItem {
  pgn: string | null;
  fen: string;
  moves: MoveRecord[];
}

/** Live, authoritative snapshot broadcast to clients. */
export interface GameStateSnapshot {
  gameId: string;
  status: GameStatus;
  turn: ChessColor;
  fen: string;
  lastMove: { from: string; to: string; san: string } | null;
  inCheck: boolean;
  checkedColor: ChessColor | null;
  white: GamePlayerInfo;
  black: GamePlayerInfo;
  timeControl: TimeControl;
  result: GameResult;
  reason: FinishReason | null;
  moveCount: number;
  /** Monotonic version for client-side reconciliation. */
  version: number;
  /** Server epoch ms at snapshot time — clients compute clock offset from it. */
  serverNow: number;
  spectatorEnabled: boolean;
  drawOffer: { byColor: ChessColor } | null;
}

export interface ClockState {
  whiteRemainingMs: number;
  blackRemainingMs: number;
  turn: ChessColor;
  serverNow: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: UserSummary;
  rating: number;
  gamesPlayed: number;
  winRate: number;
  ratingChange?: number;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface UserSettingsDto {
  boardTheme: BoardTheme;
  animationsEnabled: boolean;
  autoQueen: boolean;
  confirmMoves: boolean;
  showLegalMoves: boolean;
  sounds: { move: boolean; capture: boolean; check: boolean; notification: boolean };
  notifications: { push: boolean; game: boolean; friend: boolean };
  privacy: {
    profileVisible: boolean;
    showOnlineStatus: boolean;
    allowChallenges: boolean;
    allowMessages: boolean;
  };
  chatEnabled: boolean;
  fixedCamera: boolean;
}

export interface FriendRequestDto {
  id: string;
  from: UserSummary;
  to: UserSummary;
  createdAt: string;
}

export interface SessionDto {
  id: string;
  deviceLabel: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}
