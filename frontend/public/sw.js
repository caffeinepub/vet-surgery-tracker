const CACHE_NAME = 'surgipaw-v2';
const RUNTIME_CACHE = 'surgipaw-runtime-v2';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/generated/favicon-16x16.dim_16x16.png',
  '/assets/generated/favicon-32x32.dim_32x32.png',
  '/assets/generated/favicon-192x192.dim_192x192.png',
  '/assets/generated/favicon-512x512.dim_512x512.png',
  '/assets/generated/icon-192.dim_192x192.png',
  '/assets/generated/icon-512.dim_512x512.png'
];

// Install event - precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for:
  // - Internet Identity authentication flows
  // - Backend API calls (canister calls)
  // - Chrome extensions
  if (
    url.hostname.includes('identity.ic0.app') ||
    url.hostname.includes('identity.internetcomputer.org') ||
    url.pathname.includes('/api/') ||
    url.protocol === 'chrome-extension:' ||
    request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache static assets (JS, CSS, images, fonts)
            if (
              request.url.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)
            ) {
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Return cached index.html as fallback for offline
            return caches.match('/index.html');
          });
      })
  );
});
