// sw.js - Service Worker para PWA

const CACHE_NAME = 'clube-assinaturas-v1';
const urlsToCache = [
  '/clube-app/index.html',
  '/clube-app/admin.html',
  '/clube-app/css/styles.css',
  '/clube-app/js/config.js',
  '/clube-app/js/api.js',
  '/clube-app/js/auth.js',
  '/clube-app/js/app.js',
  '/clube-app/js/admin.js',
  '/clube-app/images/blacodegs-165.png',
  '/clube-app/images/blacodegs-192.png',
  '/clube-app/images/blacodegs-400-87.png',
  '/clube-app/images/blacodegs-512.png',
  '/clube-app/favicon.ico',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://accounts.google.com/gsi/client'
];

// Instalação: cacheia os recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Erro ao cachear recursos:', err);
      })
  );
});

// Ativação: limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptação de requisições: serve do cache ou da rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrou no cache, retorna
        if (response) {
          return response;
        }
        // Senão, faz a requisição na rede
        return fetch(event.request)
          .then(response => {
            // Verifica se é uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clona a resposta para cachear
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