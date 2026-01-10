/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

const SW_VERSION = '4.0.0';

// O Vite/Workbox injeta a lista de ficheiros a serem cacheados aqui
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache de Imagens (Estratégia: Cache First)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
  })
);

// Cache de CSS, JS e Fontes (Estratégia: Stale While Revalidate)
registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style' || 
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
  })
);

// ============ PUSH NOTIFICATIONS ============
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);
  
  let data = {
    title: '🔔 Visitante na Porta',
    body: 'Alguém está chamando na sua campainha',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {},
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      try {
        data.body = event.data.text();
      } catch (e2) {
        console.error('[SW] Error parsing push data as text:', e2);
      }
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: [300, 100, 300, 100, 300, 100, 300],
    data: data.data || {},
    requireInteraction: true,
    renotify: true,
    tag: 'doorbell-' + Date.now(),
    actions: [
      { action: 'open', title: '📞 Atender' },
      { action: 'dismiss', title: '❌ Ignorar' },
    ],
    silent: false,
  } as NotificationOptions & { vibrate?: number[]; renotify?: boolean; actions?: Array<{ action: string; title: string }> };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  const roomName = notificationData.roomName;
  const propertyName = notificationData.propertyName;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              roomName,
              propertyName,
            });
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});

self.addEventListener('notificationclose', () => {
  console.log('Notification closed without interaction');
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Permite que o app se atualize imediatamente
self.addEventListener('install', () => {
  console.log('Service Worker v' + SW_VERSION + ' installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker v' + SW_VERSION + ' activated');
  event.waitUntil(self.clients.claim());
});
