const CACHE_NAME = 'kawaii-doodle-v4'; // Bumped version for aggressive update
const ASSETS_TO_CACHE = [
    'https://unpkg.com/lucide@latest',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force new SW to take over immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache); // Delete old caches
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of all pages immediately
    );
});

self.addEventListener('fetch', (event) => {
    // Network First, Fallback to Cache for app files
    if (event.request.url.includes('app.js') ||
        event.request.url.includes('social.js') ||
        event.request.url.includes('canvas.js') ||
        event.request.url.includes('styles.css') ||
        event.request.url.includes('index.html')) {

        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Cache First for everything else (CDNs, images)
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});
