const CACHE_NAME = 'emumtaz-offline-v2';
const OFFLINE_URL = '/offline';
const NAVIGATION_TIMEOUT_MS = 8000;

function fetchWithTimeout(request) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => setTimeout(() => reject(new Error('network-timeout')), NAVIGATION_TIMEOUT_MS)),
  ]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL, '/icon'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetchWithTimeout(event.request).catch(async () =>
      (await caches.match(OFFLINE_URL)) || Response.error()),
  );
});
