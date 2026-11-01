import React, { useRef } from 'react';
import type { WindSpeedUnit, Language } from '../types/weather';
import { convertWindSpeed } from '../services/weatherService';
import { translations as allTranslations, type Translations } from '../i18n/translations';
import { useMouseGlare } from '../hooks/useMouseGlare';
import { Compass, Wind } from 'lucide-react';

export interface CompassCardProps {
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  unit: WindSpeedUnit;
  language?: Language;
  t?: Translations;
  className?: string;
}

// 16-point cardinal compass helper
function getCardinalDirection(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

export const CompassCard: React.FC<CompassCardProps> = ({
  windSpeed,
  windDirection,
  windGusts,
  unit,
  language = 'en',
  t,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  useMouseGlare(cardRef, { maxOpacity: 0.9, radius: 260 });

  const currentTranslations = t || allTranslations[language] || allTranslations.en;
  const speedObj = convertWindSpeed(windSpeed, unit);
  const gustsObj = convertWindSpeed(windGusts, unit);
  const cardinal = getCardinalDirection(windDirection);

  // Generate 72 tick marks (every 5 degrees around 360 degrees)
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const angle = i * 5;
    const isMajor = angle % 90 === 0;
    const isMedium = angle % 45 === 0 && !isMajor;
    const isTen = angle % 10 === 0 && !isMajor && !isMedium;

    const outerRadius = 96;
    const innerRadius = isMajor ? 82 : isMedium ? 86 : isTen ? 89 : 92;

    const rad = ((angle - 90) * Math.PI) / 180;
    const x1 = 120 + outerRadius * Math.cos(rad);
    const y1 = 120 + outerRadius * Math.sin(rad);
    const x2 = 120 + innerRadius * Math.cos(rad);
    const y2 = 120 + innerRadius * Math.sin(rad);

    let stroke = 'rgba(255, 255, 255, 0.25)';
    let strokeWidth = 1;
    if (isMajor) {
      stroke = angle === 0 ? '#FF3B30' : 'rgba(255, 255, 255, 0.9)';
      strokeWidth = 2.5;
    } else if (isMedium) {
      stroke = 'rgba(255, 255, 255, 0.65)';
      strokeWidth = 1.8;
    } else if (isTen) {
      stroke = 'rgba(255, 255, 255, 0.4)';
      strokeWidth = 1.2;
    }

    return { angle, x1, y1, x2, y2, stroke, strokeWidth };
  });

  return (
    <div
      ref={cardRef}
      className={`liquid-glass liquid-glass-card rounded-[26px] p-5 backdrop-blur-2xl flex flex-col justify-between transition-all duration-300 ${className}`}
      style={{
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.45)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-white/75">
          <Compass className="w-3.5 h-3.5 text-white/80" />
          <span>{currentTranslations.windTitle}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-cyan-300">
          <Wind className="w-3 h-3" />
          <span>{cardinal} {Math.round(windDirection)}°</span>
        </div>
      </div>

      {/* Circular SVG Compass Dial */}
      <div className="relative flex items-center justify-center my-3">
        <svg
          viewBox="0 0 240 240"
          className="w-48 h-48 sm:w-52 sm:h-52 select-none overflow-visible"
        >
          <defs>
            {/* North Glow */}
            <filter id="northGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Needle Red Gradient */}
            <linearGradient id="needleNorthGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#FF3B30" />
            </linearGradient>
            {/* Needle South Gradient */}
            <linearGradient id="needleSouthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            {/* Center Bezel Radial Gradient */}
            <radialGradient id="hubGlassGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.18)" />
              <stop offset="75%" stopColor="rgba(255, 255, 255, 0.06)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0.25)" />
            </radialGradient>
          </defs>

          {/* Outer dial ring */}
          <circle
            cx="120"
            cy="120"
            r="104"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1.5"
          />
          <circle
            cx="120"
            cy="120"
            r="96"
            fill="rgba(0, 0, 0, 0.15)"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="1"
          />

          {/* 72 Ticks */}
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.stroke}
              strokeWidth={t.strokeWidth}
              strokeLinecap="round"
            />
          ))}

          {/* Cardinal Markers: N, E, S, W */}
          <text
            x="120"
            y="44"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FF3B30"
            filter="url(#northGlow)"
            fontSize="14"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            N
          </text>
          <text
            x="196"
            y="120"
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255, 255, 255, 0.85)"
            fontSize="13"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            E
          </text>
          <text
            x="120"
            y="196"
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255, 255, 255, 0.85)"
            fontSize="13"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            S
          </text>
          <text
            x="44"
            y="120"
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255, 255, 255, 0.85)"
            fontSize="13"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            W
          </text>

          {/* Animated Needle Layer with cubic-bezier spring transition */}
          <g
            style={{
              transformOrigin: '120px 120px',
              transform: `rotate(${windDirection}deg)`,
              transition: 'transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* North pointing arrow (Red) */}
            <path
              d="M120 28L126 112L120 106L114 112Z"
              fill="url(#needleNorthGrad)"
              filter="drop-shadow(0 2px 4px rgba(220, 38, 38, 0.5))"
            />
            {/* South opposing tail (Silver) */}
            <path
              d="M120 212L125 128L120 134L115 128Z"
              fill="url(#needleSouthGrad)"
              opacity="0.85"
            />
          </g>

          {/* Center Hub Glass Bezel */}
          <circle
            cx="120"
            cy="120"
            r="44"
            fill="url(#hubGlassGrad)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1.5"
            filter="drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35))"
          />

          {/* Speed Digital Readout in Center Hub */}
          <text
            x="120"
            y="114"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FFFFFF"
            fontSize="22"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            {speedObj.value}
          </text>
          <text
            x="120"
            y="134"
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255, 255, 255, 0.7)"
            fontSize="11"
            fontWeight="500"
            fontFamily="system-ui, sans-serif"
          >
            {speedObj.label}
          </text>
        </svg>
      </div>

      {/* Wind Gusts & Bottom Stats */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-white/60">{currentTranslations.windGusts}</span>
        <span className="font-semibold text-white tracking-tight">
          {gustsObj.value} {gustsObj.label}
        </span>
      </div>
    </div>
  );
};

export default CompassCard;
