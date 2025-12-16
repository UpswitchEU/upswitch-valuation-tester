/**
 * Service Worker for Offline Support
 * 
 * Provides offline functionality, background sync, and asset caching.
 * 
 * Features:
 * - Cache static assets for offline access
 * - Background sync for failed requests
 * - Push notifications (future)
 * - Request interception and caching strategies
 * 
 * @module sw
 */

// Version tracking for debugging (increment on each deploy)
const SW_VERSION = '1.0.2'
const CACHE_NAME = `upswitch-valuation-v${SW_VERSION}`
const RUNTIME_CACHE = `upswitch-runtime-v${SW_VERSION}`

console.log(`[ServiceWorker] Version ${SW_VERSION} initializing`)

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
]

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event')

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[ServiceWorker] Precaching assets')
      
      // Selective precache with error handling per asset
      // Uses Promise.allSettled to allow partial success
      const cachePromises = PRECACHE_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url)
          if (response.ok) {
            await cache.put(url, response)
            console.log('[ServiceWorker] Cached successfully:', url)
            return { success: true, url }
          } else {
            console.warn('[ServiceWorker] Skipping cache (not ok):', url, response.status)
            return { success: false, url, reason: `HTTP ${response.status}` }
          }
        } catch (error) {
          console.warn('[ServiceWorker] Failed to cache:', url, error.message || error)
          return { success: false, url, reason: error.message || 'fetch failed' }
        }
      })
      
      const results = await Promise.allSettled(cachePromises)
      
      // Log summary
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failed = results.length - successful
      
      console.log('[ServiceWorker] Precache completed:', {
        total: PRECACHE_ASSETS.length,
        successful,
        failed,
      })
      
      // Don't fail install even if some assets couldn't be cached
      return Promise.resolve()
    })
  )

  // Force activation of new service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )

  // Take control of all clients immediately
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log(`[ServiceWorker v${SW_VERSION}] Serving from cache:`, request.url)
        return cachedResponse
      }

      // Not in cache, fetch from network
      console.log(`[ServiceWorker v${SW_VERSION}] Fetching from network:`, request.url)
      return fetch(request)
        .then((response) => {
          // Log successful network fetch
          console.log(`[ServiceWorker v${SW_VERSION}] Fetch finished loading:`, request.method, JSON.stringify(request.url))
          
          // Cache successful responses
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone()

            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache)
            })
          }

          return response
        })
        .catch((error) => {
          console.error(`[ServiceWorker v${SW_VERSION}] Fetch failed:`, request.url, error)

          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return new Response(
              `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Offline - Upswitch Valuation</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      height: 100vh;
                      margin: 0;
                      background: #f9fafb;
                      color: #111827;
                    }
                    .container {
                      text-align: center;
                      padding: 2rem;
                      max-width: 500px;
                    }
                    h1 {
                      font-size: 2rem;
                      margin-bottom: 1rem;
                      color: #1f2937;
                    }
                    p {
                      font-size: 1rem;
                      line-height: 1.6;
                      color: #6b7280;
                      margin-bottom: 2rem;
                    }
                    button {
                      background: #2563eb;
                      color: white;
                      border: none;
                      padding: 0.75rem 1.5rem;
                      font-size: 1rem;
                      border-radius: 0.5rem;
                      cursor: pointer;
                      transition: background 0.2s;
                    }
                    button:hover {
                      background: #1d4ed8;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>📡 You're Offline</h1>
                    <p>
                      It looks like you've lost your internet connection.
                      Don't worry—your work is saved locally.
                      We'll sync your data when you're back online.
                    </p>
                    <button onclick="location.reload()">Try Again</button>
                  </div>
                </body>
              </html>
              `,
              {
                headers: {
                  'Content-Type': 'text/html',
                },
              }
            )
          }

          throw error
        })
    })
  )
})

// Background sync event - retry failed requests
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag)

  if (event.tag === 'sync-valuation-data') {
    event.waitUntil(syncValuationData())
  }
})

/**
 * Sync valuation data when back online
 */
async function syncValuationData() {
  console.log('[ServiceWorker] Syncing valuation data...')

  try {
    // Get pending sync queue from IndexedDB
    const db = await openIndexedDB()
    const pendingRequests = await getPendingRequests(db)

    console.log('[ServiceWorker] Found pending requests:', pendingRequests.length)

    // Retry each pending request
    for (const request of pendingRequests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        })

        if (response.ok) {
          console.log('[ServiceWorker] Request synced:', request.url)
          await removePendingRequest(db, request.id)
        } else {
          console.error('[ServiceWorker] Request sync failed:', response.status)
        }
      } catch (error) {
        console.error('[ServiceWorker] Request sync error:', error)
      }
    }

    console.log('[ServiceWorker] Sync complete')
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error)
    throw error
  }
}

/**
 * Open IndexedDB for sync queue
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UpswitchSyncDB', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains('pendingRequests')) {
        const store = db.createObjectStore('pendingRequests', { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Get all pending requests from IndexedDB
 */
function getPendingRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingRequests'], 'readonly')
    const store = transaction.objectStore('pendingRequests')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

/**
 * Remove a pending request from IndexedDB
 */
function removePendingRequest(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingRequests'], 'readwrite')
    const store = transaction.objectStore('pendingRequests')
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Push notification event (future feature)
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event)

  const options = {
    body: 'Your valuation is ready!',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
  }

  event.waitUntil(
    self.registration.showNotification('Upswitch Valuation', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked')

  event.notification.close()

  event.waitUntil(
    clients.openWindow('/')
  )
})

console.log('[ServiceWorker] Loaded')

