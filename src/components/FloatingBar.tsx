import React from 'react';
import {
  Search,
  Navigation,
  Settings,
  RefreshCw,
  Bookmark
} from 'lucide-react';
import type { ShowcaseMode, Language } from '../types/weather';
import { translations } from '../i18n/translations';

export interface FloatingBarProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onUseMyLocation: () => void;
  onRefresh: () => void;
  onToggleSavedCitiesDrawer?: () => void;
  showcaseMode: ShowcaseMode;
  lang: Language;
  isRefreshing?: boolean;
  isLocating?: boolean;
  savedCount?: number;
  className?: string;
}

export const FloatingBar: React.FC<FloatingBarProps> = ({
  onOpenSearch,
  onOpenSettings,
  onUseMyLocation,
  onRefresh,
  onToggleSavedCitiesDrawer,
  showcaseMode,
  lang,
  isRefreshing = false,
  isLocating = false,
  savedCount = 0,
  className = ''
}) => {
  const t = translations[lang] || translations.en;

  const showcaseIcons: Record<ShowcaseMode, string> = {
    live: '',
    sunny: '☀️',
    rain: '🌧️',
    thunderstorm: '⚡',
    snow: '❄️',
    night: '🌙',
  };

  return (
    <aside
      aria-label="Quick Navigation and Settings"
      className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 px-3 w-auto max-w-[96vw] ${className}`}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
      }}
    >
      <div
        className="liquid-glass liquid-glass-pill flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-2xl backdrop-blur-2xl border border-white/30 text-white"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
        }}
      >
        {/* Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-2 sm:p-2.5 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white/90 hover:text-white"
          title={t.searchCity}
          aria-label={t.searchCity}
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="w-[1px] h-4 bg-white/20 my-auto" />

        {/* Use My Location Button */}
        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={isLocating}
          className={`p-2 sm:p-2.5 rounded-full hover:bg-white/20 active:scale-95 transition-all ${
            isLocating ? 'animate-pulse text-blue-300' : 'text-white/90 hover:text-white'
          }`}
          title={t.useMyLocation}
          aria-label={t.useMyLocation}
        >
          <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
        </button>

        {/* Favorite Cities / Saved Cities button */}
        {onToggleSavedCitiesDrawer && (
          <button
            type="button"
            onClick={onToggleSavedCitiesDrawer}
            className="relative p-2 sm:p-2.5 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white/90 hover:text-white"
            title={t.savedCities}
            aria-label={t.savedCities}
          >
            <Bookmark className="w-5 h-5" />
            {savedCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900 shadow">
                {savedCount}
              </span>
            )}
          </button>
        )}

        {/* Refresh Weather Data */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 sm:p-2.5 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white/90 hover:text-white"
          title="Refresh forecast"
          aria-label="Refresh forecast"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Active Showcase Mode Badge / Toggle */}
        {showcaseMode !== 'live' && (
          <>
            <div className="w-[1px] h-4 bg-white/20 my-auto" />
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200 text-xs font-semibold hover:bg-amber-400/35 transition-all active:scale-95"
              title="Showcase mode active - click to modify"
            >
              <span>{showcaseIcons[showcaseMode]}</span>
              <span className="hidden sm:inline capitalize">{showcaseMode}</span>
            </button>
          </>
        )}

        <div className="w-[1px] h-4 bg-white/20 my-auto" />

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 sm:p-2.5 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white/90 hover:text-white group"
          title={t.settingsTitle}
          aria-label={t.settingsTitle}
        >
          <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" />
        </button>
      </div>
    </aside>
  );
};

export default FloatingBar;
