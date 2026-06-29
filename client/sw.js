/**
 * SocialShop — Service Worker (Package 6)
 * Cache-first cho static assets, network-first cho API.
 */

const CACHE_NAME    = 'socialshop-v0.6.0';
const OFFLINE_URL   = '/pages/offline.html';

// Assets to precache
const PRECACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/social-bar.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/config.js',
  '/js/upload.js',
  '/js/pwa.js',
  OFFLINE_URL,
];

// ── Install ─────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate — clear old caches ──────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls → network-first (không cache)
  if (url.pathname.startsWith('/api/') || url.hostname !== location.hostname) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ message: 'Offline — không có kết nối mạng' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      )
    );
    return;
  }

  // Static assets → cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(OFFLINE_URL).then(r => r || new Response('Offline'))
        );
    })
  );
});
