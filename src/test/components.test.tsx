import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import CanvasBackground from '../components/CanvasBackground';
import { HeroWeather } from '../components/HeroWeather';
import { CitySearch } from '../components/CitySearch';
import { SettingsModal } from '../components/SettingsModal';
import { FloatingBar } from '../components/FloatingBar';
import { HourlyRibbon } from '../components/HourlyRibbon';
import { WeeklyForecast } from '../components/WeeklyForecast';
import { CompassCard } from '../components/CompassCard';
import { HumidityCard } from '../components/HumidityCard';
import { PressureCard } from '../components/PressureCard';
import { SunTrackerCard } from '../components/SunTrackerCard';

import type { WeatherData, UserSettings } from '../types/weather';

const mockWeatherData: WeatherData = {
  city: {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    admin1: 'Île-de-France',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: 'Europe/Paris',
  },
  current: {
    time: '2026-11-01T12:00:00Z',
    temperature: 21,
    apparentTemperature: 22,
    relativeHumidity: 60,
    dewPoint: 13,
    precipitation: 0,
    weatherCode: 0, // Sunny
    cloudCover: 10,
    surfacePressure: 1015,
    windSpeed: 14,
    windDirection: 220,
    windGusts: 20,
    uvIndex: 4,
    visibility: 10,
    isDay: true,
  },
  hourly: Array.from({ length: 24 }, (_, i) => ({
    time: `2026-11-01T${String(i).padStart(2, '0')}:00:00Z`,
    temperature: 18 + (i % 5),
    precipitationProbability: i * 2,
    weatherCode: 1,
    visibility: 10,
    uvIndex: 4,
    isDay: i >= 6 && i < 20,
  })),
  daily: [
    {
      date: '2026-11-01',
      dayName: 'Today',
      weatherCode: 0,
      minTemp: 14,
      maxTemp: 24,
      sunrise: '2026-11-01T06:45',
      sunset: '2026-11-01T18:30',
      uvIndexMax: 6,
      precipitationProbabilityMax: 10,
    },
    {
      date: '2026-11-02',
      dayName: 'Mon',
      weatherCode: 1,
      minTemp: 13,
      maxTemp: 22,
      sunrise: '2026-11-02T06:46',
      sunset: '2026-11-02T18:28',
      uvIndexMax: 5,
      precipitationProbabilityMax: 20,
    },
  ],
  lastUpdated: new Date().toISOString(),
  isOffline: false,
};

const mockSettings: UserSettings = {
  tempUnit: 'c',
  windUnit: 'kmh',
  pressureUnit: 'hpa',
  language: 'en',
  showcaseMode: 'live',
  glassSettings: {
    blur: 24,
    opacity: 22,
    tint: 'clear',
    specularGlow: true,
  },
};

describe('Component Integration Tests', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  describe('HeroWeather', () => {
    it('renders city name, temperature, and high/low values', () => {
      act(() => {
        root.render(
          <HeroWeather
            weather={mockWeatherData}
            tempUnit="c"
            lang="en"
          />
        );
      });

      expect(container.textContent).toContain('Paris');
      expect(container.textContent).toContain('21°');
      expect(container.textContent).toContain('24°'); // High
      expect(container.textContent).toContain('14°'); // Low
    });

    it('displays condition in Arabic and reflects temperature in Fahrenheit', () => {
      act(() => {
        root.render(
          <HeroWeather
            weather={mockWeatherData}
            tempUnit="f"
            lang="ar"
          />
        );
      });

      expect(container.textContent).toContain('Paris');
      expect(container.textContent).toContain('70°'); // 21C in F is 70F
      expect(container.textContent).toContain('مشمس'); // Sunny in Arabic
    });
  });

  describe('CitySearch', () => {
    it('renders search input with placeholder', () => {
      act(() => {
        root.render(
          <CitySearch
            onSelectCity={() => {}}
            lang="en"
          />
        );
      });

      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      expect(input?.getAttribute('placeholder')).toContain('Search for a city');
    });
  });

  describe('SettingsModal', () => {
    it('renders unit and language settings when open', () => {
      act(() => {
        root.render(
          <SettingsModal
            isOpen={true}
            onClose={() => {}}
            settings={mockSettings}
            onUpdateSettings={() => {}}
            savedCities={[]}
            onSelectCity={() => {}}
            onRemoveSavedCity={() => {}}
            onUseMyLocation={() => {}}
          />
        );
      });

      expect(container.textContent).toContain('Settings & Display');
      expect(container.textContent).toContain('English');
      expect(container.textContent).toContain('العربية');
      expect(container.textContent).toContain('Français');
      expect(container.textContent).toContain('Measurement Units');
      expect(container.textContent).toContain('Atmosphere Engine Override');
    });

    it('sets dir="rtl" on document element when Arabic is selected', () => {
      act(() => {
        root.render(
          <SettingsModal
            isOpen={true}
            onClose={() => {}}
            settings={{ ...mockSettings, language: 'ar' }}
            onUpdateSettings={() => {}}
            savedCities={[]}
            onSelectCity={() => {}}
            onRemoveSavedCity={() => {}}
            onUseMyLocation={() => {}}
          />
        );
      });

      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');
    });
  });

  describe('FloatingBar', () => {
    it('renders quick action buttons and fires callbacks', () => {
      const handleOpenSearch = vi.fn();
      const handleOpenSettings = vi.fn();
      const handleRefresh = vi.fn();

      act(() => {
        root.render(
          <FloatingBar
            onOpenSearch={handleOpenSearch}
            onOpenSettings={handleOpenSettings}
            onUseMyLocation={() => {}}
            onRefresh={handleRefresh}
            showcaseMode="live"
            lang="en"
          />
        );
      });

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(4);

      // Click search
      act(() => {
        buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(handleOpenSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bento Cards integration', () => {
    it('renders HourlyRibbon without error', () => {
      act(() => {
        root.render(
          <HourlyRibbon
            hourly={mockWeatherData.hourly}
            tempUnit="c"
            language="en"
          />
        );
      });
      expect(container.textContent).toContain('24-HOUR FORECAST');
    });

    it('renders WeeklyForecast without error', () => {
      act(() => {
        root.render(
          <WeeklyForecast
            daily={mockWeatherData.daily}
            currentTemp={21}
            tempUnit="c"
            language="en"
          />
        );
      });
      expect(container.textContent).toContain('7-DAY FORECAST');
    });

    it('renders CompassCard without error', () => {
      act(() => {
        root.render(
          <CompassCard
            windSpeed={mockWeatherData.current.windSpeed}
            windDirection={mockWeatherData.current.windDirection}
            windGusts={mockWeatherData.current.windGusts}
            unit="kmh"
            language="en"
          />
        );
      });
      expect(container.textContent).toContain('WIND & GUSTS');
      expect(container.textContent).toContain('14');
    });

    it('renders HumidityCard without error', () => {
      act(() => {
        root.render(
          <HumidityCard
            humidity={mockWeatherData.current.relativeHumidity}
            temperature={mockWeatherData.current.temperature}
            tempUnit="c"
            language="en"
          />
        );
      });
      expect(container.textContent).toContain('HUMIDITY');
      expect(container.textContent).toContain('60%');
    });

    it('renders PressureCard without error', () => {
      act(() => {
        root.render(
          <PressureCard
            pressure={mockWeatherData.current.surfacePressure}
            pressureUnit="hpa"
            visibility={10}
            apparentTemperature={22}
            currentTemperature={21}
            tempUnit="c"
            language="en"
          />
        );
      });
      expect(container.textContent).toContain('PRESSURE');
      expect(container.textContent).toContain('1015');
    });

    it('renders SunTrackerCard without error', () => {
      act(() => {
        root.render(
          <SunTrackerCard
            sunrise={mockWeatherData.daily[0].sunrise}
            sunset={mockWeatherData.daily[0].sunset}
            uvIndex={mockWeatherData.daily[0].uvIndexMax}
            currentTime="2026-11-01T12:00:00"
            language="en"
          />
        );
      });
      expect(container.textContent).toContain('SUN TRACKER');
    });

    it('renders CanvasBackground with canvas element and handles scene changes', () => {
      act(() => {
        root.render(
          <CanvasBackground
            weatherCode={0}
            isDay={true}
            showcaseMode="live"
          />
        );
      });

      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      expect(canvas?.style.display).toBe('block');
      expect(canvas?.style.width).toBe('100%');
      expect(canvas?.style.height).toBe('100%');

      // Test scene change to rain
      act(() => {
        root.render(
          <CanvasBackground
            weatherCode={61}
            isDay={false}
            showcaseMode="rain"
          />
        );
      });
      expect(container.querySelector('canvas')).not.toBeNull();

      // Test scene change to thunderstorm
      act(() => {
        root.render(
          <CanvasBackground
            weatherCode={95}
            isDay={false}
            showcaseMode="thunderstorm"
          />
        );
      });
      expect(container.querySelector('canvas')).not.toBeNull();

      // Test scene change to snow
      act(() => {
        root.render(
          <CanvasBackground
            weatherCode={71}
            isDay={true}
            showcaseMode="snow"
          />
        );
      });
      expect(container.querySelector('canvas')).not.toBeNull();
    });

    it('invokes onSelectDay(index) upon day click in WeeklyForecast with active state styling', () => {
      const handleSelectDay = vi.fn();
      act(() => {
        root.render(
          <WeeklyForecast
            daily={mockWeatherData.daily}
            currentTemp={21}
            tempUnit="c"
            language="en"
            selectedDayIndex={1}
            onSelectDay={handleSelectDay}
          />
        );
      });

      const dayRows = container.querySelectorAll('.cursor-pointer');
      expect(dayRows.length).toBe(mockWeatherData.daily.length);

      // Day 1 is selected: verify it has active border styling (border-white/50)
      expect(dayRows[1].className).toContain('border-white/50');

      // Day 0 is not selected: verify it has border-transparent
      expect(dayRows[0].className).toContain('border-transparent');

      // Click on Day 0
      act(() => {
        dayRows[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(handleSelectDay).toHaveBeenCalledWith(0);
    });

    it('displays day title and hourly predictions for selected day in HourlyRibbon', () => {
      act(() => {
        root.render(
          <HourlyRibbon
            hourly={mockWeatherData.hourly}
            tempUnit="c"
            language="en"
            selectedDayIndex={1}
            selectedDayName="Mon"
            onResetToToday={() => {}}
          />
        );
      });

      // Header displays selected day name
      expect(container.textContent).toContain('Mon');

      // Predictions display temperatures
      expect(container.textContent).toContain('°');

      // Reset button should exist when selected day is not today
      const resetButton = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Today') || btn.getAttribute('title')?.includes('Today')
      );
      expect(resetButton).toBeDefined();
    });

    it('renders glass effect customization controls and allows changing blur, opacity, and tint in SettingsModal', () => {
      const handleUpdateSettings = vi.fn();
      act(() => {
        root.render(
          <SettingsModal
            isOpen={true}
            onClose={() => {}}
            settings={mockSettings}
            onUpdateSettings={handleUpdateSettings}
            savedCities={[]}
            onSelectCity={() => {}}
            onRemoveSavedCity={() => {}}
            onUseMyLocation={() => {}}
          />
        );
      });

      expect(container.textContent).toContain('Liquid Glass Appearance');
      expect(container.textContent).toContain('Glass Blur');
      expect(container.textContent).toContain('Glass Opacity');
      expect(container.textContent).toContain('Glass Tint & Opacity');

      // 1. Change blur preset (e.g. 36px)
      const blur36Btn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('36px')
      );
      expect(blur36Btn).toBeDefined();
      act(() => {
        blur36Btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(handleUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          glassSettings: expect.objectContaining({ blur: 36 }),
        })
      );

      // 2. Change tint (e.g. Deep)
      const deepTintBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Deep')
      );
      expect(deepTintBtn).toBeDefined();
      act(() => {
        deepTintBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(handleUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          glassSettings: expect.objectContaining({ tint: 'deep' }),
        })
      );

      // 3. Change opacity using range input slider
      const opacitySlider = container.querySelector('input[type="range"]') as HTMLInputElement;
      expect(opacitySlider).not.toBeNull();
      act(() => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(opacitySlider, '45');
        } else {
          opacitySlider.value = '45';
        }
        opacitySlider.dispatchEvent(new Event('input', { bubbles: true }));
        opacitySlider.dispatchEvent(new Event('change', { bubbles: true }));
      });
      expect(handleUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          glassSettings: expect.objectContaining({ opacity: 45 }),
        })
      );
    });
  });
});
