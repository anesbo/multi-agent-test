import React, { useRef } from 'react';
import type { DailyForecastItem, TemperatureUnit, Language } from '../types/weather';
import { formatTemp } from '../services/weatherService';
import { translations as allTranslations, type Translations } from '../i18n/translations';
import { WeatherIcon } from './WeatherIcons';
import { useMouseGlare } from '../hooks/useMouseGlare';
import { Calendar, Droplets } from 'lucide-react';

export interface WeeklyForecastProps {
  daily: DailyForecastItem[];
  currentTemp: number;
  tempUnit: TemperatureUnit;
  selectedDayIndex?: number;
  onSelectDay?: (index: number) => void;
  language?: Language;
  t?: Translations;
  className?: string;
}

export const WeeklyForecast: React.FC<WeeklyForecastProps> = ({
  daily,
  currentTemp,
  tempUnit,
  selectedDayIndex = 0,
  onSelectDay,
  language = 'en',
  t,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  useMouseGlare(cardRef, { maxOpacity: 0.9, radius: 280 });

  const currentTranslations = t || allTranslations[language] || allTranslations.en;

  // Calculate week-wide overall temperature bounds for accurate proportional scaling
  const allMins = daily.map((d) => d.minTemp);
  const allMaxs = daily.map((d) => d.maxTemp);
  const weekMin = allMins.length > 0 ? Math.min(...allMins) : 0;
  const weekMax = allMaxs.length > 0 ? Math.max(...allMaxs) : 30;
  const totalRange = Math.max(1, weekMax - weekMin);

  // Helper to get temperature gradient colors based on Celsius values
  const getTempColor = (celsius: number): string => {
    if (celsius < 5) return '#38BDF8'; // Crisp Cyan
    if (celsius < 14) return '#2DD4BF'; // Emerald Teal
    if (celsius < 22) return '#FBBF24'; // Warm Gold
    if (celsius < 30) return '#FB923C'; // Radiant Orange
    return '#F87171'; // Warm Coral / Crimson
  };

  return (
    <div
      ref={cardRef}
      className={`liquid-glass liquid-glass-card rounded-[26px] p-5 backdrop-blur-2xl transition-all duration-300 ${className}`}
      style={{
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.45)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-white/75">
          <Calendar className="w-3.5 h-3.5 text-white/80" />
          <span>{currentTranslations.dailyForecast}</span>
        </div>
        <span className="text-[11px] text-white/50 font-normal">
          {daily.length} {language === 'ar' ? 'أيام' : 'Days'}
        </span>
      </div>

      {/* 7-Day List */}
      <div className="flex flex-col gap-2.5">
        {daily.map((item, index) => {
          const isToday = index === 0;

          // Scaling math relative to week's absolute extremes
          const leftPercent = Math.max(0, Math.min(100, ((item.minTemp - weekMin) / totalRange) * 100));
          const widthPercent = Math.max(8, Math.min(100 - leftPercent, ((item.maxTemp - item.minTemp) / totalRange) * 100));

          // Color calculation
          const startColor = getTempColor(item.minTemp);
          const endColor = getTempColor(item.maxTemp);

          // Live Temperature Dot calculation for Today
          const clampedTodayTemp = Math.max(item.minTemp, Math.min(item.maxTemp, currentTemp));
          const daySpan = Math.max(1, item.maxTemp - item.minTemp);
          const dotOffsetPercent = Math.max(0, Math.min(100, ((clampedTodayTemp - item.minTemp) / daySpan) * 100));

          const hasRainProb = item.precipitationProbabilityMax >= 10;

          const isSelected = selectedDayIndex === index;

          return (
            <div
              key={item.date || index}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay?.(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDay?.(index);
                }
              }}
              className={`flex items-center justify-between py-2.5 px-3 rounded-2xl transition-all duration-200 select-none cursor-pointer border ${
                isSelected
                  ? 'bg-white/20 border-white/50 shadow-lg ring-1 ring-white/40 scale-[1.01]'
                  : 'bg-transparent border-transparent hover:bg-white/10 hover:border-white/15'
              } active:scale-[0.98] group`}
              title={`Click to view hourly forecast for ${item.dayName}`}
            >
              {/* Day Name */}
              <div className="w-20 sm:w-24 text-left flex items-center gap-1.5">
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] shrink-0" />
                )}
                <span
                  className={`text-sm tracking-tight ${
                    isSelected
                      ? 'font-bold text-white'
                      : isToday
                      ? 'font-semibold text-white/95'
                      : 'font-medium text-white/80 group-hover:text-white'
                  }`}
                >
                  {item.dayName}
                </span>
              </div>

              {/* Weather Icon & Rain Prob */}
              <div className="flex items-center gap-1.5 w-16 justify-center">
                <div className="w-7 h-7 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <WeatherIcon code={item.weatherCode} isDay={true} size={24} />
                </div>
                {hasRainProb ? (
                  <div className="flex items-center text-[10px] font-bold text-cyan-300">
                    <Droplets className="w-2.5 h-2.5 mr-0.5" />
                    <span>{item.precipitationProbabilityMax}%</span>
                  </div>
                ) : (
                  <div className="w-4" />
                )}
              </div>

              {/* Min Temp */}
              <div className="w-9 text-right">
                <span className="text-xs font-medium text-white/55 group-hover:text-white/70">
                  {formatTemp(item.minTemp, tempUnit)}
                </span>
              </div>

              {/* Proportional Temperature Range Gradient Pill Bar */}
              <div className="flex-1 mx-3 sm:mx-4 h-2 bg-black/35 rounded-full relative overflow-visible shadow-inner">
                {/* Background Track subtle glow */}
                <div className="absolute inset-0 rounded-full opacity-20 bg-white/20" />

                {/* Day's Range Colored Bar */}
                <div
                  className="absolute top-0 bottom-0 rounded-full transition-all duration-500 ease-out"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    background: `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)`,
                    boxShadow: `0 0 10px ${startColor}66, inset 0 1px 1px rgba(255, 255, 255, 0.45)`
                  }}
                >
                  {/* Live Temperature Dot (Exclusive to Today) */}
                  {isToday && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 pointer-events-none"
                      style={{ left: `${dotOffsetPercent}%` }}
                      title={`Current: ${formatTemp(currentTemp, tempUnit)}`}
                    >
                      {/* Outer pulsing ring */}
                      <span className="absolute -inset-1 rounded-full bg-white opacity-40 animate-ping" />
                      {/* Inner solid white dot with specular shadow */}
                      <span
                        className="relative block w-3 h-3 rounded-full bg-white border border-black/40"
                        style={{
                          boxShadow: '0 0 6px #ffffff, 0 2px 4px rgba(0, 0, 0, 0.4)'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Max Temp */}
              <div className="w-9 text-left">
                <span className="text-xs font-semibold text-white group-hover:text-white">
                  {formatTemp(item.maxTemp, tempUnit)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyForecast;
