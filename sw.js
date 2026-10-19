/* =====================================================================
   SERVICE WORKER: makes the game work offline.

   The first time you open the game from the website, this script saves
   (caches) every file the game needs on your device. After that:
   - With internet: it fetches the newest version (so updates arrive)
     and refreshes the saved copy.
   - Without internet: it hands back the saved copy instead.
   ===================================================================== */
const CACHE = 'neon-arena-v1';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Install: save all the game files.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

// Activate: delete saved copies from older versions of this script.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

// Every request: try the internet first (giving up after 3 seconds), fall back to the saved copy.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('slow network')), 3000));
      const response = await Promise.race([fetch(request), timeout]);
      if (response.ok) cache.put(request, response.clone()); // keep the saved copy up to date
      return response;
    } catch (err) {
      const saved = await cache.match(request, { ignoreSearch: true });
      if (saved) return saved;
      if (request.mode === 'navigate') return cache.match('./index.html'); // opening the app offline
      throw err;
    }
  })());
});
