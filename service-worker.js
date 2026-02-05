// Service Worker for offline capability
const CACHE_NAME = 'domino-pouchon-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/game.js',
    '/peer-manager.js',
    'https://cdn.jsdelivr.net/npm/peerjs@1.4.7/dist/peerjs.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});