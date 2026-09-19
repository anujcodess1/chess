import type { ChessColor, FinishReason, GameResult } from './enums.js';
import type { ErrorCode } from './errors.js';
import type { ClockState, GameStateSnapshot, NotificationDto } from './entities.js';

/**
 * Strongly typed WebSocket events (§26).
 *
 * Client → server events use `game:*` / `matchmaking:*` / `chat:*`.
 * Server → client events mirror them. The server is authoritative: clients
 * never apply state without a server broadcast.
 *
 * NOTE: `game:draw-offered`, `game:draw-offer-declined`, `chat:message`,
 * `chat:typing` and the `matchmaking:*` events extend the §26 list to cover
 * the draw-offer, chat (§20) and matchmaking (§9) flows it requires.
 */

// ---------- Payloads ----------

export interface JoinGamePayload {
  gameId: string;
  asSpectator?: boolean;
}

export interface MovePayload {
  gameId: string;
  /** Client-generated UUID; server dedupes for idempotent retries (§39). */
  moveId: string;
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export interface GameMoveAck {
  gameId: string;
  moveId: string;
  ply: number;
  san: string;
  from: string;
  to: string;
  promotion: string | null;
  fenAfter: string;
  playedBy: ChessColor;
  clock: ClockState;
  turn: ChessColor;
  inCheck: boolean;
  checkmate: boolean;
  stalemate: boolean;
  /** Draw-type game ends detected by the engine. */
  finished?: { result: GameResult; reason: FinishReason };
  captured: { square: string; piece: string } | null;
}

export interface ResignPayload {
  gameId: string;
}

export interface DrawOfferPayload {
  gameId: string;
}

export interface RematchPayload {
  gameId: string;
}

export interface EnqueuePayload {
  timeControlId: string;
}

export interface ChatMessagePayload {
  gameId: string;
  /** Client-generated UUID for dedupe. */
  messageId: string;
  text: string;
}

export interface ChatTypingPayload {
  gameId: string;
  typing: boolean;
}

export interface WsError {
  code: ErrorCode | string;
  message: string;
  gameId?: string;
}

// ---------- Event maps ----------

export interface WsClientToServerEvents {
  'game:join': (payload: JoinGamePayload, ack?: (res: { ok: boolean; error?: WsError; snapshot?: GameStateSnapshot }) => void) => void;
  'game:leave': (payload: { gameId: string }) => void;
  'game:move': (payload: MovePayload, ack?: (res: { ok: boolean; error?: WsError; ack?: GameMoveAck }) => void) => void;
  'game:resign': (payload: ResignPayload) => void;
  'game:offer-draw': (payload: DrawOfferPayload) => void;
  'game:accept-draw': (payload: DrawOfferPayload) => void;
  'game:decline-draw': (payload: DrawOfferPayload) => void;
  'game:rematch': (payload: RematchPayload) => void;
  'game:typing': (payload: ChatTypingPayload) => void;
  'chat:message': (payload: ChatMessagePayload) => void;
  'matchmaking:enqueue': (payload: EnqueuePayload, ack?: (res: { ok: boolean; error?: WsError }) => void) => void;
  'matchmaking:cancel': () => void;
}

export interface WsServerToClientEvents {
  'game:joined': (payload: { gameId: string; role: 'player' | 'spectator'; color: ChessColor | null; snapshot: GameStateSnapshot }) => void;
  /** Sent to both players when a challenged/invited game begins (§41). */
  'game:start': (payload: { gameId: string; color: ChessColor }) => void;
  'game:state': (payload: { gameId: string; snapshot: GameStateSnapshot }) => void;
  'game:move': (payload: GameMoveAck) => void;
  'game:clock': (payload: { gameId: string; clock: ClockState }) => void;
  'game:check': (payload: { gameId: string; color: ChessColor; fen: string }) => void;
  'game:checkmate': (payload: { gameId: string; winnerColor: ChessColor }) => void;
  'game:draw': (payload: { gameId: string; reason: FinishReason }) => void;
  'game:resigned': (payload: { gameId: string; byColor: ChessColor }) => void;
  'game:timeout': (payload: { gameId: string; winnerColor: ChessColor | null }) => void;
  'game:opponent-connected': (payload: { gameId: string }) => void;
  'game:opponent-disconnected': (payload: { gameId: string; graceSeconds: number }) => void;
  'game:reconnected': (payload: { gameId: string; snapshot: GameStateSnapshot }) => void;
  'game:finished': (payload: {
    gameId: string;
    result: GameResult;
    reason: FinishReason;
    ratingChanges: { white: number; black: number };
    pgn: string;
    /** Present when a rematch was created from this game. */
    rematchGameId?: string;
  }) => void;
  'game:error': (payload: WsError) => void;
  'game:draw-offered': (payload: { gameId: string; byColor: ChessColor }) => void;
  'game:draw-offer-declined': (payload: { gameId: string }) => void;
  'game:chat-message': (payload: { gameId: string; messageId: string; fromUserId: string; fromUsername: string; color: ChessColor | 'spectator' | 'system'; text: string; sentAt: string }) => void;
  'game:chat-typing': (payload: { gameId: string; color: ChessColor; typing: boolean }) => void;
  'matchmaking:queued': (payload: { timeControlId: string; position: number }) => void;
  'matchmaking:cancelled': () => void;
  'matchmaking:found': (payload: { gameId: string; color: ChessColor }) => void;
  'notification:new': (payload: NotificationDto) => void;
}

export type WsClientEventName = keyof WsClientToServerEvents;
export type WsServerEventName = keyof WsServerToClientEvents;
