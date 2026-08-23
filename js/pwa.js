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