const CACHE_NAME = 'workout-tracker-v2';
const urlsToCache = [
    '/healthflow/',
    '/healthflow/index.html',
    '/healthflow/app.js',
    '/healthflow/style.css',
    '/healthflow/manifest.json',
    '/healthflow/workouts.html',
    '/healthflow/profile.html'
];

self.addEventListener('install', event => {
    console.log('Service Worker: Устанавливаем...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Кешируем файлы для офлайн работы');
                return cache.addAll(urlsToCache).catch(error => {
                    console.warn('Не удалось закешировать некоторые файлы:', error);
                });
            })
            .then(() => {
                console.log('Service Worker: Установка завершена');
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Активируем...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Удаляем старый кеш:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
        .then(() => {
            console.log('Service Worker: Активация завершена');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    // Пропускаем не-GET запросы и запросы не HTTP(S)
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('Service Worker: Используем кеш для:', event.request.url);
                    return cachedResponse;
                }
                
                console.log('Service Worker: Загружаем с сети:', event.request.url);
                
                return fetch(event.request)
                    .then(response => {
                        // Проверяем валидный ли ответ
                        if (!response || response.status !== 200 || response.type === 'opaque') {
                            return response;
                        }
                        
                        // Клонируем ответ для кеширования
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                                console.log('Service Worker: Сохраняем в кеш:', event.request.url);
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        console.log('Service Worker: Ошибка загрузки:', error);
                        
                        // Пробуем найти в кеше fallback
                        if (event.request.destination === 'document' || 
                            event.request.destination === '') {
                            return caches.match('/healthflow/index.html');
                        }
                        
                        return new Response('Офлайн режим', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Обработка сообщений от приложения
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
