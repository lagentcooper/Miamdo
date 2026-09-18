/* Service worker de Miamdo : l'application entière est mise en cache pour
   fonctionner hors connexion. Les données (recettes, planning, liste) vivent
   dans localStorage et ne transitent jamais par le réseau. */

const VERSION = 'miamdo-v1.6.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/store.js',
  './js/version.js',
  './js/prices.js',
  './js/import.js',
  './js/measure.js',
  './js/pantry.js',
  './js/library.js',
  './js/slots.js',
  './js/diet.js',
  './js/nutrition.js',
  './js/ui.js',
  './js/utils.js',
  './js/weekstate.js',
  './js/data/seed.js',
  './js/data/prices.js',
  './js/data/library.js',
  './js/data/nutrition.js',
  './js/data/staples.js',
  './js/data/families.js',
  './js/data/allergens.js',
  './js/views/recipes.js',
  './js/views/week.js',
  './js/views/shopping.js',
  './js/views/settings.js',
  './js/views/pickers.js',
  './js/views/pricesView.js',
  './js/views/importText.js',
  './js/views/library.js',
  './js/views/share.js',
  './js/views/pantry.js',
  './js/views/dietView.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Navigation : on sert la coque de l'app, même sans réseau.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // Ressources : cache d'abord, réseau ensuite (et on met à jour le cache).
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
