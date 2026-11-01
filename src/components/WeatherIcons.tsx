import React from 'react';

export interface WeatherIconProps {
  size?: number;
  className?: string;
  isDay?: boolean;
}

// 1. Sunny Icon: Spinning luminous rays + pulsing golden solar core
export const SunnyIcon: React.FC<WeatherIconProps> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`weather-icon weather-icon-sunny ${className}`}
    aria-label="Sunny"
    style={{ overflow: 'visible' }}
  >
    <defs>
      <linearGradient id="sunCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF3B0" />
        <stop offset="45%" stopColor="#FFB800" />
        <stop offset="100%" stopColor="#FF6B00" />
      </linearGradient>
      <linearGradient id="sunRayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFE066" />
        <stop offset="100%" stopColor="#FF9500" />
      </linearGradient>
      <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <style>{`
      @keyframes sunRaysSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes sunCorePulse {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(255, 184, 0, 0.6)); }
        50% { transform: scale(1.05); filter: drop-shadow(0 0 14px rgba(255, 149, 0, 0.9)); }
      }
      .anim-sun-rays {
        transform-origin: 32px 32px;
        animation: sunRaysSpin 16s linear infinite;
      }
      .anim-sun-core {
        transform-origin: 32px 32px;
        animation: sunCorePulse 3.5s ease-in-out infinite;
      }
    `}</style>
    {/* Spinning Rays */}
    <g className="anim-sun-rays">
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <rect
          key={deg}
          x="30"
          y="7"
          width="4"
          height="8"
          rx="2"
          fill="url(#sunRayGrad)"
          transform={`rotate(${deg} 32 32)`}
          opacity={deg % 60 === 0 ? 0.95 : 0.75}
        />
      ))}
    </g>
    {/* Sun Orb */}
    <circle
      cx="32"
      cy="32"
      r="14"
      fill="url(#sunCoreGrad)"
      className="anim-sun-core"
      filter="url(#sunGlow)"
    />
  </svg>
);

// 2. Moon Icon: Crescent moon with soft pulsing lunar glow & twinkling starlight
export const MoonIcon: React.FC<WeatherIconProps> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`weather-icon weather-icon-moon ${className}`}
    aria-label="Clear Night"
    style={{ overflow: 'visible' }}
  >
    <defs>
      <linearGradient id="moonGrad" x1="15%" y1="10%" x2="90%" y2="90%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor="#E0F2FE" />
        <stop offset="100%" stopColor="#7DD3FC" />
      </linearGradient>
      <filter id="moonGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <style>{`
      @keyframes moonBreathe {
        0%, 100% { filter: drop-shadow(0 0 6px rgba(186, 230, 253, 0.45)); transform: scale(1); }
        50% { filter: drop-shadow(0 0 16px rgba(125, 211, 252, 0.85)); transform: scale(1.03); }
      }
      @keyframes starTwinkle1 {
        0%, 100% { opacity: 0.3; transform: scale(0.7); }
        50% { opacity: 1; transform: scale(1.2); }
      }
      @keyframes starTwinkle2 {
        0%, 100% { opacity: 0.8; transform: scale(1.1); }
        50% { opacity: 0.2; transform: scale(0.6); }
      }
      .anim-moon {
        transform-origin: 32px 32px;
        animation: moonBreathe 4s ease-in-out infinite;
      }
      .anim-star-1 {
        transform-origin: 18px 20px;
        animation: starTwinkle1 2.8s ease-in-out infinite;
      }
      .anim-star-2 {
        transform-origin: 46px 16px;
        animation: starTwinkle2 3.4s ease-in-out infinite;
      }
    `}</style>
    {/* Twinkling mini stars */}
    <g className="anim-star-1">
      <path d="M18 16L19 19L22 20L19 21L18 24L17 21L14 20L17 19Z" fill="#BAE6FD" opacity="0.9" />
    </g>
    <g className="anim-star-2">
      <path d="M46 12L47 15L50 16L47 17L46 20L45 17L42 16L45 15Z" fill="#F0F9FF" opacity="0.8" />
    </g>
    {/* Crescent Moon */}
    <path
      d="M38 12C26.954 12 18 20.954 18 32C18 43.046 26.954 52 38 52C42.825 52 47.26 50.292 50.72 47.452C40.64 47.054 32.552 38.966 32.552 28.886C32.552 21.656 36.425 15.344 42.15 12.352C40.81 12.122 39.423 12 38 12Z"
      fill="url(#moonGrad)"
      className="anim-moon"
      filter="url(#moonGlow)"
    />
  </svg>
);

// 3. Cloud Icon: Smooth layered puffy clouds with gentle horizontal drift
export const CloudIcon: React.FC<WeatherIconProps> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`weather-icon weather-icon-cloud ${className}`}
    aria-label="Cloudy"
    style={{ overflow: 'visible' }}
  >
    <defs>
      <linearGradient id="cloudFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
      <linearGradient id="cloudBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
      <filter id="cloudShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.25" />
      </filter>
    </defs>
    <style>{`
      @keyframes cloudDriftBack {
        0%, 100% { transform: translateX(-2.5px); }
        50% { transform: translateX(2.5px); }
      }
      @keyframes cloudDriftFront {
        0%, 100% { transform: translateX(2px) translateY(0); }
        50% { transform: translateX(-2px) translateY(-1px); }
      }
      .anim-cloud-back {
        animation: cloudDriftBack 5.5s ease-in-out infinite;
      }
      .anim-cloud-front {
        animation: cloudDriftFront 4.5s ease-in-out infinite;
      }
    `}</style>
    {/* Secondary background cloud */}
    <g className="anim-cloud-back" opacity="0.65">
      <path
        d="M26 22C26 18.134 29.134 15 33 15C36.19 15 38.89 17.135 39.73 20.06C40.64 19.4 41.77 19 43 19C45.76 19 48 21.24 48 24C48 24.32 47.97 24.63 47.91 24.94C50.28 25.82 52 28.14 52 30.85C52 34.25 49.25 37 45.85 37H24C20.69 37 18 34.31 18 31C18 28.02 20.19 25.55 23.06 25.07C23.02 24.72 23 24.36 23 24C23 22.9 23.3 21.87 23.83 21C24.47 21.62 25.21 22 26 22Z"
        fill="url(#cloudBackGrad)"
      />
    </g>
    {/* Foreground puffy cloud */}
    <g className="anim-cloud-front" filter="url(#cloudShadow)">
      <path
        d="M45 46H18C13.58 46 10 42.42 10 38C10 33.88 13.11 30.48 17.15 30.05C18.67 24.28 23.89 20 30 20C37.04 20 42.89 25.21 43.83 32.02C47.33 32.61 50 35.65 50 39.33C50 43.01 47.76 46 45 46Z"
        fill="url(#cloudFrontGrad)"
      />
    </g>
  </svg>
);

// 4. Rain Icon: Drifting cloud with dripping animated vertical/angled rain strokes
export const RainIcon: React.FC<WeatherIconProps> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`weather-icon weather-icon-rain ${className}`}
    aria-label="Rain"
    style={{ overflow: 'visible' }}
  >
    <defs>
      <linearGradient id="rainDropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="rainCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="60%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
    </defs>
    <style>{`
      @keyframes rainDropDrip {
        0% { transform: translateY(0); opacity: 0; }
        25% { opacity: 1; }
        75% { opacity: 1; }
        100% { transform: translateY(14px); opacity: 0; }
      }
      .anim-drop-1 {
        animation: rainDropDrip 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      .anim-drop-2 {
        animation: rainDropDrip 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.35s;
      }
      .anim-drop-3 {
        animation: rainDropDrip 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.7s;
      }
    `}</style>
    {/* Cloud */}
    <path
      d="M46 36H18C14.13 36 11 32.87 11 29C11 25.39 13.72 22.42 17.26 22.04C18.59 16.99 23.16 13.25 28.5 13.25C34.66 13.25 39.78 17.81 40.6 23.77C43.66 24.28 46 26.94 46 30.17C46 33.39 44.04 36 46 36Z"
      fill="url(#rainCloudGrad)"
    />
    {/* Rain Drops */}
    <g transform="translate(0, 0)">
      <line
        x1="20"
        y1="40"
        x2="17"
        y2="49"
        stroke="url(#rainDropGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        className="anim-drop-1"
      />
      <line
        x1="32"
        y1="40"
        x2="29"
        y2="49"
        stroke="url(#rainDropGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        className="anim-drop-2"
      />
      <line
        x1="44"
        y1="40"
        x2="41"
        y2="49"
        stroke="url(#rainDropGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        className="anim-drop-3"
      />
    </g>
  </svg>
);

// 5. Thunder Icon: Storm cloud with energetic pulsing lightning bolt and flash glow
export const ThunderIcon: React.FC<WeatherIconProps> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`weather-icon weather-icon-thunder ${className}`}
    aria-label="Thunderstorm"
    style={{ overflow: 'visible' }}
  >
    <defs>
      <linearGradient id="thunderCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="60%" stopColor="#334155" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>
      <linearGradient id="lightningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#EAB308" />
      </linearGradient>
      <filter id="boltGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <style>{`
      @keyframes lightningFlash {
        0%, 100% { opacity: 0.25; transform: scale(0.96); filter: drop-shadow(0 0 2px rgba(250, 204, 21, 0.3)); }
        20%, 25% { opacity: 1; transform: scale(1.08); filter: drop-shadow(0 0 14px rgba(250, 204, 21, 1)); }
        22% { opacity: 0.4; transform: scale(1); }
        45%, 48% { opacity: 1; transform: scale(1.06); filter: drop-shadow(0 0 16px rgba(254, 240, 138, 1)); }
        50% { opacity: 0.3; }
      }
      .anim-lightning {
        transform-origin: 32px 42px;
        animation: lightningFlash 3.2s infinite;
      }
    `}</style>
    {/* Dark Storm Cloud */}
    <path
      d="M48 34H18C13.58 34 10 30.42 10 26C10 21.88 13.11 18.48 17.15 18.05C18.67 12.28 23.89 8 30 8C37.04 8 42.89 13.21 43.83 20.02C47.33 20.61 50 23.65 50 27.33C50 31.01 47.76 34 48 34Z"
      fill="url(#thunderCloudGrad)"
    />
    {/* Lightning Bolt */}
    <path
      d="M34 26L24 40H32L29 56L44 38H36L40 26H34Z"
      fill="url(#lightningGrad)"
      className="anim-lightning"
      filter="url(#boltGlow)"
    />
  </svg>
);

// 6. Snow Icon: Winter cloud with gently floating crystalline snowflakes
export const SnowIcon: React.FC<WeatherIconProps> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`weather-icon weather-icon-snow ${className}`}
    aria-label="Snow"
    style={{ overflow: 'visible' }}
  >
    <defs>
      <linearGradient id="snowCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
    </defs>
    <style>{`
      @keyframes snowflakeFloat1 {
        0% { transform: translateY(0) rotate(0deg); opacity: 0; }
        25% { opacity: 1; }
        75% { opacity: 0.9; }
        100% { transform: translateY(14px) rotate(120deg); opacity: 0; }
      }
      @keyframes snowflakeFloat2 {
        0% { transform: translateY(0) rotate(0deg); opacity: 0; }
        25% { opacity: 1; }
        75% { opacity: 0.9; }
        100% { transform: translateY(14px) rotate(-140deg); opacity: 0; }
      }
      .anim-flake-1 {
        animation: snowflakeFloat1 2.2s ease-in-out infinite;
      }
      .anim-flake-2 {
        animation: snowflakeFloat2 2.6s ease-in-out infinite 0.7s;
      }
      .anim-flake-3 {
        animation: snowflakeFloat1 2.4s ease-in-out infinite 1.3s;
      }
    `}</style>
    {/* Cloud */}
    <path
      d="M46 34H18C14.13 34 11 30.87 11 27C11 23.39 13.72 20.42 17.26 20.04C18.59 14.99 23.16 11.25 28.5 11.25C34.66 11.25 39.78 15.81 40.6 21.77C43.66 22.28 46 24.94 46 28.17C46 31.39 44.04 34 46 34Z"
      fill="url(#snowCloudGrad)"
    />
    {/* 3 Floating 6-point Snowflakes */}
    <g className="anim-flake-1" transform="translate(18, 38)">
      <circle cx="0" cy="0" r="1.8" fill="#E0F2FE" />
      <line x1="-3" y1="0" x2="3" y2="0" stroke="#BAE6FD" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="0" y1="-3" x2="0" y2="3" stroke="#BAE6FD" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="-2.1" y1="-2.1" x2="2.1" y2="2.1" stroke="#BAE6FD" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="-2.1" y1="2.1" x2="2.1" y2="-2.1" stroke="#BAE6FD" strokeWidth="1.2" strokeLinecap="round" />
    </g>
    <g className="anim-flake-2" transform="translate(32, 39)">
      <circle cx="0" cy="0" r="2.2" fill="#FFFFFF" />
      <line x1="-4" y1="0" x2="4" y2="0" stroke="#E0F2FE" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="0" y1="-4" x2="0" y2="4" stroke="#E0F2FE" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="-2.8" y1="-2.8" x2="2.8" y2="2.8" stroke="#E0F2FE" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="-2.8" y1="2.8" x2="2.8" y2="-2.8" stroke="#E0F2FE" strokeWidth="1.4" strokeLinecap="round" />
    </g>
    <g className="anim-flake-3" transform="translate(46, 38)">
      <circle cx="0" cy="0" r="1.8" fill="#E0F2FE" />
      <line x1="-3" y1="0" x2="3" y2="0" stroke="#BAE6FD" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="0" y1="-3" x2="0" y2="3" stroke="#BAE6FD" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="-2.1" y1="-2.1" x2="2.1" y2="2.1" stroke="#BAE6FD" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="-2.1" y1="2.1" x2="2.1" y2="-2.1" stroke="#BAE6FD" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  </svg>
);

// 7. Fog Icon: Layered drifting horizontal fog strata with subtle opacity shifts
export const FogIcon: React.FC<WeatherIconProps> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`weather-icon weather-icon-fog ${className}`}
    aria-label="Fog"
    style={{ overflow: 'visible' }}
  >
    <defs>
      <linearGradient id="fogBarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.2" />
        <stop offset="30%" stopColor="#E2E8F0" stopOpacity="0.95" />
        <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    <style>{`
      @keyframes fogDrift1 {
        0%, 100% { transform: translateX(-4px); opacity: 0.6; }
        50% { transform: translateX(4px); opacity: 0.95; }
      }
      @keyframes fogDrift2 {
        0%, 100% { transform: translateX(3px); opacity: 0.9; }
        50% { transform: translateX(-3px); opacity: 0.5; }
      }
      .anim-fog-1 {
        animation: fogDrift1 4s ease-in-out infinite;
      }
      .anim-fog-2 {
        animation: fogDrift2 5s ease-in-out infinite;
      }
      .anim-fog-3 {
        animation: fogDrift1 4.5s ease-in-out infinite 0.5s;
      }
    `}</style>
    {/* Fog Lines */}
    <g>
      <rect
        x="12"
        y="18"
        width="40"
        height="4"
        rx="2"
        fill="url(#fogBarGrad)"
        className="anim-fog-1"
      />
      <rect
        x="8"
        y="28"
        width="48"
        height="4.5"
        rx="2.25"
        fill="url(#fogBarGrad)"
        className="anim-fog-2"
      />
      <rect
        x="15"
        y="38"
        width="34"
        height="4"
        rx="2"
        fill="url(#fogBarGrad)"
        className="anim-fog-3"
      />
      <rect
        x="10"
        y="48"
        width="44"
        height="3.5"
        rx="1.75"
        fill="url(#fogBarGrad)"
        className="anim-fog-2"
      />
    </g>
  </svg>
);

// 8. Partly Cloudy Icon (Sun or Moon behind moving cloud)
export const PartlyCloudyIcon: React.FC<WeatherIconProps> = ({ size = 32, className = '', isDay = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`weather-icon weather-icon-partly-cloudy ${className}`}
    aria-label={isDay ? 'Partly Cloudy' : 'Partly Cloudy Night'}
    style={{ overflow: 'visible' }}
  >
    <defs>
      <linearGradient id="pcSunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF3B0" />
        <stop offset="60%" stopColor="#FFB800" />
        <stop offset="100%" stopColor="#FF8C00" />
      </linearGradient>
      <linearGradient id="pcMoonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#7DD3FC" />
      </linearGradient>
      <linearGradient id="pcCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="65%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
      <filter id="pcShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.25" />
      </filter>
    </defs>
    <style>{`
      @keyframes pcSunPulse {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(255, 184, 0, 0.5)); }
        50% { transform: scale(1.08); filter: drop-shadow(0 0 10px rgba(255, 184, 0, 0.8)); }
      }
      @keyframes pcCloudSway {
        0%, 100% { transform: translateX(-1.5px); }
        50% { transform: translateX(1.5px); }
      }
      .anim-pc-celestial {
        transform-origin: 24px 22px;
        animation: pcSunPulse 3.5s ease-in-out infinite;
      }
      .anim-pc-cloud {
        animation: pcCloudSway 4.5s ease-in-out infinite;
      }
    `}</style>
    {/* Celestial body behind cloud */}
    <g className="anim-pc-celestial">
      {isDay ? (
        <circle cx="24" cy="22" r="11" fill="url(#pcSunGrad)" />
      ) : (
        <path
          d="M27 15C21.48 15 17 19.48 17 25C17 30.52 21.48 35 27 35C29.41 35 31.63 34.15 33.36 32.73C28.32 32.53 24.28 28.48 24.28 23.44C24.28 19.83 26.21 16.67 29.08 15.18C28.41 15.06 27.71 15 27 15Z"
          fill="url(#pcMoonGrad)"
        />
      )}
    </g>
    {/* Drifting Foreground Cloud */}
    <g className="anim-pc-cloud" filter="url(#pcShadow)">
      <path
        d="M48 48H22C17.58 48 14 44.42 14 40C14 36.14 16.74 32.91 20.42 32.2C21.84 26.96 26.58 23 32.22 23C38.65 23 44 27.76 44.82 34.02C48.06 34.61 50.5 37.45 50.5 40.85C50.5 44.8 47.3 48 48 48Z"
        fill="url(#pcCloudGrad)"
      />
    </g>
  </svg>
);

// Comprehensive Router Component: WeatherIcon
export interface WeatherIconDispatcherProps extends WeatherIconProps {
  code: number;
}

export const WeatherIcon: React.FC<WeatherIconDispatcherProps> = ({
  code,
  isDay = true,
  size = 32,
  className = ''
}) => {
  // WMO Code interpretation
  switch (code) {
    case 0:
      // Clear sky
      return isDay ? <SunnyIcon size={size} className={className} /> : <MoonIcon size={size} className={className} />;

    case 1:
    case 2:
      // Mainly clear, partly cloudy
      return <PartlyCloudyIcon size={size} className={className} isDay={isDay} />;

    case 3:
      // Overcast
      return <CloudIcon size={size} className={className} />;

    case 45:
    case 48:
      // Fog
      return <FogIcon size={size} className={className} />;

    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      // Rain / Showers / Drizzle
      return <RainIcon size={size} className={className} />;

    case 56:
    case 57:
    case 66:
    case 67:
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      // Snow / Freezing rain / Snow showers
      return <SnowIcon size={size} className={className} />;

    case 95:
    case 96:
    case 99:
      // Thunderstorm
      return <ThunderIcon size={size} className={className} />;

    default:
      return isDay ? <SunnyIcon size={size} className={className} /> : <MoonIcon size={size} className={className} />;
  }
};

export default WeatherIcon;
