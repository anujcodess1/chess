import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocalStore } from '../api/localStore';
import { onlineService, PresenceStats, OnlinePlayerInfo } from '../api/onlineMatch';
import {
  Lock,
  Copy,
  Check,
  Clock,
  RefreshCw,
  Play,
  X,
  ChevronRight,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import {
  BrandLogoEmblem,
  QuickMatchEmblem,
  PrivateRoomEmblem,
  AiBotEmblem,
  LocalTwoPlayerEmblem,
  TacticalPuzzleEmblem,
  LuxuryKingAvatar,
  LuxuryTrophyEmblem,
} from '../components/icons/PremiumIcons';

type TimeControlKey = 'bullet' | 'blitz' | 'rapid' | 'classical';
type AiDifficulty = 'novice' | 'intermediate' | 'master';

interface TimeControlConfig {
  label: string;
  desc: string;
  initialSeconds: number;
  incrementSeconds: number;
}

const TIME_CONTROLS: Record<TimeControlKey, TimeControlConfig> = {
  bullet: { label: '1m Bullet', desc: 'Lightning reflex play', initialSeconds: 60, incrementSeconds: 0 },
  blitz: { label: '3m+2s Blitz', desc: 'Tournament arena standard', initialSeconds: 180, incrementSeconds: 2 },
  rapid: { label: '10m Rapid', desc: 'Tactical positional depth', initialSeconds: 600, incrementSeconds: 0 },
  classical: { label: '30m Classical', desc: 'Grandmaster patience', initialSeconds: 1800, incrementSeconds: 0 },
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = LocalStore.getCurrentUser();
  const [presence, setPresence] = useState<PresenceStats>(onlineService.getPresence());

  // Quick Match Selection
  const [quickTimeControl, setQuickTimeControl] = useState<TimeControlKey>('blitz');
  const [quickColor, setQuickColor] = useState<'random' | 'white' | 'black'>('random');

  // AI Selection
  const [aiDiff, setAiDiff] = useState<AiDifficulty>('intermediate');
  const [aiTc, setAiTc] = useState<TimeControlKey>('blitz');

  // Private Arena Tab: 'create' | 'join'
  const [privateTab, setPrivateTab] = useState<'create' | 'join'>('create');

  // Join Room by Code & Password
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Custom Room Creation State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roomName, setRoomName] = useState(
    currentUser?.displayName ? `${currentUser.displayName}'s Arena` : `${currentUser?.username || 'Player'}'s Arena`
  );
  const [roomTc, setRoomTc] = useState<TimeControlKey>('blitz');
  const [roomColor, setRoomColor] = useState<'random' | 'white' | 'black'>('random');
  const [roomPassword, setRoomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ roomId: string; password?: string; name: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // 30-Second Cooldown on Room Creation
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(onlineService.getRemainingRoomCooldown());

  // Open Rooms Browser
  const [openRooms, setOpenRooms] = useState<Array<{ roomId: string; name: string; timeControl: string; hasPassword: boolean; hostName: string; hostRating: number }>>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [selectedRoomForPassword, setSelectedRoomForPassword] = useState<string | null>(null);
  const [promptPasswordInput, setPromptPasswordInput] = useState('');

  // Subscribe to Presence
  useEffect(() => {
    const unsub = onlineService.subscribePresence((stats) => {
      setPresence(stats);
    });
    return () => unsub();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = onlineService.getRemainingRoomCooldown();
      setCooldownRemaining(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Open Rooms
  const loadOpenRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const rooms = await onlineService.fetchOpenRooms();
      setOpenRooms(rooms);
    } catch {}
    setIsLoadingRooms(false);
  };

  useEffect(() => {
    loadOpenRooms();
    const timer = setInterval(loadOpenRooms, 6000);
    return () => clearInterval(timer);
  }, []);

  // 1. Launch Quick Match
  const handleLaunchQuickMatch = () => {
    navigate(`/play?mode=online&tc=${quickTimeControl}&color=${quickColor}&autoSearch=true`);
  };

  // 2. Launch AI Match
  const handleLaunchAiMatch = () => {
    navigate(`/play?mode=ai&ai=${aiDiff}&tc=${aiTc}`);
  };

  // 3. Launch Local 2P Match
  const handleLaunchLocalMatch = () => {
    navigate('/play?mode=pass_and_play');
  };

  // 4. Create Custom Room (with 30-second cooldown enforcement)
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const cooldown = onlineService.getRemainingRoomCooldown();
    if (cooldown > 0) {
      setCreateError(`Room creation limit active. Please wait ${cooldown} seconds before creating another room.`);
      return;
    }

    const myId = currentUser?.id || onlineService.getPlayerId();
    const hostInfo: OnlinePlayerInfo = {
      id: myId,
      username: currentUser?.username || `Host_${myId.substring(myId.length - 4)}`,
      rating: currentUser?.ratings[roomTc] || 1500,
      color: roomColor === 'random' ? 'white' : roomColor,
      title: currentUser?.title,
    };

    const res = await onlineService.createCustomRoom({
      name: roomName.trim() || `${hostInfo.username}'s Arena`,
      password: roomPassword.trim() || undefined,
      timeControl: roomTc,
      colorPreference: roomColor,
      host: hostInfo,
    });

    if (!res.ok) {
      if (res.remainingSeconds) {
        setCooldownRemaining(res.remainingSeconds);
      }
      setCreateError(res.error || 'Failed to create room. Please try again.');
      return;
    }

    if (res.roomId) {
      setCreatedRoom({
        roomId: res.roomId,
        password: roomPassword.trim() || undefined,
        name: roomName.trim(),
      });
      loadOpenRooms();
    }
  };

  // 5. Close / Delete Room (starts 30-second cooldown!)
  const handleCloseRoom = async () => {
    if (!createdRoom) return;
    await onlineService.closeCustomRoom(createdRoom.roomId);
    setCreatedRoom(null);
    setIsCreateModalOpen(false);
    setCooldownRemaining(30);
    loadOpenRooms();
  };

  // 6. Enter the Arena for created room
  const handleEnterCreatedRoom = () => {
    if (!createdRoom) return;
    navigate(`/play?mode=online&room=${createdRoom.roomId}&role=host&tc=${roomTc}&color=${roomColor}`);
  };

  // 7. Join Room by ID & Password
  const handleJoinRoom = async (roomIdToJoin: string, passwordToUse?: string) => {
    if (!roomIdToJoin.trim()) return;
    setIsJoining(true);
    setJoinError(null);

    const myId = currentUser?.id || onlineService.getPlayerId();
    const playerInfo: OnlinePlayerInfo = {
      id: myId,
      username: currentUser?.username || `Guest_${myId.substring(myId.length - 4)}`,
      rating: currentUser?.ratings.blitz || 1500,
      color: 'black',
      title: currentUser?.title,
    };

    const res = await onlineService.joinRoomWithPassword(roomIdToJoin, passwordToUse, playerInfo);
    setIsJoining(false);

    if (!res.ok) {
      setJoinError(res.message || 'Failed to join room.');
      return;
    }

    navigate(`/play?mode=online&room=${roomIdToJoin.trim().toUpperCase()}&role=join`);
  };

  const copyToClipboard = (text: string, isPassword = false) => {
    navigator.clipboard.writeText(text);
    if (isPassword) {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 76px)',
        backgroundColor: '#000000',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.04) 0%, transparent 70%)',
        color: '#ffffff',
        padding: '64px 48px 140px 48px',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Hero Section — Grand, Spacious & Clean */}
        <div
          style={{
            position: 'relative',
            borderRadius: '32px',
            background: 'linear-gradient(180deg, rgba(20, 20, 23, 0.7) 0%, rgba(9, 9, 11, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '64px 56px',
            marginBottom: '64px',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.9), 0 0 60px rgba(255, 255, 255, 0.02)',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Radial Lighting */}
          <div
            style={{
              position: 'absolute',
              top: '-30%',
              left: '25%',
              width: '600px',
              height: '400px',
              background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.07) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '48px',
            }}
          >
            <div style={{ maxWidth: '720px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#f4f4f5',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  marginBottom: '28px',
                  textTransform: 'uppercase',
                }}
              >
                <BrandLogoEmblem size={16} />
                <span>Online Chess</span>
              </div>

              <h1
                style={{
                  fontSize: '56px',
                  fontWeight: 800,
                  margin: '0 0 16px 0',
                  lineHeight: 1.1,
                  letterSpacing: '-0.035em',
                  color: '#ffffff',
                }}
              >
                Chess
              </h1>
              <p
                style={{
                  fontSize: '16px',
                  color: '#a1a1aa',
                  margin: 0,
                  lineHeight: 1.75,
                  maxWidth: '620px',
                  fontWeight: 400,
                }}
              >
                Play chess online with random players worldwide, create private password-protected rooms with friends, or practice offline against the computer.
              </p>
            </div>

            {/* Live Telemetry Card */}
            <div
              style={{
                background: 'rgba(10, 10, 12, 0.88)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '24px',
                padding: '28px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                minWidth: '260px',
                boxShadow: '0 15px 40px rgba(0,0,0,0.7)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 0 16px #ffffff',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', letterSpacing: '1px' }}>
                  ARENA TELEMETRY
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#a1a1aa' }}>
                  <span>Active Online</span>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '15px' }}>{presence.onlineCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#a1a1aa' }}>
                  <span>In Matchmaking</span>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '15px' }}>{presence.queueCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#a1a1aa' }}>
                  <span>Active Arenas</span>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '15px' }}>{presence.openRoomsCount || openRooms.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cooldown Alert Banner */}
        {cooldownRemaining > 0 && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              borderRadius: '20px',
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '56px',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Clock size={22} color="#ffffff" />
              <div>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Room Limit Cooldown: </span>
                <span style={{ color: '#d4d4d8', fontSize: '14px' }}>
                  You closed a room recently. Please wait {cooldownRemaining}s before creating a new one to keep rooms clean.
                </span>
              </div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
              {cooldownRemaining}s
            </div>
          </div>
        )}

        {/* Primary Multiplayer Grid — Generously Spaced (2 Columns, Uncluttered) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
            gap: '40px',
            marginBottom: '80px',
          }}
        >
          {/* Card 1: ⚡ Quick Match (Random Matchmaking) */}
          <div
            style={{
              background: 'rgba(16, 16, 19, 0.75)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '28px',
              padding: '44px 40px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
              <QuickMatchEmblem size={56} />
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
                  Quick Match
                </h2>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0, fontWeight: 400 }}>
                  Automated matchmaking with players across the globe
                </p>
              </div>
            </div>

            {/* Time Control Options */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginBottom: '14px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Select Time Format
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {(Object.keys(TIME_CONTROLS) as TimeControlKey[]).map((key) => {
                  const active = quickTimeControl === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setQuickTimeControl(key)}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '16px',
                        border: active ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                        color: active ? '#000000' : '#d4d4d8',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Poppins', sans-serif",
                        boxShadow: active ? '0 8px 24px rgba(255, 255, 255, 0.15)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{TIME_CONTROLS[key].label}</div>
                      <div style={{ fontSize: '11px', color: active ? '#52525b' : '#71717a', marginTop: '2px' }}>
                        {TIME_CONTROLS[key].desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Preference */}
            <div style={{ marginBottom: '40px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginBottom: '14px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Preferred Piece Color
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { id: 'random', label: 'Random Choice', emblem: <BrandLogoEmblem size={20} /> },
                  { id: 'white', label: 'White Pieces', emblem: <LuxuryKingAvatar size={22} variant="light" /> },
                  { id: 'black', label: 'Black Pieces', emblem: <LuxuryKingAvatar size={22} variant="dark" /> },
                ].map((opt) => {
                  const active = quickColor === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuickColor(opt.id as any)}
                      style={{
                        padding: '14px 10px',
                        borderRadius: '14px',
                        border: active ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: active ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: "'Poppins', sans-serif",
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {opt.emblem}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleLaunchQuickMatch}
              style={{
                marginTop: 'auto',
                width: '100%',
                padding: '18px 24px',
                borderRadius: '16px',
                border: 'none',
                background: '#ffffff',
                color: '#000000',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 12px 36px rgba(255, 255, 255, 0.22)',
                transition: 'all 0.2s ease',
                fontFamily: "'Poppins', sans-serif",
                letterSpacing: '0.02em',
              }}
            >
              <QuickMatchEmblem size={22} />
              <span>Find Random Opponent</span>
            </button>
          </div>

          {/* Card 2: 🛡️ Private Arena Suite (Create Room OR Join Room with Switcher) */}
          <div
            style={{
              background: 'rgba(16, 16, 19, 0.75)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '28px',
              padding: '44px 40px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
              <PrivateRoomEmblem size={56} />
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
                  Private Arena
                </h2>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
                  Unique Room ID & Optional Password Protection
                </p>
              </div>
            </div>

            {/* Clean Segment Switcher: Create Arena vs Join Arena */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '6px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '32px',
              }}
            >
              <button
                type="button"
                onClick={() => setPrivateTab('create')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: privateTab === 'create' ? '#ffffff' : 'transparent',
                  color: privateTab === 'create' ? '#000000' : '#a1a1aa',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Create Arena
              </button>
              <button
                type="button"
                onClick={() => setPrivateTab('join')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: privateTab === 'join' ? '#ffffff' : 'transparent',
                  color: privateTab === 'join' ? '#000000' : '#a1a1aa',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Join with Code
              </button>
            </div>

            {privateTab === 'create' ? (
              /* Create Tab View */
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 24px 0' }}>
                  Launch a private chess lobby. You will receive a unique Room ID that you can share with friends. Add an optional password to restrict entry.
                </p>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    marginBottom: '36px',
                    fontSize: '13px',
                    color: '#d4d4d8',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Lock size={16} color="#ffffff" />
                    <span>Cryptographic room codes and optional PIN password</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={16} color="#ffffff" />
                    <span>A 30-second cooldown protects lobby hygiene upon room closure</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCreateError(null);
                    setIsCreateModalOpen(true);
                  }}
                  disabled={cooldownRemaining > 0}
                  style={{
                    marginTop: 'auto',
                    width: '100%',
                    padding: '18px 24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    background: cooldownRemaining > 0 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                    color: cooldownRemaining > 0 ? '#71717a' : '#ffffff',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: cooldownRemaining > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontFamily: "'Poppins', sans-serif",
                    transition: 'all 0.2s ease',
                  }}
                >
                  <PrivateRoomEmblem size={20} />
                  <span>
                    {cooldownRemaining > 0 ? `Cooldown Active (${cooldownRemaining}s)` : 'Configure & Generate Arena'}
                  </span>
                </button>
              </div>
            ) : (
              /* Join Tab View */
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                {joinError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      fontSize: '13px',
                      color: '#fca5a5',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{joinError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Room Code ID:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ARENA-8392"
                      value={joinRoomId}
                      onChange={(e) => {
                        setJoinRoomId(e.target.value.toUpperCase());
                        setJoinError(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Room Password:
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank if public room"
                      value={joinPassword}
                      onChange={(e) => {
                        setJoinPassword(e.target.value);
                        setJoinError(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleJoinRoom(joinRoomId, joinPassword)}
                  disabled={isJoining || !joinRoomId.trim()}
                  style={{
                    marginTop: 'auto',
                    width: '100%',
                    padding: '18px 24px',
                    borderRadius: '16px',
                    border: 'none',
                    background: !joinRoomId.trim() ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                    color: !joinRoomId.trim() ? '#71717a' : '#000000',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: !joinRoomId.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: !joinRoomId.trim() ? 'none' : '0 12px 36px rgba(255, 255, 255, 0.2)',
                    fontFamily: "'Poppins', sans-serif",
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Play size={18} />
                  <span>{isJoining ? 'Connecting to Room...' : 'Enter Arena'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section Header: Mastery & Offline */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: '#a1a1aa',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Tactics & Solitary Play
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Offline Formats & Practice
          </h2>
        </div>

        {/* Secondary Modes Row — Clean, Luxurious & Spacious */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '32px',
            marginBottom: '80px',
          }}
        >
          {/* Vs Computer AI */}
          <div
            style={{
              background: 'rgba(16, 16, 19, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <AiBotEmblem size={44} />
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>Vs Computer AI</div>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>Adaptive tactical engine</div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 24px 0', lineHeight: 1.7 }}>
              Practice against offline algorithmic engines with configurable difficulty levels and zero latency.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
              {(['novice', 'intermediate', 'master'] as AiDifficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setAiDiff(d)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: '12px',
                    border: aiDiff === d ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: aiDiff === d ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                    color: aiDiff === d ? '#000000' : '#a1a1aa',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontFamily: "'Poppins', sans-serif",
                    transition: 'all 0.15s ease',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLaunchAiMatch}
              style={{
                marginTop: 'auto',
                padding: '14px 20px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>Play vs {aiDiff.toUpperCase()} Bot</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Pass & Play (Local 2P) */}
          <div
            style={{
              background: 'rgba(16, 16, 19, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <LocalTwoPlayerEmblem size={44} />
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>Pass & Play (Local 2P)</div>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>Shared physical screen</div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 24px 0', lineHeight: 1.7 }}>
              Share your display and play an over-the-board match locally on the same computer or tablet.
            </p>

            <button
              type="button"
              onClick={handleLaunchLocalMatch}
              style={{
                marginTop: 'auto',
                padding: '14px 20px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>Start Local 2P Game</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Tactical Puzzles */}
          <div
            style={{
              background: 'rgba(16, 16, 19, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <TacticalPuzzleEmblem size={44} />
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>Daily Puzzles</div>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>Tactical checkmate drills</div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 24px 0', lineHeight: 1.7 }}>
              Sharpen your tactical prowess with grandmaster checkmate sequences, forks, and pins.
            </p>

            <button
              type="button"
              onClick={() => navigate('/puzzles')}
              style={{
                marginTop: 'auto',
                padding: '14px 20px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>Solve Daily Puzzles</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Live Open Rooms Browser — Clean Minimalist Section */}
        <div
          style={{
            background: 'rgba(16, 16, 19, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '28px',
            padding: '44px 40px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <PrivateRoomEmblem size={28} />
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Open Public Arenas ({openRooms.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={loadOpenRooms}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '8px 18px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: "'Poppins', sans-serif",
                transition: 'all 0.2s ease',
              }}
            >
              <RefreshCw size={14} style={{ animation: isLoadingRooms ? 'spin 1s linear infinite' : 'none' }} />
              <span>Refresh List</span>
            </button>
          </div>

          {openRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#71717a', fontSize: '14px' }}>
              <p style={{ margin: '0 0 18px 0', fontSize: '15px', color: '#a1a1aa' }}>
                No active custom rooms waiting right now.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                disabled={cooldownRemaining > 0}
                style={{
                  padding: '12px 26px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: cooldownRemaining > 0 ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s Cooldown` : 'Create the first room'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {openRooms.map((room) => (
                <div
                  key={room.roomId}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '18px',
                    padding: '22px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{room.name}</span>
                      {room.hasPassword && <Lock size={13} color="#a1a1aa" />}
                    </div>
                    <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
                      {room.hostName} ({room.hostRating} Elo) • {room.timeControl}
                    </div>
                    <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600, marginTop: '4px', letterSpacing: '0.5px' }}>
                      ID: {room.roomId}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (room.hasPassword) {
                        setSelectedRoomForPassword(room.roomId);
                        setPromptPasswordInput('');
                      } else {
                        handleJoinRoom(room.roomId);
                      }
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#ffffff',
                      color: '#000000',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    <span>Join</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create Custom Room Wizard */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#09090b',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '28px',
              padding: '40px 44px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 35px 90px rgba(0,0,0,0.95), 0 0 60px rgba(255, 255, 255, 0.05)',
              position: 'relative',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Close modal button */}
            {!createdRoom && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                }}
              >
                <X size={22} />
              </button>
            )}

            {!createdRoom ? (
              <form onSubmit={handleCreateRoom}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                  <PrivateRoomEmblem size={36} />
                  <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    Configure Arena
                  </h3>
                </div>

                {createError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      fontSize: '13px',
                      color: '#fca5a5',
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Room Title */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d4d4d8', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Arena Name:
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  />
                </div>

                {/* Time Format */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d4d4d8', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Time Format:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {(Object.keys(TIME_CONTROLS) as TimeControlKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRoomTc(key)}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: roomTc === key ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: roomTc === key ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                          color: roomTc === key ? '#000000' : '#d4d4d8',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {TIME_CONTROLS[key].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Host Color */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d4d4d8', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Host Plays As:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      { id: 'random', label: 'Random', emblem: <BrandLogoEmblem size={18} /> },
                      { id: 'white', label: 'White', emblem: <LuxuryKingAvatar size={20} variant="light" /> },
                      { id: 'black', label: 'Black', emblem: <LuxuryKingAvatar size={20} variant="dark" /> },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRoomColor(opt.id as any)}
                        style={{
                          padding: '12px 8px',
                          borderRadius: '10px',
                          border: roomColor === opt.id ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: roomColor === opt.id ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: "'Poppins', sans-serif",
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {opt.emblem}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password Protection */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#d4d4d8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Room Password:
                    </label>
                    <span style={{ fontSize: '11px', color: '#71717a' }}>Optional</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Leave blank for public room"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 44px 14px 16px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#a1a1aa',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cooldownRemaining > 0}
                  style={{
                    width: '100%',
                    padding: '18px',
                    borderRadius: '14px',
                    border: 'none',
                    background: cooldownRemaining > 0 ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                    color: cooldownRemaining > 0 ? '#71717a' : '#000000',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: cooldownRemaining > 0 ? 'not-allowed' : 'pointer',
                    boxShadow: cooldownRemaining > 0 ? 'none' : '0 12px 30px rgba(255, 255, 255, 0.2)',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s Cooldown...` : 'Create Room & Generate ID'}
                </button>
              </form>
            ) : (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <PrivateRoomEmblem size={38} />
                  </div>
                  <h3 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>
                    {createdRoom.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0 }}>
                    Arena created. Share the credentials below with your opponent.
                  </p>
                </div>

                {/* Room ID Badge */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '18px',
                    padding: '20px 24px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 700, letterSpacing: '1px' }}>ROOM ID:</div>
                    <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '1.5px', color: '#ffffff' }}>
                      {createdRoom.roomId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdRoom.roomId, false)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      background: copiedId ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                      color: copiedId ? '#000000' : '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    {copiedId ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                  </button>
                </div>

                {/* Password Badge */}
                {createdRoom.password && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '18px',
                      padding: '20px 24px',
                      marginBottom: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 700, letterSpacing: '1px' }}>ROOM PASSWORD:</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff' }}>
                        {createdRoom.password}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdRoom.password || '', true)}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        background: copiedPassword ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                        color: copiedPassword ? '#000000' : '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {copiedPassword ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copiedPassword ? 'Copied' : 'Copy Password'}</span>
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <button
                    type="button"
                    onClick={handleEnterCreatedRoom}
                    style={{
                      width: '100%',
                      padding: '18px',
                      borderRadius: '14px',
                      border: 'none',
                      background: '#ffffff',
                      color: '#000000',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 12px 30px rgba(255, 255, 255, 0.2)',
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    <Play size={18} />
                    <span>Enter Arena (Host)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseRoom}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#fca5a5',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    Close Room (Applies 30s Cooldown)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Password Prompt for Protected Open Room */}
      {selectedRoomForPassword && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#09090b',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
              padding: '36px',
              maxWidth: '440px',
              width: '100%',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <Lock size={22} color="#ffffff" />
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Protected Room
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 24px 0', lineHeight: 1.6 }}>
              Room #{selectedRoomForPassword} requires a security password to enter:
            </p>

            <input
              type="password"
              placeholder="Enter room password"
              value={promptPasswordInput}
              onChange={(e) => setPromptPasswordInput(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '24px',
                boxSizing: 'border-box',
                fontFamily: "'Poppins', sans-serif",
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  const roomId = selectedRoomForPassword;
                  setSelectedRoomForPassword(null);
                  handleJoinRoom(roomId, promptPasswordInput);
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#000000',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Join Match
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoomForPassword(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: '#a1a1aa',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
