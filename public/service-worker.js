// ============================================
// SERVICE WORKER - PWA Offline Support
// ============================================

const CACHE_NAME = 'inventario-v21';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/modal-styles.css',
    '/js/app.js',
    '/js/api.js',
    '/js/db.js',
    '/js/sync.js',
    '/js/auth.js',
    '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    // Forzar activación inmediata del nuevo SW
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Intercepción de requests
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignorar chrome-extension y otros esquemas no HTTP
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return;
    }

    // Ignorar peticiones POST, PUT, DELETE (solo cachear GET)
    if (event.request.method !== 'GET') {
        return;
    }

    // NUNCA cachear peticiones a la API - siempre ir al servidor
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Para archivos estáticos: Cache First, fallback a Network
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - devolver respuesta
                if (response) {
                    return response;
                }

                // Clonar request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then((response) => {
                    // Verificar si es una respuesta válida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clonar respuesta
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});
