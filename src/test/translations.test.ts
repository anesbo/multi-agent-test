import { describe, it, expect } from 'vitest';
import { translations, getWeatherConditionDescription } from '../i18n/translations';
import type { Language } from '../types/weather';

describe('translations and i18n Unit Tests', () => {
  const languages: Language[] = ['en', 'ar', 'fr'];

  it('contains comprehensive translation keys across all 3 languages', () => {
    const requiredKeys: (keyof typeof translations.en)[] = [
      'appName',
      'searchPlaceholder',
      'searchCity',
      'noResults',
      'useMyLocation',
      'locating',
      'savedCities',
      'saveCity',
      'removeCity',
      'hourlyForecast',
      'dailyForecast',
      'windTitle',
      'sunTracker',
      'uvIndex',
      'humidityTitle',
      'pressureTitle',
      'settingsTitle',
      'units',
      'temperature',
      'language',
      'showcaseMode',
      'showcaseLive',
      'showcaseSunny',
      'showcaseRain',
      'showcaseThunder',
      'showcaseSnow',
      'showcaseNight',
    ];

    languages.forEach((lang) => {
      const dict = translations[lang];
      expect(dict).toBeDefined();
      requiredKeys.forEach((key) => {
        expect(dict[key], `Missing translation for key "${key}" in language "${lang}"`).toBeDefined();
        expect(typeof dict[key]).toBe('string');
        expect(dict[key].length).toBeGreaterThan(0);
      });
    });
  });

  describe('getWeatherConditionDescription', () => {
    it('returns Sunny / Clear correctly for code 0 based on isDay', () => {
      expect(getWeatherConditionDescription(0, true, 'en')).toBe('Sunny');
      expect(getWeatherConditionDescription(0, false, 'en')).toBe('Clear');

      expect(getWeatherConditionDescription(0, true, 'ar')).toBe('مشمس');
      expect(getWeatherConditionDescription(0, false, 'ar')).toBe('صافٍ');

      expect(getWeatherConditionDescription(0, true, 'fr')).toBe('Ensoleillé');
      expect(getWeatherConditionDescription(0, false, 'fr')).toBe('Nuit claire');
    });

    it('returns Thunderstorm for code 95', () => {
      expect(getWeatherConditionDescription(95, true, 'en')).toBe('Thunderstorm');
      expect(getWeatherConditionDescription(95, true, 'ar')).toBe('عاصفة رعدية');
      expect(getWeatherConditionDescription(95, true, 'fr')).toBe('Orage');
    });

    it('returns Rain for code 61', () => {
      expect(getWeatherConditionDescription(61, true, 'en')).toBe('Rain');
      expect(getWeatherConditionDescription(61, true, 'ar')).toBe('ماطر');
      expect(getWeatherConditionDescription(61, true, 'fr')).toBe('Pluie');
    });

    it('returns Snow for code 71', () => {
      expect(getWeatherConditionDescription(71, true, 'en')).toBe('Snow');
      expect(getWeatherConditionDescription(71, true, 'ar')).toBe('ثلوج');
      expect(getWeatherConditionDescription(71, true, 'fr')).toBe('Neige');
    });
  });
});
