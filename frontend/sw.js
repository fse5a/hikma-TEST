const CACHE_NAME = 'hikma-shell-__BUILD_ID__';
const APP_SHELL = ['./index.html', './style.css', './settings.js', './public-data.js', './api-client.js', './i18n.js', './pdf-import.js', './vendor/pdf.min.mjs', './vendor/pdf.worker.min.mjs', './app.js', './auto-update.js', './skins.js', './features-styles.js', './restored-features.js', './scanner.js', './manifest.webmanifest', './icon.svg', './voices.json', './test-sentences.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(async (cache) => {
    await Promise.all(APP_SHELL.map(async (asset) => {
      try {
        const response = await fetch(asset, {cache: 'reload'});
        if (response.ok) await cache.put(asset, response);
      } catch {}
    }));
    await self.skipWaiting();
  }));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const {request} = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  const isStaticAsset = url.pathname.startsWith('/vendor/') || url.pathname.startsWith('/fonts/');
  const networkFirst = !isStaticAsset;
  if (networkFirst) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(async () => (await caches.match(request)) || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok && request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
