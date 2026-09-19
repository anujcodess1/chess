import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth3DCanvas } from '../components/3d/Auth3DCanvas';
import { LocalStore } from '../api/localStore';
import { signIn as commitSession, userAccountToAuthUser } from '../auth';
import { Crown, Sparkles, LogIn, UserPlus, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form fields
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = LocalStore.signIn(loginInput, loginPassword);
      if (!res.success || !res.user) {
        setError(res.error || 'Invalid credentials. Please try again.');
        setIsLoading(false);
        return;
      }

      commitSession({
        user: userAccountToAuthUser(res.user),
        tokens: {
          accessToken: `local_token_${res.user.id}`,
          refreshToken: `local_refresh_${res.user.id}`,
          accessExpiresIn: 86400 * 30,
        },
      });

      setIsLoading(false);
      navigate('/');
    }, 250);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = LocalStore.signUp(signupUsername, signupEmail, signupPassword, signupDisplayName);
      if (!res.success || !res.user) {
        setError(res.error || 'Failed to create account.');
        setIsLoading(false);
        return;
      }

      commitSession({
        user: userAccountToAuthUser(res.user),
        tokens: {
          accessToken: `local_token_${res.user.id}`,
          refreshToken: `local_refresh_${res.user.id}`,
          accessExpiresIn: 86400 * 30,
        },
      });

      setIsLoading(false);
      navigate('/');
    }, 300);
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: "'Poppins', sans-serif",
        overflow: 'hidden',
        padding: '32px 20px',
      }}
    >
      {/* 3D Interactive Monochromatic Staunton Scene */}
      <Auth3DCanvas />

      {/* Cinematic Vignette Overlays */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 75%, #000000 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Floating Auth Card in Cinematic Black & White */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(15, 15, 18, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '28px',
          padding: '40px 36px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              background: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 10px 30px rgba(255, 255, 255, 0.2)',
              marginBottom: '16px',
            }}
          >
            <Crown size={32} color="#000000" strokeWidth={2.2} />
          </div>
          <h1
            style={{
              margin: '0 0 8px 0',
              fontSize: '30px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: '#ffffff',
            }}
          >
            Chess
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#a1a1aa' }}>
            Play Chess Online
          </p>
        </div>

        {/* Tab Switcher: Sign In / Sign Up */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '16px',
            marginBottom: '28px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              background: mode === 'signin' ? '#ffffff' : 'transparent',
              color: mode === 'signin' ? '#000000' : '#a1a1aa',
              boxShadow: mode === 'signin' ? '0 4px 14px rgba(255, 255, 255, 0.2)' : 'none',
            }}
          >
            <LogIn size={16} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              background: mode === 'signup' ? '#ffffff' : 'transparent',
              color: mode === 'signup' ? '#000000' : '#a1a1aa',
              boxShadow: mode === 'signup' ? '0 4px 14px rgba(255, 255, 255, 0.2)' : 'none',
            }}
          >
            <UserPlus size={16} />
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d4d4d8', marginBottom: '8px' }}>
                Username or Email
              </label>
              <input
                type="text"
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="e.g. grandmaster"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.6)',
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d4d4d8', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "'Poppins', sans-serif",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '8px',
                padding: '16px',
                borderRadius: '14px',
                border: 'none',
                background: '#ffffff',
                color: '#000000',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? 'Entering Arena...' : 'Enter Arena'}
              <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          /* Sign Up Form */
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d4d4d8', marginBottom: '8px' }}>
                Username
              </label>
              <input
                type="text"
                required
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                placeholder="Choose player username"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.6)',
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d4d4d8', marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="name@chess.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "'Poppins', sans-serif",
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d4d4d8', marginBottom: '8px' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="6+ chars"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.6)',
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d4d4d8', marginBottom: '8px' }}>
                  Confirm
                </label>
                <input
                  type="password"
                  required
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  placeholder="Repeat"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.6)',
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
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '10px',
                padding: '16px',
                borderRadius: '14px',
                border: 'none',
                background: '#ffffff',
                color: '#000000',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? 'Creating Account...' : 'Create Player Account'}
              <Sparkles size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
