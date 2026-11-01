export type TemperatureUnit = 'c' | 'f';
export type WindSpeedUnit = 'kmh' | 'mph' | 'ms' | 'knots';
export type PressureUnit = 'hpa' | 'inhg' | 'mmhg';
export type PrecipitationUnit = 'mm' | 'inch';
export type VisibilityUnit = 'km' | 'mi';
export type Language = 'en' | 'ar' | 'fr';
export type ShowcaseMode = 'live' | 'sunny' | 'rain' | 'thunderstorm' | 'snow' | 'night';

export type GlassTint = 'clear' | 'frosted' | 'deep' | 'vibrant';

export interface GlassSettings {
  blur: number; // default: 24, range 0-40
  opacity: number; // default: 22, range 5-60
  tint: GlassTint; // default: 'clear'
  specularGlow: boolean; // default: true
}

export interface UserSettings {
  tempUnit: TemperatureUnit;
  windUnit: WindSpeedUnit;
  pressureUnit: PressureUnit;
  language: Language;
  showcaseMode: ShowcaseMode;
  precipitationUnit?: PrecipitationUnit;
  visibilityUnit?: VisibilityUnit;
  glassSettings: GlassSettings;
}

export interface CityLocation {
  id: number | string;
  name: string;
  country: string;
  countryCode?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isCurrentLocation?: boolean;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  dewPoint: number;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  surfacePressure: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  uvIndex: number;
  visibility: number;
  isDay: boolean;
}

export interface HourlyForecastItem {
  time: string;
  date?: string; // YYYY-MM-DD for indexing across all 7 days
  temperature: number;
  apparentTemperature?: number;
  precipitationProbability: number;
  precipitation?: number;
  weatherCode: number;
  visibility: number;
  uvIndex: number;
  windSpeed?: number;
  windDirection?: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  weatherCode: number;
  minTemp: number;
  maxTemp: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
  precipitationProbabilityMax: number;
  precipitationSum?: number;
  windSpeedMax?: number;
  windGustsMax?: number;
}

export interface WeatherData {
  city: CityLocation;
  current: CurrentWeather;
  hourly: HourlyForecastItem[]; // full 7-day hourly projections (up to 168 hours)
  daily: DailyForecastItem[];
  lastUpdated: string;
  isOffline?: boolean;
  cachedAt?: number;
}

export interface SavedCity extends CityLocation {
  currentTemp?: number;
  weatherCode?: number;
  isDay?: boolean;
  lastRefreshed?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

export interface GeolocationState {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}
