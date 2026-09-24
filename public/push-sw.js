// UN-SMO Service Worker: Push-Meldungen + App-Hülle zwischenspeichern.
const CACHE = 'un-smo-shell-v5';
const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/icon-v3-192.png',
  '/icon-v3-512.png',
  '/apple-touch-icon-v3.png',
  '/fonts/outfit-300.woff2',
  '/fonts/outfit-400.woff2',
  '/fonts/outfit-500.woff2',
];

// In Vorschau-/Entwicklungsumgebungen niemals zwischenspeichern.
const host = self.location.hostname;
const CACHING_ENABLED =
  host !== 'localhost' &&
  host !== '127.0.0.1' &&
  !host.includes('id-preview') &&
  !host.endsWith('.local');

self.addEventListener('install', (event) => {
  if (CACHING_ENABLED) {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  }
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  if (!CACHING_ENABLED) return;
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML immer frisch holen, Cache nur als Notfall (offline).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/').then((r) => r || Response.error())),
    );
    return;
  }

  // Statische Bausteine: zuerst aus dem Cache, im Hintergrund erneuern.
  if (/\.(js|css|woff2|png|svg|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});

self.addEventListener('push', (event) => {
  // Titel und Text nur aus der Nutzlast – keine Standardtexte, die sich wiederholen.
  let data = {};
  try {
    if (event.data) data = event.data.json() || {};
  } catch (_) {
    if (event.data) data = { body: event.data.text() };
  }
  const title = data.title || 'UN-SMO';
  const options = {
    tag: data.tag,
    icon: '/icon-v3-192.png',
    badge: '/icon-v3-192.png',
    vibrate: [10, 50, 10],
    data: { url: '/' },
  };
  if (data.body && data.body !== title) options.body = data.body;
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow('/');
    }),
  );
});
