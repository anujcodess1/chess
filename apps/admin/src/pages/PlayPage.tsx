import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Chess, Square } from 'chess.js';
import confetti from 'canvas-confetti';
import { ChessBoard3D } from '../components/3d/ChessBoard3D';
import { SoundEffects } from '../utils/sound';
import { LocalStore } from '../api/localStore';
import { onlineService, OnlineMessage, OnlinePlayerInfo } from '../api/onlineMatch';
import {
  RotateCcw,
  Flag,
  Clock,
  RefreshCw,
  Send,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import {
  BrandLogoEmblem,
  QuickMatchEmblem,
  PrivateRoomEmblem,
  AiBotEmblem,
  LocalTwoPlayerEmblem,
  LuxuryKingAvatar,
  LuxuryTrophyEmblem,
} from '../components/icons/PremiumIcons';

type GameMode = 'online' | 'ai' | 'pass_and_play';
type TimeControlKey = 'bullet' | 'blitz' | 'rapid' | 'classical';
type AiDifficulty = 'novice' | 'intermediate' | 'master';

interface TimeControlConfig {
  label: string;
  initialSeconds: number;
  incrementSeconds: number;
}

const TIME_CONTROLS: Record<TimeControlKey, TimeControlConfig> = {
  bullet: { label: '1m Bullet', initialSeconds: 60, incrementSeconds: 0 },
  blitz: { label: '3m+2s Blitz', initialSeconds: 180, incrementSeconds: 2 },
  rapid: { label: '10m Rapid', initialSeconds: 600, incrementSeconds: 0 },
  classical: { label: '30m Classical', initialSeconds: 1800, incrementSeconds: 0 },
};

export const PlayPage: React.FC = () => {
  const currentUser = LocalStore.getCurrentUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paramMode = (searchParams.get('mode') as GameMode) || 'online';
  const paramTc = (searchParams.get('tc') as TimeControlKey) || 'blitz';
  const paramAi = (searchParams.get('ai') as AiDifficulty) || 'intermediate';
  const paramRoom = searchParams.get('room');
  const paramRole = searchParams.get('role');
  const paramColor = searchParams.get('color') as 'white' | 'black' | 'random' | null;
  const autoSearch = searchParams.get('autoSearch') === 'true';

  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [gameMode, setGameMode] = useState<GameMode>(paramMode);
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>(paramAi);
  const [timeControl, setTimeControl] = useState<TimeControlKey>(paramTc);

  // Board state
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [checkSquare, setCheckSquare] = useState<string | null>(null);
  const [playerPerspective, setPlayerPerspective] = useState<'white' | 'black'>(
    paramColor === 'black' ? 'black' : 'white'
  );

  // Clocks
  const [whiteTime, setWhiteTime] = useState(TIME_CONTROLS[paramTc]?.initialSeconds || TIME_CONTROLS.blitz.initialSeconds);
  const [blackTime, setBlackTime] = useState(TIME_CONTROLS[paramTc]?.initialSeconds || TIME_CONTROLS.blitz.initialSeconds);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameResult, setGameResult] = useState<{ winner: 'white' | 'black' | 'draw' | null; reason: string } | null>(null);

  // History & Captured
  const [moveHistory, setMoveHistory] = useState<{ white: string; black?: string }[]>([]);
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);

  // Online Multiplayer State
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(paramRoom || null);
  const [matchmakingState, setMatchmakingState] = useState<'idle' | 'searching' | 'matched'>('idle');
  const [searchTimer, setSearchTimer] = useState(0);
  const [presence, setPresence] = useState(onlineService.getPresence());
  const [customRoomOpen, setCustomRoomOpen] = useState(false);

  const [onlineOpponent, setOnlineOpponent] = useState<OnlinePlayerInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([
    { sender: 'System', text: 'Welcome to Chess. Good luck!' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Handle URL navigation params (from HomePage)
  useEffect(() => {
    if (paramRoom) {
      setActiveRoomCode(paramRoom);
      if (paramRole === 'host') {
        setChatMessages((prev) => [
          ...prev,
          { sender: 'System', text: `Room #${paramRoom} ready! Waiting for an opponent to join.` },
        ]);
      } else if (paramRole === 'join') {
        setMatchmakingState('matched');
        setIsGameActive(true);
        setChatMessages((prev) => [
          ...prev,
          { sender: 'System', text: `Connected to Room #${paramRoom}! Match started.` },
        ]);
      }
    } else if (autoSearch && paramMode === 'online') {
      startRandomMatchmaking();
    }
  }, []);

  // Presence Listener
  useEffect(() => {
    const unsubPresence = onlineService.subscribePresence(setPresence);
    return () => unsubPresence();
  }, []);

  // Search Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (matchmakingState === 'searching') {
      interval = setInterval(() => {
        setSearchTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [matchmakingState]);

  // Online Bus Listener
  useEffect(() => {
    const myId = currentUser?.id || onlineService.getPlayerId();

    const unsub = onlineService.subscribe((msg: OnlineMessage) => {
      // 1. Queue Match Found Event (Random Matchmaking)
      if (msg.type === 'QUEUE_MATCH_FOUND') {
        const isWhite = msg.whitePlayer.id === myId;
        const isBlack = msg.blackPlayer.id === myId;

        if (isWhite || isBlack) {
          const opponent = isWhite ? msg.blackPlayer : msg.whitePlayer;
          const myColor = isWhite ? 'white' : 'black';

          setActiveRoomCode(msg.matchId);
          setPlayerPerspective(myColor);
          setOnlineOpponent(opponent);
          setMatchmakingState('matched');
          setIsGameActive(true);
          SoundEffects.playVictory();
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          setChatMessages((prev) => [
            ...prev,
            { sender: 'System', text: `Random match connected! Playing vs ${opponent.username} (${opponent.rating} Elo) as ${myColor.toUpperCase()}.` },
          ]);
        }
        return;
      }

      // 2. Room Specific Events
      if (!activeRoomCode) return;
      const targetCode = 'roomCode' in msg ? msg.roomCode : 'matchId' in msg ? msg.matchId : null;
      if (targetCode && targetCode !== activeRoomCode) return;

      if (msg.type === 'ROOM_JOIN') {
        setOnlineOpponent(msg.player);
        setMatchmakingState('matched');
        setIsGameActive(true);
        setChatMessages((prev) => [...prev, { sender: 'System', text: `${msg.player.username} joined the match!` }]);
        SoundEffects.playVictory();
      } else if (msg.type === 'MOVE') {
        if (msg.senderId !== myId) {
          makeMove(msg.move.from, msg.move.to, false);
        }
      } else if (msg.type === 'RESIGN') {
        setIsGameActive(false);
        setGameResult({ winner: playerPerspective, reason: 'Opponent resigned' });
        SoundEffects.playVictory();
      } else if (msg.type === 'CHAT') {
        setChatMessages((prev) => [...prev, { sender: msg.senderName, text: msg.text }]);
      }
    });

    return () => unsub();
  }, [activeRoomCode, currentUser, playerPerspective]);

  // Handle Random Matchmaking Search
  const startRandomMatchmaking = () => {
    setMatchmakingState('searching');
    setSearchTimer(0);
    setOnlineOpponent(null);
    handleStartNewGame();

    const myId = currentUser?.id || onlineService.getPlayerId();
    const myInfo: OnlinePlayerInfo = {
      id: myId,
      username: currentUser?.username || `Player_${myId.substring(myId.length - 4)}`,
      rating: currentUser?.ratings[timeControl] || 1500,
      color: 'white',
      title: currentUser?.title,
    };

    // Register into server queue and broadcast
    onlineService.registerInQueue(myInfo, timeControl);
  };

  const cancelMatchmaking = () => {
    setMatchmakingState('idle');
    onlineService.cancelQueue();
  };

  // Clock Countdown Timer
  useEffect(() => {
    if (!isGameActive || gameResult) return;

    const timer = setInterval(() => {
      const turn = chess.turn();
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            handleTimeout('black');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            handleTimeout('white');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameActive, gameResult, chess]);

  const handleTimeout = (winner: 'white' | 'black') => {
    setIsGameActive(false);
    setGameResult({ winner, reason: 'Time out' });
    SoundEffects.playVictory();
    recordGameEnd(winner, 'Time out');
  };

  const recordGameEnd = (winner: 'white' | 'black' | 'draw', reason: string) => {
    const isWin = winner === playerPerspective;
    const isLoss = winner !== 'draw' && !isWin;
    LocalStore.recordGame({
      opponent: gameMode === 'online' ? (onlineOpponent?.username || 'Random Player') : gameMode === 'ai' ? `ChessBot AI (${aiDifficulty})` : 'Player 2 (Local)',
      opponentRating: gameMode === 'online' ? (onlineOpponent?.rating || 1850) : gameMode === 'ai' ? (aiDifficulty === 'novice' ? 1000 : aiDifficulty === 'intermediate' ? 1500 : 2100) : 1200,
      playerColor: playerPerspective,
      result: isWin ? 'win' : isLoss ? 'loss' : 'draw',
      reason,
      timeControl: TIME_CONTROLS[timeControl].label,
      movesCount: chess.history().length,
      pgn: chess.pgn(),
      ratingChange: isWin ? 16 : isLoss ? -12 : 2,
    });
  };

  // Find king square if in check
  const updateCheckState = useCallback(() => {
    if (chess.inCheck()) {
      const board = chess.board();
      const turn = chess.turn();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const piece = board[r]?.[f];
          if (piece && piece.type === 'k' && piece.color === turn) {
            const sq = `${String.fromCharCode('a'.charCodeAt(0) + f)}${8 - r}`;
            setCheckSquare(sq);
            SoundEffects.playCheck();
            return;
          }
        }
      }
    } else {
      setCheckSquare(null);
    }
  }, [chess]);

  // Make move helper
  const makeMove = useCallback(
    (from: string, to: string, broadcast = true) => {
      try {
        const move = chess.move({
          from: from as Square,
          to: to as Square,
          promotion: 'q',
        });

        if (!move) return false;

        if (move.captured) {
          SoundEffects.playCapture();
        } else {
          SoundEffects.playMove();
        }

        const inc = TIME_CONTROLS[timeControl].incrementSeconds;
        if (move.color === 'w') {
          setWhiteTime((t) => t + inc);
        } else {
          setBlackTime((t) => t + inc);
        }

        setFen(chess.fen());
        setLastMove({ from, to });
        setSelectedSquare(null);
        setLegalMoves([]);
        setIsGameActive(true);

        if (broadcast && gameMode === 'online' && activeRoomCode) {
          onlineService.sendMove(activeRoomCode, {
            from,
            to,
            promotion: 'q',
            timeRemaining: move.color === 'w' ? whiteTime : blackTime,
          });
        }

        if (move.captured) {
          if (move.color === 'w') {
            setCapturedBlack((prev) => [...prev, move.captured!]);
          } else {
            setCapturedWhite((prev) => [...prev, move.captured!]);
          }
        }

        const hist = chess.history();
        const formatted: { white: string; black?: string }[] = [];
        for (let i = 0; i < hist.length; i += 2) {
          const wMove = hist[i];
          if (wMove) {
            formatted.push({
              white: wMove,
              black: hist[i + 1],
            });
          }
        }
        setMoveHistory(formatted);

        if (chess.isGameOver()) {
          setIsGameActive(false);
          if (chess.isCheckmate()) {
            const winner = chess.turn() === 'w' ? 'black' : 'white';
            setGameResult({ winner, reason: 'Checkmate' });
            SoundEffects.playVictory();
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            recordGameEnd(winner, 'Checkmate');
          } else if (chess.isDraw()) {
            let reason = 'Draw';
            if (chess.isStalemate()) reason = 'Stalemate';
            else if (chess.isThreefoldRepetition()) reason = 'Threefold repetition';
            else if (chess.isInsufficientMaterial()) reason = 'Insufficient material';
            setGameResult({ winner: 'draw', reason });
            recordGameEnd('draw', reason);
          }
        } else {
          updateCheckState();
        }

        return true;
      } catch {
        return false;
      }
    },
    [chess, timeControl, updateCheckState, playerPerspective, gameMode, activeRoomCode, currentUser, whiteTime, blackTime]
  );

  // AI Move Engine (if AI mode is selected)
  useEffect(() => {
    if (gameMode !== 'ai' || !isGameActive || gameResult) return;
    if (chess.turn() === 'b') {
      const timer = setTimeout(() => {
        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) return;

        let selectedMove = moves[0];
        if (aiDifficulty === 'novice') {
          selectedMove = moves[Math.floor(Math.random() * moves.length)];
        } else if (aiDifficulty === 'intermediate') {
          const captures = moves.filter((m) => m.captured);
          if (captures.length > 0 && Math.random() > 0.3) {
            selectedMove = captures[Math.floor(Math.random() * captures.length)];
          } else {
            selectedMove = moves[Math.floor(Math.random() * moves.length)];
          }
        } else {
          const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 };
          let bestScore = -999;
          for (const m of moves) {
            let score = 0;
            if (m.captured) score += (pieceValues[m.captured] || 1) * 2;
            if (m.san.includes('#')) score += 1000;
            if (m.san.includes('+')) score += 3;
            if (score > bestScore) {
              bestScore = score;
              selectedMove = m;
            }
          }
        }

        if (selectedMove) {
          makeMove(selectedMove.from, selectedMove.to);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [chess, isGameActive, gameMode, aiDifficulty, gameResult, makeMove, fen]);

  // Square Click handler (Guaranteed piece stability & route display)
  const handleSquareClick = useCallback(
    (square: string) => {
      if (gameResult) return;

      // 1. If a piece is already selected and user clicked on a valid legal move destination: make the move!
      if (selectedSquare && legalMoves.includes(square)) {
        makeMove(selectedSquare, square);
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // 2. Active Online Match turn enforcement
      if (gameMode === 'online' && (matchmakingState === 'matched' || activeRoomCode)) {
        const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
        if (currentTurn !== playerPerspective) {
          return;
        }
      }

      // 3. AI Mode turn enforcement (Player is White)
      if (gameMode === 'ai' && chess.turn() !== 'w') {
        return;
      }

      // 4. Select piece of the current turn
      const piece = chess.get(square as Square);
      const currentTurn = chess.turn();

      if (piece && piece.color === currentTurn) {
        setSelectedSquare(square);
        const moves = chess.moves({ square: square as Square, verbose: true });
        setLegalMoves(moves.map((m) => m.to));
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [chess, gameResult, gameMode, matchmakingState, activeRoomCode, playerPerspective, selectedSquare, legalMoves, makeMove]
  );

  const handleStartNewGame = () => {
    chess.reset();
    setFen(chess.fen());
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setCheckSquare(null);
    setGameResult(null);
    setMoveHistory([]);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setWhiteTime(TIME_CONTROLS[timeControl].initialSeconds);
    setBlackTime(TIME_CONTROLS[timeControl].initialSeconds);
    setIsGameActive(false);
  };

  const handleResign = () => {
    if (gameResult) return;
    const winner = playerPerspective === 'white' ? 'black' : 'white';
    setIsGameActive(false);
    setGameResult({ winner, reason: 'Resignation' });
    if (gameMode === 'online' && activeRoomCode) {
      onlineService.sendResign(activeRoomCode);
    }
    recordGameEnd(winner, 'Resignation');
  };

  const handleJoinCustomRoom = () => {
    const code = roomCodeInput.trim().toUpperCase() || 'FOREST';
    setActiveRoomCode(code);
    setPlayerPerspective('black');
    setMatchmakingState('matched');
    setIsGameActive(true);

    const myId = currentUser?.id || onlineService.getPlayerId();
    onlineService.joinCustomRoom(code, {
      id: myId,
      username: currentUser?.username || `Guest_${myId.substring(myId.length - 4)}`,
      rating: currentUser?.ratings.rapid || 1450,
      color: 'black',
    });

    setChatMessages((prev) => [...prev, { sender: 'System', text: `Joined Online Room #${code} as Black!` }]);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    const sender = currentUser?.displayName || currentUser?.username || 'You';
    setChatMessages((prev) => [...prev, { sender, text }]);
    if (activeRoomCode) {
      onlineService.sendChat(activeRoomCode, sender, text);
    }
  };

  const copyRoomCode = () => {
    if (activeRoomCode) {
      navigator.clipboard.writeText(activeRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 72px)',
        backgroundColor: '#000000',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 60%)',
        color: '#ffffff',
        display: 'flex',
        padding: '32px 40px',
        gap: '32px',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* 3D Chessboard Stage (Left / Center) */}
      <div
        style={{
          flex: '1 1 65%',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          minWidth: 0,
        }}
      >
        {/* Top Arena Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '2px 6px',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Home Lobby</span>
          </Link>

          {activeRoomCode && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12px',
                color: '#d4d4d8',
                background: 'rgba(18, 18, 20, 0.8)',
                backdropFilter: 'blur(16px)',
                padding: '8px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span style={{ color: '#a1a1aa' }}>Room:</span>
              <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em' }}>{activeRoomCode}</span>
            </div>
          )}
        </div>

        {/* Opponent Card & Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 15, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '18px',
            padding: '16px 24px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: playerPerspective === 'white' ? 'linear-gradient(135deg, #1c1c20, #09090b)' : '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: playerPerspective === 'white' ? 'none' : '0 4px 18px rgba(255, 255, 255, 0.25)',
              }}
            >
              <LuxuryKingAvatar size={28} variant={playerPerspective === 'white' ? 'dark' : 'light'} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>
                  {gameMode === 'online'
                    ? onlineOpponent
                      ? `${onlineOpponent.username} (${onlineOpponent.rating} Elo)`
                      : 'Searching for opponent...'
                    : gameMode === 'ai'
                    ? `ChessBot AI (${aiDifficulty.toUpperCase()})`
                    : 'Player 2 (Black)'}
                </span>
                {gameMode === 'online' && onlineOpponent && (
                  <span style={{ fontSize: '10px', background: '#ffffff', color: '#000000', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                    ONLINE
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>
                Captured: {capturedBlack.map((p) => p.toUpperCase()).join(' ') || 'None'}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              padding: '8px 20px',
              borderRadius: '12px',
              background: chess.turn() === 'b' && isGameActive ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: chess.turn() === 'b' && isGameActive ? '#ffffff' : '#71717a',
              border: chess.turn() === 'b' && isGameActive ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: chess.turn() === 'b' && isGameActive ? '0 0 25px rgba(255, 255, 255, 0.2)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {formatTime(blackTime)}
          </div>
        </div>

        {/* 3D Monochrome Chessboard Viewport */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: '560px',
            background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.04) 0%, #050507 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 50px rgba(255, 255, 255, 0.04)',
          }}
        >
          <ChessBoard3D
            fen={fen}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            checkSquare={checkSquare}
            lastMove={lastMove}
            playerColor={playerPerspective}
            theme="default"
            onSquareClick={handleSquareClick}
          />

          {/* Searching Overlay if in matchmaking queue */}
          {gameMode === 'online' && matchmakingState === 'searching' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.88)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
              }}
            >
              <div
                style={{
                  background: 'rgba(15, 15, 18, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '24px',
                  padding: '40px 48px',
                  textAlign: 'center',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.95), 0 0 40px rgba(255, 255, 255, 0.08)',
                  maxWidth: '420px',
                  width: '90%',
                }}
              >
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                      animation: 'pulseRadarWhite 2s infinite',
                    }}
                  >
                    <QuickMatchEmblem size={44} />
                  </div>
                  <style>{`
                    @keyframes pulseRadarWhite {
                      0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6); }
                      70% { box-shadow: 0 0 0 20px rgba(255, 255, 255, 0); }
                      100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                    }
                  `}</style>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>
                  Finding Random Opponent...
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  Scanning for active players across the platform ({searchTimer}s)
                </p>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#ffffff',
                    background: 'rgba(255, 255, 255, 0.08)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    marginBottom: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff', display: 'inline-block' }} />
                  <span>{presence.onlineCount} Online • {presence.queueCount} Searching</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  <button
                    type="button"
                    onClick={cancelMatchmaking}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: 'transparent',
                      color: '#a1a1aa',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Cancel Search
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Banner Overlay */}
          {gameResult && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.88)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
              }}
            >
              <div
                style={{
                  background: 'rgba(15, 15, 18, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '24px',
                  padding: '42px 52px',
                  textAlign: 'center',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.95), 0 0 50px rgba(255, 255, 255, 0.1)',
                }}
              >
                <LuxuryTrophyEmblem size={68} style={{ marginBottom: '18px' }} />
                <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>
                  {gameResult.winner === 'draw'
                    ? 'Game Drawn!'
                    : `${gameResult.winner === 'white' ? 'White' : 'Black'} Wins!`}
                </h2>
                <p style={{ color: '#a1a1aa', fontSize: '15px', margin: '0 0 28px 0' }}>
                  Match finished by {gameResult.reason}
                </p>
                <button
                  type="button"
                  onClick={startRandomMatchmaking}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '14px',
                    border: 'none',
                    background: '#ffffff',
                    color: '#000000',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Find New Opponent
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Player Card & Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 15, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '18px',
            padding: '16px 24px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: playerPerspective === 'white' ? '#ffffff' : 'linear-gradient(135deg, #1c1c20, #09090b)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: playerPerspective === 'white' ? '0 4px 18px rgba(255, 255, 255, 0.25)' : 'none',
              }}
            >
              <LuxuryKingAvatar size={28} variant={playerPerspective === 'white' ? 'light' : 'dark'} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                {currentUser?.displayName || 'You'} ({playerPerspective === 'white' ? 'White' : 'Black'})
              </div>
              <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>
                Captured: {capturedWhite.map((p) => p.toUpperCase()).join(' ') || 'None'}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              padding: '8px 20px',
              borderRadius: '12px',
              background: chess.turn() === 'w' && isGameActive ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: chess.turn() === 'w' && isGameActive ? '#ffffff' : '#71717a',
              border: chess.turn() === 'w' && isGameActive ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: chess.turn() === 'w' && isGameActive ? '0 0 25px rgba(255, 255, 255, 0.2)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {formatTime(whiteTime)}
          </div>
        </div>
      </div>

      {/* Side Control Panel (Right) */}
      <div
        style={{
          flex: '0 0 380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Game Mode Setup Card */}
        <div
          style={{
            background: 'rgba(15, 15, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '22px',
            padding: '24px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>
            Arena Match Mode
          </div>

          {/* Mode Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => {
                setGameMode('online');
                handleStartNewGame();
              }}
              style={{
                padding: '12px 6px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
                background: gameMode === 'online' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                color: gameMode === 'online' ? '#000000' : '#a1a1aa',
                boxShadow: gameMode === 'online' ? '0 4px 18px rgba(255, 255, 255, 0.2)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <QuickMatchEmblem size={18} />
              Online Live
            </button>
            <button
              type="button"
              onClick={() => {
                setGameMode('ai');
                handleStartNewGame();
              }}
              style={{
                padding: '12px 6px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
                background: gameMode === 'ai' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                color: gameMode === 'ai' ? '#000000' : '#a1a1aa',
                boxShadow: gameMode === 'ai' ? '0 4px 18px rgba(255, 255, 255, 0.2)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <AiBotEmblem size={18} />
              Vs AI Bot
            </button>
            <button
              type="button"
              onClick={() => {
                setGameMode('pass_and_play');
                handleStartNewGame();
              }}
              style={{
                padding: '12px 6px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
                background: gameMode === 'pass_and_play' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                color: gameMode === 'pass_and_play' ? '#000000' : '#a1a1aa',
                boxShadow: gameMode === 'pass_and_play' ? '0 4px 18px rgba(255, 255, 255, 0.2)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <LocalTwoPlayerEmblem size={18} />
              Local 2P
            </button>
          </div>

          {/* Random Matchmaking & Room Code for Online Mode */}
          {gameMode === 'online' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {/* Live Presence Pulse Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                    {presence.onlineCount} Players Online
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500 }}>
                  {presence.queueCount > 0 ? `${presence.queueCount} in Queue` : 'Ready to Match'}
                </span>
              </div>

              {/* Big 1-Click Random Matchmaking Hero Button */}
              <button
                type="button"
                onClick={startRandomMatchmaking}
                disabled={matchmakingState === 'searching'}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '14px',
                  border: 'none',
                  background:
                    matchmakingState === 'searching'
                      ? '#27272a'
                      : 'linear-gradient(135deg, #ffffff 0%, #e4e4e7 100%)',
                  color: matchmakingState === 'searching' ? '#ffffff' : '#000000',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: matchmakingState === 'searching' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: matchmakingState === 'searching' ? 'none' : '0 8px 30px rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {matchmakingState === 'searching' ? (
                    <Loader2 size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                  ) : (
                    <QuickMatchEmblem size={20} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.02em' }}>
                    {matchmakingState === 'searching' ? 'Searching Website Pool...' : '⚡ Quick Match (Random Player)'}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: matchmakingState === 'searching' ? '#a1a1aa' : '#52525b', fontWeight: 500 }}>
                  {matchmakingState === 'searching'
                    ? `Scanning for opponents (${searchTimer}s)`
                    : 'Instantly play anyone currently on website'}
                </span>
              </button>

              {/* Cancel option while searching */}
              {matchmakingState === 'searching' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={cancelMatchmaking}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: 'transparent',
                      color: '#a1a1aa',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Optional Custom Room with Friend */}
              <div
                style={{
                  background: 'rgba(18, 18, 20, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setCustomRoomOpen(!customRoomOpen)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    color: '#d4d4d8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PrivateRoomEmblem size={16} />
                    <span>Private Room with Friend (Code)</span>
                  </div>
                  {customRoomOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {customRoomOpen && (
                  <div style={{ padding: '0 14px 14px 14px' }}>
                    <p style={{ fontSize: '11px', color: '#a1a1aa', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      Share a code with a friend to play a private match:
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Room code (e.g. VIP88)"
                        value={roomCodeInput}
                        onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#ffffff',
                          fontSize: '12px',
                          outline: 'none',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleJoinCustomRoom}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#ffffff',
                          color: '#000000',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Join
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Time Controls */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '8px', fontWeight: 600 }}>
              Time Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(Object.keys(TIME_CONTROLS) as TimeControlKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTimeControl(key);
                    setWhiteTime(TIME_CONTROLS[key].initialSeconds);
                    setBlackTime(TIME_CONTROLS[key].initialSeconds);
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: timeControl === key ? '#ffffff' : 'rgba(255,255,255,0.04)',
                    color: timeControl === key ? '#000000' : '#a1a1aa',
                    border: timeControl === key ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: timeControl === key ? '0 4px 14px rgba(255, 255, 255, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {TIME_CONTROLS[key].label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty (if AI mode) */}
          {gameMode === 'ai' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '8px', fontWeight: 600 }}>
                AI Difficulty
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['novice', 'intermediate', 'master'] as AiDifficulty[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setAiDifficulty(level)}
                    style={{
                      flex: 1,
                      padding: '10px 6px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      background: aiDifficulty === level ? '#ffffff' : 'rgba(255,255,255,0.04)',
                      color: aiDifficulty === level ? '#000000' : '#a1a1aa',
                      border: aiDifficulty === level ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: aiDifficulty === level ? '0 4px 14px rgba(255, 255, 255, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live In-Game Chat (for Online matches) */}
        {gameMode === 'online' ? (
          <div
            style={{
              flex: 1,
              minHeight: '230px',
              background: 'rgba(15, 15, 18, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '22px',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              <MessageSquare size={16} />
              <span>Match Live Chat</span>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: '180px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '4px',
                marginBottom: '14px',
              }}
            >
              {chatMessages.map((m, idx) => (
                <div key={idx} style={{ fontSize: '12px', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700, color: m.sender === 'System' ? '#ffffff' : '#d4d4d8' }}>
                    {m.sender}:
                  </span>{' '}
                  <span style={{ color: '#a1a1aa' }}>{m.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Say something to opponent..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  fontFamily: "'Poppins', sans-serif",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#000000',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        ) : (
          /* Move History */
          <div
            style={{
              flex: 1,
              minHeight: '230px',
              background: 'rgba(15, 15, 18, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '22px',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              Move Notation (SAN)
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '200px' }}>
              {moveHistory.length === 0 ? (
                <div style={{ color: '#71717a', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
                  Make your first move on the board
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {moveHistory.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 1fr',
                        fontSize: '13px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                        color: '#d4d4d8',
                      }}
                    >
                      <span style={{ color: '#71717a' }}>{idx + 1}.</span>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>{m.white}</span>
                      <span style={{ fontWeight: 600, color: '#a1a1aa' }}>{m.black || ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleStartNewGame}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              background: '#ffffff',
              color: '#000000',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(255, 255, 255, 0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            <RotateCcw size={15} />
            New Match
          </button>

          <button
            type="button"
            onClick={() => setPlayerPerspective((p) => (p === 'white' ? 'black' : 'white'))}
            title="Flip Board Angle"
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={15} />
          </button>

          <button
            type="button"
            onClick={handleResign}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'transparent',
              color: '#a1a1aa',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Flag size={15} />
            Resign
          </button>
        </div>
      </div>
    </div>
  );
};
