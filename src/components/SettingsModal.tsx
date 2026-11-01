import React, { useEffect } from 'react';
import {
  X,
  MapPin,
  Trash2,
  Check,
  Compass,
  Gauge,
  Thermometer,
  Languages,
  Sparkles,
  Navigation,
  Loader2,
  Sliders
} from 'lucide-react';
import type {
  UserSettings,
  SavedCity,
  CityLocation,
  TemperatureUnit,
  WindSpeedUnit,
  PressureUnit,
  Language,
  ShowcaseMode,
  GlassSettings,
  GlassTint
} from '../types/weather';
import { translations } from '../i18n/translations';
import { formatTemp, applyGlassSettings } from '../services/weatherService';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  savedCities: SavedCity[];
  currentCity?: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  onRemoveSavedCity: (cityId: string | number) => void;
  onUseMyLocation: () => void;
  isLocating?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  savedCities,
  currentCity,
  onSelectCity,
  onRemoveSavedCity,
  onUseMyLocation,
  isLocating = false
}) => {
  const t = translations[settings.language] || translations.en;

  // Sync RTL / LTR dynamically whenever language changes
  useEffect(() => {
    const isRTL = settings.language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCurrent = (city: CityLocation) => {
    if (!currentCity) return false;
    return (
      Math.abs(currentCity.latitude - city.latitude) < 0.05 &&
      Math.abs(currentCity.longitude - city.longitude) < 0.05
    );
  };

  const showcaseOptions: { id: ShowcaseMode; label: string; icon: string }[] = [
    { id: 'live', label: t.showcaseLive, icon: '🛰️' },
    { id: 'sunny', label: t.showcaseSunny, icon: '☀️' },
    { id: 'rain', label: t.showcaseRain, icon: '🌧️' },
    { id: 'thunderstorm', label: t.showcaseThunder, icon: '⚡' },
    { id: 'snow', label: t.showcaseSnow, icon: '❄️' },
    { id: 'night', label: t.showcaseNight, icon: '🌙' },
  ];

  const currentGlass: GlassSettings = settings.glassSettings || {
    blur: 24,
    opacity: 22,
    tint: 'clear',
    specularGlow: true
  };

  const handleUpdateGlass = (partial: Partial<GlassSettings>) => {
    const updated: GlassSettings = {
      ...currentGlass,
      ...partial
    };
    onUpdateSettings({ glassSettings: updated });
    applyGlassSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 sm:overflow-y-auto">
      {/* Dynamic blurred backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Modal Dialog Body */}
      <div
        className="liquid-glass relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-white/30 text-white z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
          direction: settings.language === 'ar' ? 'rtl' : 'ltr',
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white m-0">
                {t.settingsTitle}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/15 active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto liquid-glass-scroll p-6 space-y-6">
          {/* Quick Action: Use My Location */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/15 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/30 text-blue-300">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm sm:text-base text-white">
                  {t.useMyLocation}
                </div>
                <div className="text-xs text-white/70">
                  {isLocating ? t.locating : 'GPS coordinate meteorological lookup'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onUseMyLocation}
              disabled={isLocating}
              className="liquid-glass liquid-glass-button px-4 py-2 text-sm font-semibold rounded-xl bg-blue-500/40 hover:bg-blue-500/60 text-white disabled:opacity-50"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.locating}</span>
                </>
              ) : (
                <span>{t.useMyLocation}</span>
              )}
            </button>
          </div>

          {/* Section: Favorite Cities List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80 m-0 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t.savedCities} ({savedCities.length})
              </h3>
            </div>

            {savedCities.length === 0 ? (
              <div className="text-center py-5 text-sm text-white/60 bg-white/5 rounded-2xl border border-white/10">
                {t.noResults}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {savedCities.map((city) => {
                  const active = isCurrent(city);
                  const tempDisplay =
                    typeof city.currentTemp === 'number'
                      ? formatTemp(city.currentTemp, settings.tempUnit)
                      : null;

                  return (
                    <div
                      key={city.id || `${city.name}-${city.latitude}`}
                      onClick={() => {
                        onSelectCity(city);
                        onClose();
                      }}
                      className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all ${
                        active
                          ? 'bg-white/20 border-white/50 shadow-lg'
                          : 'bg-white/10 hover:bg-white/15 border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            active ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'
                          }`}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-white truncate">
                            {city.name}
                          </span>
                          <span className="text-xs text-white/70 truncate">
                            {city.country}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {tempDisplay && (
                          <span className="text-lg font-light text-white tracking-tight">
                            {tempDisplay}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveSavedCity(city.id);
                          }}
                          className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-colors opacity-70 group-hover:opacity-100"
                          title={t.removeCity}
                          aria-label={t.removeCity}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Language Switcher */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80 m-0 flex items-center gap-2">
              <Languages className="w-4 h-4" />
              {t.language}
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'en' as Language, label: 'English', native: 'English' },
                { code: 'ar' as Language, label: 'العربية', native: 'Arabic (RTL)' },
                { code: 'fr' as Language, label: 'Français', native: 'French' },
              ].map((lang) => {
                const active = settings.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => onUpdateSettings({ language: lang.code })}
                    className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl border transition-all ${
                      active
                        ? 'bg-white/25 border-white/60 shadow-md font-bold'
                        : 'bg-white/10 hover:bg-white/15 border-white/15'
                    }`}
                  >
                    <span className="text-sm text-white">{lang.label}</span>
                    <span className="text-[11px] text-white/60">{lang.native}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Unit Customization */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80 m-0 flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              {t.units}
            </h3>

            <div className="space-y-3">
              {/* Temperature Unit */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/10 border border-white/15">
                <span className="text-sm font-medium text-white">{t.temperature}</span>
                <div className="flex items-center gap-1 p-1 bg-black/25 rounded-xl border border-white/15">
                  {(['c', 'f'] as TemperatureUnit[]).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => onUpdateSettings({ tempUnit: unit })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        settings.tempUnit === unit
                          ? 'bg-white text-slate-900 shadow'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      °{unit.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wind Speed Unit */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/10 border border-white/15">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-white/70" />
                  <span className="text-sm font-medium text-white">{t.wind}</span>
                </div>
                <div className="flex items-center gap-1 p-1 bg-black/25 rounded-xl border border-white/15">
                  {(['kmh', 'mph', 'ms'] as WindSpeedUnit[]).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => onUpdateSettings({ windUnit: unit })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        settings.windUnit === unit
                          ? 'bg-white text-slate-900 shadow'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {unit === 'ms' ? 'm/s' : unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pressure Unit */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/10 border border-white/15">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-white/70" />
                  <span className="text-sm font-medium text-white">{t.pressure}</span>
                </div>
                <div className="flex items-center gap-1 p-1 bg-black/25 rounded-xl border border-white/15">
                  {(['hpa', 'inhg'] as PressureUnit[]).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => onUpdateSettings({ pressureUnit: unit })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        settings.pressureUnit === unit
                          ? 'bg-white text-slate-900 shadow'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {unit === 'inhg' ? 'inHg' : 'hPa'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Live Weather Showcase Mode */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80 m-0 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                {t.showcaseMode}
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                {t.showcaseDesc}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {showcaseOptions.map((opt) => {
                const active = settings.showcaseMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateSettings({ showcaseMode: opt.id })}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      active
                        ? 'bg-white/25 border-white/70 shadow-lg font-semibold'
                        : 'bg-white/10 hover:bg-white/15 border-white/15'
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-xs sm:text-sm text-white truncate">
                      {opt.label}
                    </span>
                    {active && <Check className="w-4 h-4 ml-auto text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Liquid Glass Appearance */}
          <div className="space-y-4 pt-2 border-t border-white/15">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80 m-0 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-300" />
                <span>
                  {settings.language === 'ar'
                    ? 'مظهر وتأثيرات الزجاج السائل'
                    : settings.language === 'fr'
                    ? 'Apparence du Verre Liquide'
                    : 'Liquid Glass Appearance'}
                </span>
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                {settings.language === 'ar'
                  ? 'تخصيص درجة التغبيش، الشفافية، والتوهج العاكس في الوقت الفعلي.'
                  : settings.language === 'fr'
                  ? 'Personnalisez le flou, l’opacité et les reflets spéculaires en temps réel.'
                  : 'Customize backdrop blur, translucent tint, and specular gleam in real time.'}
              </p>
            </div>

            {/* 1. Glass Blur Presets */}
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-white/90">
                <span>
                  {settings.language === 'ar'
                    ? 'درجة التغبيش (Blur)'
                    : settings.language === 'fr'
                    ? 'Flou du verre'
                    : 'Glass Blur'}
                </span>
                <span className="font-semibold text-cyan-300">{currentGlass.blur}px</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 0, label: '0px', desc: 'None' },
                  { value: 12, label: '12px', desc: 'Soft' },
                  { value: 24, label: '24px', desc: 'Default' },
                  { value: 36, label: '36px', desc: 'Heavy' }
                ].map((b) => {
                  const active = currentGlass.blur === b.value;
                  return (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => handleUpdateGlass({ blur: b.value })}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                        active
                          ? 'bg-white text-slate-900 shadow-md font-bold'
                          : 'bg-white/10 hover:bg-white/20 text-white/80'
                      }`}
                    >
                      <span>{b.label}</span>
                      <span className={`text-[10px] ${active ? 'text-slate-600' : 'text-white/50'}`}>
                        {b.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Glass Opacity Slider */}
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-white/90">
                <span>
                  {settings.language === 'ar'
                    ? 'نسبة العتامة (Opacity)'
                    : settings.language === 'fr'
                    ? 'Opacité du verre'
                    : 'Glass Opacity'}
                </span>
                <span className="font-semibold text-cyan-300">{currentGlass.opacity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={currentGlass.opacity}
                onChange={(e) => handleUpdateGlass({ opacity: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
                aria-label="Glass Opacity"
              />
            </div>

            {/* 2. Glass Opacity / Tint */}
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-white/90">
                <span>
                  {settings.language === 'ar'
                    ? 'نمط الشفافية واللون'
                    : settings.language === 'fr'
                    ? 'Teinte & Opacité'
                    : 'Glass Tint & Opacity'}
                </span>
                <span className="font-semibold text-cyan-300 capitalize">{currentGlass.tint}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'clear' as GlassTint, label: 'Clear', icon: '💎' },
                  { id: 'frosted' as GlassTint, label: 'Frosted', icon: '❄️' },
                  { id: 'deep' as GlassTint, label: 'Deep', icon: '🌌' },
                  { id: 'vibrant' as GlassTint, label: 'Vibrant', icon: '✨' }
                ].map((tnt) => {
                  const active = currentGlass.tint === tnt.id;
                  return (
                    <button
                      key={tnt.id}
                      type="button"
                      onClick={() => handleUpdateGlass({ tint: tnt.id })}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                        active
                          ? 'bg-white/25 border-white/70 shadow font-semibold'
                          : 'bg-white/10 hover:bg-white/15 border-white/15'
                      }`}
                    >
                      <span className="text-base">{tnt.icon}</span>
                      <span className="text-xs text-white">{tnt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Specular Glow Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 border border-white/15">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">
                  {settings.language === 'ar'
                    ? 'التوهج وانعكاس المؤشر (Specular Glow)'
                    : settings.language === 'fr'
                    ? 'Reflet & Éclat Spéculaire'
                    : 'Specular Glow & Glare'}
                </span>
                <span className="text-xs text-white/60">
                  {settings.language === 'ar'
                    ? 'إبراز الحواف العاكسة وتتبع حركة المؤشر'
                    : settings.language === 'fr'
                    ? 'Effet de reflet brillant réactif au curseur'
                    : 'Interactive cursor glare and bright refractive borders'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateGlass({ specularGlow: !currentGlass.specularGlow })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  currentGlass.specularGlow ? 'bg-cyan-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    currentGlass.specularGlow ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-white/15 bg-white/5">
          <button
            type="button"
            onClick={onClose}
            className="liquid-glass-button px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/20 hover:bg-white/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
