// sw.js - Service Worker para PWA
// Estratégia: Network First (rede primeiro, cache como fallback)
// Assim as atualizações chegam automaticamente aos usuários

const CACHE_NAME = 'clube-assinaturas-v2';
const urlsToCache = [
  '/clube-app/index.html',
  '/clube-app/admin.html',
  '/clube-app/css/styles.css',
  '/clube-app/js/config.js',
  '/clube-app/js/api.js',
  '/clube-app/js/auth.js',
  '/clube-app/js/app.js',
  '/clube-app/js/admin.js',
  '/clube-app/images/blacodegs-cicle.png',
  '/clube-app/images/blacodegs-linha-400-68.png',
  '/clube-app/images/blacodegs-quad-165.png',
  '/clube-app/images/blacodegs-quad-192.png',
  '/clube-app/images/blacodegs-quad-512.png',
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
  // Força o SW a assumir o controle imediatamente
  self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Toma controle de todas as páginas abertas imediatamente
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições: Network First com fallback para cache
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') return;

  // Ignora requisições para o backend (Apps Script)
  if (event.request.url.includes('script.google.com')) return;

  // Ignora requisições do Google OAuth
  if (event.request.url.includes('accounts.google.com')) return;

  event.respondWith(
    // Tenta buscar da rede primeiro
    fetch(event.request)
      .then(response => {
        // Verifica se é uma resposta válida
        if (!response || response.status !== 200) {
          return response;
        }
        // Clona a resposta para cachear
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Se falhar (offline), tenta do cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se não tiver no cache e for navegação, retorna o index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/clube-app/index.html');
            }
            return new Response('', { status: 404, statusText: 'Not Found' });
          });
      })
  );
});

// Escuta mensagem para forçar atualização
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});