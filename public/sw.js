// Service Worker for Controle de Frete PWA (W3C Web Push — Android, Desktop & iOS 16.4+ Home Screen PWA)
const CACHE_NAME = 'controle-frete-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((oldKey) => caches.delete(oldKey))
      )
    ).then(() => self.clients.claim())
  );
});

// Handle W3C Web Push events (Android Chrome, Desktop browsers, and iOS 16.4+ Home Screen PWAs)
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const notifSource = payload.notification || payload;
  const title = notifSource.title || 'Controle de Frete';
  const body = notifSource.body || 'Uma nova movimentação foi registrada na caderneta.';
  const targetUrl = (payload.data && payload.data.url) || payload.url || '/';
  const tag = payload.tag || ('controle-frete-' + Date.now());

  const options = {
    body,
    icon: notifSource.icon || '/icon-192.png',
    badge: notifSource.badge || '/icon-192.png',
    data: { url: targetUrl },
    tag,
    renotify: Boolean(payload.renotify),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Open or focus the PWA when the user taps a notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const relativeUrl = event.notification.data?.url || '/';
  const urlToOpen = new URL(relativeUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && client.url !== urlToOpen) {
            client.navigate(urlToOpen).catch(() => {});
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
