/* Week Trainer service worker — network-first so updates land immediately (offline falls
   back to cache). Bump CACHE when shell files change. */
const CACHE = 'week-trainer-public-v12';
const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/store.js',
  './js/program.js',
  './js/muscles.js',
  './js/app.js',
  './img/front.svg',
  './img/back.svg',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // only handle our own shell

  // Network-first: always try fresh (so edits show up), update the cache, fall back to
  // cache only when offline. Keeps the app installable + offline-capable without going stale.
  event.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
