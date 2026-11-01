import type { Language } from '../types/weather';

export interface Translations {
  appName: string;
  searchPlaceholder: string;
  searchCity: string;
  noResults: string;
  useMyLocation: string;
  locating: string;
  savedCities: string;
  saveCity: string;
  removeCity: string;
  hourlyForecast: string;
  hourlyForecastSummary: string;
  dailyForecast: string;
  windTitle: string;
  windSpeed: string;
  windGusts: string;
  windDirection: string;
  sunTracker: string;
  sunrise: string;
  sunset: string;
  uvIndex: string;
  uvLow: string;
  uvMod: string;
  uvHigh: string;
  uvVeryHigh: string;
  uvExtreme: string;
  uvAdviceLow: string;
  uvAdviceMod: string;
  uvAdviceHigh: string;
  uvAdviceExtreme: string;
  humidityTitle: string;
  dewPoint: string;
  dewPointDesc: string;
  pressureTitle: string;
  pressureLow: string;
  pressureNormal: string;
  pressureHigh: string;
  visibilityTitle: string;
  visibilityKm: string;
  visibilityMiles: string;
  visibilityClear: string;
  visibilityGood: string;
  visibilityModerate: string;
  visibilityPoor: string;
  feelsLikeTitle: string;
  feelsLikeSame: string;
  feelsLikeWarmer: string;
  feelsLikeColder: string;
  precipitationTitle: string;
  settingsTitle: string;
  units: string;
  temperature: string;
  wind: string;
  pressure: string;
  language: string;
  showcaseMode: string;
  showcaseDesc: string;
  showcaseLive: string;
  showcaseSunny: string;
  showcaseRain: string;
  showcaseThunder: string;
  showcaseSnow: string;
  showcaseNight: string;
  installApp: string;
  offlineNotice: string;
  offlineBadge: string;
  now: string;
  today: string;
  high: string;
  low: string;
  h: string;
  l: string;
  updatedJustNow: string;
  updatedMinsAgo: string;
  geolocationError: string;
  geolocationDenied: string;
  // Wind compass cardinal directions
  windN: string;
  windNE: string;
  windE: string;
  windSE: string;
  windS: string;
  windSW: string;
  windW: string;
  windNW: string;
  // Weather condition descriptions
  conditionClearDay: string;
  conditionClearNight: string;
  conditionMainlyClearDay: string;
  conditionMainlyClearNight: string;
  conditionPartlyCloudy: string;
  conditionOvercast: string;
  conditionFog: string;
  conditionDrizzle: string;
  conditionRain: string;
  conditionHeavyRain: string;
  conditionThunderstorm: string;
  conditionSnow: string;
  conditionSnowShowers: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'Weather',
    searchPlaceholder: 'Search for a city or airport...',
    searchCity: 'Search City',
    noResults: 'No cities found',
    useMyLocation: 'Use My Current Location',
    locating: 'Locating...',
    savedCities: 'Favorite Cities',
    saveCity: 'Add to Favorites',
    removeCity: 'Remove',
    hourlyForecast: '24-HOUR FORECAST',
    hourlyForecastSummary: 'Hourly conditions throughout the next 24 hours',
    dailyForecast: '7-DAY FORECAST',
    windTitle: 'WIND & GUSTS',
    windSpeed: 'Wind Speed',
    windGusts: 'Gusts up to',
    windDirection: 'Direction',
    sunTracker: 'SUN TRACKER',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    uvIndex: 'UV INDEX',
    uvLow: 'Low',
    uvMod: 'Moderate',
    uvHigh: 'High',
    uvVeryHigh: 'Very High',
    uvExtreme: 'Extreme',
    uvAdviceLow: 'Low danger. Sun protection not required.',
    uvAdviceMod: 'Take precautions. Seek shade during midday.',
    uvAdviceHigh: 'Protection essential. Generously apply SPF 30+.',
    uvAdviceExtreme: 'Extreme caution. Avoid direct midday sun exposure.',
    humidityTitle: 'HUMIDITY',
    dewPoint: 'The dew point is',
    dewPointDesc: 'right now.',
    pressureTitle: 'PRESSURE',
    pressureLow: 'Low',
    pressureNormal: 'Steady',
    pressureHigh: 'High',
    visibilityTitle: 'VISIBILITY',
    visibilityKm: 'km',
    visibilityMiles: 'mi',
    visibilityClear: 'Perfect clarity and unlimited view.',
    visibilityGood: 'Good visibility across horizons.',
    visibilityModerate: 'Moderate haze or mist reducing view.',
    visibilityPoor: 'Dense fog or precipitation obstructing visibility.',
    feelsLikeTitle: 'FEELS LIKE',
    feelsLikeSame: 'Similar to the actual temperature.',
    feelsLikeWarmer: 'Humidity is making it feel warmer.',
    feelsLikeColder: 'Wind chill is making it feel colder.',
    precipitationTitle: 'PRECIPITATION',
    settingsTitle: 'Settings & Display',
    units: 'Measurement Units',
    temperature: 'Temperature',
    wind: 'Wind Speed',
    pressure: 'Pressure',
    language: 'Language',
    showcaseMode: 'Atmosphere Engine Override',
    showcaseDesc: 'Preview 60fps HTML5 canvas shaders and liquid glass refraction effects.',
    showcaseLive: 'Live API',
    showcaseSunny: '☀️ Sunny',
    showcaseRain: '🌧️ Heavy Rain',
    showcaseThunder: '⚡ Thunderstorm',
    showcaseSnow: '❄️ Snow',
    showcaseNight: '🌙 Clear Night',
    installApp: 'Install App',
    offlineNotice: 'Offline Mode: Displaying cached meteorological data',
    offlineBadge: 'Offline',
    now: 'Now',
    today: 'Today',
    high: 'H',
    low: 'L',
    h: 'H',
    l: 'L',
    updatedJustNow: 'Updated just now',
    updatedMinsAgo: 'Updated {m}m ago',
    geolocationError: 'Unable to retrieve your current location',
    geolocationDenied: 'Location access permission was denied',
    windN: 'North',
    windNE: 'North-East',
    windE: 'East',
    windSE: 'South-East',
    windS: 'South',
    windSW: 'South-West',
    windW: 'West',
    windNW: 'North-West',
    conditionClearDay: 'Sunny',
    conditionClearNight: 'Clear',
    conditionMainlyClearDay: 'Mostly Sunny',
    conditionMainlyClearNight: 'Mostly Clear',
    conditionPartlyCloudy: 'Partly Cloudy',
    conditionOvercast: 'Overcast',
    conditionFog: 'Foggy',
    conditionDrizzle: 'Drizzle',
    conditionRain: 'Rain',
    conditionHeavyRain: 'Heavy Rain',
    conditionThunderstorm: 'Thunderstorm',
    conditionSnow: 'Snow',
    conditionSnowShowers: 'Snow Showers',
  },
  ar: {
    appName: 'الطقس',
    searchPlaceholder: 'ابحث عن مدينة أو مطار...',
    searchCity: 'بحث عن مدينة',
    noResults: 'لم يتم العثور على نتائج',
    useMyLocation: 'استخدم موقعي الحالي',
    locating: 'جاري تحديد الموقع...',
    savedCities: 'المدن المفضلة',
    saveCity: 'إضافة للمفضلة',
    removeCity: 'إزالة',
    hourlyForecast: 'توقعات ٢٤ ساعة',
    hourlyForecastSummary: 'الأحوال الجوية على مدار الساعات القادمة',
    dailyForecast: 'توقعات ٧ أيام',
    windTitle: 'الرياح والعواصف',
    windSpeed: 'سرعة الرياح',
    windGusts: 'الهبات تصل إلى',
    windDirection: 'الاتجاه',
    sunTracker: 'مسار الشمس',
    sunrise: 'شروق الشمس',
    sunset: 'غروب الشمس',
    uvIndex: 'مؤشر الأشعة فوق البنفسجية',
    uvLow: 'منخفض',
    uvMod: 'متوسط',
    uvHigh: 'مرتفع',
    uvVeryHigh: 'مرتفع جداً',
    uvExtreme: 'شديد الخطورة',
    uvAdviceLow: 'مستوى آمن، لا يتطلب حماية خاصة.',
    uvAdviceMod: 'اتخذ الاحتياطات وتجنب شمس الظهيرة.',
    uvAdviceHigh: 'الحماية ضرورية واستخدم واقي الشمس.',
    uvAdviceExtreme: 'حذر شديد! تجنب التعرض المباشر لأشعة الشمس.',
    humidityTitle: 'الرطوبة',
    dewPoint: 'نقطة الندى تبلغ',
    dewPointDesc: 'في الوقت الحالي.',
    pressureTitle: 'الضغط الجوي',
    pressureLow: 'منخفض',
    pressureNormal: 'مستقر',
    pressureHigh: 'مرتفع',
    visibilityTitle: 'مدى الرؤية',
    visibilityKm: 'كم',
    visibilityMiles: 'ميل',
    visibilityClear: 'رؤية واضحة ومثالية تماماً.',
    visibilityGood: 'رؤية جيدة في جميع الاتجاهات.',
    visibilityModerate: 'ضباب خفيف أو غبار يحد من الرؤية.',
    visibilityPoor: 'ضباب كثيف أو أمطار تعيق الرؤية.',
    feelsLikeTitle: 'درجة الحرارة المحسوسة',
    feelsLikeSame: 'مطابقة لدرجة الحرارة الفعلية.',
    feelsLikeWarmer: 'الرطوبة تجعل الجو يبدو أكثر دفئاً.',
    feelsLikeColder: 'حركة الرياح تزيد من الإحساس بالبرودة.',
    precipitationTitle: 'هطول الأمطار',
    settingsTitle: 'الإعدادات والمظهر',
    units: 'وحدات القياس',
    temperature: 'درجة الحرارة',
    wind: 'سرعة الرياح',
    pressure: 'الضغط',
    language: 'اللغة',
    showcaseMode: 'محاكاة الطقس الحية',
    showcaseDesc: 'استعراض محرك الجزيئات وتأثيرات الزجاج السائل ثلاثية الأبعاد.',
    showcaseLive: 'بيانات حية',
    showcaseSunny: '☀️ مشمس',
    showcaseRain: '🌧️ أمطار غزيرة',
    showcaseThunder: '⚡ عاصفة رعدية',
    showcaseSnow: '❄️ تساقط الثلوج',
    showcaseNight: '🌙 سماء صافية ليلاً',
    installApp: 'تثبيت التطبيق',
    offlineNotice: 'وضع عدم الاتصال: عرض أحدث البيانات المحفوظة',
    offlineBadge: 'بدون اتصال',
    now: 'الآن',
    today: 'اليوم',
    high: 'ع',
    low: 'د',
    h: 'ع',
    l: 'د',
    updatedJustNow: 'تم التحديث الآن',
    updatedMinsAgo: 'تم التحديث منذ {m} د',
    geolocationError: 'تعذر تحديد موقعك الجغرافي الحالي',
    geolocationDenied: 'تم رفض إذن الوصول إلى الموقع الجغرافي',
    windN: 'شمال',
    windNE: 'شمال شرق',
    windE: 'شرق',
    windSE: 'جنوب شرق',
    windS: 'جنوب',
    windSW: 'جنوب غرب',
    windW: 'غرب',
    windNW: 'شمال غرب',
    conditionClearDay: 'مشمس',
    conditionClearNight: 'صافٍ',
    conditionMainlyClearDay: 'مشمس غالباً',
    conditionMainlyClearNight: 'صافٍ غالباً',
    conditionPartlyCloudy: 'غائم جزئياً',
    conditionOvercast: 'غائم كلياً',
    conditionFog: 'ضبابي',
    conditionDrizzle: 'رذاذ خفيف',
    conditionRain: 'ماطر',
    conditionHeavyRain: 'أمطار غزيرة',
    conditionThunderstorm: 'عاصفة رعدية',
    conditionSnow: 'ثلوج',
    conditionSnowShowers: 'زخات ثلجية',
  },
  fr: {
    appName: 'Météo',
    searchPlaceholder: 'Rechercher une ville ou un aéroport...',
    searchCity: 'Rechercher une ville',
    noResults: 'Aucune ville trouvée',
    useMyLocation: 'Utiliser ma position actuelle',
    locating: 'Localisation en cours...',
    savedCities: 'Villes favorites',
    saveCity: 'Ajouter aux favoris',
    removeCity: 'Supprimer',
    hourlyForecast: 'PRÉVISIONS 24 HEURES',
    hourlyForecastSummary: 'Conditions météo détaillées pour les prochaines 24h',
    dailyForecast: 'PRÉVISIONS SUR 7 JOURS',
    windTitle: 'VENT & RAFALES',
    windSpeed: 'Vitesse du vent',
    windGusts: 'Rafales jusqu’à',
    windDirection: 'Direction',
    sunTracker: 'TRAJECTOIRE SOLAIRE',
    sunrise: 'Lever du soleil',
    sunset: 'Coucher du soleil',
    uvIndex: 'INDICE UV',
    uvLow: 'Faible',
    uvMod: 'Modéré',
    uvHigh: 'Élevé',
    uvVeryHigh: 'Très élevé',
    uvExtreme: 'Extrême',
    uvAdviceLow: 'Danger faible. Protection solaire non requise.',
    uvAdviceMod: 'Prenez des précautions. Restez à l’ombre à midi.',
    uvAdviceHigh: 'Protection indispensable. Appliquez crème SPF 30+.',
    uvAdviceExtreme: 'Prudence extrême ! Évitez toute exposition directe au soleil.',
    humidityTitle: 'HUMIDITÉ',
    dewPoint: 'Le point de rosée est de',
    dewPointDesc: 'actuellement.',
    pressureTitle: 'PRESSION',
    pressureLow: 'Basse',
    pressureNormal: 'Stable',
    pressureHigh: 'Haute',
    visibilityTitle: 'VISIBILITÉ',
    visibilityKm: 'km',
    visibilityMiles: 'mi',
    visibilityClear: 'Visibilité parfaite et dégagée.',
    visibilityGood: 'Bonne visibilité sur l’ensemble de l’horizon.',
    visibilityModerate: 'Brume légère réduisant la visibilité.',
    visibilityPoor: 'Brouillard dense ou pluie limitant la visibilité.',
    feelsLikeTitle: 'RESSENTI',
    feelsLikeSame: 'Similaire à la température réelle.',
    feelsLikeWarmer: 'L’humidité augmente la sensation de chaleur.',
    feelsLikeColder: 'Le vent amplifie la sensation de fraîcheur.',
    precipitationTitle: 'PRÉCIPITATIONS',
    settingsTitle: 'Paramètres & Affichage',
    units: 'Unités de mesure',
    temperature: 'Température',
    wind: 'Vitesse du vent',
    pressure: 'Pression',
    language: 'Langue',
    showcaseMode: 'Mode Démonstration Météo',
    showcaseDesc: 'Prévisualisez le moteur de particules 60fps et les réfractions de verre liquide.',
    showcaseLive: 'API Direct',
    showcaseSunny: '☀️ Ensoleillé',
    showcaseRain: '🌧️ Pluie battante',
    showcaseThunder: '⚡ Orage',
    showcaseSnow: '❄️ Chute de neige',
    showcaseNight: '🌙 Nuit étoilée',
    installApp: 'Installer l’application',
    offlineNotice: 'Mode hors-ligne : Affichage des données météo en cache',
    offlineBadge: 'Hors-ligne',
    now: 'Maint.',
    today: 'Aujourd’hui',
    high: 'Max',
    low: 'Min',
    h: 'Max',
    l: 'Min',
    updatedJustNow: 'Mis à jour à l’instant',
    updatedMinsAgo: 'Mis à jour il y a {m} min',
    geolocationError: 'Impossible de géolocaliser votre position',
    geolocationDenied: 'L’accès à votre position a été refusé',
    windN: 'Nord',
    windNE: 'Nord-Est',
    windE: 'Est',
    windSE: 'Sud-Est',
    windS: 'Sud',
    windSW: 'Sud-Ouest',
    windW: 'Ouest',
    windNW: 'Nord-Ouest',
    conditionClearDay: 'Ensoleillé',
    conditionClearNight: 'Nuit claire',
    conditionMainlyClearDay: 'Généralement ensoleillé',
    conditionMainlyClearNight: 'Généralement dégagé',
    conditionPartlyCloudy: 'Partiellement nuageux',
    conditionOvercast: 'Couvert',
    conditionFog: 'Brouillard',
    conditionDrizzle: 'Bruine',
    conditionRain: 'Pluie',
    conditionHeavyRain: 'Pluie forte',
    conditionThunderstorm: 'Orage',
    conditionSnow: 'Neige',
    conditionSnowShowers: 'Averses de neige',
  },
};

export function getWeatherConditionDescription(code: number, isDay: boolean, lang: Language): string {
  const t = translations[lang] || translations.en;

  if (code === 0) return isDay ? t.conditionClearDay : t.conditionClearNight;
  if (code === 1) return isDay ? t.conditionMainlyClearDay : t.conditionMainlyClearNight;
  if (code === 2) return t.conditionPartlyCloudy;
  if (code === 3) return t.conditionOvercast;
  if (code === 45 || code === 48) return t.conditionFog;
  if ([51, 53, 55, 56, 57].includes(code)) return t.conditionDrizzle;
  if ([61, 63, 65, 66, 67, 80, 81].includes(code)) return t.conditionRain;
  if (code === 82) return t.conditionHeavyRain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return t.conditionSnow;
  if ([95, 96, 99].includes(code)) return t.conditionThunderstorm;

  return isDay ? t.conditionPartlyCloudy : t.conditionMainlyClearNight;
}

export function getWindDirectionDescription(degrees: number, lang: Language): string {
  const t = translations[lang] || translations.en;
  const normalized = ((degrees % 360) + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) return t.windN;
  if (normalized >= 22.5 && normalized < 67.5) return t.windNE;
  if (normalized >= 67.5 && normalized < 112.5) return t.windE;
  if (normalized >= 112.5 && normalized < 157.5) return t.windSE;
  if (normalized >= 157.5 && normalized < 202.5) return t.windS;
  if (normalized >= 202.5 && normalized < 247.5) return t.windSW;
  if (normalized >= 247.5 && normalized < 292.5) return t.windW;
  return t.windNW;
}

export function getUVAdvice(uvIndex: number, lang: Language): { category: string; advice: string } {
  const t = translations[lang] || translations.en;

  if (uvIndex < 3) {
    return { category: t.uvLow, advice: t.uvAdviceLow };
  } else if (uvIndex < 6) {
    return { category: t.uvMod, advice: t.uvAdviceMod };
  } else if (uvIndex < 8) {
    return { category: t.uvHigh, advice: t.uvAdviceHigh };
  } else if (uvIndex < 11) {
    return { category: t.uvVeryHigh, advice: t.uvAdviceHigh };
  }
  return { category: t.uvExtreme, advice: t.uvAdviceExtreme };
}

export function formatRelativeTime(isoString: string, lang: Language): string {
  const t = translations[lang] || translations.en;
  try {
    const timeMs = new Date(isoString).getTime();
    if (isNaN(timeMs)) return t.updatedJustNow;

    const diffSeconds = Math.max(0, Math.floor((Date.now() - timeMs) / 1000));
    if (diffSeconds < 60) return t.updatedJustNow;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return t.updatedMinsAgo.replace('{m}', diffMinutes.toString());
    }

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  } catch {
    return t.updatedJustNow;
  }
}
