'use strict';

/* Task Calendar service worker — オフラインでも開けるようにする（PWA）。
   スコープはこのアプリのディレクトリのみ。他のNESTアプリには影響しない。 */

const CACHE_NAME = 'task-calendar-v105';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=105',
  './tokens.css?v=105',
  './app.js?v=105',
  './reminder-core.js?v=105',
  './reminder-client.js?v=105',
  './record-tools.js?v=105',
  './expressive-themes.css?v=105',
  './assets/collage.png',
  './assets/gallery.png',
  './assets/aquarium.png',
  './assets/woodland.png',
  './assets/cosmos.png',
  './firebase-config.js?v=105',
  './vendor/firebase-app-compat.js?v=29',
  './vendor/firebase-auth-compat.js?v=29',
  './vendor/firebase-firestore-compat.js?v=29',
  './manifest.webmanifest',
  './icons/icon.svg?v=105',
  './icons/icon-dark.svg?v=105',
  './icons/default-dark-180.png',
  './icons/logo-512.png',
  './icons/logo-dark-512.png',
  './icons/logo-180.png',
  './icons/logo-dark-180.png',
  './icons/favicon-32.png?v=105',
  './icons/apple-touch-icon.png?v=105',
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

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { /* Always show a visible notification. */ }
  event.waitUntil(self.registration.showNotification(String(data.title || 'TaskARE').slice(0, 100), {
    body: String(data.body || '大切な日を確認しましょう。').slice(0, 800),
    icon: new URL('./icons/icon-192.png', self.registration.scope).href,
    tag: String(data.tag || 'taskare-reminder').slice(0, 100),
    data: { destination: 'reminders' },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.destination === 'reminders' ? './?reminders=1' : './', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
    const existing = clients.find((client) => client.url.startsWith(self.registration.scope));
    if (existing) { await existing.navigate(url); return existing.focus(); }
    return self.clients.openWindow(url);
  }));
});
