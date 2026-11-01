import React, { useState, useEffect, useCallback, useTransition } from 'react';
import type {
  WeatherData,
  CityLocation,
  SavedCity,
  UserSettings,
} from './types/weather';
import {
  DEFAULT_CITIES,
  fetchWeatherData,
  getSavedCities,
  saveCityToStorage,
  removeCityFromStorage,
  formatTemp,
  getUserSettings,
  saveUserSettings,
  applyGlassSettings,
  getHourlyForDay,
} from './services/weatherService';
import { translations } from './i18n/translations';
import { useGlobalMouseGlare } from './hooks/useMouseGlare';

// Components
import CanvasBackground from './components/CanvasBackground';
import HeroWeather from './components/HeroWeather';
import CitySearch from './components/CitySearch';
import FloatingBar from './components/FloatingBar';
import SettingsModal from './components/SettingsModal';

// Bento Widget Cards from Worker 2
import HourlyRibbon from './components/HourlyRibbon';
import WeeklyForecast from './components/WeeklyForecast';
import CompassCard from './components/CompassCard';
import SunTrackerCard from './components/SunTrackerCard';
import HumidityCard from './components/HumidityCard';
import PressureCard from './components/PressureCard';

import {
  WifiOff,
  CloudRain,
  Sparkles,
  MapPin,
  Clock,
  Star,
} from 'lucide-react';

export const App: React.FC = () => {
  // Global dynamic cursor glare on all .liquid-glass elements
  useGlobalMouseGlare();

  // Settings State
  const [settings, setSettings] = useState<UserSettings>(() => getUserSettings());

  // Current selected city
  const [currentCity, setCurrentCity] = useState<CityLocation>(DEFAULT_CITIES[0]);

  // Weather data
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Saved cities list
  const [savedCities, setSavedCities] = useState<SavedCity[]>(() => getSavedCities());

  // UI Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Selected Day Index for 7-Day Forecast & Hourly Ribbon
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const [, startTransition] = useTransition();
  const t = translations[settings.language] || translations.en;

  // Sync RTL / LTR dynamically whenever language changes
  useEffect(() => {
    const isRTL = settings.language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // Load weather data for a given city
  const loadWeatherData = useCallback(
    async (city: CityLocation, showLoader = true, lang: string = settings.language) => {
      if (showLoader) setIsLoading(true);
      try {
        const data = await fetchWeatherData(city, lang as any);
        startTransition(() => {
          setWeather(data);
          setCurrentCity(city);
        });

        // Update current temperature in saved cities if matching
        setSavedCities((prev) =>
          prev.map((sc) =>
            Math.abs(sc.latitude - city.latitude) < 0.05 &&
            Math.abs(sc.longitude - city.longitude) < 0.05
              ? {
                  ...sc,
                  currentTemp: data.current.temperature,
                  weatherCode: data.current.weatherCode,
                  isDay: data.current.isDay,
                }
              : sc
          )
        );
      } catch (err) {
        console.error('Error fetching weather:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [settings.language]
  );

  const hasLoadedRef = React.useRef(false);

  // Initial load & language change synchronization
  useEffect(() => {
    const isFirst = !hasLoadedRef.current;
    hasLoadedRef.current = true;
    loadWeatherData(currentCity, isFirst, settings.language);
  }, [currentCity, settings.language, loadWeatherData]);

  // Dynamic Glass Settings application
  useEffect(() => {
    if (settings.glassSettings) {
      applyGlassSettings(settings.glassSettings);
    }
  }, [settings.glassSettings]);

  // Update Settings handler
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = saveUserSettings(newSettings);
    setSettings(updated);
  };

  // Switch City
  const handleSelectCity = (city: CityLocation) => {
    setSelectedDayIndex(0);
    loadWeatherData(city, true);
    setIsSearchOpen(false);
  };

  // Toggle Save City
  const handleToggleSaveCity = (city: CityLocation) => {
    const exists = savedCities.some(
      (c) =>
        Math.abs(c.latitude - city.latitude) < 0.05 &&
        Math.abs(c.longitude - city.longitude) < 0.05
    );

    let updated: SavedCity[];
    if (exists) {
      updated = removeCityFromStorage(city.id);
    } else {
      const newSaved: SavedCity = {
        ...city,
        currentTemp: weather ? weather.current.temperature : undefined,
        weatherCode: weather ? weather.current.weatherCode : undefined,
        isDay: weather ? weather.current.isDay : true,
      };
      updated = saveCityToStorage(newSaved);
    }
    setSavedCities(updated);
  };

  const handleRemoveSavedCity = (cityId: string | number) => {
    const updated = removeCityFromStorage(cityId);
    setSavedCities(updated);
  };

  // Refresh current forecast
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWeatherData(currentCity, false);
  };

  // Geolocation lookup
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        let cityName = 'Current Location';
        let country = '';

        try {
          // Attempt reverse geocoding via Open-Meteo or BigDataCloud
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${settings.language}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.city || data.locality) {
              cityName = data.city || data.locality;
              country = data.countryName || '';
            }
          }
        } catch {
          // Fallback to coordinates
        }

        const userLocation: CityLocation = {
          id: `loc_${latitude.toFixed(2)}_${longitude.toFixed(2)}`,
          name: cityName,
          country,
          latitude,
          longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto',
        };

        setIsLocating(false);
        handleSelectCity(userLocation);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        // Fallback default city
        handleSelectCity(DEFAULT_CITIES[0]);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const today = weather?.daily[0];
  const displayHourly = weather ? getHourlyForDay(weather, selectedDayIndex) : [];
  const selectedDayName = weather?.daily[selectedDayIndex]?.dayName;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between selection:bg-white/20 selection:text-white">
      {/* 60fps Canvas Weather Atmosphere Engine */}
      <CanvasBackground
        weatherCode={weather?.current.weatherCode ?? 0}
        isDay={weather?.current.isDay ?? true}
        showcaseMode={settings.showcaseMode}
      />

      {/* Top Banner for Offline Mode or Active Showcase */}
      {(weather?.isOffline || settings.showcaseMode !== 'live') && (
        <div className="relative z-30 w-full px-4 pt-2 pb-0">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 py-1.5 px-4 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 border border-amber-400/30 backdrop-blur-md shadow-lg text-center">
            {settings.showcaseMode !== 'live' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  {t.showcaseMode}: <strong className="capitalize">{settings.showcaseMode}</strong>
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>{t.offlineNotice}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Search Modal Drawer */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200 lg:hidden">
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="p-2 rounded-full text-white/80 hover:bg-white/20 active:scale-95"
            >
              ✕
            </button>
          </div>
          <div className="max-w-md mx-auto w-full">
            <CitySearch
              onSelectCity={handleSelectCity}
              currentCity={currentCity}
              savedCities={savedCities}
              onToggleSaveCity={handleToggleSaveCity}
              lang={settings.language}
              autoFocus={true}
              onClose={() => setIsSearchOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 pointer-events-auto flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28">
        {isLoading && !weather ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="p-4 rounded-3xl liquid-glass animate-pulse flex items-center gap-3 text-white">
              <CloudRain className="w-8 h-8 animate-bounce" />
              <span className="text-lg font-medium">Loading weather data...</span>
            </div>
          </div>
        ) : weather ? (
          <>
            {/* ======================================================== */}
            {/* MOBILE & TABLET LAYOUT (< 1024px)                        */}
            {/* Single-column iOS Weather flow with sticky hero header    */}
            {/* ======================================================== */}
            <div className="flex flex-col lg:hidden space-y-6">
              {/* iOS Hero Weather Header */}
              <HeroWeather
                weather={weather}
                tempUnit={settings.tempUnit}
                lang={settings.language}
                onOpenSearch={() => setIsSearchOpen(true)}
              />

              {/* 24-Hour Hourly Ribbon */}
              <div className="w-full">
                <HourlyRibbon
                  hourly={displayHourly}
                  tempUnit={settings.tempUnit}
                  selectedDayIndex={selectedDayIndex}
                  selectedDayName={selectedDayName}
                  onResetToToday={() => setSelectedDayIndex(0)}
                  language={settings.language}
                />
              </div>

              {/* 7-Day Forecast */}
              <div className="w-full">
                <WeeklyForecast
                  daily={weather.daily}
                  currentTemp={weather.current.temperature}
                  tempUnit={settings.tempUnit}
                  language={settings.language}
                  selectedDayIndex={selectedDayIndex}
                  onSelectDay={setSelectedDayIndex}
                />
              </div>

              {/* 2x2 Bento Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CompassCard
                  windSpeed={weather.current.windSpeed}
                  windDirection={weather.current.windDirection}
                  windGusts={weather.current.windGusts}
                  unit={settings.windUnit}
                  language={settings.language}
                />
                <SunTrackerCard
                  sunrise={today?.sunrise || ''}
                  sunset={today?.sunset || ''}
                  uvIndex={today?.uvIndexMax ?? 5}
                  currentTime={weather.current.time}
                  language={settings.language}
                />
                <HumidityCard
                  humidity={weather.current.relativeHumidity}
                  temperature={weather.current.temperature}
                  tempUnit={settings.tempUnit}
                  language={settings.language}
                />
                <PressureCard
                  pressure={weather.current.surfacePressure}
                  pressureUnit={settings.pressureUnit}
                  visibility={weather.hourly[0]?.visibility ?? 10}
                  apparentTemperature={weather.current.apparentTemperature}
                  currentTemperature={weather.current.temperature}
                  tempUnit={settings.tempUnit}
                  language={settings.language}
                />
              </div>
            </div>

            {/* ======================================================== */}
            {/* PC WIDESCREEN COMMAND CENTER (>= 1024px)                 */}
            {/* Sticky Left Command Column + 4-Column Bento Grid         */}
            {/* ======================================================== */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Glass Command Hub (sticky) */}
              <aside className="lg:col-span-4 xl:col-span-4 sticky top-6 flex flex-col gap-5">
                {/* Search Bar at Top of Left Column */}
                <CitySearch
                  onSelectCity={handleSelectCity}
                  currentCity={currentCity}
                  savedCities={savedCities}
                  onToggleSaveCity={handleToggleSaveCity}
                  lang={settings.language}
                />

                {/* Hero Weather Card */}
                <div className="liquid-glass liquid-glass-card rounded-[28px] p-6 shadow-2xl backdrop-blur-2xl">
                  <HeroWeather
                    weather={weather}
                    tempUnit={settings.tempUnit}
                    lang={settings.language}
                    onOpenSearch={() => setIsSearchOpen(true)}
                  />

                  {/* System & Meteorological Quick Readout */}
                  <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 gap-3 text-center">
                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                        {t.feelsLikeTitle}
                      </div>
                      <div className="text-lg font-light text-white mt-0.5">
                        {formatTemp(weather.current.apparentTemperature, settings.tempUnit)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                        {t.humidityTitle}
                      </div>
                      <div className="text-lg font-light text-white mt-0.5">
                        {Math.round(weather.current.relativeHumidity)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Saved Favorite Cities Glass Shelf */}
                <div className="liquid-glass liquid-glass-card rounded-[28px] p-5 shadow-2xl backdrop-blur-2xl">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{t.savedCities}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSaveCity(weather.city)}
                      className="text-xs font-medium text-white/70 hover:text-white transition-colors"
                    >
                      {savedCities.some((c) => Math.abs(c.latitude - weather.city.latitude) < 0.05)
                        ? '★ Saved'
                        : '+ Save current'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto liquid-glass-scroll pr-1">
                    {savedCities.map((city) => {
                      const isSelected =
                        Math.abs(city.latitude - weather.city.latitude) < 0.05 &&
                        Math.abs(city.longitude - weather.city.longitude) < 0.05;

                      return (
                        <div
                          key={city.id || `${city.name}-${city.latitude}`}
                          onClick={() => handleSelectCity(city)}
                          className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all ${
                            isSelected
                              ? 'bg-white/25 border-white/50 shadow-md font-medium'
                              : 'bg-white/5 hover:bg-white/15 border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MapPin className="w-4 h-4 text-white/70 shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold text-white truncate">
                                {city.name}
                              </span>
                              <span className="text-xs text-white/60 truncate">
                                {city.country}
                              </span>
                            </div>
                          </div>

                          {typeof city.currentTemp === 'number' && (
                            <span className="text-base font-light text-white tracking-tight shrink-0 pl-2">
                              {formatTemp(city.currentTemp, settings.tempUnit)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between px-3 text-xs text-white/50">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Updated: {new Date(weather.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span>Open-Meteo 60fps</span>
                </div>
              </aside>

              {/* Right Column: 4-Column Bento Grid */}
              <section className="lg:col-span-8 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Row 1: Hourly Ribbon (spans all 4 columns) */}
                <div className="col-span-1 md:col-span-2 xl:col-span-4">
                  <HourlyRibbon
                    hourly={displayHourly}
                    tempUnit={settings.tempUnit}
                    selectedDayIndex={selectedDayIndex}
                    selectedDayName={selectedDayName}
                    onResetToToday={() => setSelectedDayIndex(0)}
                    language={settings.language}
                  />
                </div>

                {/* Row 2: Weekly Forecast (spans 2 columns) */}
                <div className="col-span-1 md:col-span-2 xl:col-span-2">
                  <WeeklyForecast
                    daily={weather.daily}
                    currentTemp={weather.current.temperature}
                    tempUnit={settings.tempUnit}
                    language={settings.language}
                    selectedDayIndex={selectedDayIndex}
                    onSelectDay={setSelectedDayIndex}
                  />
                </div>

                {/* Row 2: Compass & Sun Tracker (each 2 columns on 4-col grid or 1 col on 2-col) */}
                <div className="col-span-1 md:col-span-1 xl:col-span-2">
                  <CompassCard
                    windSpeed={weather.current.windSpeed}
                    windDirection={weather.current.windDirection}
                    windGusts={weather.current.windGusts}
                    unit={settings.windUnit}
                    language={settings.language}
                  />
                </div>

                {/* Row 3: Sun Tracker (spans 2 columns) */}
                <div className="col-span-1 md:col-span-1 xl:col-span-2">
                  <SunTrackerCard
                    sunrise={today?.sunrise || ''}
                    sunset={today?.sunset || ''}
                    uvIndex={today?.uvIndexMax ?? 5}
                    currentTime={weather.current.time}
                    language={settings.language}
                  />
                </div>

                {/* Row 3: Humidity (spans 1 col on 4-col grid) */}
                <div className="col-span-1 md:col-span-1 xl:col-span-1">
                  <HumidityCard
                    humidity={weather.current.relativeHumidity}
                    temperature={weather.current.temperature}
                    tempUnit={settings.tempUnit}
                    language={settings.language}
                  />
                </div>

                {/* Row 3: Pressure (spans 1 col on 4-col grid) */}
                <div className="col-span-1 md:col-span-1 xl:col-span-1">
                  <PressureCard
                    pressure={weather.current.surfacePressure}
                    pressureUnit={settings.pressureUnit}
                    visibility={weather.hourly[0]?.visibility ?? 10}
                    apparentTemperature={weather.current.apparentTemperature}
                    currentTemperature={weather.current.temperature}
                    tempUnit={settings.tempUnit}
                    language={settings.language}
                  />
                </div>
              </section>
            </div>
          </>
        ) : null}
      </main>

      {/* Pill-shaped Liquid Glass Floating Bottom Navigation */}
      <FloatingBar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onUseMyLocation={handleUseMyLocation}
        onRefresh={handleRefresh}
        onToggleSavedCitiesDrawer={() => setIsSettingsOpen(true)}
        showcaseMode={settings.showcaseMode}
        lang={settings.language}
        isRefreshing={isRefreshing}
        isLocating={isLocating}
        savedCount={savedCities.length}
      />

      {/* Liquid Glass Settings Modal Drawer */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        savedCities={savedCities}
        currentCity={weather?.city}
        onSelectCity={handleSelectCity}
        onRemoveSavedCity={handleRemoveSavedCity}
        onUseMyLocation={handleUseMyLocation}
        isLocating={isLocating}
      />
    </div>
  );
};

export default App;
