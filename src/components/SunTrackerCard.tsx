import React, { useRef, useMemo } from 'react';
import type { Language } from '../types/weather';
import { translations as allTranslations, type Translations } from '../i18n/translations';
import { useMouseGlare } from '../hooks/useMouseGlare';
import { Sun, Sunrise, Sunset, ShieldAlert } from 'lucide-react';

export interface SunTrackerCardProps {
  sunrise: string;
  sunset: string;
  uvIndex: number;
  currentTime?: string;
  language?: Language;
  t?: Translations;
  className?: string;
}

// Cubic Bezier interpolation helper: P(t) = (1-t)^3*P0 + 3*(1-t)^2*t*P1 + 3*(1-t)*t^2*P2 + t^3*P3
function getCubicBezierPoint(
  t: number,
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number]
): [number, number] {
  const clampedT = Math.max(0, Math.min(1, t));
  const mt = 1 - clampedT;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = clampedT * clampedT;
  const t3 = t2 * clampedT;

  const x = mt3 * p0[0] + 3 * mt2 * clampedT * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0];
  const y = mt3 * p0[1] + 3 * mt2 * clampedT * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1];
  return [x, y];
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 12 * 60;
  // If ISO string like 2026-11-01T06:30
  if (timeStr.includes('T')) {
    const parts = timeStr.split('T')[1].split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
  }
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
  }
  return 12 * 60;
}

function formatTimeString(timeStr: string, language: Language): string {
  if (!timeStr) return '--:--';
  try {
    let date: Date;
    if (timeStr.includes('T')) {
      date = new Date(timeStr);
    } else {
      const [h, m] = timeStr.split(':');
      date = new Date();
      date.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    }

    if (isNaN(date.getTime())) return timeStr.slice(-5);

    if (language === 'ar') {
      return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return timeStr.slice(-5);
  }
}

export const SunTrackerCard: React.FC<SunTrackerCardProps> = ({
  sunrise,
  sunset,
  uvIndex,
  currentTime,
  language = 'en',
  t,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  useMouseGlare(cardRef, { maxOpacity: 0.9, radius: 280 });

  const currentTranslations = t || allTranslations[language] || allTranslations.en;

  // Time calculations
  const riseMinutes = parseTimeToMinutes(sunrise);
  const setMinutes = parseTimeToMinutes(sunset);

  const nowMinutes = useMemo(() => {
    if (currentTime) {
      return parseTimeToMinutes(currentTime);
    }
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }, [currentTime]);

  const isDay = nowMinutes >= riseMinutes && nowMinutes <= setMinutes;
  const daySpan = Math.max(1, setMinutes - riseMinutes);

  // Bezier curve points: P0=(30, 75), P1=(70, 16), P2=(210, 16), P3=(250, 75)
  const p0: [number, number] = [30, 75];
  const p1: [number, number] = [70, 16];
  const p2: [number, number] = [210, 16];
  const p3: [number, number] = [250, 75];

  let sunX = 140;
  let sunY = 30;

  if (isDay) {
    const progress = (nowMinutes - riseMinutes) / daySpan;
    const [x, y] = getCubicBezierPoint(progress, p0, p1, p2, p3);
    sunX = x;
    sunY = y;
  } else if (nowMinutes < riseMinutes) {
    // Before sunrise (approaching from below horizon on left)
    const nightProgress = Math.max(0, 1 - (riseMinutes - nowMinutes) / (6 * 60));
    sunX = 10 + nightProgress * 20;
    sunY = 92 - nightProgress * 17;
  } else {
    // After sunset (descending below horizon on right)
    const nightProgress = Math.min(1, (nowMinutes - setMinutes) / (6 * 60));
    sunX = 250 + nightProgress * 20;
    sunY = 75 + nightProgress * 17;
  }

  // UV index category and color
  let uvLabel = currentTranslations.uvLow;
  let uvAdvice = currentTranslations.uvAdviceLow;
  let uvColor = '#22C55E';

  if (uvIndex >= 11) {
    uvLabel = currentTranslations.uvExtreme;
    uvAdvice = currentTranslations.uvAdviceHigh;
    uvColor = '#A855F7';
  } else if (uvIndex >= 8) {
    uvLabel = currentTranslations.uvVeryHigh;
    uvAdvice = currentTranslations.uvAdviceHigh;
    uvColor = '#EF4444';
  } else if (uvIndex >= 6) {
    uvLabel = currentTranslations.uvHigh;
    uvAdvice = currentTranslations.uvAdviceHigh;
    uvColor = '#F97316';
  } else if (uvIndex >= 3) {
    uvLabel = currentTranslations.uvMod;
    uvAdvice = currentTranslations.uvAdviceMod;
    uvColor = '#EAB308';
  }

  const uvProgress = Math.min(100, Math.max(0, (uvIndex / 11) * 100));

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
          <Sun className="w-3.5 h-3.5 text-amber-300" />
          <span>{currentTranslations.sunTracker}</span>
        </div>
        <span className="text-[11px] font-medium text-amber-300/90">
          {isDay ? 'Daylight' : 'Night'}
        </span>
      </div>

      {/* SVG Horizon Arc */}
      <div className="relative flex items-center justify-center my-2">
        <svg
          viewBox="0 0 280 100"
          className="w-full h-24 select-none overflow-visible"
        >
          <defs>
            {/* Daylight Path Gradient */}
            <linearGradient id="arcDayGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(251, 191, 36, 0.2)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0.95)" />
            </linearGradient>
            {/* Sun Orb Radial Glow */}
            <radialGradient id="sunOrbGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>
            {/* Filter Glow */}
            <filter id="sunOrbGlowFilter" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizon Line */}
          <line
            x1="10"
            y1="75"
            x2="270"
            y2="75"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Daylight Parabolic / Sine Curve */}
          <path
            d="M 30,75 C 70,16 210,16 250,75"
            fill="none"
            stroke="url(#arcDayGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Night Curves (subtle dashed under horizon) */}
          <path
            d="M 10,92 C 18,92 24,85 30,75"
            fill="none"
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="2 3"
          />
          <path
            d="M 250,75 C 256,85 262,92 270,92"
            fill="none"
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="2 3"
          />

          {/* Sunrise Point Dot */}
          <circle cx="30" cy="75" r="3.5" fill="#FBBF24" opacity="0.85" />

          {/* Sunset Point Dot */}
          <circle cx="250" cy="75" r="3.5" fill="#FB923C" opacity="0.85" />

          {/* Sun Orb moving along the horizon arc */}
          <g
            style={{
              transform: `translate(${sunX}px, ${sunY}px)`,
              transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Outer halo */}
            <circle
              cx="0"
              cy="0"
              r="12"
              fill="rgba(251, 191, 36, 0.25)"
              className="animate-ping"
              style={{ animationDuration: '3s' }}
            />
            {/* Radiant core */}
            <circle
              cx="0"
              cy="0"
              r="7.5"
              fill="url(#sunOrbGrad)"
              filter="url(#sunOrbGlowFilter)"
              stroke="#FFF"
              strokeWidth="1"
            />
          </g>
        </svg>
      </div>

      {/* Sunrise & Sunset Readout */}
      <div className="flex items-center justify-between px-2 pt-1 pb-3 text-xs border-b border-white/10">
        <div className="flex items-center gap-1.5 text-white/85">
          <Sunrise className="w-4 h-4 text-amber-300" />
          <div className="flex flex-col">
            <span className="text-[10px] text-white/50 uppercase">{currentTranslations.sunrise}</span>
            <span className="font-semibold">{formatTimeString(sunrise, language)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-white/85 text-right">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/50 uppercase">{currentTranslations.sunset}</span>
            <span className="font-semibold">{formatTimeString(sunset, language)}</span>
          </div>
          <Sunset className="w-4 h-4 text-orange-400" />
        </div>
      </div>

      {/* UV Index Section */}
      <div className="pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/75 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: uvColor }} />
            <span>{currentTranslations.uvIndex}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-white">{Math.round(uvIndex)}</span>
            <span className="text-xs font-semibold" style={{ color: uvColor }}>
              {uvLabel}
            </span>
          </div>
        </div>

        {/* Color-graded spectrum bar */}
        <div className="relative h-2 rounded-full overflow-visible bg-black/40 shadow-inner my-2">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #22C55E 0%, #EAB308 28%, #F97316 55%, #EF4444 80%, #A855F7 100%)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.35)'
            }}
          />

          {/* Animated Indicator Dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-700 ease-out"
            style={{ left: `${uvProgress}%` }}
          >
            <div
              className="w-3.5 h-3.5 rounded-full bg-white border-2 border-black/40 shadow-lg"
              style={{
                boxShadow: `0 0 8px ${uvColor}, 0 2px 4px rgba(0, 0, 0, 0.4)`
              }}
            />
          </div>
        </div>

        {/* Contextual Guidance Text */}
        <p className="text-[11px] leading-tight text-white/65 mt-2">
          {uvAdvice}
        </p>
      </div>
    </div>
  );
};

export default SunTrackerCard;
