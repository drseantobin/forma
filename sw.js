// sw.js — Forma service worker. Makes the app installable and offline-capable.
// Bump CACHE when shipping changes so clients pick up the new files.
//
// SHELL must list EVERY src/*.js module — otherwise a freshly-installed user who
// goes offline before that module is fetched at runtime hits a broken dynamic
// import. Keep in sync with src/; the deploy step diffs SHELL against src/*.js.
const CACHE = 'forma-v270';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-512.png',
  './brandmark.png',
  './wordmark-logo.png',
  './og-image.png',
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
  './src/milestones.js',
  './src/reliability.js',
  './src/methods.js',
  './src/snapshot.js',
  './src/research.js',
  './src/contact.js',
  './src/llm.js',
  './src/analytics.js',
  './src/release.js',
  './src/validity.js',
  './src/overclaiming.js',
  './src/calibration.js',
  './src/breathcount.js',
  './src/svt.js',
  './src/constructs.js',
  './src/growth.js',
  './src/practice.js',
];

self.addEventListener('install', (e) => {
  // Resilient precache: one missing/404 file must not abort the whole install
  // (addAll is atomic and would). Cache each individually, best-effort.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
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
  // Never cache live coaching API calls — always go to network. Covers every
  // bring-your-own-key provider (kept in sync with src/llm.js PROVIDERS hosts).
  const NO_CACHE_HOSTS = ['api.anthropic.com', 'api.openai.com', 'generativelanguage.googleapis.com', 'openrouter.ai', 'localhost', '127.0.0.1'];
  if (NO_CACHE_HOSTS.some((h) => req.url.includes(h))) return;

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
