/* ============================================
   MGHIC FinanceApp - Service Worker
   Smart caching with auto-update
   ============================================ */

const CACHE_VERSION = 'mghic-v2';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/db.js',
    '/js/app.js',
    '/js/categories.js',
    '/js/transactions.js',
    '/js/savings.js',
    '/js/invoices.js',
    '/js/dashboard.js',
    '/js/reports.js',
    '/manifest.json'
];

// Install - cache core assets
self.addEventListener('install', (event) => {
    console.log('🔧 SW: Installing', CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting()) // Force activate immediately
    );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
    console.log('✅ SW: Activating', CACHE_VERSION);
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_VERSION)
                    .map(key => {
                        console.log('🗑️ SW: Deleting old cache', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim()) // Take control immediately
    );
});

// Fetch - Network First strategy (always get latest)
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip external URLs (CDNs etc)
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Got network response - cache it and return
                const clone = response.clone();
                caches.open(CACHE_VERSION).then(cache => {
                    cache.put(event.request, clone);
                });
                return response;
            })
            .catch(() => {
                // Network failed - try cache (offline mode)
                return caches.match(event.request);
            })
    );
});