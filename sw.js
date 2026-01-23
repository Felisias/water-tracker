[file name]: sw.js
[file content begin]
const CACHE_NAME = 'healthflow-v2'; // Увеличиваем версию кеша
const urlsToCache = [
    '/healthflow/',
    '/healthflow/index.html',
    '/healthflow/water.html',
    '/healthflow/workouts.html',
    '/healthflow/profile.html',
    '/healthflow/style.css',
    '/healthflow/app.js',
    '/healthflow/water.js',
    '/healthflow/workouts.js',
    '/healthflow/exercises.js',
    '/healthflow/db.js',
    '/healthflow/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кешируем файлы для офлайн работы');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Удаляем старый кеш:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    });
            })
    );
});
[file content end]
