// Vampire Dice Roller Service Worker
// Version 1.0.0

const CACHE_NAME = 'vampire-dice-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  
  // Icons
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/shortcut-d10.png',
  '/icons/shortcut-pool.png',
  
  // External dependencies (if used)
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/htmx/1.9.10/htmx.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, serve offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
        
        // For other requests, you could return a default response
        return new Response('Offline - Resource not available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// Handle background sync for dice roll statistics (optional feature)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'dice-stats-sync') {
    event.waitUntil(syncDiceStats());
  }
});

// Handle push notifications (for future features like shared sessions)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New dice roll shared!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'vampire-dice-notification',
    actions: [
      {
        action: 'view',
        title: 'View Roll',
        icon: '/icons/shortcut-d10.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Vampire Dice Roller', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CACHE_DICE_RESULT') {
    // Cache dice roll results for offline viewing
    cacheDiceResult(event.data.payload);
  }
});

// Utility functions
async function syncDiceStats() {
  try {
    // This would sync dice roll statistics to a server
    // For now, just log that sync would happen
    console.log('[SW] Syncing dice statistics...');
    
    // You could implement actual sync logic here
    const stats = await getStoredDiceStats();
    if (stats && stats.length > 0) {
      // Send stats to server
      console.log('[SW] Would sync', stats.length, 'dice rolls');
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

async function getStoredDiceStats() {
  // This would retrieve stored dice statistics
  // Implementation depends on your storage strategy
  return [];
}

async function cacheDiceResult(result) {
  try {
    const cache = await caches.open('dice-results-v1');
    const response = new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`/dice-result-${Date.now()}`, response);
    console.log('[SW] Cached dice result');
  } catch (error) {
    console.error('[SW] Failed to cache dice result:', error);
  }
}

// Periodic cleanup of old cached dice results
setInterval(() => {
  cleanupOldDiceResults();
}, 24 * 60 * 60 * 1000); // Run daily

async function cleanupOldDiceResults() {
  try {
    const cache = await caches.open('dice-results-v1');
    const requests = await cache.keys();
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of requests) {
      const url = new URL(request.url);
      const timestamp = parseInt(url.pathname.split('-').pop());
      
      if (timestamp < oneWeekAgo) {
        await cache.delete(request);
        console.log('[SW] Cleaned up old dice result:', request.url);
      }
    }
  } catch (error) {
    console.error('[SW] Cleanup failed:', error);
  }
}
