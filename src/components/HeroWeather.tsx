import React, { useEffect, useState } from 'react';
import type { WeatherData, TemperatureUnit, Language } from '../types/weather';
import { formatTemp } from '../services/weatherService';
import { translations, getWeatherConditionDescription } from '../i18n/translations';
import { MapPin, Search } from 'lucide-react';

export interface HeroWeatherProps {
  weather: WeatherData;
  tempUnit: TemperatureUnit;
  lang: Language;
  onOpenSearch?: () => void;
  className?: string;
}

export const HeroWeather: React.FC<HeroWeatherProps> = ({
  weather,
  tempUnit,
  lang,
  onOpenSearch,
  className = ''
}) => {
  const [scrollY, setScrollY] = useState(0);
  const t = translations[lang] || translations.en;

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentTemp = formatTemp(weather.current.temperature, tempUnit);
  const todayForecast = weather.daily[0];
  const highTemp = todayForecast ? formatTemp(todayForecast.maxTemp, tempUnit) : currentTemp;
  const lowTemp = todayForecast ? formatTemp(todayForecast.minTemp, tempUnit) : currentTemp;
  const condition = getWeatherConditionDescription(
    weather.current.weatherCode,
    weather.current.isDay,
    lang
  );

  // Scroll collapse progress between 0 and 1 (from scroll 0px to 140px)
  const collapseProgress = Math.min(1, Math.max(0, scrollY / 120));

  return (
    <div className={`relative w-full ${className}`}>
      {/* Sticky Compact Mobile Bar (revealed as user scrolls down) */}
      <div
        className="sticky top-0 z-30 w-full transition-all duration-300 pointer-events-none md:hidden"
        style={{
          opacity: collapseProgress,
          transform: `translateY(${collapseProgress > 0.1 ? 0 : -10}px)`,
        }}
      >
        <div className="pointer-events-auto mx-auto max-w-md px-3 py-2">
          <div className="liquid-glass liquid-glass-pill flex items-center justify-between px-4 py-2.5 shadow-lg backdrop-blur-xl">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-white/80 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white truncate drop-shadow-sm">
                  {weather.city.name}
                </span>
                <span className="text-[11px] text-white/75 truncate">
                  {condition}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xl font-light text-white tracking-tight drop-shadow-sm">
                {currentTemp}
              </span>
              {onOpenSearch && (
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 transition-transform text-white/90"
                  aria-label={t.searchCity}
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main iOS Hero Weather Display */}
      <div
        className="flex flex-col items-center text-center transition-all duration-200"
        style={{
          opacity: Math.max(0, 1 - collapseProgress * 1.5),
          transform: `translateY(${scrollY * -0.2}px) scale(${1 - collapseProgress * 0.08})`,
        }}
      >
        {/* City and Location */}
        <div className="flex flex-col items-center gap-0.5 mt-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white drop-shadow-md m-0">
              {weather.city.name}
            </h1>
          </div>
          <p className="text-sm sm:text-base font-medium text-white/80 tracking-wide drop-shadow-sm">
            {weather.city.admin1 ? `${weather.city.admin1}, ` : ''}{weather.city.country}
          </p>
        </div>

        {/* 96px Ultra-thin Temperature Display */}
        <div className="my-1 sm:my-2 flex items-start justify-center select-none">
          <span
            className="text-white drop-shadow-lg tracking-tighter"
            style={{
              fontSize: 'clamp(5.5rem, 16vw, 6.75rem)',
              fontWeight: 200,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              textShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {currentTemp}
          </span>
        </div>

        {/* Condition Text */}
        <div className="text-lg sm:text-xl font-medium text-white/95 tracking-wide drop-shadow-sm mb-1">
          {condition}
        </div>

        {/* High & Low Temperatures */}
        <div className="flex items-center justify-center gap-4 text-sm sm:text-base font-medium text-white/85 drop-shadow-sm">
          <span>
            {t.h}: {highTemp}
          </span>
          <span className="text-white/40">•</span>
          <span>
            {t.l}: {lowTemp}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeroWeather;
