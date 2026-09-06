const CACHE = 'daily-hub-v16';
const CAT_IMAGES = [
  'assets/cats/com.hihonor.photos_20260810124005.png',
  'assets/cats/com.hihonor.photos_20260810124021.png',
  'assets/cats/com.hihonor.photos_20260810124029.png',
  'assets/cats/com.hihonor.photos_20260810124042.png',
  'assets/cats/com.hihonor.photos_20260810124053.png',
  'assets/cats/com.hihonor.photos_20260810124102.png',
  'assets/cats/com.hihonor.photos_20260810124113.png',
  'assets/cats/com.hihonor.photos_20260810124122.png',
  'assets/cats/com.hihonor.photos_20260810124133.png',
  'assets/cats/com.hihonor.photos_20260810124146.png',
  'assets/cats/com.hihonor.photos_20260810124154.png',
  'assets/cats/com.hihonor.photos_20260810124200.png',
  'assets/cats/com.hihonor.photos_20260810124211.png',
  'assets/cats/com.hihonor.photos_20260810124222.png'
];
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/splash-640x1136.png',
  './icons/splash-750x1334.png',
  './icons/splash-828x1792.png',
  './icons/splash-1125x2436.png',
  './icons/splash-1170x2532.png',
  './icons/splash-1242x2688.png'
].concat(CAT_IMAGES);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
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
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      });
    })
  );
});
