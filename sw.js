// Bump SW_VERSION on every deploy — changing these bytes is what tells the
// browser a new service worker exists and forces installed PWAs to update.
const SW_VERSION = '2026-07-27-1';
const CACHE_NAME = 'ahbc-inventory-' + SW_VERSION;

// Precache is a convenience, not a requirement: the fetch handler is network-first
// and caches on demand. A missing or redirecting URL must never break the install.
const ASSETS = [
  './inventory-count.html',
  './manifest.json',
  './logo.png',
  './tree-mark.png',
  './icon-192.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Open+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js',
  'https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js'
];

// Install: cache each asset independently so one failure can't reject the install
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => null))
      )
    )
  );
});

// Activate: delete ALL old caches immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network first, fall back to cache only if offline
self.addEventListener('fetch', event => {
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
