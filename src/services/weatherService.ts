import type {
  CityLocation,
  WeatherData,
  SavedCity,
  UserSettings,
  GlassSettings,
  HourlyForecastItem,
  TemperatureUnit,
  WindSpeedUnit,
  PressureUnit,
  PrecipitationUnit,
  VisibilityUnit,
  Language,
  CacheEntry
} from '../types/weather';

export const DEFAULT_CITIES: CityLocation[] = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    countryCode: 'FR',
    admin1: 'Île-de-France',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: 'Europe/Paris'
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    countryCode: 'US',
    admin1: 'New York',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York'
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    admin1: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo'
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    admin1: 'Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: 'Asia/Dubai'
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    admin1: 'England',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London'
  }
];

export const DEFAULT_GLASS_SETTINGS: GlassSettings = {
  blur: 24,
  opacity: 22,
  tint: 'clear',
  specularGlow: true
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  tempUnit: 'c',
  windUnit: 'kmh',
  pressureUnit: 'hpa',
  language: 'en',
  showcaseMode: 'live',
  precipitationUnit: 'mm',
  visibilityUnit: 'km',
  glassSettings: DEFAULT_GLASS_SETTINGS
};

export const DEFAULT_SETTINGS: UserSettings = DEFAULT_USER_SETTINGS;

const STORAGE_CACHE_KEY_PREFIX = 'liquid_weather_cache_';
const STORAGE_LAST_CACHE_KEY = 'liquid_weather_last_cache';
const STORAGE_SAVED_CITIES_KEY = 'liquid_weather_saved_cities';
const STORAGE_SETTINGS_KEY = 'liquid_weather_settings';
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes freshness window
const CACHE_VERSION = 2;

// ==========================================
// 1. WEATHER DATA FETCHING & CACHING
// ==========================================

export async function fetchWeatherData(
  city: CityLocation,
  lang: Language = 'en',
  forceRefresh: boolean = false
): Promise<WeatherData> {
  const cacheKey = `${STORAGE_CACHE_KEY_PREFIX}${city.latitude.toFixed(2)}_${city.longitude.toFixed(2)}`;

  // Stale-While-Revalidate check
  if (!forceRefresh) {
    const cachedEntry = getCacheEntry<WeatherData>(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      return {
        ...cachedEntry.data,
        city: { ...cachedEntry.data.city, ...city }, // keep display name updated
        isOffline: false
      };
    }
  }

  // Open-Meteo v1 forecast request with full meteorological telemetry across 7 days
  const params = new URLSearchParams({
    latitude: city.latitude.toFixed(4),
    longitude: city.longitude.toFixed(4),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'dew_point_2m',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m'
    ].join(','),
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'visibility',
      'uv_index',
      'wind_speed_10m',
      'wind_direction_10m'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_probability_max',
      'precipitation_sum',
      'wind_speed_10m_max',
      'wind_gusts_10m_max'
    ].join(','),
    timezone: 'auto'
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  // Safe fetch with 9s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP error: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();
    const formattedData = transformOpenMeteoResponse(city, rawData, lang);

    // Save to persistent local cache
    setCacheEntry(cacheKey, formattedData);
    setCacheEntry(STORAGE_LAST_CACHE_KEY, formattedData);

    return formattedData;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Weather network fetch failed, recovering from cache:', error);

    // Error recovery: Load existing cached data for this city or last viewed city
    const cachedEntry = getCacheEntry<WeatherData>(cacheKey) || getCacheEntry<WeatherData>(STORAGE_LAST_CACHE_KEY);
    if (cachedEntry) {
      return {
        ...cachedEntry.data,
        city: { ...cachedEntry.data.city, ...city },
        isOffline: true,
        cachedAt: cachedEntry.timestamp
      };
    }

    // Secondary fallback: Return calculated realistic weather data if first time offline
    return generateFallbackWeatherData(city);
  }
}

function transformOpenMeteoResponse(city: CityLocation, raw: any, lang: Language): WeatherData {
  const currentRaw = raw.current || {};
  const hourlyRaw = raw.hourly || {};
  const dailyRaw = raw.daily || {};

  const currentTemp = Math.round(Number(currentRaw.temperature_2m ?? 20));
  const apparentTemp = Math.round(Number(currentRaw.apparent_temperature ?? currentTemp));
  const humidity = Math.round(Number(currentRaw.relative_humidity_2m ?? 50));

  // Calculate dew point if not supplied directly
  const dewPoint =
    typeof currentRaw.dew_point_2m === 'number'
      ? Math.round(currentRaw.dew_point_2m * 10) / 10
      : calculateDewPoint(currentTemp, humidity);

  // Hourly series projection across full 7 days (up to 168 hours)
  const hourlyTimes: string[] = hourlyRaw.time || [];
  const hourly: HourlyForecastItem[] = [];
  const totalHours = hourlyTimes.length;

  for (let idx = 0; idx < totalHours; idx++) {
    const timeStr = hourlyTimes[idx];
    const dateObj = new Date(timeStr);
    const hour = dateObj.getHours();
    const isHourDay = hour >= 6 && hour < 20;
    const datePart = timeStr.split('T')[0];

    hourly.push({
      time: timeStr,
      date: datePart,
      temperature: Math.round(Number(hourlyRaw.temperature_2m?.[idx] ?? currentTemp)),
      apparentTemperature: Math.round(Number(hourlyRaw.apparent_temperature?.[idx] ?? currentTemp)),
      precipitationProbability: Math.round(Number(hourlyRaw.precipitation_probability?.[idx] ?? 0)),
      precipitation: Math.round(Number(hourlyRaw.precipitation?.[idx] ?? 0) * 10) / 10,
      weatherCode: Number(hourlyRaw.weather_code?.[idx] ?? currentRaw.weather_code ?? 0),
      visibility: Math.round(Number(hourlyRaw.visibility?.[idx] ?? 10000) / 1000), // in km
      uvIndex: Math.round(Number(hourlyRaw.uv_index?.[idx] ?? 0) * 10) / 10,
      windSpeed: Math.round(Number(hourlyRaw.wind_speed_10m?.[idx] ?? 10)),
      windDirection: Math.round(Number(hourlyRaw.wind_direction_10m?.[idx] ?? 0)),
      isDay: isHourDay
    });
  }

  // Daily 7-day forecast series
  const dailyTimes: string[] = dailyRaw.time || [];
  const daily = [];
  const daysCount = Math.min(7, dailyTimes.length);
  const locale = lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US';

  for (let i = 0; i < daysCount; i++) {
    const dateStr = dailyTimes[i];
    const dateObj = new Date(dateStr);

    let dayName = dateObj.toLocaleDateString(locale, { weekday: 'short' });
    if (i === 0) {
      dayName = lang === 'ar' ? 'اليوم' : lang === 'fr' ? 'Aujourd’hui' : 'Today';
    }

    daily.push({
      date: dateStr,
      dayName,
      weatherCode: Number(dailyRaw.weather_code?.[i] ?? 0),
      minTemp: Math.round(Number(dailyRaw.temperature_2m_min?.[i] ?? currentTemp - 4)),
      maxTemp: Math.round(Number(dailyRaw.temperature_2m_max?.[i] ?? currentTemp + 4)),
      sunrise: dailyRaw.sunrise?.[i] || `${dateStr}T06:00`,
      sunset: dailyRaw.sunset?.[i] || `${dateStr}T19:30`,
      uvIndexMax: Math.round(Number(dailyRaw.uv_index_max?.[i] ?? 5)),
      precipitationProbabilityMax: Math.round(Number(dailyRaw.precipitation_probability_max?.[i] ?? 0)),
      precipitationSum: Math.round(Number(dailyRaw.precipitation_sum?.[i] ?? 0) * 10) / 10,
      windSpeedMax: Math.round(Number(dailyRaw.wind_speed_10m_max?.[i] ?? 15)),
      windGustsMax: Math.round(Number(dailyRaw.wind_gusts_10m_max?.[i] ?? 22))
    });
  }

  // Current UV and visibility approximation from first hourly interval
  const currentUV = hourly[0]?.uvIndex ?? (currentRaw.is_day === 1 ? 5 : 0);
  const currentVisibility = hourly[0]?.visibility ?? 10;

  return {
    city,
    current: {
      time: currentRaw.time || new Date().toISOString(),
      temperature: currentTemp,
      apparentTemperature: apparentTemp,
      relativeHumidity: humidity,
      dewPoint,
      precipitation: Math.round(Number(currentRaw.precipitation ?? 0) * 10) / 10,
      weatherCode: Number(currentRaw.weather_code ?? 0),
      cloudCover: Math.round(Number(currentRaw.cloud_cover ?? 20)),
      surfacePressure: Math.round(Number(currentRaw.surface_pressure ?? 1013)),
      windSpeed: Math.round(Number(currentRaw.wind_speed_10m ?? 12)),
      windDirection: Math.round(Number(currentRaw.wind_direction_10m ?? 0)),
      windGusts: Math.round(Number(currentRaw.wind_gusts_10m ?? 18)),
      uvIndex: currentUV,
      visibility: currentVisibility,
      isDay: currentRaw.is_day === 1
    },
    hourly,
    daily,
    lastUpdated: new Date().toISOString(),
    isOffline: false
  };
}

/**
 * Returns the 24-hour hourly forecast slice for any selected day index (0 to 6).
 * Handles date string mapping as well as boundary fallbacks.
 */
export function getHourlyForDay(weather: WeatherData, dayIndex: number = 0): HourlyForecastItem[] {
  if (!weather || !weather.hourly || weather.hourly.length === 0) {
    return [];
  }

  const safeDay = Math.max(0, Math.min(6, Math.floor(dayIndex)));

  // 1. Try to match by date from weather.daily
  const targetDaily = weather.daily?.[safeDay];
  if (targetDaily && targetDaily.date) {
    const targetDateStr = targetDaily.date.split('T')[0];
    const matched = weather.hourly.filter((item) => {
      if (item.date) return item.date === targetDateStr;
      return item.time.startsWith(targetDateStr);
    });

    if (matched.length > 0) {
      return matched.slice(0, 24);
    }
  }

  // 2. Fallback to 24-hour block slicing
  const blockStart = safeDay * 24;
  const slice = weather.hourly.slice(blockStart, blockStart + 24);
  if (slice.length > 0) {
    return slice;
  }

  // 3. Fallback to first 24 items
  return weather.hourly.slice(0, 24);
}

// ==========================================
// 2. GEOLOCATION & REVERSE GEOCODING
// ==========================================

export async function getUserCoordinates(timeoutMs: number = 8000): Promise<{ latitude: number; longitude: number }> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser environment');
  }

  return new Promise((resolve, reject) => {
    let hasResolved = false;

    const successHandler = (position: GeolocationPosition) => {
      if (hasResolved) return;
      hasResolved = true;
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      if (hasResolved) return;
      hasResolved = true;
      let msg = 'Unable to determine location';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          msg = 'Geolocation permission denied by user';
          break;
        case error.POSITION_UNAVAILABLE:
          msg = 'Location information is unavailable';
          break;
        case error.TIMEOUT:
          msg = 'Location request timed out';
          break;
      }
      reject(new Error(msg));
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 120000 // Accept positions up to 2 minutes old
    });
  });
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  lang: Language = 'en'
): Promise<CityLocation> {
  const localityLang = lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr' : 'en';

  // 1. Primary: Fast, no-auth BigDataCloud client reverse geocoding API
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${localityLang}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(bdcUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const cityName = data.city || data.locality || data.principalSubdivision || 'Current Location';
      return {
        id: `loc_${latitude.toFixed(3)}_${longitude.toFixed(3)}`,
        name: cityName,
        country: data.countryName || '',
        countryCode: data.countryCode || '',
        admin1: data.principalSubdivision || '',
        latitude,
        longitude,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto',
        isCurrentLocation: true
      };
    }
  } catch {
    // Continue to fallback
  }

  // 2. Secondary fallback: OpenStreetMap Nominatim reverse geocode
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${localityLang}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(osmUrl, {
      headers: { 'User-Agent': 'LiquidWeatherApp/2.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const cityName = addr.city || addr.town || addr.village || addr.suburb || 'Current Location';
      return {
        id: `loc_${latitude.toFixed(3)}_${longitude.toFixed(3)}`,
        name: cityName,
        country: addr.country || '',
        countryCode: addr.country_code ? addr.country_code.toUpperCase() : '',
        admin1: addr.state || addr.region || '',
        latitude,
        longitude,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto',
        isCurrentLocation: true
      };
    }
  } catch {
    // Continue to standard fallback
  }

  // 3. Fallback: Return clean CityLocation instance
  const defaultLabel = lang === 'ar' ? 'موقعي الحالي' : lang === 'fr' ? 'Ma position' : 'My Location';
  return {
    id: `loc_${latitude.toFixed(3)}_${longitude.toFixed(3)}`,
    name: defaultLabel,
    country: '',
    latitude,
    longitude,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto',
    isCurrentLocation: true
  };
}

export async function fetchCurrentLocationWeather(lang: Language = 'en'): Promise<WeatherData> {
  const coords = await getUserCoordinates();
  const city = await reverseGeocode(coords.latitude, coords.longitude, lang);
  return fetchWeatherData(city, lang);
}

// ==========================================
// 3. CITY AUTOCOMPLETE SEARCH
// ==========================================

export async function searchCities(
  query: string,
  lang: Language = 'en',
  signal?: AbortSignal
): Promise<CityLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // Match against default cities for instant local autocomplete
  const localMatches = DEFAULT_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      c.country.toLowerCase().includes(trimmed.toLowerCase())
  );

  const geocodingLang = lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr' : 'en';
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=12&language=${geocodingLang}&format=json`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return localMatches;

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return localMatches;
    }

    const remoteResults: CityLocation[] = data.results.map((item: any) => ({
      id: `${item.id || item.name}_${item.latitude}_${item.longitude}`,
      name: item.name,
      country: item.country || '',
      countryCode: item.country_code || '',
      admin1: item.admin1 || '',
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      timezone: item.timezone || 'auto'
    }));

    // Prioritize exact matching names at top
    remoteResults.sort((a, b) => {
      const aExact = a.name.toLowerCase() === trimmed.toLowerCase();
      const bExact = b.name.toLowerCase() === trimmed.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    return remoteResults;
  } catch (e: any) {
    if (e.name === 'AbortError') return [];
    console.warn('Error fetching remote geocoding search:', e);
    return localMatches;
  }
}

// ==========================================
// 4. UNIT CONVERSIONS & CALCULATIONS
// ==========================================

export function convertTemp(celsius: number, unit: TemperatureUnit): number {
  if (unit === 'f') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

export function formatTemp(celsius: number, unit: TemperatureUnit): string {
  return `${convertTemp(celsius, unit)}°`;
}

export function convertWindSpeed(
  kmh: number,
  unit: WindSpeedUnit
): { value: number; label: string; formatted: string } {
  switch (unit) {
    case 'mph': {
      const val = Math.round(kmh * 0.621371);
      return { value: val, label: 'mph', formatted: `${val} mph` };
    }
    case 'ms': {
      const val = Math.round((kmh / 3.6) * 10) / 10;
      return { value: val, label: 'm/s', formatted: `${val} m/s` };
    }
    case 'knots': {
      const val = Math.round(kmh * 0.539957);
      return { value: val, label: 'kn', formatted: `${val} kn` };
    }
    case 'kmh':
    default: {
      const val = Math.round(kmh);
      return { value: val, label: 'km/h', formatted: `${val} km/h` };
    }
  }
}

export function convertPressure(
  hpa: number,
  unit: PressureUnit
): { value: number; label: string; formatted: string } {
  switch (unit) {
    case 'inhg': {
      const val = Math.round(hpa * 0.02953 * 100) / 100;
      return { value: val, label: 'inHg', formatted: `${val.toFixed(2)} inHg` };
    }
    case 'mmhg': {
      const val = Math.round(hpa * 0.750062);
      return { value: val, label: 'mmHg', formatted: `${val} mmHg` };
    }
    case 'hpa':
    default: {
      const val = Math.round(hpa);
      return { value: val, label: 'hPa', formatted: `${val} hPa` };
    }
  }
}

export function convertVisibility(
  km: number,
  unit: VisibilityUnit
): { value: number; label: string; formatted: string } {
  if (unit === 'mi') {
    const val = Math.round(km * 0.621371 * 10) / 10;
    return { value: val, label: 'mi', formatted: `${val} mi` };
  }
  return { value: km, label: 'km', formatted: `${km} km` };
}

export function convertPrecipitation(
  mm: number,
  unit: PrecipitationUnit
): { value: number; label: string; formatted: string } {
  if (unit === 'inch') {
    const val = Math.round((mm / 25.4) * 100) / 100;
    return { value: val, label: 'in', formatted: `${val.toFixed(2)} in` };
  }
  return { value: mm, label: 'mm', formatted: `${mm} mm` };
}

/**
 * Magnus-Tetens approximation formula for dew point calculation
 */
export function calculateDewPoint(tempCelsius: number, relativeHumidity: number): number {
  const safeHumidity = Math.max(1, Math.min(100, relativeHumidity));
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempCelsius) / (b + tempCelsius) + Math.log(safeHumidity / 100);
  const dew = (b * alpha) / (a - alpha);
  return Math.round(dew * 10) / 10;
}

// ==========================================
// 5. LIQUID GLASS ARCHITECTURE STYLING
// ==========================================

/**
 * Dynamically applies Liquid Glass configuration custom properties to the document root element.
 * Updates --glass-blur, --glass-filter, --glass-bg, --glass-border, and --glass-shadow.
 */
export function applyGlassSettings(settings: GlassSettings): void {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const root = document.documentElement;

  const blur = Math.max(0, Math.min(40, settings.blur ?? 24));
  const opacityPct = Math.max(5, Math.min(60, settings.opacity ?? 22)) / 100;
  const tint = settings.tint || 'clear';
  const specular = settings.specularGlow ?? true;

  root.style.setProperty('--glass-blur', `${blur}px`);
  root.style.setProperty('--glass-filter', `blur(${blur}px) saturate(180%)`);

  let bgGradient = `linear-gradient(135deg, rgba(255, 255, 255, ${opacityPct.toFixed(3)}) 0%, rgba(255, 255, 255, ${(opacityPct * 0.25).toFixed(3)}) 100%)`;
  let borderAlpha = Math.min(0.65, opacityPct * 1.3);

  switch (tint) {
    case 'frosted':
      bgGradient = `linear-gradient(135deg, rgba(255, 255, 255, ${Math.min(0.75, opacityPct * 1.4).toFixed(3)}) 0%, rgba(220, 235, 255, ${(opacityPct * 0.45).toFixed(3)}) 100%)`;
      break;
    case 'deep':
      bgGradient = `linear-gradient(135deg, rgba(15, 23, 42, ${Math.min(0.88, opacityPct * 1.8).toFixed(3)}) 0%, rgba(30, 41, 59, ${(opacityPct * 1.1).toFixed(3)}) 100%)`;
      borderAlpha = Math.min(0.4, opacityPct * 0.8);
      break;
    case 'vibrant':
      bgGradient = `linear-gradient(135deg, rgba(56, 189, 248, ${(opacityPct * 0.9).toFixed(3)}) 0%, rgba(168, 85, 247, ${(opacityPct * 0.45).toFixed(3)}) 100%)`;
      break;
    case 'clear':
    default:
      break;
  }

  root.style.setProperty('--glass-bg', bgGradient);
  root.style.setProperty('--glass-border', `1px solid rgba(255, 255, 255, ${borderAlpha.toFixed(3)})`);

  if (specular) {
    root.style.setProperty(
      '--glass-shadow',
      '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1.5px 1px rgba(255, 255, 255, 0.65), inset 0 -1px 1px rgba(255, 255, 255, 0.15)'
    );
  } else {
    root.style.setProperty(
      '--glass-shadow',
      '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 0.5px 0.5px rgba(255, 255, 255, 0.2)'
    );
  }
}

// ==========================================
// 6. SAVED CITIES & SETTINGS STORAGE
// ==========================================

export function getUserSettings(): UserSettings {
  try {
    const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const combined: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        ...parsed,
        glassSettings: {
          ...DEFAULT_GLASS_SETTINGS,
          ...(parsed.glassSettings || {})
        }
      };
      // Rehydrate glass styling to DOM
      if (typeof window !== 'undefined' && combined.glassSettings) {
        applyGlassSettings(combined.glassSettings);
      }
      return combined;
    }
  } catch (e) {
    console.warn('Error reading user settings:', e);
  }

  if (typeof window !== 'undefined') {
    applyGlassSettings(DEFAULT_GLASS_SETTINGS);
  }
  return DEFAULT_USER_SETTINGS;
}

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  const current = getUserSettings();
  const currentGlass = current.glassSettings || DEFAULT_GLASS_SETTINGS;
  const updatedGlass: GlassSettings = {
    ...currentGlass,
    ...(settings.glassSettings || {})
  };
  const updated: UserSettings = {
    ...current,
    ...settings,
    glassSettings: updatedGlass
  };
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
    applyGlassSettings(updatedGlass);
  } catch (e) {
    console.warn('Error saving user settings:', e);
  }
  return updated;
}

export function getSavedCities(): SavedCity[] {
  try {
    const saved = localStorage.getItem(STORAGE_SAVED_CITIES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading saved cities:', e);
  }

  // Pre-seeded favorite cities
  return [
    { ...DEFAULT_CITIES[0], currentTemp: 19, weatherCode: 1, isDay: true },
    { ...DEFAULT_CITIES[1], currentTemp: 22, weatherCode: 0, isDay: true },
    { ...DEFAULT_CITIES[2], currentTemp: 16, weatherCode: 2, isDay: false },
    { ...DEFAULT_CITIES[3], currentTemp: 32, weatherCode: 0, isDay: true }
  ];
}

export function saveCityToStorage(city: SavedCity): SavedCity[] {
  const current = getSavedCities();
  const exists = current.some(
    (c) =>
      Math.abs(c.latitude - city.latitude) < 0.05 &&
      Math.abs(c.longitude - city.longitude) < 0.05
  );
  const updated = exists ? current : [city, ...current];
  try {
    localStorage.setItem(STORAGE_SAVED_CITIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving city to storage:', e);
  }
  return updated;
}

export function removeCityFromStorage(cityId: string | number): SavedCity[] {
  const current = getSavedCities();
  const updated = current.filter((c) => String(c.id) !== String(cityId));
  try {
    localStorage.setItem(STORAGE_SAVED_CITIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error removing city from storage:', e);
  }
  return updated;
}

export function updateSavedCityWeather(
  cityId: string | number,
  currentTemp: number,
  weatherCode: number,
  isDay: boolean
): SavedCity[] {
  const current = getSavedCities();
  const updated = current.map((c) => {
    if (String(c.id) === String(cityId)) {
      return {
        ...c,
        currentTemp,
        weatherCode,
        isDay,
        lastRefreshed: new Date().toISOString()
      };
    }
    return c;
  });

  try {
    localStorage.setItem(STORAGE_SAVED_CITIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error updating saved city weather:', e);
  }
  return updated;
}

// ==========================================
// 7. CACHE MANAGEMENT & EVICTION
// ==========================================

function getCacheEntry<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.timestamp === 'number' && parsed.data) {
      return parsed as CacheEntry<T>;
    }
  } catch {
    return null;
  }
  return null;
}

function setCacheEntry<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    version: CACHE_VERSION
  };

  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // QuotaExceededError recovery: purge older weather cache keys
    pruneOldCaches();
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Storage unavailable, ignore
    }
  }
}

function pruneOldCaches(): void {
  try {
    const cacheKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_CACHE_KEY_PREFIX)) {
        cacheKeys.push(k);
      }
    }
    // Remove oldest half of entries
    cacheKeys.slice(0, Math.ceil(cacheKeys.length / 2)).forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ==========================================
// 8. REALISTIC FALLBACK METEOROLOGICAL GENERATOR (FULL 7 DAYS)
// ==========================================

function generateFallbackWeatherData(city: CityLocation): WeatherData {
  const now = new Date();
  const currentHour = now.getHours();
  const isDay = currentHour >= 6 && currentHour < 20;

  // Generate 7-day hourly projections (168 hours)
  const hourly: HourlyForecastItem[] = [];
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(startOfDay.getTime() + d * 86400000);
    const dateStr = dayDate.toISOString().split('T')[0];

    for (let h = 0; h < 24; h++) {
      const pointTime = new Date(dayDate.getTime() + h * 3600000);
      const isHourDay = h >= 6 && h < 20;
      const diurnalShift = Math.sin(((h - 8) / 24) * Math.PI * 2) * 5;
      const dayBaseTemp = 18 + (d % 3);
      const temp = Math.round(dayBaseTemp + diurnalShift);

      hourly.push({
        time: pointTime.toISOString(),
        date: dateStr,
        temperature: temp,
        apparentTemperature: temp + 1,
        precipitationProbability: Math.max(0, Math.round(Math.sin((h + d) / 3) * 35)),
        precipitation: (h === 14 && d % 2 === 1) ? 1.2 : 0,
        weatherCode: d % 2 === 0 ? 1 : 2,
        visibility: 10,
        uvIndex: h >= 10 && h <= 16 ? Math.round(6 - Math.abs(13 - h) * 1.5) : 0,
        windSpeed: 10 + (h % 5),
        windDirection: 210 + ((d * 10) % 90),
        isDay: isHourDay
      });
    }
  }

  const daily = [];
  const days = ['Today', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    daily.push({
      date: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : days[d.getDay()],
      weatherCode: i % 2 === 0 ? 0 : 2,
      minTemp: 14 + (i % 3),
      maxTemp: 23 + (i % 4),
      sunrise: `${d.toISOString().split('T')[0]}T06:30`,
      sunset: `${d.toISOString().split('T')[0]}T19:45`,
      uvIndexMax: 6,
      precipitationProbabilityMax: 20,
      precipitationSum: 0,
      windSpeedMax: 16,
      windGustsMax: 24
    });
  }

  return {
    city,
    current: {
      time: now.toISOString(),
      temperature: 20,
      apparentTemperature: 21,
      relativeHumidity: 65,
      dewPoint: 13.2,
      precipitation: 0,
      weatherCode: 1,
      cloudCover: 25,
      surfacePressure: 1014,
      windSpeed: 14,
      windDirection: 215,
      windGusts: 22,
      uvIndex: isDay ? 5 : 0,
      visibility: 10,
      isDay
    },
    hourly,
    daily,
    lastUpdated: now.toISOString(),
    isOffline: true
  };
}
