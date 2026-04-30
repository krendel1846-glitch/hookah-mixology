const CACHE_NAME = "hookah-mixology-v33-scoring-engine-split";
const APP_SHELL = [
  './',
  './index.html',
  './app.js?v=33',
  './js/mixology-engine.js?v=33',
  './js/app-stats.js?v=33',
  './js/scoring-engine.js?v=33',
  './photo-search.js?v=33',
  './manifest.webmanifest?v=33',
  './icons/icon-120-v5.png',
  './icons/icon-152-v5.png',
  './icons/icon-167-v5.png',
  './icons/icon-180-v5.png',
  './icons/icon-192-v5.png',
  './icons/icon-512-v5.png',
  './icons/icon-1024-v5.png',
  './assets/banner-v25.png',
  './data/bundled_base.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(response => { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)); return response; }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(req).then(response => { if (response && response.status === 200) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(req, copy)); } return response; }).catch(() => caches.match(req)));
});
