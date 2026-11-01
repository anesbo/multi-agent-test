import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, Star, MapPin } from 'lucide-react';
import type { CityLocation, SavedCity, Language } from '../types/weather';
import { searchCities } from '../services/weatherService';
import { translations } from '../i18n/translations';

export interface CitySearchProps {
  onSelectCity: (city: CityLocation) => void;
  currentCity?: CityLocation;
  savedCities?: SavedCity[];
  onToggleSaveCity?: (city: CityLocation) => void;
  lang: Language;
  autoFocus?: boolean;
  onClose?: () => void;
  className?: string;
  placeholder?: string;
}

export const CitySearch: React.FC<CitySearchProps> = ({
  onSelectCity,
  currentCity,
  savedCities = [],
  onToggleSaveCity,
  lang,
  autoFocus = false,
  onClose,
  className = '',
  placeholder
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang] || translations.en;

  // Debounced search effect
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const cities = await searchCities(trimmed, lang);
        setResults(cities);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Failed to search cities:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, lang]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (city: CityLocation) => {
      onSelectCity(city);
      setQuery('');
      setIsOpen(false);
      setResults([]);
      if (onClose) onClose();
    },
    [onSelectCity, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      if (onClose) onClose();
    }
  };

  const isCitySaved = (city: CityLocation) => {
    return savedCities.some(
      (c) =>
        Math.abs(c.latitude - city.latitude) < 0.05 &&
        Math.abs(c.longitude - city.longitude) < 0.05
    );
  };

  const isCurrent = (city: CityLocation) => {
    if (!currentCity) return false;
    return (
      Math.abs(currentCity.latitude - city.latitude) < 0.05 &&
      Math.abs(currentCity.longitude - city.longitude) < 0.05
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/70">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white/90" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (val.trim().length < 2) {
              setResults([]);
              setIsLoading(false);
            } else if (!isOpen) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder || t.searchPlaceholder}
          className="liquid-glass-input w-full pl-11 pr-11 py-3 text-sm sm:text-base text-white placeholder-white/60 focus:placeholder-white/40 rounded-full"
          style={{
            direction: lang === 'ar' ? 'rtl' : 'ltr',
          }}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 active:scale-95 transition-all"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && query.trim().length >= 2 && (
        <div
          className="liquid-glass absolute left-0 right-0 top-full mt-2.5 max-h-80 overflow-y-auto liquid-glass-scroll z-50 rounded-2xl shadow-2xl border border-white/30 backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%)',
          }}
        >
          {isLoading && results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-6 text-white/75 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.searchPlaceholder}...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-white/70 text-sm">
              {t.noResults}
            </div>
          ) : (
            <div className="p-1.5 space-y-1">
              {results.map((city, index) => {
                const active = index === selectedIndex;
                const saved = isCitySaved(city);
                const current = isCurrent(city);

                return (
                  <div
                    key={city.id || `${city.name}-${city.latitude}-${index}`}
                    onClick={() => handleSelect(city)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      active
                        ? 'bg-white/25 text-white'
                        : 'text-white/90 hover:bg-white/15'
                    } ${current ? 'border border-white/40' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="p-1.5 rounded-lg bg-white/10 text-white/80 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm sm:text-base truncate">
                            {city.name}
                          </span>
                          {current && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-white/90">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-white/70 truncate">
                          {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                        </span>
                      </div>
                    </div>

                    {/* Quick favorite toggle */}
                    {onToggleSaveCity && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSaveCity(city);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          saved
                            ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/20'
                            : 'text-white/40 hover:text-white/90 hover:bg-white/15'
                        }`}
                        title={saved ? t.removeCity : t.saveCity}
                        aria-label={saved ? t.removeCity : t.saveCity}
                      >
                        <Star className={`w-4 h-4 ${saved ? 'fill-amber-400' : ''}`} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitySearch;
