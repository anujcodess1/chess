import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface QueuedPlayer {
  id: string;
  username: string;
  rating: number;
  timeControl: string;
  title?: string;
  joinedAt: number;
}

export interface ActiveMatch {
  matchId: string;
  timeControl: string;
  white: QueuedPlayer;
  black: QueuedPlayer;
  createdAt: number;
  lastActivity: number;
  moves: Array<{ from: string; to: string; promotion?: string; timeRemaining: number }>;
}

export interface CustomRoomRecord {
  roomId: string;
  name: string;
  password?: string;
  timeControl: string;
  colorPreference: 'white' | 'black' | 'random';
  host: QueuedPlayer;
  opponent?: QueuedPlayer;
  createdAt: number;
  status: 'waiting' | 'matched' | 'closed';
}

export function matchmakingPlugin(): Plugin {
  const connectedClients = new Map<string, { res: ServerResponse; username: string; lastSeen: number }>();
  const matchmakingQueue: QueuedPlayer[] = [];
  const activeMatches = new Map<string, ActiveMatch>();
  const customRooms = new Map<string, CustomRoomRecord>();
  const roomCooldowns = new Map<string, number>();

  const parseJsonBody = async (req: IncomingMessage): Promise<any> => {
    return new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch {
          resolve({});
        }
      });
    });
  };

  const sendToClient = (playerId: string, eventName: string, payload: any) => {
    const client = connectedClients.get(playerId);
    if (client && !client.res.writableEnded) {
      client.res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
    }
  };

  const broadcastToAll = (eventName: string, payload: any) => {
    for (const [id, client] of connectedClients.entries()) {
      if (!client.res.writableEnded) {
        try {
          client.res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
        } catch {
          connectedClients.delete(id);
        }
      }
    }
  };

  const getStats = () => ({
    onlineCount: Math.max(1, connectedClients.size),
    queueCount: matchmakingQueue.length,
    activeMatchesCount: activeMatches.size,
    openRoomsCount: Array.from(customRooms.values()).filter((r) => r.status === 'waiting').length,
  });

  const pruneQueue = () => {
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (let i = matchmakingQueue.length - 1; i >= 0; i--) {
      const p = matchmakingQueue[i]!;
      if (p.joinedAt < cutoff || !connectedClients.has(p.id)) {
        matchmakingQueue.splice(i, 1);
      }
    }
  };

  const broadcastPresence = () => {
    pruneQueue();
    broadcastToAll('PRESENCE', getStats());
  };

  const handleRequest = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    if (!pathname.startsWith('/api/matchmaking')) {
      return next();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (pathname === '/api/matchmaking/events' && req.method === 'GET') {
      const playerId = url.searchParams.get('playerId') || `guest_${Date.now()}`;
      const username = url.searchParams.get('username') || 'Guest Player';

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      res.write(': connected\n\n');

      connectedClients.set(playerId, {
        res,
        username,
        lastSeen: Date.now(),
      });

      res.write(`event: PRESENCE\ndata: ${JSON.stringify(getStats())}\n\n`);
      broadcastPresence();

      const heartbeat = setInterval(() => {
        if (!res.writableEnded) {
          res.write(': ping\n\n');
        } else {
          clearInterval(heartbeat);
        }
      }, 15000);

      req.on('close', () => {
        clearInterval(heartbeat);
        connectedClients.delete(playerId);
        const idx = matchmakingQueue.findIndex((p) => p.id === playerId);
        if (idx !== -1) {
          matchmakingQueue.splice(idx, 1);
        }
        broadcastPresence();
      });

      return;
    }

    if (pathname === '/api/matchmaking/stats' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getStats()));
      return;
    }

    if (pathname === '/api/matchmaking/queue' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const player: QueuedPlayer = {
        id: body.id,
        username: body.username || 'Player',
        rating: body.rating || 1500,
        timeControl: body.timeControl || 'blitz',
        title: body.title,
        joinedAt: Date.now(),
      };

      if (!player.id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing player id' }));
        return;
      }

      pruneQueue();

      const opponentIdx = matchmakingQueue.findIndex(
        (p) => p.id !== player.id && (p.timeControl === player.timeControl || matchmakingQueue.length > 2)
      );

      if (opponentIdx !== -1) {
        const opponent = matchmakingQueue.splice(opponentIdx, 1)[0]!;
        const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const isSelfWhite = Math.random() > 0.5;
        const whitePlayer = isSelfWhite ? { ...player, color: 'white' as const } : { ...opponent, color: 'white' as const };
        const blackPlayer = isSelfWhite ? { ...opponent, color: 'black' as const } : { ...player, color: 'black' as const };

        const match: ActiveMatch = {
          matchId,
          timeControl: player.timeControl,
          white: whitePlayer,
          black: blackPlayer,
          createdAt: Date.now(),
          lastActivity: Date.now(),
          moves: [],
        };

        activeMatches.set(matchId, match);

        const matchFoundEvent = {
          type: 'QUEUE_MATCH_FOUND',
          matchId,
          whitePlayer,
          blackPlayer,
          timeControl: player.timeControl,
        };

        sendToClient(opponent.id, 'QUEUE_MATCH_FOUND', matchFoundEvent);
        sendToClient(player.id, 'QUEUE_MATCH_FOUND', matchFoundEvent);
        broadcastPresence();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'matched', match: matchFoundEvent }));
        return;
      }

      const existingIdx = matchmakingQueue.findIndex((p) => p.id === player.id);
      if (existingIdx === -1) {
        matchmakingQueue.push(player);
      } else {
        matchmakingQueue[existingIdx] = player;
      }

      broadcastPresence();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'queued', queuePosition: matchmakingQueue.length }));
      return;
    }

    if (pathname === '/api/matchmaking/cancel' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const playerId = body.playerId;
      const idx = matchmakingQueue.findIndex((p) => p.id === playerId);
      if (idx !== -1) {
        matchmakingQueue.splice(idx, 1);
      }
      broadcastPresence();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (pathname === '/api/matchmaking/move' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { matchId, senderId, move } = body;
      const match = activeMatches.get(matchId);

      if (match) {
        match.lastActivity = Date.now();
        match.moves.push(move);
        const opponentId = senderId === match.white.id ? match.black.id : match.white.id;

        sendToClient(opponentId, 'MOVE', {
          matchId,
          senderId,
          move,
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (pathname === '/api/matchmaking/chat' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { matchId, senderId, senderName, text } = body;
      const match = activeMatches.get(matchId);

      if (match) {
        const opponentId = senderId === match.white.id ? match.black.id : match.white.id;
        sendToClient(opponentId, 'CHAT', {
          matchId,
          senderName,
          text,
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (pathname === '/api/matchmaking/action' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { matchId, senderId, action } = body;
      const match = activeMatches.get(matchId);

      if (match) {
        const opponentId = senderId === match.white.id ? match.black.id : match.white.id;
        sendToClient(opponentId, action, {
          matchId,
          senderId,
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (pathname === '/api/matchmaking/room/create' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { host, name, password, timeControl, colorPreference, customRoomId } = body;

      if (!host || !host.id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing host info' }));
        return;
      }

      const lastClosed = roomCooldowns.get(host.id) || 0;
      const elapsedSinceClose = Date.now() - lastClosed;
      if (elapsedSinceClose < 30000) {
        const remainingSeconds = Math.ceil((30000 - elapsedSinceClose) / 1000);
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'COOLDOWN',
            message: `Room creation limit active. Please wait ${remainingSeconds}s before creating another room.`,
            remainingSeconds,
          })
        );
        return;
      }

      const roomId = (customRoomId || `FOREST-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();

      const newRoom: CustomRoomRecord = {
        roomId,
        name: name || `${host.username}'s Arena`,
        password: password ? String(password).trim() : undefined,
        timeControl: timeControl || 'blitz',
        colorPreference: colorPreference || 'random',
        host: {
          id: host.id,
          username: host.username || 'Host',
          rating: host.rating || 1500,
          timeControl: timeControl || 'blitz',
          title: host.title,
          joinedAt: Date.now(),
        },
        createdAt: Date.now(),
        status: 'waiting',
      };

      customRooms.set(roomId, newRoom);
      broadcastPresence();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          roomId,
          room: {
            roomId,
            name: newRoom.name,
            hasPassword: Boolean(newRoom.password),
            timeControl: newRoom.timeControl,
            colorPreference: newRoom.colorPreference,
            host: newRoom.host,
            createdAt: newRoom.createdAt,
          },
        })
      );
      return;
    }

    if (pathname === '/api/matchmaking/room/close' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { roomId, playerId } = body;

      const room = customRooms.get((roomId || '').toUpperCase());
      if (room) {
        room.status = 'closed';
        customRooms.delete(room.roomId);

        if (room.opponent) {
          sendToClient(room.opponent.id, 'ROOM_CLOSED', { roomId: room.roomId, reason: 'Host closed the room' });
        }
      }

      if (playerId) {
        roomCooldowns.set(playerId, Date.now());
      }

      broadcastPresence();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, cooldownSeconds: 30, message: 'Room closed. 30s limit applied.' }));
      return;
    }

    if (pathname === '/api/matchmaking/room/cooldown' && req.method === 'GET') {
      const playerId = url.searchParams.get('playerId') || '';
      const lastClosed = roomCooldowns.get(playerId) || 0;
      const elapsed = Date.now() - lastClosed;
      const remainingSeconds = elapsed < 30000 ? Math.ceil((30000 - elapsed) / 1000) : 0;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ inCooldown: remainingSeconds > 0, remainingSeconds }));
      return;
    }

    if (pathname === '/api/matchmaking/room/join' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { roomId, password, player } = body;
      const code = (roomId || '').toUpperCase();

      const room = customRooms.get(code);
      if (!room || room.status !== 'waiting') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'ROOM_NOT_FOUND', message: 'Room does not exist or has already started.' }));
        return;
      }

      if (room.host.id === player.id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'CANNOT_JOIN_SELF', message: 'You are the host of this room.' }));
        return;
      }

      if (room.password) {
        const inputPassword = (password || '').trim();
        if (inputPassword !== room.password) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'INVALID_PASSWORD', message: 'Incorrect room password.' }));
          return;
        }
      }

      let isHostWhite = Math.random() > 0.5;
      if (room.colorPreference === 'white') isHostWhite = true;
      if (room.colorPreference === 'black') isHostWhite = false;

      const whitePlayer = isHostWhite
        ? { ...room.host, color: 'white' as const }
        : { ...player, color: 'white' as const };
      const blackPlayer = isHostWhite
        ? { ...player, color: 'black' as const }
        : { ...room.host, color: 'black' as const };

      const matchId = `match_${room.roomId}`;
      const activeMatch: ActiveMatch = {
        matchId,
        timeControl: room.timeControl,
        white: whitePlayer,
        black: blackPlayer,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        moves: [],
      };

      activeMatches.set(matchId, activeMatch);
      room.status = 'matched';
      room.opponent = player;

      const matchFoundPayload = {
        type: 'QUEUE_MATCH_FOUND',
        matchId,
        whitePlayer,
        blackPlayer,
        timeControl: room.timeControl,
        roomName: room.name,
      };

      sendToClient(room.host.id, 'QUEUE_MATCH_FOUND', matchFoundPayload);
      sendToClient(player.id, 'QUEUE_MATCH_FOUND', matchFoundPayload);
      broadcastPresence();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, match: matchFoundPayload }));
      return;
    }

    if (pathname === '/api/matchmaking/rooms' && req.method === 'GET') {
      const openRooms = Array.from(customRooms.values())
        .filter((r) => r.status === 'waiting')
        .map((r) => ({
          roomId: r.roomId,
          name: r.name,
          timeControl: r.timeControl,
          hasPassword: Boolean(r.password),
          hostName: r.host.username,
          hostRating: r.host.rating,
          createdAt: r.createdAt,
        }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ rooms: openRooms }));
      return;
    }

    if (pathname === '/api/matchmaking/room' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { roomCode, player } = body;
      const code = (roomCode || 'FOREST').toUpperCase();

      let room = customRooms.get(code);
      if (!room) {
        room = {
          roomId: code,
          name: `Room #${code}`,
          timeControl: 'blitz',
          colorPreference: 'random',
          host: player,
          createdAt: Date.now(),
          status: 'waiting',
        };
        customRooms.set(code, room);
      } else if (room.status === 'waiting' && room.host.id !== player.id) {
        room.status = 'matched';
        sendToClient(room.host.id, 'ROOM_JOIN', { roomCode: code, player });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    next();
  };

  return {
    name: 'chess-matchmaking-server',
    configureServer(server) {
      server.middlewares.use(handleRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRequest);
    },
  };
}
