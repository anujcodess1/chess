import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Luxury Brand Crown & Chess Shield
 */
export const BrandLogoEmblem: React.FC<IconProps> = ({ size = 36, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.18))', ...style }}
  >
    <defs>
      <linearGradient id="brandMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="40%" stopColor="#e4e4e7" />
        <stop offset="70%" stopColor="#a1a1aa" />
        <stop offset="100%" stopColor="#52525b" />
      </linearGradient>
      <linearGradient id="brandGlow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </linearGradient>
      <filter id="subtleShine" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ffffff" floodOpacity="0.25" />
      </filter>
    </defs>
    {/* Outer Faceted Shield */}
    <rect x="3" y="3" width="42" height="42" rx="14" fill="#09090b" stroke="url(#brandMetal)" strokeWidth="1.5" />
    <rect x="4" y="4" width="40" height="40" rx="13" fill="url(#brandGlow)" opacity="0.15" />
    {/* Geometric Crown Silhouette */}
    <path
      d="M14 33H34V30H14V33ZM34 28L31.5 19L27 24L24 15L21 24L16.5 19L14 28H34Z"
      fill="url(#brandMetal)"
      filter="url(#subtleShine)"
    />
    {/* Diamond Crest Tip */}
    <circle cx="24" cy="13.5" r="2" fill="#ffffff" />
    <circle cx="15.5" cy="17.5" r="1.5" fill="#ffffff" opacity="0.9" />
    <circle cx="32.5" cy="17.5" r="1.5" fill="#ffffff" opacity="0.9" />
    {/* Base Inlay Bar */}
    <rect x="17" y="30.5" width="14" height="1" rx="0.5" fill="#ffffff" opacity="0.8" />
  </svg>
);

/**
 * Luxury Lightning Shard (Quick Match)
 */
export const QuickMatchEmblem: React.FC<IconProps> = ({ size = 28, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))', ...style }}
  >
    <defs>
      <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor="#f4f4f5" />
        <stop offset="100%" stopColor="#a1a1aa" />
      </linearGradient>
      <linearGradient id="boltRim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#71717a" />
      </linearGradient>
    </defs>
    <path
      d="M18.5 2.5L7 17H16L13.5 29.5L25 15H16L18.5 2.5Z"
      fill="url(#boltGrad)"
      stroke="url(#boltRim)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* Internal Bevel Core */}
    <path
      d="M17.5 5.5L9.5 16.5H16L14.5 25.5L22.5 15.5H16L17.5 5.5Z"
      fill="#ffffff"
      opacity="0.35"
    />
  </svg>
);

/**
 * Luxury Security Crest & Vault Lock (Private Room)
 */
export const PrivateRoomEmblem: React.FC<IconProps> = ({ size = 28, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.15))', ...style }}
  >
    <defs>
      <linearGradient id="shieldMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#d4d4d8" />
        <stop offset="100%" stopColor="#52525b" />
      </linearGradient>
    </defs>
    {/* Shield Outer Wall */}
    <path
      d="M16 3L6 7.5V14.5C6 21 10.3 27 16 29C21.7 27 26 21 26 14.5V7.5L16 3Z"
      fill="#0c0c0e"
      stroke="url(#shieldMetal)"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Keyhole Lock Core */}
    <path
      d="M16 11C14.34 11 13 12.34 13 14C13 15.15 13.65 16.14 14.6 16.63L14 21H18L17.4 16.63C18.35 16.14 19 15.15 19 14C19 12.34 17.66 11 16 11Z"
      fill="url(#shieldMetal)"
    />
    <circle cx="16" cy="14" r="1.3" fill="#000000" />
  </svg>
);

/**
 * Luxury AI Core Crown (Computer Match)
 */
export const AiBotEmblem: React.FC<IconProps> = ({ size = 28, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.15))', ...style }}
  >
    <defs>
      <linearGradient id="aiMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#e4e4e7" />
        <stop offset="100%" stopColor="#71717a" />
      </linearGradient>
    </defs>
    {/* Neural Hex Frame */}
    <path
      d="M16 3.5L25.5 9V20L16 25.5L6.5 20V9L16 3.5Z"
      fill="#0c0c0e"
      stroke="url(#aiMetal)"
      strokeWidth="1.4"
    />
    {/* Cybernetic Crown Nodes */}
    <circle cx="16" cy="14.5" r="4" fill="url(#aiMetal)" />
    <circle cx="16" cy="14.5" r="1.8" fill="#000000" />
    <circle cx="16" cy="8" r="1.5" fill="#ffffff" />
    <circle cx="10.5" cy="18" r="1.5" fill="#ffffff" />
    <circle cx="21.5" cy="18" r="1.5" fill="#ffffff" />
    <line x1="16" y1="9.5" x2="16" y2="10.5" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="12" y1="16.5" x2="13.2" y2="15.8" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="20" y1="16.5" x2="18.8" y2="15.8" stroke="#ffffff" strokeWidth="1.2" />
  </svg>
);

/**
 * Luxury 2-Player Dueling Kings (Local Pass & Play)
 */
export const LocalTwoPlayerEmblem: React.FC<IconProps> = ({ size = 28, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.15))', ...style }}
  >
    <defs>
      <linearGradient id="whiteKing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d4d4d8" />
      </linearGradient>
      <linearGradient id="blackKing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3f3f46" />
        <stop offset="100%" stopColor="#18181b" />
      </linearGradient>
    </defs>
    {/* Left (White) King silhouette */}
    <path
      d="M12 25H4V22H12V25ZM11.5 20.5H4.5L5.5 13H10.5L11.5 20.5ZM10 11.5L8 9L6 11.5V12.5H10V11.5ZM8 6.5V8.5M7 7.5H9"
      fill="url(#whiteKing)"
      stroke="#ffffff"
      strokeWidth="0.6"
      strokeLinecap="round"
    />
    {/* Right (Black) King silhouette */}
    <path
      d="M28 25H20V22H28V25ZM27.5 20.5H20.5L21.5 13H26.5L27.5 20.5ZM26 11.5L24 9L22 11.5V12.5H26V11.5ZM24 6.5V8.5M23 7.5H25"
      fill="url(#blackKing)"
      stroke="#a1a1aa"
      strokeWidth="0.8"
      strokeLinecap="round"
    />
    {/* Center Division Flare */}
    <circle cx="16" cy="16" r="1.5" fill="#ffffff" />
  </svg>
);

/**
 * Luxury Tactical Puzzle Crystal
 */
export const TacticalPuzzleEmblem: React.FC<IconProps> = ({ size = 28, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.15))', ...style }}
  >
    <defs>
      <linearGradient id="puzzleMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#e4e4e7" />
        <stop offset="100%" stopColor="#71717a" />
      </linearGradient>
    </defs>
    <path
      d="M16 3L28 10V22L16 29L4 22V10L16 3Z"
      fill="#0c0c0e"
      stroke="url(#puzzleMetal)"
      strokeWidth="1.4"
    />
    {/* Facet Inset Lines */}
    <path d="M16 3V16L28 22" stroke="url(#puzzleMetal)" strokeWidth="1" opacity="0.6" />
    <path d="M16 16L4 22" stroke="url(#puzzleMetal)" strokeWidth="1" opacity="0.6" />
    <path d="M16 16L28 10" stroke="url(#puzzleMetal)" strokeWidth="1" opacity="0.6" />
    <path d="M16 16L4 10" stroke="url(#puzzleMetal)" strokeWidth="1" opacity="0.6" />
    <circle cx="16" cy="16" r="2.5" fill="#ffffff" />
  </svg>
);

/**
 * Luxury Sculpted Staunton King Emblem (Replaces cheap unicode ♔)
 */
export const LuxuryKingAvatar: React.FC<IconProps & { variant?: 'light' | 'dark' }> = ({
  size = 28,
  variant = 'light',
  style,
}) => {
  const isLight = variant === 'light';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: isLight ? 'drop-shadow(0 2px 8px rgba(255,255,255,0.3))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))', ...style }}
    >
      <defs>
        <linearGradient id="kingLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f4f4f5" />
          <stop offset="100%" stopColor="#d4d4d8" />
        </linearGradient>
        <linearGradient id="kingDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="50%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
      </defs>
      {/* Base Pedestal */}
      <path
        d="M23 26H9C8.45 26 8 25.55 8 25V24C8 23.45 8.45 23 9 23H23C23.55 23 24 23.45 24 24V25C24 25.55 23.55 26 23 26Z"
        fill={isLight ? 'url(#kingLight)' : 'url(#kingDark)'}
        stroke={isLight ? '#ffffff' : '#52525b'}
        strokeWidth="0.8"
      />
      {/* Turned Body */}
      <path
        d="M10 22C10.5 19 12 16.5 13 14H19C20 16.5 21.5 19 22 22H10Z"
        fill={isLight ? 'url(#kingLight)' : 'url(#kingDark)'}
        stroke={isLight ? '#ffffff' : '#52525b'}
        strokeWidth="0.8"
      />
      {/* Mid Collar */}
      <path
        d="M11 13H21V11.5C21 11.22 20.78 11 20.5 11H11.5C11.22 11 11 11.22 11 11.5V13Z"
        fill={isLight ? '#ffffff' : '#3f3f46'}
      />
      {/* Crown Cap */}
      <path
        d="M11 10.5C11 8 13.24 6 16 6C18.76 6 21 8 21 10.5H11Z"
        fill={isLight ? 'url(#kingLight)' : 'url(#kingDark)'}
        stroke={isLight ? '#ffffff' : '#52525b'}
        strokeWidth="0.8"
      />
      {/* Cross Finial */}
      <line x1="16" y1="3" x2="16" y2="6.5" stroke={isLight ? '#ffffff' : '#d4d4d8'} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14.2" y1="4.5" x2="17.8" y2="4.5" stroke={isLight ? '#ffffff' : '#d4d4d8'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

/**
 * Luxury Sculpted Trophy Emblem
 */
export const LuxuryTrophyEmblem: React.FC<IconProps> = ({ size = 32, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 4px 14px rgba(255,255,255,0.2))', ...style }}
  >
    <defs>
      <linearGradient id="trophyMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor="#f4f4f5" />
        <stop offset="70%" stopColor="#d4d4d8" />
        <stop offset="100%" stopColor="#71717a" />
      </linearGradient>
    </defs>
    {/* Cup Body */}
    <path
      d="M11 6H25V15C25 18.87 21.87 22 18 22C14.13 22 11 18.87 11 15V6Z"
      fill="url(#trophyMetal)"
      stroke="#ffffff"
      strokeWidth="1"
    />
    {/* Left Handle */}
    <path
      d="M11 9H8C6.9 9 6 9.9 6 11V13C6 15.21 7.79 17 10 17H11"
      stroke="url(#trophyMetal)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Right Handle */}
    <path
      d="M25 9H28C29.1 9 30 9.9 30 11V13C30 15.21 28.21 17 26 17H25"
      stroke="url(#trophyMetal)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Stem */}
    <path d="M16 22V27H20V22" fill="url(#trophyMetal)" />
    {/* Base Stand */}
    <rect x="12" y="27" width="12" height="4" rx="2" fill="url(#trophyMetal)" stroke="#ffffff" strokeWidth="0.8" />
    {/* Star Inlay */}
    <circle cx="18" cy="13.5" r="2.2" fill="#000000" />
    <circle cx="18" cy="13.5" r="1.2" fill="#ffffff" />
  </svg>
);
