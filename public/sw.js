// Service Worker for Liquid Weather PWA
const SHELL_CACHE_NAME = 'weather-shell-v1';
const API_CACHE_NAME = 'weather-api-v1';

const STATIC_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png'
];

// Open-Meteo API hostnames to intercept and cache
const WEATHER_API_HOSTS = [
  'api.open-meteo.com',
  'geocoding-api.open-meteo.com'
];

// Install: Cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static app shell');
      return cache.addAll(STATIC_SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Some shell assets failed to precache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== SHELL_CACHE_NAME && key !== API_CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Handle requests with appropriate offline strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 1. Weather & Geocoding API: Network-First with Cache Fallback
  if (WEATHER_API_HOSTS.some((host) => url.hostname.includes(host))) {
    event.respondWith(handleWeatherApiRequest(request));
    return;
  }

  // 2. Navigation requests (HTML documents): Network-First, fallback to index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 3. Static Assets & App Bundles: Cache-First with Background Revalidation
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to revalidate cache
        fetch(request)
          .then((freshResponse) => {
            if (freshResponse && freshResponse.status === 200) {
              caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, freshResponse));
            }
          })
          .catch(() => {
            // Offline - ignore background fetch error
          });
        return cachedResponse;
      }

      // If not in cache, fetch from network and store in shell cache
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(SHELL_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

/**
 * Handles Open-Meteo API requests:
 * Attempts network first. On success, caches fresh forecast data.
 * On offline or network failure, falls back to cached API response.
 */
async function handleWeatherApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      // Clone and store fresh weather data in cache
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Open-Meteo network request failed, querying API cache for:', request.url, error);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving weather data from offline API cache');
      return cachedResponse;
    }

    // If exact query match is missing, check if any recent forecast for this endpoint exists in cache
    const cachedRequests = await cache.keys();
    for (const cachedReq of cachedRequests) {
      if (cachedReq.url.includes('api.open-meteo.com/v1/forecast')) {
        const fallbackCached = await cache.match(cachedReq);
        if (fallbackCached) {
          console.log('[SW] Serving nearest cached weather forecast');
          return fallbackCached;
        }
      }
    }

    // Return custom offline JSON error response if totally uncached
    return new Response(
      JSON.stringify({
        error: true,
        offline: true,
        message: 'No internet connection and no cached weather data available.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable (Offline)',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Support manual skip waiting message from app client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
