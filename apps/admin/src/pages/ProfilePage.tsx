import React from 'react';
import { LocalStore } from '../api/localStore';
import { Crown, Flame, Zap, Clock, History } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const user = LocalStore.getCurrentUser();
  const history = LocalStore.getGameHistory();

  if (!user) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#a1a1aa', fontFamily: "'Poppins', sans-serif" }}>
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 72px)',
        backgroundColor: '#000000',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 60%)',
        color: '#ffffff',
        padding: '48px 56px',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Profile Card Header */}
        <div
          style={{
            background: 'rgba(15, 15, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '24px',
                background: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '38px',
                fontWeight: 800,
                color: '#000000',
                boxShadow: '0 12px 28px rgba(255, 255, 255, 0.2)',
              }}
            >
              ♔
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#ffffff' }}>{user.displayName}</h1>
                {user.title && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      background: '#ffffff',
                      color: '#000000',
                      padding: '3px 9px',
                      borderRadius: '6px',
                    }}
                  >
                    {user.title}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '14px', color: '#a1a1aa', marginTop: '4px' }}>@{user.username}</div>
              <p style={{ fontSize: '14px', color: '#71717a', margin: '10px 0 0 0' }}>
                {user.bio || 'Online Grandmaster competing in the 3D Arena.'}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '16px 24px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>{user.stats.wins}</div>
              <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600 }}>WINS</div>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#d4d4d8' }}>{user.stats.draws}</div>
              <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600 }}>DRAWS</div>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#a1a1aa' }}>{user.stats.losses}</div>
              <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600 }}>LOSSES</div>
            </div>
          </div>
        </div>

        {/* Rating Category Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
          {[
            { label: 'Bullet', rating: user.ratings.bullet, icon: Zap },
            { label: 'Blitz', rating: user.ratings.blitz, icon: Flame },
            { label: 'Rapid', rating: user.ratings.rapid, icon: Clock },
            { label: 'Classical', rating: user.ratings.classical, icon: Crown },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                style={{
                  background: 'rgba(15, 15, 18, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa' }}>{card.label}</span>
                  <Icon size={18} color="#ffffff" />
                </div>
                <div style={{ fontSize: '30px', fontWeight: 800, color: '#ffffff' }}>{card.rating}</div>
                <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>Competitive Rating</div>
              </div>
            );
          })}
        </div>

        {/* Recent Match History */}
        <div
          style={{
            background: 'rgba(15, 15, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <History size={22} color="#ffffff" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff' }}>Recent Match History</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((game) => {
              const isWin = game.result === 'win';
              return (
                <div
                  key={game.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 22px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: isWin ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: isWin ? '#ffffff' : '#a1a1aa',
                        border: isWin ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {game.result}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                        vs {game.opponent} ({game.opponentRating})
                      </div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
                        {game.timeControl} • {game.reason} • {game.movesCount} moves
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: game.ratingChange >= 0 ? '#ffffff' : '#a1a1aa',
                      }}
                    >
                      {game.ratingChange >= 0 ? `+${game.ratingChange}` : game.ratingChange} Elo
                    </div>
                    <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                      {new Date(game.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
