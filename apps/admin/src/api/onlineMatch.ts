/**
 * Local Online Multiplayer & Matchmaking Engine for Grand Chess.
 * Handles random player queue, instant pairing across windows/tabs,
 * room codes, live moves, in-game chat, and presence — all without a server.
 */

const ROOMS_STORAGE_KEY = 'grand_chess_rooms';
const ROOM_TTL_MS = 5 * 60 * 60 * 1000;

interface StoredRoom {
  roomId: string;
  name: string;
  password?: string;
  timeControl: string;
  colorPreference: 'white' | 'black' | 'random';
  host: OnlinePlayerInfo;
  createdAt: number;
}

export interface OnlineMovePayload {
  from: string;
  to: string;
  promotion?: string;
  timeRemaining: number;
}

export interface OnlinePlayerInfo {
  id: string;
  username: string;
  rating: number;
  color: 'white' | 'black';
  title?: string;
}

export interface PresenceStats {
  onlineCount: number;
  queueCount: number;
  activeMatchesCount: number;
  openRoomsCount?: number;
}

export type OnlineMessage =
  | { type: 'QUEUE_ENTER'; player: OnlinePlayerInfo; timeControl: string; timestamp: number }
  | { type: 'QUEUE_MATCH_FOUND'; matchId: string; whitePlayer: OnlinePlayerInfo; blackPlayer: OnlinePlayerInfo; timeControl: string }
  | { type: 'ROOM_PING'; roomCode: string; player: OnlinePlayerInfo }
  | { type: 'ROOM_JOIN'; roomCode: string; player: OnlinePlayerInfo }
  | { type: 'MATCH_READY'; roomCode: string; whitePlayer: OnlinePlayerInfo; blackPlayer: OnlinePlayerInfo }
  | { type: 'MOVE'; roomCode?: string; matchId?: string; senderId: string; move: OnlineMovePayload }
  | { type: 'RESIGN'; roomCode?: string; matchId?: string; senderId: string }
  | { type: 'DRAW_OFFER'; roomCode?: string; matchId?: string; senderId: string }
  | { type: 'DRAW_ACCEPT'; roomCode?: string; matchId?: string }
  | { type: 'CHAT'; roomCode?: string; matchId?: string; senderName: string; text: string }
  | { type: 'PRESENCE'; stats: PresenceStats };

type MessageCallback = (msg: OnlineMessage) => void;
type PresenceCallback = (stats: PresenceStats) => void;

export function getOrCreatePlayerSessionId(): string {
  if (typeof window === 'undefined') return 'server_player';
  let id = sessionStorage.getItem('grand_chess_player_id');
  if (!id) {
    id = `player_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    sessionStorage.setItem('grand_chess_player_id', id);
  }
  return id;
}

class OnlineManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<MessageCallback> = new Set();
  private presenceListeners: Set<PresenceCallback> = new Set();
  private pendingQueuePlayer: { player: OnlinePlayerInfo; timeControl: string; timestamp: number } | null = null;
  private currentPresence: PresenceStats = { onlineCount: 1, queueCount: 0, activeMatchesCount: 0 };
  private myPlayerId: string = getOrCreatePlayerSessionId();

  constructor() {
    this.initBroadcastChannel();
    this.initStorageListener();
  }

  public getPlayerId(): string {
    return this.myPlayerId;
  }

  public getPresence(): PresenceStats {
    return this.currentPresence;
  }

  private initBroadcastChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('grand_chess_online_bus');
      this.channel.onmessage = (event) => {
        this.handleIncoming(event.data as OnlineMessage);
      };
    }
  }

  private initStorageListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'grand_chess_online_packet' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue) as OnlineMessage;
            this.handleIncoming(data);
          } catch {}
        }
      });
    }
  }

  private handleIncoming(msg: OnlineMessage): void {
    // 1. Cross-tab pairing logic if both tabs are local and server response is pending
    if (msg.type === 'QUEUE_ENTER' && this.pendingQueuePlayer) {
      if (msg.player.id !== this.pendingQueuePlayer.player.id && msg.timeControl === this.pendingQueuePlayer.timeControl) {
        const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const isSelfWhite = Math.random() > 0.5;

        const whitePlayer: OnlinePlayerInfo = {
          ...this.pendingQueuePlayer.player,
          color: isSelfWhite ? 'white' : 'black',
        };

        const blackPlayer: OnlinePlayerInfo = {
          ...msg.player,
          color: isSelfWhite ? 'black' : 'white',
        };

        this.broadcast({
          type: 'QUEUE_MATCH_FOUND',
          matchId,
          whitePlayer: isSelfWhite ? whitePlayer : blackPlayer,
          blackPlayer: isSelfWhite ? blackPlayer : whitePlayer,
          timeControl: msg.timeControl,
        });

        this.pendingQueuePlayer = null;
        return;
      }
    }

    this.emit(msg);
  }

  public async registerInQueue(player: OnlinePlayerInfo, timeControl: string): Promise<void> {
    this.pendingQueuePlayer = { player, timeControl, timestamp: Date.now() };

    // Notify local tabs via broadcast
    this.broadcast({
      type: 'QUEUE_ENTER',
      player,
      timeControl,
      timestamp: Date.now(),
    });
  }

  public async cancelQueue(): Promise<void> {
    this.pendingQueuePlayer = null;
  }

  public async sendMove(matchId: string, move: OnlineMovePayload): Promise<void> {
    this.broadcast({
      type: 'MOVE',
      roomCode: matchId,
      matchId,
      senderId: this.myPlayerId,
      move,
    });
  }

  public async sendChat(matchId: string, senderName: string, text: string): Promise<void> {
    this.broadcast({
      type: 'CHAT',
      roomCode: matchId,
      matchId,
      senderName,
      text,
    });
  }

  public async sendResign(matchId: string): Promise<void> {
    this.broadcast({
      type: 'RESIGN',
      roomCode: matchId,
      matchId,
      senderId: this.myPlayerId,
    });
  }

  public async joinCustomRoom(roomCode: string, player: OnlinePlayerInfo): Promise<void> {
    this.broadcast({
      type: 'ROOM_JOIN',
      roomCode,
      player,
    });
  }

  // Room Creation with Password and 30s Cooldown Enforcement
  public getRemainingRoomCooldown(): number {
    if (typeof window === 'undefined') return 0;
    const until = Number(sessionStorage.getItem('room_cooldown_until') || 0);
    const remaining = Math.ceil((until - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  private readRooms(): Record<string, StoredRoom> {
    try {
      const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
      if (!raw) return {};
      const rooms = JSON.parse(raw) as Record<string, StoredRoom>;
      const now = Date.now();
      let changed = false;
      for (const [id, room] of Object.entries(rooms)) {
        if (!room || now - room.createdAt > ROOM_TTL_MS) {
          delete rooms[id];
          changed = true;
        }
      }
      if (changed) localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
      return rooms;
    } catch {
      return {};
    }
  }

  public async createCustomRoom(params: {
    name: string;
    password?: string;
    timeControl: string;
    colorPreference: 'white' | 'black' | 'random';
    host: OnlinePlayerInfo;
    customRoomId?: string;
  }): Promise<{ ok: boolean; roomId?: string; error?: string; remainingSeconds?: number; room?: any }> {
    const localCooldown = this.getRemainingRoomCooldown();
    if (localCooldown > 0) {
      return { ok: false, error: 'COOLDOWN', remainingSeconds: localCooldown };
    }

    const roomId = (params.customRoomId || `FOREST-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
    const rooms = this.readRooms();
    const room: StoredRoom = {
      roomId,
      name: params.name,
      password: params.password || undefined,
      timeControl: params.timeControl,
      colorPreference: params.colorPreference,
      host: params.host,
      createdAt: Date.now(),
    };
    rooms[roomId] = room;
    try {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    } catch {}

    return { ok: true, roomId, room: { ...room, hasPassword: Boolean(room.password) } };
  }

  public async closeCustomRoom(roomId: string): Promise<{ ok: boolean; cooldownSeconds: number }> {
    const cooldownUntil = Date.now() + 30000;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('room_cooldown_until', String(cooldownUntil));
    }

    const rooms = this.readRooms();
    delete rooms[roomId.trim().toUpperCase()];
    try {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    } catch {}

    return { ok: true, cooldownSeconds: 30 };
  }

  public async joinRoomWithPassword(
    roomId: string,
    password: string | undefined,
    player: OnlinePlayerInfo
  ): Promise<{ ok: boolean; match?: any; error?: string; message?: string }> {
    const code = roomId.trim().toUpperCase();
    const room = this.readRooms()[code];

    if (!room) {
      return { ok: false, error: 'ROOM_NOT_FOUND', message: 'Room not found. Ask the host to create it again.' };
    }
    if (room.password && room.password !== (password ?? '').trim()) {
      return { ok: false, error: 'WRONG_PASSWORD', message: 'Incorrect room password.' };
    }
    if (room.host.id === player.id) {
      return { ok: false, error: 'HOST_JOIN', message: 'You are the host of this room — enter it from the room card.' };
    }

    this.broadcast({ type: 'ROOM_JOIN', roomCode: code, player });
    return { ok: true };
  }

  public async fetchOpenRooms(): Promise<Array<{ roomId: string; name: string; timeControl: string; hasPassword: boolean; hostName: string; hostRating: number }>> {
    const rooms = this.readRooms();
    return Object.values(rooms)
      .filter((room) => room.host.id !== this.myPlayerId)
      .map((room) => ({
        roomId: room.roomId,
        name: room.name,
        timeControl: room.timeControl,
        hasPassword: Boolean(room.password),
        hostName: room.host.username,
        hostRating: room.host.rating,
      }));
  }

  public subscribe(cb: MessageCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public subscribePresence(cb: PresenceCallback): () => void {
    this.presenceListeners.add(cb);
    cb(this.currentPresence);
    return () => {
      this.presenceListeners.delete(cb);
    };
  }

  public broadcast(msg: OnlineMessage): void {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {}
    }
    try {
      localStorage.setItem('grand_chess_online_packet', JSON.stringify({ ...msg, _t: Date.now() }));
    } catch {}
    this.emit(msg);
  }

  private emit(msg: OnlineMessage): void {
    for (const listener of this.listeners) {
      try {
        listener(msg);
      } catch {}
    }
  }
}

export const onlineService = new OnlineManager();
