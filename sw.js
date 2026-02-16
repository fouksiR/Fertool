const CACHE_NAME = 'fertool-v2';

// Install — just activate immediately
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate — clear old caches, claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — ONLY cache static assets on same origin
// NEVER interfere with API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip ALL of these — let them go straight to network
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('run.app') ||
    url.pathname.includes('/query') ||
    url.pathname.includes('/cdn-cgi') ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  // Same-origin GET requests: network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
