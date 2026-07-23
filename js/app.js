/**
 * Lógica da página do usuário (Minha Conta).
 */
let usuarioAtual = null;
let dashboardAtual = null;

document.addEventListener('DOMContentLoaded', () => {
  const usuario = protegerPagina();
  if (usuario) {
    entrarNoApp(usuario);
  } else {
    mostrarLogin();
  }
});

function mostrarLogin() {
  document.getElementById('tela-login').classList.remove('oculto');
  document.getElementById('app').classList.add('oculto');
  iniciarLoginGoogle(
    usuario => entrarNoApp(usuario),
    mensagem => {
      const el = document.getElementById('mensagem-erro');
      el.textContent = mensagem;
      el.style.display = 'block';
    }
  );
}

function entrarNoApp(usuario) {
  usuarioAtual = usuario;
  document.getElementById('tela-login').classList.add('oculto');
  document.getElementById('app').classList.remove('oculto');

  document.getElementById('avatar-iniciais').textContent = (usuario.nome || '?').trim().charAt(0).toUpperCase();
  document.getElementById('nome-usuario').textContent = usuario.nome;

  if (usuario.acesso === 'administrador') {
    document.getElementById('link-admin').classList.remove('oculto');
  }

  carregarDashboard();
  carregarExtrato();
}

function formatarMoeda(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(valor) {
  if (!valor) return '—';
  const d = new Date(valor);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('pt-BR');
}

function exibirToast(mensagem, tipo = 'sucesso') {
  M.toast({
    html: mensagem,
    displayLength: 4200,
    classes: tipo === 'erro' ? 'toast-erro' : 'toast-sucesso'
  });
}

async function carregarDashboard() {
  const container = document.getElementById('conteudo-dashboard');
  try {
    const resultado = await chamarBackend('dashboardUsuario');
    if (!resultado.sucesso) { exibirToast(resultado.mensagem, 'erro'); return; }
    dashboardAtual = resultado;
    renderizarResumo(resultado);
    renderizarStreamings(resultado);
    renderizarPagamento(resultado);
  } catch (erro) {
    container.innerHTML = '<div class="vazio">Não foi possível carregar seus dados agora.</div>';
  }
}

function renderizarResumo(d) {
  document.getElementById('grade-resumo').innerHTML = `
    <div class="cartao-resumo destaque">
      <div class="rotulo">Valor mensal (com divisão)</div>
      <div class="valor mono">${formatarMoeda(d.totalMensalComDivisao)}</div>
    </div>
    <div class="cartao-resumo positivo">
      <div class="rotulo">Economia mensal estimada</div>
      <div class="valor mono">${formatarMoeda(d.economiaMensal)}</div>
    </div>
    <div class="cartao-resumo ${d.valorEmAberto > 0 ? 'alerta' : ''}">
      <div class="rotulo">Valor em aberto</div>
      <div class="valor mono">${formatarMoeda(d.valorEmAberto)}</div>
    </div>
    <div class="cartao-resumo">
      <div class="rotulo">Próximo vencimento</div>
      <div class="valor mono">${formatarData(d.proximoVencimento)}</div>
    </div>
  `;
}

function renderizarStreamings(d) {
  const grade = document.getElementById('grade-tickets');
  const cartaoAtivo = (s) => `
    <div class="ticket">
      <div class="ticket-logo">
        ${s.urlLogo ? `<img src="${s.urlLogo}" alt="${s.nome}">` : `<span class="inicial">${(s.nome||'?').charAt(0)}</span>`}
      </div>
      <div class="ticket-perfuracao"></div>
      <div class="ticket-corpo">
        <div class="nome">${s.nome}</div>
        <div class="plano">${s.plano || ''}</div>
        <div class="valor-linha"><span class="valor mono">${formatarMoeda(s.valorMensal)}</span><span class="por">/ mês</span></div>
        <div class="cotas">${s.minhasCotas} de ${s.totalCotas} cota(s) da assinatura</div>
      </div>
    </div>`;
  const cartaoInativo = (s) => `
    <div class="ticket inativo">
      <div class="ticket-logo">
        ${s.urlLogo ? `<img src="${s.urlLogo}" alt="${s.nome}">` : `<span class="inicial">${(s.nome||'?').charAt(0)}</span>`}
      </div>
      <div class="ticket-perfuracao"></div>
      <div class="ticket-corpo">
        <div class="nome">${s.nome}</div>
        <div class="plano">${s.plano || ''}</div>
      </div>
    </div>`;

  const html = [
    ...d.participando.map(cartaoAtivo),
    ...d.naoParticipando.map(cartaoInativo)
  ].join('');

  grade.innerHTML = html || '<div class="vazio">Nenhum streaming cadastrado ainda.</div>';
}

function renderizarPagamento(d) {
  const secao = document.getElementById('secao-pagamento');
  if (!d.pendentes || d.pendentes.length === 0) {
    secao.innerHTML = '<div class="vazio">Nenhum pagamento pendente no momento. Tudo em dia! 🎉</div>';
    return;
  }
  // Usa o lançamento mais próximo do vencimento
  const pendente = d.pendentes[0];
  const emAtraso = pendente.diasAtraso > 0;

  secao.innerHTML = `
    <div class="painel-pagamento">
      <div class="lado-info">
        <div class="rotulo" style="color:var(--cor-texto-muted); font-size:12px; text-transform:uppercase; letter-spacing:1px;">Valor a pagar</div>
        <div class="valor-total mono">${formatarMoeda(pendente.valorTotal)}</div>
        <div style="color:var(--cor-texto-muted); font-size:13.5px;">Vencimento: ${formatarData(pendente.vencimento)}</div>
        ${emAtraso ? `<div style="color:var(--cor-vermelho); font-size:13px; margin-top:6px;">Em atraso há ${pendente.diasAtraso} dia(s) — multa e juros já aplicados.</div>` : ''}
        <div class="aviso-multa"><strong>Atenção:</strong> pagamentos em atraso têm multa de 2% + juros de 1% ao mês, proporcional aos dias de atraso.</div>
        <button class="btn btn-secundario btn-bloco" style="margin-top:18px;" onclick="informarPagamento('${pendente.id}')" ${pendente.informouPagamento ? 'disabled' : ''}>
          ${pendente.informouPagamento ? 'Pagamento informado — aguardando confirmação' : 'Já paguei, informar pagamento'}
        </button>
      </div>
      <div class="lado-qr">
        <div id="qrcode-canvas"></div>
        <button class="btn btn-primario btn-bloco" onclick="gerarQrCode('${pendente.id}')">Gerar QR Code Pix</button>
        <div class="pix-copia-cola oculto" id="bloco-copia-cola">
          <label style="font-size:11px; color:var(--cor-texto-muted); text-transform:uppercase;">Pix copia e cola</label>
          <textarea id="pix-copia-cola-texto" rows="3" readonly></textarea>
          <button class="btn btn-secundario btn-bloco" style="margin-top:8px;" onclick="copiarPix()">Copiar código</button>
        </div>
      </div>
    </div>
  `;
}

async function gerarQrCode(idExtrato) {
  try {
    const resultado = await chamarBackend('gerarPix', { idExtrato });
    if (!resultado.sucesso) { exibirToast(resultado.mensagem, 'erro'); return; }

    const container = document.getElementById('qrcode-canvas');
    container.innerHTML = '';
    new QRCode(container, { text: resultado.payload, width: 190, height: 190 });

    document.getElementById('bloco-copia-cola').classList.remove('oculto');
    document.getElementById('pix-copia-cola-texto').value = resultado.payload;
  } catch (erro) {
    exibirToast('Erro ao gerar Pix: ' + erro.message, 'erro');
  }
}

function copiarPix() {
  const campo = document.getElementById('pix-copia-cola-texto');
  campo.select();
  document.execCommand('copy');
  exibirToast('Código Pix copiado!');
}

async function informarPagamento(idExtrato) {
  try {
    const resultado = await chamarBackend('informarPagamento', { idExtrato });
    exibirToast(resultado.mensagem, resultado.sucesso ? 'sucesso' : 'erro');
    if (resultado.sucesso) { carregarDashboard(); carregarExtrato(); }
  } catch (erro) {
    exibirToast('Erro: ' + erro.message, 'erro');
  }
}

async function carregarExtrato() {
  const corpo = document.getElementById('corpo-extrato');
  try {
    const resultado = await chamarBackend('extratoUsuario');
    if (!resultado.sucesso) return;
    if (resultado.extrato.length === 0) {
      corpo.innerHTML = `<tr><td colspan="5" class="vazio">Nenhum lançamento no seu extrato ainda.</td></tr>`;
      return;
    }
    corpo.innerHTML = resultado.extrato.map(r => {
      let tag = '<span class="tag tag-pendente">Pendente</span>';
      if (r.pago) tag = '<span class="tag tag-pago">Pago</span>';
      else if (r.diasAtraso > 0) tag = '<span class="tag tag-atraso">Em atraso</span>';
      else if (r.informouPagamento) tag = '<span class="tag tag-aguardando">Aguardando confirmação</span>';
      return `<tr>
        <td>${formatarData(r.vencimento)}</td>
        <td class="valor mono">${formatarMoeda(r.valorDevidoInicial)}</td>
        <td class="valor mono">${formatarMoeda(r.encargos || 0)}</td>
        <td class="valor mono">${formatarMoeda(r.valorTotal)}</td>
        <td>${tag}</td>
      </tr>`;
    }).join('');
  } catch (erro) {
    corpo.innerHTML = `<tr><td colspan="5" class="vazio">Erro ao carregar extrato.</td></tr>`;
  }
}