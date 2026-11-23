// Offline support: network first (so updates show up straight away), cached copy when offline.
const CACHE = 'rep12-v11';
const PICS = 'rep12-pics-v2';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/app.css',
  './js/app.js', './js/store.js', './js/ui.js', './js/exercises.js', './js/equipment.js', './js/pictures.js',
  './js/planner.js', './js/workout.js', './js/identify.js', './js/charts.js', './js/sync.js',
  './js/views-plan.js', './js/views-gym.js', './js/views-me.js', './js/views-timer.js', './js/anim.js', './js/tour.js', './js/speak.js', './js/coach.js', './js/i18n.js', './js/localize.js', './js/lang/keys.js',
  ...['es', 'pt', 'de', 'it', 'fi', 'sv', 'zh', 'hi', 'ar', 'he'].map(c => `./js/lang/${c}.js`),
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== PICS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return; // sync calls go straight to Google
  // Exercise and equipment pictures (clip stills, product photos): cache first, so the lists show them offline at the gym.
  if (url.pathname.includes('/media/') && url.pathname.endsWith('.jpg')) {
    e.respondWith(caches.open(PICS).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }))));
    return;
  }
  if (url.pathname.includes('/media/')) return; // video clips: Safari streams them with range requests, which a cache can't answer
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
  );
});
