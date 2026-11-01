import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  convertTemp,
  formatTemp,
  convertWindSpeed,
  convertPressure,
  getSavedCities,
  saveCityToStorage,
  removeCityFromStorage,
  searchCities,
  fetchWeatherData,
  DEFAULT_CITIES,
  getHourlyForDay,
  applyGlassSettings,
  getUserSettings,
  saveUserSettings,
} from '../services/weatherService';
import type { CityLocation, SavedCity, WeatherData, GlassSettings } from '../types/weather';

describe('weatherService Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Temperature conversion', () => {
    it('converts Celsius correctly', () => {
      expect(convertTemp(20, 'c')).toBe(20);
      expect(convertTemp(0, 'c')).toBe(0);
      expect(convertTemp(-5, 'c')).toBe(-5);
    });

    it('converts Fahrenheit correctly', () => {
      expect(convertTemp(0, 'f')).toBe(32);
      expect(convertTemp(20, 'f')).toBe(68);
      expect(convertTemp(100, 'f')).toBe(212);
      expect(convertTemp(-10, 'f')).toBe(14);
    });

    it('formats temperature with degree symbol', () => {
      expect(formatTemp(23, 'c')).toBe('23°');
      expect(formatTemp(23, 'f')).toBe('73°');
    });
  });

  describe('Wind speed conversion', () => {
    it('converts km/h correctly', () => {
      const res = convertWindSpeed(36, 'kmh');
      expect(res.value).toBe(36);
      expect(res.label).toBe('km/h');
    });

    it('converts mph correctly', () => {
      const res = convertWindSpeed(100, 'mph');
      expect(res.value).toBe(62);
      expect(res.label).toBe('mph');
    });

    it('converts m/s correctly', () => {
      const res = convertWindSpeed(36, 'ms');
      expect(res.value).toBe(10);
      expect(res.label).toBe('m/s');
    });
  });

  describe('Pressure conversion', () => {
    it('formats hPa correctly', () => {
      const res = convertPressure(1013, 'hpa');
      expect(res.value).toBe(1013);
      expect(res.label).toBe('hPa');
    });

    it('converts inHg correctly', () => {
      const res = convertPressure(1013, 'inhg');
      expect(res.value).toBeCloseTo(29.91, 1);
      expect(res.label).toBe('inHg');
    });
  });

  describe('Saved Cities Storage', () => {
    it('returns default cities when storage is empty', () => {
      const cities = getSavedCities();
      expect(cities.length).toBeGreaterThan(0);
      expect(cities[0].name).toBe('Paris');
    });

    it('saves a new city and avoids duplicate addition', () => {
      const newCity: SavedCity = {
        id: 'cairo',
        name: 'Cairo',
        country: 'Egypt',
        latitude: 30.0444,
        longitude: 31.2357,
        timezone: 'Africa/Cairo',
        currentTemp: 28,
      };

      const updated = saveCityToStorage(newCity);
      expect(updated[0].name).toBe('Cairo');

      // Adding the same city again should not duplicate it
      const secondAttempt = saveCityToStorage(newCity);
      const cairoMatches = secondAttempt.filter(
        (c) => Math.abs(c.latitude - 30.0444) < 0.01
      );
      expect(cairoMatches.length).toBe(1);
    });

    it('removes a saved city by ID', () => {
      const initial = getSavedCities();
      const firstId = initial[0].id;
      const updated = removeCityFromStorage(firstId);
      expect(updated.some((c) => c.id === firstId)).toBe(false);
    });
  });

  describe('searchCities', () => {
    it('returns empty array if query has fewer than 2 characters', async () => {
      const result = await searchCities('a');
      expect(result).toEqual([]);
    });

    it('fetches matching cities from geocoding API', async () => {
      const mockApiResponse = {
        results: [
          {
            id: 1,
            name: 'London',
            country: 'United Kingdom',
            admin1: 'England',
            latitude: 51.5074,
            longitude: -0.1278,
            timezone: 'Europe/London',
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const cities = await searchCities('London', 'en');
      expect(cities.length).toBe(1);
      expect(cities[0].name).toBe('London');
      expect(cities[0].country).toBe('United Kingdom');
    });

    it('returns empty array on network failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      const result = await searchCities('Rome');
      expect(result).toEqual([]);
    });
  });

  describe('fetchWeatherData', () => {
    const testCity: CityLocation = DEFAULT_CITIES[0];

    it('returns realistic fallback weather when network fails and no cache exists', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Fetch failed'));

      const weather = await fetchWeatherData(testCity, 'en');
      expect(weather).toBeDefined();
      expect(weather.city.name).toBe(testCity.name);
      expect(weather.current).toBeDefined();
      expect(weather.hourly.length).toBe(168); // 7 days * 24 hours
      expect(weather.daily.length).toBe(7);
      expect(weather.isOffline).toBe(true);
    });

    it('transforms real Open-Meteo payload structure correctly', async () => {
      const nowISO = new Date().toISOString();
      const mockCurrent = {
        time: nowISO,
        temperature_2m: 22.4,
        apparent_temperature: 21.8,
        relative_humidity_2m: 55,
        precipitation: 0,
        weather_code: 1,
        cloud_cover: 20,
        surface_pressure: 1016,
        wind_speed_10m: 12,
        wind_direction_10m: 180,
        wind_gusts_10m: 18,
        is_day: 1,
      };

      const mockHourly = {
        time: Array.from({ length: 24 }, (_, i) => new Date(Date.now() + i * 3600000).toISOString()),
        temperature_2m: Array(24).fill(22),
        precipitation_probability: Array(24).fill(10),
        weather_code: Array(24).fill(1),
        visibility: Array(24).fill(10000),
        uv_index: Array(24).fill(4),
      };

      const mockDaily = {
        time: ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'],
        weather_code: [1, 2, 0, 3, 61, 1, 0],
        temperature_2m_max: [24, 23, 25, 21, 18, 20, 22],
        temperature_2m_min: [14, 13, 15, 12, 10, 11, 12],
        sunrise: Array(7).fill('2026-11-01T06:30'),
        sunset: Array(7).fill('2026-11-01T19:45'),
        uv_index_max: Array(7).fill(5),
        precipitation_probability_max: Array(7).fill(15),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: mockCurrent,
          hourly: mockHourly,
          daily: mockDaily,
        }),
      } as Response);

      const weather = await fetchWeatherData(testCity, 'en');
      expect(weather.current.temperature).toBe(22);
      expect(weather.current.weatherCode).toBe(1);
      expect(weather.current.isDay).toBe(true);
      expect(weather.hourly.length).toBe(24);
      expect(weather.daily.length).toBe(7);
      expect(weather.isOffline).toBe(false);
    });
  });

  describe('getHourlyForDay', () => {
    // Generate a 7-day realistic weather data object with 168 hours (24h * 7 days)
    const create7DayWeatherData = (): WeatherData => {
      const dates = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'];
      const hourly = [];

      for (let day = 0; day < 7; day++) {
        for (let h = 0; h < 24; h++) {
          const hourStr = String(h).padStart(2, '0');
          hourly.push({
            time: `${dates[day]}T${hourStr}:00:00`,
            date: dates[day],
            temperature: 15 + day + (h % 5),
            precipitationProbability: day * 5,
            weatherCode: day % 2 === 0 ? 0 : 2,
            visibility: 10,
            uvIndex: h >= 10 && h <= 15 ? 5 : 0,
            isDay: h >= 6 && h < 20,
          });
        }
      }

      return {
        city: DEFAULT_CITIES[0],
        current: {
          time: '2026-11-01T12:00:00',
          temperature: 18,
          apparentTemperature: 18,
          relativeHumidity: 60,
          dewPoint: 10,
          precipitation: 0,
          weatherCode: 0,
          cloudCover: 10,
          surfacePressure: 1015,
          windSpeed: 10,
          windDirection: 180,
          windGusts: 15,
          uvIndex: 4,
          visibility: 10,
          isDay: true,
        },
        hourly,
        daily: dates.map((d, idx) => ({
          date: d,
          dayName: idx === 0 ? 'Today' : `Day ${idx}`,
          weatherCode: idx % 2 === 0 ? 0 : 2,
          minTemp: 12 + idx,
          maxTemp: 22 + idx,
          sunrise: `${d}T06:30`,
          sunset: `${d}T19:30`,
          uvIndexMax: 5,
          precipitationProbabilityMax: 10,
        })),
        lastUpdated: new Date().toISOString(),
      };
    };

    it('retrieves the correct 24h slice for each day from day 0 through day 6', () => {
      const weather = create7DayWeatherData();
      const dates = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'];

      for (let dayIndex = 0; dayIndex <= 6; dayIndex++) {
        const slice = getHourlyForDay(weather, dayIndex);
        expect(slice.length).toBe(24);
        // All 24 hours in the slice belong to that day's date
        slice.forEach((hourItem) => {
          expect(hourItem.time.startsWith(dates[dayIndex])).toBe(true);
        });
      }
    });

    it('safely handles out of range day indexes by clamping', () => {
      const weather = create7DayWeatherData();
      const negativeDay = getHourlyForDay(weather, -2);
      expect(negativeDay.length).toBe(24);
      expect(negativeDay[0].time.startsWith('2026-11-01')).toBe(true);

      const highDay = getHourlyForDay(weather, 15);
      expect(highDay.length).toBe(24);
      expect(highDay[0].time.startsWith('2026-11-07')).toBe(true);
    });

    it('returns empty array when weather has no hourly data', () => {
      const emptyWeather = { ...create7DayWeatherData(), hourly: [] };
      expect(getHourlyForDay(emptyWeather, 0)).toEqual([]);
    });
  });

  describe('applyGlassSettings', () => {
    it('sets CSS variables on documentElement without throwing errors', () => {
      const testSettings: GlassSettings = {
        blur: 30,
        opacity: 35,
        tint: 'frosted',
        specularGlow: true,
      };

      expect(() => applyGlassSettings(testSettings)).not.toThrow();
      expect(document.documentElement.style.getPropertyValue('--glass-blur')).toBe('30px');
      expect(document.documentElement.style.getPropertyValue('--glass-filter')).toBe('blur(30px) saturate(180%)');
      expect(document.documentElement.style.getPropertyValue('--glass-bg')).toContain('rgba(255, 255, 255');
      expect(document.documentElement.style.getPropertyValue('--glass-shadow')).toContain('inset');
    });

    it('correctly adapts background and border for various glass tints', () => {
      const tints: ('clear' | 'frosted' | 'deep' | 'vibrant')[] = ['clear', 'frosted', 'deep', 'vibrant'];

      tints.forEach((tint) => {
        expect(() =>
          applyGlassSettings({
            blur: 24,
            opacity: 25,
            tint,
            specularGlow: true,
          })
        ).not.toThrow();

        const bg = document.documentElement.style.getPropertyValue('--glass-bg');
        expect(bg).toBeDefined();
        expect(bg.length).toBeGreaterThan(0);
      });
    });

    it('disables specular inset highlights when specularGlow is false', () => {
      applyGlassSettings({
        blur: 16,
        opacity: 20,
        tint: 'clear',
        specularGlow: false,
      });

      const shadow = document.documentElement.style.getPropertyValue('--glass-shadow');
      expect(shadow).toContain('0 8px 24px');
    });
  });

  describe('Settings persistence for glassSettings', () => {
    it('returns default glass settings when none are stored', () => {
      const settings = getUserSettings();
      expect(settings.glassSettings).toBeDefined();
      expect(settings.glassSettings.blur).toBe(24);
      expect(settings.glassSettings.opacity).toBe(22);
      expect(settings.glassSettings.tint).toBe('clear');
      expect(settings.glassSettings.specularGlow).toBe(true);
    });

    it('persists and rehydrates custom glass settings', () => {
      const customGlass: GlassSettings = {
        blur: 36,
        opacity: 45,
        tint: 'deep',
        specularGlow: false,
      };

      const saved = saveUserSettings({ glassSettings: customGlass });
      expect(saved.glassSettings.blur).toBe(36);
      expect(saved.glassSettings.tint).toBe('deep');

      // Rehydrate
      const rehydrated = getUserSettings();
      expect(rehydrated.glassSettings.blur).toBe(36);
      expect(rehydrated.glassSettings.opacity).toBe(45);
      expect(rehydrated.glassSettings.tint).toBe('deep');
      expect(rehydrated.glassSettings.specularGlow).toBe(false);

      // Verify DOM reflects saved glass settings
      expect(document.documentElement.style.getPropertyValue('--glass-blur')).toBe('36px');
    });
  });
});
