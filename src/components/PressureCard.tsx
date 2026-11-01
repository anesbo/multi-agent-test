import React, { useRef } from 'react';
import type { PressureUnit, TemperatureUnit, Language } from '../types/weather';
import { convertPressure, formatTemp } from '../services/weatherService';
import { translations as allTranslations, type Translations } from '../i18n/translations';
import { useMouseGlare } from '../hooks/useMouseGlare';
import { Gauge, Eye, Thermometer } from 'lucide-react';

export interface PressureCardProps {
  pressure: number;
  pressureUnit: PressureUnit;
  visibility: number;
  apparentTemperature: number;
  currentTemperature: number;
  tempUnit: TemperatureUnit;
  language?: Language;
  t?: Translations;
  className?: string;
}

export const PressureCard: React.FC<PressureCardProps> = ({
  pressure,
  pressureUnit,
  visibility,
  apparentTemperature,
  currentTemperature,
  tempUnit,
  language = 'en',
  t,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  useMouseGlare(cardRef, { maxOpacity: 0.9, radius: 280 });

  const currentTranslations = t || allTranslations[language] || allTranslations.en;
  const pressureObj = convertPressure(pressure, pressureUnit);

  // Pressure evaluation: Standard is 1013.25 hPa
  let statusText = currentTranslations.pressureNormal;
  let statusColor = '#34D399'; // Emerald
  if (pressure < 1005) {
    statusText = currentTranslations.pressureLow;
    statusColor = '#38BDF8'; // Sky blue
  } else if (pressure > 1022) {
    statusText = currentTranslations.pressureHigh;
    statusColor = '#FB923C'; // Warm Orange
  }

  // Semi-circle gauge needle rotation angle:
  // Range: 960 hPa (-90 deg) to 1060 hPa (+90 deg)
  const minP = 960;
  const maxP = 1060;
  const clampedP = Math.max(minP, Math.min(maxP, pressure));
  const progress = (clampedP - minP) / (maxP - minP);
  const needleAngle = -90 + progress * 180;

  // Visibility status
  let visibilityDesc = currentTranslations.visibilityGood;
  let visibilityStatus = 'Good';
  if (visibility >= 10) {
    visibilityDesc = currentTranslations.visibilityClear;
    visibilityStatus = 'Clear';
  } else if (visibility <= 3) {
    visibilityDesc = currentTranslations.visibilityPoor;
    visibilityStatus = 'Poor';
  } else if (visibility <= 6) {
    visibilityDesc = currentTranslations.visibilityModerate;
    visibilityStatus = 'Moderate';
  }
  const visibilityProgress = Math.min(100, Math.max(5, (visibility / 10) * 100));

  // Feels like description
  const tempDiff = apparentTemperature - currentTemperature;
  let feelsLikeNote = currentTranslations.feelsLikeSame;
  if (tempDiff >= 1.5) {
    feelsLikeNote = currentTranslations.feelsLikeWarmer;
  } else if (tempDiff <= -1.5) {
    feelsLikeNote = currentTranslations.feelsLikeColder;
  }

  return (
    <div
      ref={cardRef}
      className={`liquid-glass liquid-glass-card rounded-[26px] p-5 backdrop-blur-2xl flex flex-col justify-between transition-all duration-300 ${className}`}
      style={{
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.45)'
      }}
    >
      {/* 1. Pressure Section */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-white/75">
            <Gauge className="w-3.5 h-3.5 text-white/80" />
            <span>{currentTranslations.pressureTitle}</span>
          </div>
          <span className="text-[11px] font-semibold" style={{ color: statusColor }}>
            {statusText}
          </span>
        </div>

        {/* Semi-circular SVG Gauge */}
        <div className="relative flex flex-col items-center justify-center pt-2">
          <svg
            viewBox="0 0 200 115"
            className="w-48 sm:w-52 h-28 select-none overflow-visible"
          >
            <defs>
              {/* Semi-circle Multi-stop Gradient Track */}
              <linearGradient id="pressureArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#FB923C" />
              </linearGradient>

              {/* Pivot Hub Gradient */}
              <radialGradient id="pivotGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="70%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
              </radialGradient>
            </defs>

            {/* Background Arc Track */}
            <path
              d="M 25 105 A 75 75 0 0 1 175 105"
              fill="none"
              stroke="rgba(255, 255, 255, 0.14)"
              strokeWidth="9"
              strokeLinecap="round"
            />

            {/* Colored Segment Arc */}
            <path
              d="M 25 105 A 75 75 0 0 1 175 105"
              fill="none"
              stroke="url(#pressureArcGrad)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="236"
              strokeDashoffset="0"
              opacity="0.9"
            />

            {/* Zone Division Tick Indicators */}
            <line x1="100" y1="20" x2="100" y2="30" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <line x1="47" y1="52" x2="54" y2="59" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <line x1="153" y1="52" x2="146" y2="59" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

            {/* Labels under arc */}
            <text x="25" y="114" fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="middle">Low</text>
            <text x="100" y="42" fill="rgba(255,255,255,0.6)" fontSize="9" textAnchor="middle" fontWeight="bold">STEADY</text>
            <text x="175" y="114" fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="middle">High</text>

            {/* Animated Needle */}
            <g
              style={{
                transformOrigin: '100px 105px',
                transform: `rotate(${needleAngle}deg)`,
                transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <polygon
                points="98,105 102,105 100.5,35 99.5,35"
                fill="#FFFFFF"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
              />
              <circle cx="100" cy="35" r="2" fill={statusColor} />
            </g>

            {/* Center Pivot Bezel */}
            <circle cx="100" cy="105" r="9" fill="url(#pivotGrad)" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
            <circle cx="100" cy="105" r="3.5" fill="#1E293B" />
          </svg>

          {/* Large Readout */}
          <div className="flex items-baseline gap-1 -mt-4">
            <span className="text-2xl font-bold text-white tracking-tight">
              {pressureObj.value}
            </span>
            <span className="text-xs font-medium text-white/60">
              {pressureObj.label}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visibility & Apparent Temperature Section */}
      <div className="pt-3 mt-1 border-t border-white/10 space-y-3">
        {/* Visibility Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-white/70">
              <Eye className="w-3.5 h-3.5 text-white/80" />
              <span>{currentTranslations.visibilityTitle}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-semibold text-white">{visibility} km</span>
              <span className="text-[10px] text-white/50">({visibilityStatus})</span>
            </div>
          </div>

          {/* Meter Bar */}
          <div className="relative h-1.5 rounded-full bg-black/35 overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${visibilityProgress}%`,
                background: 'linear-gradient(90deg, #38BDF8 0%, #34D399 100%)',
                boxShadow: '0 0 8px rgba(52, 211, 153, 0.4)'
              }}
            />
          </div>
          <p className="text-[10px] text-white/55 mt-1 leading-tight line-clamp-1">
            {visibilityDesc}
          </p>
        </div>

        {/* Feels Like (Apparent Temperature) */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-white/70">
            <Thermometer className="w-3.5 h-3.5 text-orange-300" />
            <span>{currentTranslations.feelsLikeTitle}</span>
          </div>
          <span className="text-sm font-bold text-white">
            {formatTemp(apparentTemperature, tempUnit)}
          </span>
        </div>
        <p className="text-[10px] text-white/55 -mt-1 leading-tight">
          {feelsLikeNote}
        </p>
      </div>
    </div>
  );
};

export default PressureCard;
