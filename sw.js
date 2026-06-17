// sw.js — Forma service worker. Makes the app installable and offline-capable.
// Bump CACHE when shipping changes so clients pick up the new files.
const CACHE = 'forma-v29';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './src/domains.js',
  './src/assessments.js',
  './src/exercises.js',
  './src/scoring.js',
  './src/progress.js',
  './src/insights.js',
  './src/profile.js',
  './src/coach.js',
  './src/diagnostic.js',
  './src/proof.js',
  './src/planner.js',
  './src/orchestrator.js',
  './src/speech.js',
  './src/audio.js',
  './src/team.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Never cache calls to the Claude API (coaching) — always go to network.
  if (req.url.includes('api.anthropic.com')) return;

  // Network-first for EVERYTHING: always fetch the latest when online, refresh
  // the cache, and fall back to cache only when offline. This guarantees a
  // returning user never gets stuck on a stale version of the app.
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
