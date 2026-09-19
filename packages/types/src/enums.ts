export const UserRole = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
  DELETED: 'DELETED',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

/** Game state machine (§38). Never use arbitrary boolean flags for game state. */
export const GameStatus = {
  WAITING: 'WAITING',
  MATCHED: 'MATCHED',
  ACTIVE: 'ACTIVE',
  FINISHED: 'FINISHED',
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const FinishReason = {
  CHECKMATE: 'CHECKMATE',
  STALEMATE: 'STALEMATE',
  RESIGNATION: 'RESIGNATION',
  TIMEOUT: 'TIMEOUT',
  DRAW_AGREEMENT: 'DRAW_AGREEMENT',
  THREEFOLD_REPETITION: 'THREEFOLD_REPETITION',
  FIFTY_MOVE_RULE: 'FIFTY_MOVE_RULE',
  INSUFFICIENT_MATERIAL: 'INSUFFICIENT_MATERIAL',
  ABANDONMENT: 'ABANDONMENT',
} as const;
export type FinishReason = (typeof FinishReason)[keyof typeof FinishReason];

export const GameResult = {
  WHITE_WIN: '1-0',
  BLACK_WIN: '0-1',
  DRAW: '1/2-1/2',
  NONE: '*',
} as const;
export type GameResult = (typeof GameResult)[keyof typeof GameResult];

export const RatingType = {
  BULLET: 'BULLET',
  BLITZ: 'BLITZ',
  RAPID: 'RAPID',
  CLASSICAL: 'CLASSICAL',
} as const;
export type RatingType = (typeof RatingType)[keyof typeof RatingType];

export const GameType = {
  MATCHMAKING: 'MATCHMAKING',
  PRIVATE: 'PRIVATE',
  CHALLENGE: 'CHALLENGE',
  CORRESPONDENCE: 'CORRESPONDENCE',
  PRACTICE: 'PRACTICE',
} as const;
export type GameType = (typeof GameType)[keyof typeof GameType];

export const ChessColor = {
  WHITE: 'w',
  BLACK: 'b',
} as const;
export type ChessColor = (typeof ChessColor)[keyof typeof ChessColor];

export const NotificationType = {
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  FRIEND_REQUEST_ACCEPTED: 'FRIEND_REQUEST_ACCEPTED',
  GAME_INVITATION: 'GAME_INVITATION',
  GAME_STARTED: 'GAME_STARTED',
  YOUR_TURN: 'YOUR_TURN',
  CHALLENGE_RECEIVED: 'CHALLENGE_RECEIVED',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
  RATING_MILESTONE: 'RATING_MILESTONE',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const ReportReason = {
  CHEATING: 'CHEATING',
  ABUSE: 'ABUSE',
  SPAM: 'SPAM',
  OFFENSIVE_PROFILE: 'OFFENSIVE_PROFILE',
  OTHER: 'OTHER',
} as const;
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export const ReportStatus = {
  OPEN: 'OPEN',
  REVIEWING: 'REVIEWING',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

/** Supported time controls (§9): base seconds + increment seconds. */
export interface TimeControl {
  id: string;
  baseSeconds: number;
  incrementSeconds: number;
}

export const TIME_CONTROLS: readonly TimeControl[] = [
  { id: '1+0', baseSeconds: 60, incrementSeconds: 0 },
  { id: '2+1', baseSeconds: 120, incrementSeconds: 1 },
  { id: '3+0', baseSeconds: 180, incrementSeconds: 0 },
  { id: '3+2', baseSeconds: 180, incrementSeconds: 2 },
  { id: '5+0', baseSeconds: 300, incrementSeconds: 0 },
  { id: '5+3', baseSeconds: 300, incrementSeconds: 3 },
  { id: '10+0', baseSeconds: 600, incrementSeconds: 0 },
  { id: '10+5', baseSeconds: 600, incrementSeconds: 5 },
  { id: '15+10', baseSeconds: 900, incrementSeconds: 10 },
  { id: '30+0', baseSeconds: 1800, incrementSeconds: 0 },
] as const;

export const ConnectionStatus = {
  OFFLINE: 'OFFLINE',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
} as const;
export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

export const BoardTheme = {
  CLASSIC: 'CLASSIC',
  MIDNIGHT: 'MIDNIGHT',
  ROYAL: 'ROYAL',
  MINIMAL: 'MINIMAL',
} as const;
export type BoardTheme = (typeof BoardTheme)[keyof typeof BoardTheme];
