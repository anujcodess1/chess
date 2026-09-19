import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser, signOut } from '../auth';
import { LocalStore } from '../api/localStore';
import { Swords, Puzzle, Trophy, User, LogOut, Home } from 'lucide-react';
import { BrandLogoEmblem } from './icons/PremiumIcons';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const account = LocalStore.getCurrentUser();

  const handleSignOut = () => {
    signOut();
    navigate('/auth');
  };

  const inArena = location.pathname === '/play';

  const navLinks = [
    { path: '/', label: 'Home Lobby', icon: Home },
    ...(inArena ? [{ path: '/play', label: 'Battle Arena', icon: Swords }] : []),
    { path: '/puzzles', label: 'Daily Puzzles', icon: Puzzle },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/profile', label: 'My Profile', icon: User },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '76px',
        backgroundColor: 'rgba(5, 5, 7, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        color: '#ffffff',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Cinematic Brand Logo with Custom Emblem SVG */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <BrandLogoEmblem size={40} />
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.06em', lineHeight: 1.1, color: '#ffffff' }}>
            CHESS
          </div>
          <div style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 600, letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff', display: 'inline-block' }} />
            ONLINE
          </div>
        </div>
      </Link>

      {/* Spacious Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '9999px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.2s ease',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#000000' : '#a1a1aa',
                boxShadow: isActive ? '0 4px 16px rgba(255, 255, 255, 0.2)' : 'none',
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.4 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {account && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                {account.displayName || account.username}
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 600 }}>
                {account.ratings.rapid} Elo Rating
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#d4d4d8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'Poppins, sans-serif',
                transition: 'all 0.15s ease',
              }}
            >
              <LogOut size={14} />
              <span>Exit</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
