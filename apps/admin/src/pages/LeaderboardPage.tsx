import React, { useState } from 'react';
import { LocalStore } from '../api/localStore';
import { Trophy, Medal, Search } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const [category, setCategory] = useState<'blitz' | 'bullet' | 'rapid' | 'classical'>('blitz');
  const [search, setSearch] = useState('');
  const players = LocalStore.getLeaderboard();

  const filtered = players
    .filter(
      (p) =>
        p.username.toLowerCase().includes(search.toLowerCase()) ||
        p.displayName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.ratings[category] - a.ratings[category]);

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
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header Title & Categories */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Trophy size={32} color="#ffffff" />
              <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, color: '#ffffff' }}>Global Leaderboard</h1>
            </div>
            <p style={{ color: '#a1a1aa', margin: 0, fontSize: '14px' }}>
              Top ranked Grandmasters across all time formats
            </p>
          </div>

          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {(['blitz', 'bullet', 'rapid', 'classical'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  background: category === cat ? '#ffffff' : 'transparent',
                  color: category === cat ? '#000000' : '#a1a1aa',
                  boxShadow: category === cat ? '0 4px 14px rgba(255, 255, 255, 0.15)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '28px', position: 'relative' }}>
          <Search
            size={18}
            color="#a1a1aa"
            style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search players by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 18px 14px 48px',
              borderRadius: '14px',
              background: 'rgba(15, 15, 18, 0.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: "'Poppins', sans-serif",
            }}
          />
        </div>

        {/* Leaderboard Table */}
        <div
          style={{
            background: 'rgba(15, 15, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 2fr 120px 140px 120px',
              padding: '18px 28px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#71717a',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            <span>Rank</span>
            <span>Player</span>
            <span style={{ textAlign: 'right' }}>Rating</span>
            <span style={{ textAlign: 'right' }}>Win Rate</span>
            <span style={{ textAlign: 'right' }}>Games</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((player, idx) => {
              const total = player.stats.gamesPlayed || 1;
              const winRate = Math.round((player.stats.wins / total) * 100);
              const rank = idx + 1;

              return (
                <div
                  key={player.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 2fr 120px 140px 120px',
                    padding: '20px 28px',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: rank === 1 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    transition: 'background 0.2s ease',
                  }}
                >
                  {/* Rank */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {rank === 1 ? (
                      <Medal size={22} color="#ffffff" />
                    ) : rank === 2 ? (
                      <Medal size={22} color="#e4e4e7" />
                    ) : rank === 3 ? (
                      <Medal size={22} color="#a1a1aa" />
                    ) : (
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#71717a' }}>#{rank}</span>
                    )}
                  </div>

                  {/* Player Name & Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #27272a, #18181b)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        fontWeight: 800,
                        color: '#ffffff',
                      }}
                    >
                      {player.username[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                          {player.displayName}
                        </span>
                        {player.title && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: '#ffffff',
                              color: '#000000',
                              padding: '2px 7px',
                              borderRadius: '4px',
                            }}
                          >
                            {player.title}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: '#71717a' }}>@{player.username}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div style={{ textAlign: 'right', fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>
                    {player.ratings[category]}
                  </div>

                  {/* Win Rate */}
                  <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: 600, color: '#d4d4d8' }}>
                    {winRate}%
                  </div>

                  {/* Games Played */}
                  <div style={{ textAlign: 'right', fontSize: '14px', color: '#71717a' }}>
                    {player.stats.gamesPlayed}
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
