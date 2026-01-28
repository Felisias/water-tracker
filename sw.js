const CACHE_NAME = 'workout-v1';
const urlsToCache = [
    './',                    // index.html
    './index.html',          // явно указываем
    './app.js',
    './style.css',
    './manifest.json',
    './workouts.html',
    './profile.html'
];

// Устанавливаем Service Worker
self.addEventListener('install', event => {
    console.log('SW: Установка...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Кешируем файлы');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('SW: Все файлы закешированы');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('SW: Ошибка кеширования:', error);
            })
    );
});

// Активируем Service Worker
self.addEventListener('activate', event => {
    console.log('SW: Активация');
    event.waitUntil(
        Promise.all([
            // Очищаем старые кеши
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('SW: Удаляем старый кеш', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Берём управление сразу
            self.clients.claim()
        ])
    );
});

// Перехват запросов
self.addEventListener('fetch', event => {
    // Не обрабатываем не-GET запросы
    if (event.request.method !== 'GET') return;
    
    // Игнорируем запросы к другим доменам
    if (!event.request.url.startsWith(self.location.origin)) return;
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Если есть в кеше - возвращаем
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Если нет в кеше - грузим из сети
                return fetch(event.request)
                    .then(networkResponse => {
                        // Проверяем успешность ответа
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }
                        
                        // Клонируем и кешируем ответ
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return networkResponse;
                    })
                    .catch(error => {
                        console.log('SW: Ошибка загрузки', event.request.url, error);
                        
                        // Fallback для index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        
                        return new Response('Офлайн режим', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain; charset=utf-8'
                            })
                        });
                    });
            })
    );
});
