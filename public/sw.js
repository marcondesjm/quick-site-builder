// Service Worker for DoorVII PWA - Complete Offline Support
const SW_VERSION = '4.1.0';
const CACHE = 'doorvii-pwa-v4.1';

// Offline fallback page
const offlineFallbackPage = '/offline.html';

// Assets to pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/manifest.json'
];

// Install event - pre-cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker v' + SW_VERSION + ' installing...');
  
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching offline assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service Worker v' + SW_VERSION + ' installed');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Pre-cache failed:', err);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker v' + SW_VERSION + ' activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker v' + SW_VERSION + ' activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - Stale While Revalidate strategy with offline fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Skip API calls and supabase requests - always go to network
  if (request.url.includes('/api/') || 
      request.url.includes('supabase') || 
      request.url.includes('/functions/')) {
    return;
  }

  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(async () => {
          // Try to get from cache first
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page as fallback
          const offlineResponse = await caches.match(offlineFallbackPage);
          return offlineResponse || new Response('Offline - Sem conexão', {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // For images - Cache First strategy
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              const responseClone = response.clone();
              caches.open(CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
              return response;
            })
            .catch(() => {
              // Return placeholder for failed images
              return new Response('', { status: 404 });
            });
        })
    );
    return;
  }

  // For static assets (JS, CSS, fonts) - Stale While Revalidate
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              const responseClone = networkResponse.clone();
              caches.open(CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
              return networkResponse;
            })
            .catch(() => cachedResponse);
          
          return cachedResponse || fetchPromise;
        })
    );
    return;
  }

  // Default - Network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Push notifications
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
      console.log('[SW] Push data parsed:', data);
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
    timestamp: Date.now(),
    silent: false,
  };

  console.log('[SW] Showing notification with options:', options);

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('[SW] Notification shown successfully'))
      .catch((err) => console.error('[SW] Error showing notification:', err))
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  if (event.action === 'dismiss') {
    console.log('[SW] Notification dismissed by user');
    return;
  }

  const notificationData = event.notification.data || {};
  const roomName = notificationData.roomName;
  const propertyName = notificationData.propertyName;

  console.log('[SW] Opening app with data:', { roomName, propertyName });

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[SW] Found clients:', clientList.length);
        
        for (const client of clientList) {
          if ('focus' in client) {
            console.log('[SW] Focusing existing client');
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
          console.log('[SW] Opening new window');
          return self.clients.openWindow('/');
        }
      })
      .catch((err) => console.error('[SW] Error handling notification click:', err))
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed without interaction');
});

// Message handler
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync support
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-activities') {
    event.waitUntil(
      // Sync pending activities when back online
      console.log('[SW] Syncing pending activities...')
    );
  }
});

// Periodic background sync (for supported browsers)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(
      console.log('[SW] Checking for new notifications...')
    );
  }
});

console.log('[SW] Service Worker v' + SW_VERSION + ' loaded');
