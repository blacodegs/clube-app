/**
 * Camada de comunicação com o back-end (Google Apps Script).
 * Usamos Content-Type: text/plain no fetch para evitar o preflight CORS
 * (o Apps Script continua lendo e.postData.contents como JSON normalmente).
 */
async function chamarBackend(action, dados = {}) {
  const idToken = obterTokenSessao();
  const corpo = Object.assign({ action, idToken }, dados);

  const resposta = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(corpo)
  });

  if (!resposta.ok) {
    throw new Error('Falha de comunicação com o servidor (HTTP ' + resposta.status + ').');
  }
  const json = await resposta.json();
  return json;
}
