import React, { useRef } from 'react';
import type { HourlyForecastItem, TemperatureUnit, Language } from '../types/weather';
import { formatTemp } from '../services/weatherService';
import { translations as allTranslations, type Translations } from '../i18n/translations';
import { WeatherIcon } from './WeatherIcons';
import { useMouseGlare } from '../hooks/useMouseGlare';
import { Clock, Droplets, RotateCcw } from 'lucide-react';

export interface HourlyRibbonProps {
  hourly: HourlyForecastItem[];
  tempUnit: TemperatureUnit;
  selectedDayIndex?: number;
  selectedDayName?: string;
  onResetToToday?: () => void;
  language?: Language;
  t?: Translations;
  className?: string;
}

export const HourlyRibbon: React.FC<HourlyRibbonProps> = ({
  hourly,
  tempUnit,
  selectedDayIndex = 0,
  selectedDayName,
  onResetToToday,
  language = 'en',
  t,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  useMouseGlare(cardRef, { maxOpacity: 0.9, radius: 260 });

  const currentTranslations = t || allTranslations[language] || allTranslations.en;

  const formatHourLabel = (timeStr: string, index: number): string => {
    if (selectedDayIndex === 0 && index === 0) {
      return currentTranslations.now || 'Now';
    }

    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) {
        return timeStr.slice(11, 16);
      }

      if (language === 'ar') {
        return date.toLocaleTimeString('ar-SA', { hour: 'numeric' });
      } else if (language === 'fr') {
        return `${date.getHours()}h`;
      } else {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      }
    } catch {
      return timeStr.slice(11, 16);
    }
  };

  // Limit to 24 hours
  const displayHours = hourly.slice(0, 24);

  const isCustomDay = selectedDayIndex > 0;

  return (
    <div
      ref={cardRef}
      className={`liquid-glass liquid-glass-card rounded-[26px] p-5 backdrop-blur-2xl transition-all duration-300 ${className}`}
      style={{
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.45)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-white/75">
          <Clock className="w-3.5 h-3.5 text-white/80" />
          <span>
            {isCustomDay
              ? `${currentTranslations.hourlyForecast} — ${selectedDayName || 'Forecast'}`
              : currentTranslations.hourlyForecast}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isCustomDay && onResetToToday && (
            <button
              type="button"
              onClick={onResetToToday}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/15 hover:bg-white/25 active:scale-95 text-cyan-200 border border-cyan-400/30 transition-all flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{language === 'ar' ? 'اليوم' : language === 'fr' ? 'Aujourd’hui' : 'Back to Today'}</span>
            </button>
          )}
          <span className="text-[11px] text-white/50 font-normal hidden sm:inline">
            {displayHours.length}h
          </span>
        </div>
      </div>

      {/* 24-Hour Horizontal Scroll Ribbon */}
      <div
        className="flex items-center gap-3 overflow-x-auto liquid-glass-scroll py-2 px-1 -mx-1 select-none scroll-smooth"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }}
      >
        {displayHours.map((item, index) => {
          const hourLabel = formatHourLabel(item.time, index);
          const hasRainProb = item.precipitationProbability >= 10;

          return (
            <div
              key={`${item.time}-${index}`}
              className="flex flex-col items-center justify-between py-2.5 px-3 min-w-[72px] sm:min-w-[76px] rounded-2xl transition-all duration-200 hover:bg-white/10 group cursor-default"
            >
              {/* Hour Label */}
              <span
                className={`text-xs font-medium mb-2.5 whitespace-nowrap transition-colors ${
                  index === 0 ? 'text-white font-semibold' : 'text-white/70 group-hover:text-white'
                }`}
              >
                {hourLabel}
              </span>

              {/* Animated Mini Weather Icon */}
              <div className="my-1.5 flex items-center justify-center h-9 w-9 transition-transform duration-200 group-hover:scale-110">
                <WeatherIcon code={item.weatherCode} isDay={item.isDay} size={30} />
              </div>

              {/* Rain Probability Badge */}
              <div className="h-5 flex items-center justify-center my-1">
                {hasRainProb ? (
                  <div
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight text-cyan-200"
                    style={{
                      background: 'rgba(6, 182, 212, 0.25)',
                      boxShadow: '0 0 8px rgba(6, 182, 212, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                    }}
                    title={`${item.precipitationProbability}% precipitation`}
                  >
                    <Droplets className="w-2.5 h-2.5 text-cyan-300 animate-pulse" />
                    <span>{item.precipitationProbability}%</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-transparent select-none">-</span>
                )}
              </div>

              {/* Temperature */}
              <span className="text-sm font-semibold tracking-tight text-white mt-1">
                {formatTemp(item.temperature, tempUnit)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HourlyRibbon;
