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
  private listeners: Set<MessageCallback> = new Set();
  private presenceListeners: Set<PresenceCallback> = new Set();
  private sseEventSource: EventSource | null = null;
  private currentPresence: PresenceStats = { onlineCount: 1, queueCount: 0, activeMatchesCount: 0 };
  private myPlayerId: string = getOrCreatePlayerSessionId();

  constructor() {
    this.connectServerEvents();
  }

  public getPlayerId(): string {
    return this.myPlayerId;
  }

  public getPresence(): PresenceStats {
    return this.currentPresence;
  }

  public connectServerEvents(username = 'Guest'): void {
    if (typeof window === 'undefined') return;

    if (this.sseEventSource) {
      this.sseEventSource.close();
    }

    try {
      const sseUrl = `/api/matchmaking/events?playerId=${encodeURIComponent(this.myPlayerId)}&username=${encodeURIComponent(username)}`;
      const es = new EventSource(sseUrl);

      es.addEventListener('PRESENCE', (e) => {
        try {
          const stats = JSON.parse(e.data) as PresenceStats;
          this.currentPresence = stats;
          this.notifyPresence(stats);
        } catch {}
      });

      es.addEventListener('QUEUE_MATCH_FOUND', (e) => {
        try {
          const msg = JSON.parse(e.data) as OnlineMessage;
          this.handleIncoming(msg);
        } catch {}
      });

      es.addEventListener('MOVE', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.handleIncoming({
            type: 'MOVE',
            matchId: data.matchId,
            roomCode: data.matchId,
            senderId: data.senderId,
            move: data.move,
          });
        } catch {}
      });

      es.addEventListener('CHAT', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.handleIncoming({
            type: 'CHAT',
            matchId: data.matchId,
            roomCode: data.matchId,
            senderName: data.senderName,
            text: data.text,
          });
        } catch {}
      });

      es.addEventListener('ROOM_JOIN', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.handleIncoming({
            type: 'ROOM_JOIN',
            roomCode: data.roomCode,
            player: data.player,
          });
        } catch {}
      });

      es.addEventListener('RESIGN', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.handleIncoming({
            type: 'RESIGN',
            matchId: data.matchId,
            roomCode: data.matchId,
            senderId: data.senderId,
          });
        } catch {}
      });

      es.onerror = () => {
        es.close();
        setTimeout(() => this.connectServerEvents(username), 5000);
      };

      this.sseEventSource = es;
    } catch {}
  }

  private handleIncoming(msg: OnlineMessage): void {
    this.emit(msg);
  }

  public async registerInQueue(player: OnlinePlayerInfo, timeControl: string): Promise<void> {
    try {
      const resp = await fetch('/api/matchmaking/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: player.id,
          username: player.username,
          rating: player.rating,
          timeControl,
          title: player.title,
        }),
      });

      if (resp.ok) {
        const result = await resp.json();
        if (result.status === 'matched' && result.match) {
          this.emit(result.match);
        }
      }
    } catch {}
  }

  public async cancelQueue(): Promise<void> {
    try {
      await fetch('/api/matchmaking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: this.myPlayerId }),
      });
    } catch {}
  }

  public async sendMove(matchId: string, move: OnlineMovePayload): Promise<void> {
    this.broadcast({
      type: 'MOVE',
      roomCode: matchId,
      matchId,
      senderId: this.myPlayerId,
      move,
    });

    try {
      await fetch('/api/matchmaking/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          senderId: this.myPlayerId,
          move,
        }),
      });
    } catch {}
  }

  public async sendChat(matchId: string, senderName: string, text: string): Promise<void> {
    this.broadcast({
      type: 'CHAT',
      roomCode: matchId,
      matchId,
      senderName,
      text,
    });

    try {
      await fetch('/api/matchmaking/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          senderId: this.myPlayerId,
          senderName,
          text,
        }),
      });
    } catch {}
  }

  public async sendResign(matchId: string): Promise<void> {
    this.broadcast({
      type: 'RESIGN',
      roomCode: matchId,
      matchId,
      senderId: this.myPlayerId,
    });

    try {
      await fetch('/api/matchmaking/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          senderId: this.myPlayerId,
          action: 'RESIGN',
        }),
      });
    } catch {}
  }

  public async joinCustomRoom(roomCode: string, player: OnlinePlayerInfo): Promise<void> {
    this.broadcast({
      type: 'ROOM_JOIN',
      roomCode,
      player,
    });

    try {
      await fetch('/api/matchmaking/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          player,
        }),
      });
    } catch {}
  }

  public getRemainingRoomCooldown(): number {
    if (typeof window === 'undefined') return 0;
    const until = Number(sessionStorage.getItem('room_cooldown_until') || 0);
    const remaining = Math.ceil((until - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  public async createCustomRoom(params: {
    name: string;
    password?: string;
    timeControl: string;
    colorPreference: 'white' | 'black' | 'random';
    host: OnlinePlayerInfo;
    customRoomId?: string;
  }): Promise<{ ok: boolean; roomId?: string; error?: string; remainingSeconds?: number; room?: any }> {
    try {
      const resp = await fetch('/api/matchmaking/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await resp.json();
      if (!resp.ok) {
        if (resp.status === 429) {
          sessionStorage.setItem('room_cooldown_until', String(Date.now() + (data.remainingSeconds || 30) * 1000));
        }
        return { ok: false, error: data.error || 'Failed to create room', remainingSeconds: data.remainingSeconds };
      }

      return { ok: true, roomId: data.roomId, room: data.room };
    } catch {
      const roomId = (params.customRoomId || `FOREST-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
      return {
        ok: true,
        roomId,
        room: {
          roomId,
          name: params.name,
          hasPassword: Boolean(params.password),
          timeControl: params.timeControl,
          colorPreference: params.colorPreference,
          host: params.host,
        },
      };
    }
  }

  public async closeCustomRoom(roomId: string): Promise<{ ok: boolean; cooldownSeconds: number }> {
    try {
      await fetch('/api/matchmaking/room/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          playerId: this.myPlayerId,
        }),
      });
    } catch {}

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('room_cooldown_until', String(Date.now() + 30000));
    }

    return { ok: true, cooldownSeconds: 30 };
  }

  public async joinRoomWithPassword(
    roomId: string,
    password: string | undefined,
    player: OnlinePlayerInfo
  ): Promise<{ ok: boolean; match?: any; error?: string; message?: string }> {
    try {
      const resp = await fetch('/api/matchmaking/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId.trim().toUpperCase(),
          password: password ? password.trim() : undefined,
          player,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        return { ok: false, error: data.error, message: data.message || 'Failed to join room' };
      }

      if (data.match) {
        this.broadcast(data.match);
      }
      return { ok: true, match: data.match };
    } catch (err: any) {
      return { ok: false, error: 'NETWORK_ERROR', message: err.message || 'Network error' };
    }
  }

  public async fetchOpenRooms(): Promise<Array<{ roomId: string; name: string; timeControl: string; hasPassword: boolean; hostName: string; hostRating: number }>> {
    try {
      const resp = await fetch('/api/matchmaking/rooms');
      if (resp.ok) {
        const data = await resp.json();
        return data.rooms || [];
      }
    } catch {}
    return [];
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
    this.emit(msg);
  }

  private emit(msg: OnlineMessage): void {
    for (const listener of this.listeners) {
      try {
        listener(msg);
      } catch {}
    }
  }

  private notifyPresence(stats: PresenceStats): void {
    for (const listener of this.presenceListeners) {
      try {
        listener(stats);
      } catch {}
    }
  }
}

export const onlineService = new OnlineManager();
