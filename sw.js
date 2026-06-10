/**
 * sw.js — Service Worker
 * ------------------------------------------------------------------
 * Strategi cache ringan untuk mempercepat kunjungan ulang:
 * - Aset statis (HTML/CSS/JS/ikon/CDN): cache-first.
 * - Permintaan ke Apps Script (API): SELALU lewat jaringan (tidak di-cache)
 *   agar data pertanyaan/jawaban selalu mutakhir.
 * ------------------------------------------------------------------
 */
const CACHE = 'tms-static-v7';
const PRECACHE = [
  '/',
  '/index.html',
  '/arsip.html',
  '/q.html',
  '/ustadz.html',
  '/qr.html',
  '/live.html',
  '/404.html',
  '/assets/css/app.css',
  '/assets/js/config.js',
  '/assets/js/api.js',
  '/assets/js/ui.js',
  '/assets/js/store.js',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Jangan cache: bukan GET, atau permintaan ke backend Apps Script
  if (req.method !== 'GET' || url.hostname.indexOf('script.google.com') !== -1 ||
      url.hostname.indexOf('googleusercontent.com') !== -1) {
    return; // biarkan default (jaringan)
  }

  // Cache-first untuk aset statis & dokumen
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Simpan salinan untuk kunjungan berikutnya (best-effort)
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
