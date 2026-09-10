/**
 * Registro do Service Worker com auto-update
 * - Network First: sempre busca da rede primeiro
 * - Cache como fallback quando offline
 * - Verifica atualizações a cada hora
 * - Recarrega automaticamente quando nova versão está disponível
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js')
      .then(function(registration) {
        console.log('Service Worker registrado com sucesso:', registration);

        // Verifica se há atualização pendente
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão disponível! Atualiza imediatamente
                newWorker.postMessage('SKIP_WAITING');
                // Recarrega a página para aplicar a nova versão
                window.location.reload();
              }
            });
          }
        });
      })
      .catch(function(error) {
        console.log('Falha ao registrar Service Worker:', error);
      });
  });

  // Verifica atualizações a cada hora
  setInterval(() => {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        registration.update();
      }
    });
  }, 60 * 60 * 1000); // 1 hora
}

/**
 * PWA — Service Worker + Instalação do App
 * -------------------------------------------------
 * - Registra o Service Worker com auto-update
 * - Detecta a plataforma (Desktop / Android / iOS)
 * - Captura beforeinstallprompt para instalação em 1 clique
 * - Oferece modal explicativo para iOS
 */

/* ============================================================
   SERVICE WORKER — REGISTRO E AUTO-UPDATE
   ============================================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js')
      .then(function(registration) {
        console.log('Service Worker registrado com sucesso:', registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage('SKIP_WAITING');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch(function(error) {
        console.log('Falha ao registrar Service Worker:', error);
      });
  });

  // Verifica atualizações a cada hora
  setInterval(() => {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) registration.update();
    });
  }, 60 * 60 * 1000);
}

/* ============================================================
   INSTALAÇÃO DO PWA
   ============================================================ */
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

/**
 * Chamado ao clicar em "Instalar App".
 * - Android/Desktop: usa o prompt nativo (se disponível)
 * - iOS: mostra modal explicativo
 * - Fallback: mostra toast com instrução genérica
 */
function instalarApp() {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/.test(ua) ||
                (/safari/i.test(ua) && !/chrome/i.test(ua) && !/android/i.test(ua));

  if (isIos) {
    abrirModalInstalarIos();
    return;
  }

  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((escolha) => {
      if (escolha.outcome === 'accepted') {
        exibirToast('App instalado com sucesso!');
      }
      deferredPrompt = null;
    });
    return;
  }

  // Fallback (ex.: já instalado, navegador sem suporte, etc.)
  exibirToast('Para instalar, abra o menu do navegador e escolha "Adicionar à tela inicial".');
}

function abrirModalInstalarIos() {
  const modal = document.getElementById('modal-instalar-ios');
  if (modal) modal.style.display = 'flex';
}

function fecharModalInstalarIos() {
  const modal = document.getElementById('modal-instalar-ios');
  if (modal) modal.style.display = 'none';
}

// Fecha o modal iOS clicando fora ou com Esc
document.addEventListener('click', (evento) => {
  const modal = document.getElementById('modal-instalar-ios');
  if (!modal || modal.style.display === 'none') return;
  if (evento.target === modal) fecharModalInstalarIos();
});
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') fecharModalInstalarIos();
});