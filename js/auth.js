/**
 * Login exclusivo via Google (Google Identity Services).
 * O usuário só entra se o e-mail da conta Google já estiver cadastrado
 * pelo administrador em tabUsusarios — não há opção de "criar conta".
 */

const CHAVE_TOKEN = 'clube_streaming_token';
const CHAVE_USUARIO = 'clube_streaming_usuario';

function obterTokenSessao() {
  return sessionStorage.getItem(CHAVE_TOKEN) || '';
}

function obterUsuarioSessao() {
  const bruto = sessionStorage.getItem(CHAVE_USUARIO);
  return bruto ? JSON.parse(bruto) : null;
}

function salvarSessao(idToken, usuario) {
  sessionStorage.setItem(CHAVE_TOKEN, idToken);
  sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

function encerrarSessao() {
  sessionStorage.removeItem(CHAVE_TOKEN);
  sessionStorage.removeItem(CHAVE_USUARIO);
  location.reload();
}

/**
 * O script do Google (accounts.google.com/gsi/client) carrega com
 * async/defer, então pode não estar pronto ainda quando a página termina
 * de montar o DOM. Esta função espera até window.google existir.
 */
function esperarGoogleCarregar(tentativasRestantes = 100) {
  return new Promise((resolve, reject) => {
    function verificar(restantes) {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        resolve();
      } else if (restantes <= 0) {
        reject(new Error('Não foi possível carregar o script de login do Google. Verifique sua conexão e recarregue a página.'));
      } else {
        setTimeout(() => verificar(restantes - 1), 100);
      }
    }
    verificar(tentativasRestantes);
  });
}

/**
 * Inicializa o botão de login do Google e trata o retorno do credential.
 * aoAutenticar(usuario) é chamado quando o login + validação no back-end
 * derem certo.
 */
async function iniciarLoginGoogle(aoAutenticar, aoFalhar) {
  try {
    await esperarGoogleCarregar();
  } catch (erro) {
    aoFalhar(erro.message);
    return;
  }

  function callback(response) {
    const idToken = response.credential;
    chamarBackend('autenticar', { idToken })
      .then(resultado => {
        if (resultado.sucesso) {
          salvarSessao(idToken, resultado.usuario);
          aoAutenticar(resultado.usuario);
        } else {
          aoFalhar(resultado.mensagem || 'Não foi possível autenticar.');
        }
      })
      .catch(erro => aoFalhar('Erro de conexão: ' + erro.message));
  }

  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.indexOf('COLOQUE_AQUI') === 0) {
    aoFalhar('O login do Google ainda não foi configurado (GOOGLE_CLIENT_ID em js/config.js).');
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: callback
  });
  google.accounts.id.renderButton(
    document.getElementById('google-login-btn'),
    { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 320 }
  );
}

/** Garante que existe sessão válida; caso contrário, mostra a tela de login. */
function protegerPagina() {
  const usuario = obterUsuarioSessao();
  const token = obterTokenSessao();
  return (usuario && token) ? usuario : null;
}