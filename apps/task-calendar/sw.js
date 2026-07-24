'use strict';

/* Task Calendar service worker — オフラインでも開けるようにする（PWA）。
   スコープはこのアプリのディレクトリのみ。他のNESTアプリには影響しない。 */

const CACHE_NAME = 'task-calendar-v77';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=77',
  './tokens.css?v=77',
  './app.js?v=77',
  './firebase-config.js?v=77',
  './vendor/firebase-app-compat.js?v=29',
  './vendor/firebase-auth-compat.js?v=29',
  './vendor/firebase-firestore-compat.js?v=29',
  './manifest.webmanifest',
  './icons/icon.svg?v=77',
  './icons/favicon-32.png?v=77',
  './icons/apple-touch-icon.png?v=77',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // ページ本体はネット優先（更新をすぐ反映）、圏外ならキャッシュへ
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // CSS/JS/画像はキャッシュ優先＋裏で更新（stale-while-revalidate）
  event.respondWith(
    caches.match(request).then((hit) => {
      const refresh = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || refresh;
    })
  );
});
