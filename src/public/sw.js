// Service Worker for PWA with Advanced Caching
const CACHE_NAME = 'our-paths-v2';
const DYNAMIC_CACHE = 'our-paths-dynamic-v2';
const API_CACHE = 'our-paths-api-v2';
const IMAGE_CACHE = 'our-paths-images-v2';

// App Shell - critical resources for offline functionality
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/styles.css',
  '/scripts/index.js',
  '/images/logo.png',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('[SW] Failed to cache some resources:', err);
          // Continue even if some resources fail
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  const cacheWhitelist = [CACHE_NAME, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome extension and non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // API requests - Network First with Cache Fallback
  if (url.pathname.includes('/v1/') || url.hostname.includes('story-api.dicoding.dev')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Images - Cache First with Network Fallback
  if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // App Shell & Static Assets - Cache First
  if (urlsToCache.some(cachedUrl => request.url.includes(cachedUrl)) || 
      request.destination === 'style' || 
      request.destination === 'script') {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }

  // Other requests - Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Network First Strategy - for API calls
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page or error response
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'You are currently offline. Showing cached data.' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cache First Strategy - for images and static assets
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);
    
    // Return placeholder image for failed image requests
    if (request.destination === 'image') {
      return caches.match('/images/logo.png');
    }
    
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Stale While Revalidate - for dynamic content
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse && networkResponse.status === 200) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received', event);
  
  let notificationData = {
    title: 'Our Paths',
    body: 'New story available!',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    tag: 'story-notification',
    data: {
      url: '/#/'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'Our Paths',
        body: data.body || data.message || 'New story available!',
        icon: data.icon || '/images/logo.png',
        badge: '/images/logo.png',
        image: data.image || data.photoUrl,
        tag: data.tag || 'story-notification',
        data: {
          url: data.url || `/#/story/${data.storyId}` || '/#/',
          storyId: data.storyId,
          ...data
        },
        actions: [
          {
            action: 'view',
            title: 'View Story',
            icon: '/images/logo.png'
          },
          {
            action: 'close',
            title: 'Close',
            icon: '/images/logo.png'
          }
        ],
        requireInteraction: false,
        vibrate: [200, 100, 200]
      };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/#/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline story submission
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncPendingStories());
  }
});

async function syncPendingStories() {
  console.log('[SW] Starting background sync...');
  
  try {
    // Open IndexedDB
    const db = await openDatabase();
    
    // Get pending operations
    const pendingItems = await getAllQueueItems(db);
    
    if (pendingItems.length === 0) {
      console.log('[SW] No pending items to sync');
      return;
    }

    console.log(`[SW] Syncing ${pendingItems.length} pending items`);
    
    let synced = 0;
    let failed = 0;

    for (const item of pendingItems) {
      try {
        const success = await syncStoryItem(db, item);
        if (success) {
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('[SW] Error syncing item:', error);
        failed++;
      }
    }

    console.log(`[SW] Sync complete: ${synced} synced, ${failed} failed`);
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        synced,
        failed
      });
    });
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OurPathsDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllQueueItems(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_queue'], 'readonly');
    const store = transaction.objectStore('offline_queue');
    const index = store.index('by_status');
    const request = index.getAll('pending');
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function syncStoryItem(db, item) {
  try {
    // Convert Blob to File
    const photoFile = new File([item.data.photo], item.data.photoName, {
      type: item.data.photoType
    });

    // Create FormData
    const formData = new FormData();
    formData.append('description', item.data.description);
    formData.append('photo', photoFile);
    if (item.data.lat) formData.append('lat', item.data.lat);
    if (item.data.lon) formData.append('lon', item.data.lon);

    // Get token from clients
    const clients = await self.clients.matchAll();
    let token = null;
    if (clients.length > 0) {
      // Request token from client
      const response = await new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => resolve(event.data);
        clients[0].postMessage({ type: 'GET_TOKEN' }, [channel.port2]);
      });
      token = response.token;
    }

    // Submit to API
    const endpoint = token 
      ? 'https://story-api.dicoding.dev/v1/stories'
      : 'https://story-api.dicoding.dev/v1/stories/guest';
    
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData
    });

    const result = await apiResponse.json();

    if (result.error === false) {
      // Success - remove from queue
      await removeFromQueue(db, item.id);
      return true;
    } else {
      // API error - update status
      await updateQueueItemStatus(db, item.id, 'failed', result.message);
      return false;
    }
  } catch (error) {
    // Network error - update status
    await updateQueueItemStatus(db, item.id, 'failed', error.message);
    return false;
  }
}

function removeFromQueue(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_queue'], 'readwrite');
    const store = transaction.objectStore('offline_queue');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function updateQueueItemStatus(db, id, status, error) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_queue'], 'readwrite');
    const store = transaction.objectStore('offline_queue');
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.status = status;
        item.error = error;
        item.attempts = (item.attempts || 0) + 1;
        item.lastAttempt = new Date().toISOString();
        
        // Retry logic: mark as pending if attempts < 3
        if (item.attempts < 3 && status === 'failed') {
          item.status = 'pending';
        }
        
        const putRequest = store.put(item);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, data } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: icon || '/images/logo.png',
      badge: '/images/logo.png',
      data,
      actions: [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' }
      ]
    });
  }
});
