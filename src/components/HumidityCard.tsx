import React, { useRef } from 'react';
import type { TemperatureUnit, Language } from '../types/weather';
import { formatTemp } from '../services/weatherService';
import { translations as allTranslations, type Translations } from '../i18n/translations';
import { useMouseGlare } from '../hooks/useMouseGlare';
import { Droplet } from 'lucide-react';

export interface HumidityCardProps {
  humidity: number;
  temperature: number;
  tempUnit: TemperatureUnit;
  language?: Language;
  t?: Translations;
  className?: string;
}

// Magnus-Tetens formula to compute dew point from temperature (°C) and relative humidity (%)
function calculateDewPoint(tempCelsius: number, relativeHumidity: number): number {
  const rh = Math.max(1, Math.min(100, relativeHumidity));
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempCelsius) / (b + tempCelsius) + Math.log(rh / 100.0);
  const dewPoint = (b * alpha) / (a - alpha);
  return Math.round(dewPoint);
}

export const HumidityCard: React.FC<HumidityCardProps> = ({
  humidity,
  temperature,
  tempUnit,
  language = 'en',
  t,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  useMouseGlare(cardRef, { maxOpacity: 0.9, radius: 260 });

  const currentTranslations = t || allTranslations[language] || allTranslations.en;
  const clampedHumidity = Math.max(0, Math.min(100, Math.round(humidity)));
  const dewPoint = calculateDewPoint(temperature, clampedHumidity);

  // Height scaling: beaker height = 120 (from y=130 to y=10)
  const liquidHeight = (clampedHumidity / 100) * 115;
  const liquidTopY = 130 - liquidHeight;

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
          <Droplet className="w-3.5 h-3.5 text-cyan-300" />
          <span>{currentTranslations.humidityTitle}</span>
        </div>
        <span className="text-[11px] font-medium text-cyan-300">
          {clampedHumidity > 70 ? 'High' : clampedHumidity > 40 ? 'Comfortable' : 'Dry'}
        </span>
      </div>

      {/* Main Body: Animated Liquid Wave Gauge & Humidity Readout */}
      <div className="flex items-center justify-between my-3 gap-4">
        {/* Large Readout */}
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm">
              {clampedHumidity}
            </span>
            <span className="text-2xl font-bold text-cyan-300 ml-1">%</span>
          </div>
          <span className="text-xs text-white/60 mt-1">Relative Humidity</span>
        </div>

        {/* Animated Vertical Liquid-Fill Wave Gauge */}
        <div className="relative w-20 h-28 sm:w-24 sm:h-32 flex-shrink-0 flex items-center justify-center">
          <svg
            viewBox="0 0 100 140"
            className="w-full h-full select-none overflow-visible"
          >
            <defs>
              {/* Beaker Capsule Clip */}
              <clipPath id="beakerClip">
                <rect x="15" y="10" width="70" height="120" rx="35" />
              </clipPath>

              {/* Liquid Gradient */}
              <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#0369A1" />
              </linearGradient>

              {/* Crest Glow */}
              <linearGradient id="crestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.75)" />
                <stop offset="100%" stopColor="rgba(56, 189, 248, 0.1)" />
              </linearGradient>
            </defs>
            <style>{`
              @keyframes waveOscillate1 {
                0% { transform: translateX(0); }
                100% { transform: translateX(-80px); }
              }
              @keyframes waveOscillate2 {
                0% { transform: translateX(-80px); }
                100% { transform: translateX(0); }
              }
              .anim-wave-front {
                animation: waveOscillate1 3.5s linear infinite;
              }
              .anim-wave-back {
                animation: waveOscillate2 4.5s linear infinite;
              }
            `}</style>

            {/* Glass Beaker Container Background */}
            <rect
              x="15"
              y="10"
              width="70"
              height="120"
              rx="35"
              fill="rgba(0, 0, 0, 0.25)"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="2"
            />

            {/* Liquid Group with Clipping to Beaker */}
            <g clipPath="url(#beakerClip)">
              {/* Smooth Vertical Translation based on humidity % */}
              <g
                style={{
                  transform: `translateY(${liquidTopY}px)`,
                  transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                {/* Secondary Background Sine Wave */}
                <g className="anim-wave-back" opacity="0.45">
                  <path
                    d="M 0,0 Q 20,-6 40,0 T 80,0 T 120,0 T 160,0 T 200,0 V 160 H 0 Z"
                    fill="#38BDF8"
                  />
                </g>

                {/* Primary Foreground Sine Wave with Liquid Gradient */}
                <g className="anim-wave-front">
                  <path
                    d="M 0,0 Q 20,6 40,0 T 80,0 T 120,0 T 160,0 T 200,0 V 160 H 0 Z"
                    fill="url(#liquidGrad)"
                  />
                  {/* Wave Crest Shimmer */}
                  <path
                    d="M 0,0 Q 20,6 40,0 T 80,0 T 120,0 T 160,0 T 200,0"
                    fill="none"
                    stroke="url(#crestGrad)"
                    strokeWidth="3"
                  />
                </g>
              </g>

              {/* Specular Glare Reflection on Glass Surface */}
              <path
                d="M 22 24 C 22 18 26 14 32 14 C 30 18 28 35 28 65 C 28 95 30 112 32 126 C 26 126 22 122 22 116 Z"
                fill="rgba(255, 255, 255, 0.2)"
                pointerEvents="none"
              />
            </g>

            {/* Outer Specular Rim */}
            <rect
              x="15"
              y="10"
              width="70"
              height="120"
              rx="35"
              fill="none"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.5"
              pointerEvents="none"
            />
          </svg>
        </div>
      </div>

      {/* Dew Point Readout */}
      <div className="pt-2 border-t border-white/10 text-xs text-white/75 leading-relaxed">
        <span>{currentTranslations.dewPoint} </span>
        <strong className="text-white font-semibold">{formatTemp(dewPoint, tempUnit)}</strong>
        <span> {currentTranslations.dewPointDesc}</span>
      </div>
    </div>
  );
};

export default HumidityCard;
