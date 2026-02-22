// A unique name for our cache
// By changing this name, we can force the service worker to update all cached files.
const CACHE_NAME = 'taskweave-cache-v2';

// The list of files that form the "app shell" - the minimum needed for the app to run.
const APP_SHELL_URLS = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/offline.html',
  '/icons/manifest-icon-192.maskable.png',
  '/icons/manifest-icon-512.maskable.png',
];

// --- INSTALL: Cache the App Shell ---
self.addEventListener('install', (event) => {
  // Tell the browser to wait until the cache is populated before completing installation.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        // Add all the app shell files to the cache.
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
  );
});

// --- ACTIVATE: Clean up old caches ---
self.addEventListener('activate', (event) => {
  // This event fires when the service worker becomes active.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete all caches that are not the current version.
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all open clients (tabs) immediately.
      return self.clients.claim();
    })
  );
});


// --- FETCH: Intercept network requests ---
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests (i.e., loading a page), use a network-first strategy.
  // This ensures the user always gets the latest version of the app's HTML shell if online.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If the network request is successful, cache it for offline use and return it.
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // If the network fails, try to serve the request from the cache.
          return caches.match(event.request)
            .then(response => {
                // If it's in the cache, serve it. Otherwise, serve the offline fallback page.
                return response || caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // For all other requests (CSS, JS, images), use a cache-first strategy.
  // These assets are fingerprinted by Next.js, so a new version will have a new URL.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If we have a cached response, return it.
        if (response) {
          return response;
        }

        // If not, fetch it from the network.
        return fetch(event.request).then((networkResponse) => {
          // And cache it for next time.
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
      .catch(() => {
         // If both cache and network fail (e.g., for an image),
         // we don't return the offline.html page, we just let the request fail.
         // This prevents a broken image being replaced by a full HTML document.
      })
  );
});
