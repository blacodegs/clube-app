/**
 * Lógica da página de Administração.
 * Mesma sessão do usuário; o acesso é bloqueado no back-end (comAuthAdmin)
 * e aqui reforçamos no front-end também.
 */
let usuariosCache = [];
let streamingsCache = [];
let planosCache = [];

const ICONE_EDITAR = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const ICONE_EXCLUIR = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
const ICONE_FECHAR = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

/** Fecha o card de "novo participante" aberto, se houver. */
function fecharCardNovo() {
  const cardAberto = document.querySelector('.card-divisao.novo');
  if (cardAberto) cardAberto.remove();
}

// Cancelar o card de adicionar: clique fora ou tecla Esc
document.addEventListener('click', (evento) => {
  const cardAberto = document.querySelector('.card-divisao.novo');
  if (!cardAberto) return;
  if (cardAberto.contains(evento.target)) return;
  if (evento.target.closest('.btn-add-usuario')) return;
  cardAberto.remove();
});
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') fecharCardNovo();
});

document.addEventListener('DOMContentLoaded', () => {
  const usuario = protegerPagina();
  if (usuario && usuario.acesso === 'administrador') {
    iniciarAdmin(usuario);
  } else if (usuario) {
    document.body.innerHTML = '<div class="tela-login"><div class="cartao-login"><h1>Acesso restrito</h1><p>Sua conta não tem permissão de administrador.</p><a class="btn btn-primario" href="index.html">Voltar para Minha Conta</a></div></div>';
  } else {
    mostrarLoginAdmin();
  }

  M.Datepicker.init(document.querySelectorAll('.datepicker'), {
    format: 'yyyy-mm-dd',
    autoClose: true,
    yearRange: 5,
    onSelect: function(date) {
      // "this" é a instância do Datepicker; this.el é o input correspondente.
      if (this.el && this.el.id === 'form-plano-data-inicio') {
        recalcularDataFimPlano();
      }
    },
    i18n: {
      months: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
      monthsShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
      weekdays: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
      weekdaysShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
      weekdaysAbbrev: ['D','S','T','Q','Q','S','S'],
      cancel: 'Cancelar',
      clear: 'Limpar',
      done: 'OK',
      today: 'Hoje'
    }
  });

  instanciaDatepickerPlanoFim = M.Datepicker.getInstance(document.getElementById('form-plano-data-fim'));
  instanciaDatepickerPlanoInicio = M.Datepicker.getInstance(document.getElementById('form-plano-data-inicio'));
  const inputParcelas = document.getElementById('form-plano-parcelas');
  if (inputParcelas) inputParcelas.addEventListener('input', recalcularDataFimPlano);
  recalcularDataFimPlano();
});

let instanciaDatepickerPlanoFim = null;
let instanciaDatepickerPlanoInicio = null;

/**
 * Quando PARCELAS > 1, o campo "Data de fim" fica travado e é calculado
 * automaticamente: a última parcela vence "parcelas" meses após a data de
 * início (a 1ª parcela vence no mês seguinte ao início, e assim por diante
 * até a última). Quando PARCELAS = 1, o campo volta a ser editável
 * manualmente.
 */
function recalcularDataFimPlano() {
  const inputParcelas = document.getElementById('form-plano-parcelas');
  const inputInicio = document.getElementById('form-plano-data-inicio');
  const inputFim = document.getElementById('form-plano-data-fim');
  if (!inputParcelas || !inputInicio || !inputFim) return;

  const parcelas = Number(inputParcelas.value) || 1;

  if (parcelas <= 1) {
    inputFim.disabled = false;
    return;
  }

  inputFim.disabled = true;
  if (!inputInicio.value) return;

  const dataInicio = new Date(inputInicio.value + 'T00:00:00');
  if (isNaN(dataInicio)) return;

  const dataFim = new Date(dataInicio);
  dataFim.setMonth(dataFim.getMonth() + parcelas);

  const iso = formatarDataISO(dataFim);
  inputFim.value = iso;
  if (instanciaDatepickerPlanoFim) {
    instanciaDatepickerPlanoFim.setDate(dataFim);
    if (instanciaDatepickerPlanoFim.setInputValue) instanciaDatepickerPlanoFim.setInputValue();
  }
}

function formatarDataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function mostrarLoginAdmin() {
  document.getElementById('tela-login').classList.remove('oculto');
  document.getElementById('app').classList.add('oculto');
  iniciarLoginGoogle(
    usuario => {
      if (usuario.acesso !== 'administrador') {
        location.href = 'index.html';
      } else {
        iniciarAdmin(usuario);
      }
    },
    mensagem => {
      const el = document.getElementById('mensagem-erro');
      el.textContent = mensagem; el.style.display = 'block';
    }
  );
}

function iniciarAdmin(usuario) {
  document.getElementById('tela-login').classList.add('oculto');
  document.getElementById('app').classList.remove('oculto');
  document.getElementById('nome-usuario').textContent = usuario.nome;
  document.getElementById('avatar-iniciais').textContent = (usuario.nome || '?').charAt(0).toUpperCase();
  trocarAba('usuarios');
}

function formatarMoeda(valor) { return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function formatarData(valor) {
  if (!valor) return '—';
  const d = new Date(valor);
  return isNaN(d) ? '—' : d.toLocaleDateString('pt-BR');
}
function paraInputData(valor) {
  if (!valor) return '';
  const d = new Date(valor);
  if (isNaN(d)) return '';
  return d.toISOString().substring(0, 10);
}
function exibirToast(mensagem, tipo = 'sucesso') {
  M.toast({
    html: mensagem,
    displayLength: 4200,
    classes: tipo === 'erro' ? 'toast-erro' : 'toast-sucesso'
  });
}

function trocarAba(aba) {
  document.querySelectorAll('.aba-admin').forEach(el => el.classList.add('oculto'));
  document.getElementById('aba-' + aba).classList.remove('oculto');
  document.querySelectorAll('.nav-abas button').forEach(b => b.classList.remove('ativo'));
  document.getElementById('botao-aba-' + aba).classList.add('ativo');

  if (aba === 'usuarios') carregarUsuarios();
  if (aba === 'streamings') carregarStreamings();
  if (aba === 'divisao') carregarDivisaoAgrupada();
  if (aba === 'planos') {
    carregarStreamingsParaSelect('select-plano-streaming', () => {});
    prepararFormularioPlano();
    carregarPlanosGeral();
    recalcularDataFimPlano();
  }
  if (aba === 'configuracoes') carregarConfiguracoes();
  if (aba === 'financeiro') carregarFinanceiro();
}

/* ============================== USUÁRIOS ============================== */
async function carregarUsuarios() {
  const resultado = await chamarBackend('listarUsuarios');
  if (!resultado.sucesso) { exibirToast(resultado.mensagem, 'erro'); return; }
  usuariosCache = resultado.usuarios;
  document.getElementById('corpo-tabela-usuarios').innerHTML = usuariosCache.map(u => `
    <tr>
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td>${u.acesso === 'administrador' ? 'Administrador' : 'Comum'}</td>
      <td><button class="link-acao" onclick="editarUsuario('${u.id}')">Editar</button></td>
    </tr>`).join('') || '<tr><td colspan="4" class="vazio">Nenhum usuário cadastrado.</td></tr>';
}

function editarUsuario(id) {
  const u = usuariosCache.find(x => x.id === id);
  if (!u) return;
  document.getElementById('form-usuario-id').value = u.id;
  document.getElementById('form-usuario-nome').value = u.nome;
  document.getElementById('form-usuario-email').value = u.email;
  document.getElementById('form-usuario-acesso').value = u.acesso;
  document.getElementById('titulo-form-usuario').textContent = 'Editar usuário';
}

function limparFormUsuario() {
  document.getElementById('form-usuario-id').value = '';
  document.getElementById('form-usuario-nome').value = '';
  document.getElementById('form-usuario-email').value = '';
  document.getElementById('form-usuario-acesso').value = 'comum';
  document.getElementById('titulo-form-usuario').textContent = 'Novo usuário';
}

async function salvarUsuario(evento) {
  evento.preventDefault();
  const id = document.getElementById('form-usuario-id').value;
  const dados = {
    nome: document.getElementById('form-usuario-nome').value.trim(),
    email: document.getElementById('form-usuario-email').value.trim(),
    acesso: document.getElementById('form-usuario-acesso').value
  };
  const resultado = id
    ? await chamarBackend('atualizarUsuario', { id, usuario: dados })
    : await chamarBackend('criarUsuario', { usuario: dados });

  exibirToast(resultado.mensagem || (resultado.sucesso ? 'Salvo com sucesso!' : 'Erro ao salvar.'), resultado.sucesso ? 'sucesso' : 'erro');
  if (resultado.sucesso) { limparFormUsuario(); carregarUsuarios(); }
}

/* ============================== STREAMINGS ============================== */
async function carregarStreamings() {
  const resultado = await chamarBackend('listarStreamings');
  if (!resultado.sucesso) { exibirToast(resultado.mensagem, 'erro'); return; }
  streamingsCache = resultado.streamings;
  document.getElementById('corpo-tabela-streamings').innerHTML = streamingsCache.map(s => `
    <tr>
      <td>${s.urlLogo ? `<img src="${s.urlLogo}" style="height:22px;vertical-align:middle;margin-right:8px;">` : ''}</td>
      <td>${s.plano || ''}</td>
      <td>${s.dispositivos || ''}</td>
      <td>${s.vagas || ''}</td>
      <td><button class="link-acao" onclick="editarStreaming('${s.id}')">Editar</button></td>
    </tr>`).join('') || '<tr><td colspan="5" class="vazio">Nenhum streaming cadastrado.</td></tr>';
}

function editarStreaming(id) {
  const s = streamingsCache.find(x => x.id === id);
  if (!s) return;
  document.getElementById('form-streaming-id').value = s.id;
  document.getElementById('form-streaming-nome').value = s.streaming;
  document.getElementById('form-streaming-plano').value = s.plano || '';
  document.getElementById('form-streaming-dispositivos').value = s.dispositivos || '';
  document.getElementById('form-streaming-vagas').value = s.vagas || '';
  document.getElementById('form-streaming-login').value = s.login || '';
  document.getElementById('form-streaming-senha').value = s.senha || '';
  document.getElementById('form-streaming-logo').value = s.urlLogo || '';
  document.getElementById('titulo-form-streaming').textContent = 'Editar streaming';
}

function limparFormStreaming() {
  ['id','nome','plano','dispositivos','vagas','login','senha','logo'].forEach(campo =>
    document.getElementById('form-streaming-' + campo).value = '');
  document.getElementById('titulo-form-streaming').textContent = 'Novo streaming';
}

async function salvarStreaming(evento) {
  evento.preventDefault();
  const id = document.getElementById('form-streaming-id').value;
  const dados = {
    streaming: document.getElementById('form-streaming-nome').value.trim(),
    plano: document.getElementById('form-streaming-plano').value.trim(),
    dispositivos: document.getElementById('form-streaming-dispositivos').value.trim(),
    vagas: document.getElementById('form-streaming-vagas').value.trim(),
    login: document.getElementById('form-streaming-login').value.trim(),
    senha: document.getElementById('form-streaming-senha').value.trim(),
    urlLogo: document.getElementById('form-streaming-logo').value.trim()
  };
  const resultado = id
    ? await chamarBackend('atualizarStreaming', { id, streaming: dados })
    : await chamarBackend('criarStreaming', { streaming: dados });

  exibirToast(resultado.mensagem || (resultado.sucesso ? 'Salvo com sucesso!' : 'Erro ao salvar.'), resultado.sucesso ? 'sucesso' : 'erro');
  if (resultado.sucesso) { limparFormStreaming(); carregarStreamings(); }
}

/* ============================== DIVISÃO / COTAS ============================== */
async function carregarStreamingsParaSelect(idSelect, aoCarregar) {
  if (streamingsCache.length === 0) {
    const resultado = await chamarBackend('listarStreamings');
    streamingsCache = resultado.streamings || [];
  }
  const select = document.getElementById(idSelect);
  select.innerHTML = streamingsCache.map(s => `<option value="${s.id}">${s.streaming}</option>`).join('');
  select.onchange = () => aoCarregar();
  if (streamingsCache.length > 0) aoCarregar();
}

let ultimoResultadoDivisao = { grupos: [] };

async function carregarDivisaoAgrupada() {
  if (usuariosCache.length === 0) {
    const r = await chamarBackend('listarUsuarios');
    usuariosCache = r.usuarios || [];
  }
  const resultado = await chamarBackend('listarDivisaoCompleta');
  if (!resultado.sucesso) { exibirToast(resultado.mensagem, 'erro'); return; }
  ultimoResultadoDivisao = resultado;

  const container = document.getElementById('grupos-divisao');
  if (resultado.grupos.length === 0) {
    container.innerHTML = '<div class="vazio">Nenhum streaming cadastrado ainda.</div>';
    return;
  }
  container.innerHTML = resultado.grupos.map(renderizarGrupoDivisao).join('');
}

function renderizarGrupoDivisao(grupo) {
  const logoHtml = grupo.urlLogo
    ? `<img src="${grupo.urlLogo}" alt="${grupo.nomeStreaming}">`
    : `<span class="inicial">${(grupo.nomeStreaming || '?').charAt(0)}</span>`;

  const cards = grupo.participantes.map(p => cardDivisaoSalvo(p, grupo.idStreaming)).join('');

  let seloVagas = '';
  if (grupo.vagas !== null && grupo.vagas !== undefined) {
    const disponiveis = grupo.vagas - grupo.participantesAtivos;
    const classe = disponiveis > 0 ? 'tem-vaga' : 'sem-vaga';
    const texto = disponiveis > 0
      ? `${disponiveis} de ${grupo.vagas} vaga(s) livre(s)`
      : `Sem vagas (${grupo.participantesAtivos}/${grupo.vagas})`;
    seloVagas = `<span class="selo-vagas ${classe}">${texto}</span>`;
  }

  return `
    <div class="grupo-divisao">
      <div class="grupo-divisao-cabecalho">
        <div class="grupo-divisao-titulo">${logoHtml}<h4>${grupo.nomeStreaming}</h4></div>
        ${seloVagas}
      </div>
      <div class="fila-cards-divisao" id="fila-divisao-${grupo.idStreaming}">
        ${cards}
        <button class="btn-add-usuario" onclick="adicionarCardNovoUsuario('${grupo.idStreaming}')">+ Adicionar usuário</button>
      </div>
    </div>`;
}

function cardDivisaoSalvo(p, idStreaming) {
  return `
    <div class="card-divisao" id="card-${idStreaming}-${p.idUsuario}">
      <div class="coluna"><div class="rotulo-mini">Usuário</div><div class="valor-mini">${p.nomeUsuario}</div></div>
      <div class="coluna"><div class="rotulo-mini">Cotas</div><div class="valor-mini">${p.cotas}</div></div>
      <div class="coluna"><div class="rotulo-mini">Valor</div><div class="valor-mini mono">${formatarMoeda(p.valorMensal)}</div></div>
      <div class="coluna-acoes">
        <button class="icone-acao" onclick="editarParticipante('${idStreaming}','${p.idUsuario}')" title="Editar cotas">${ICONE_EDITAR}</button>
        <button class="icone-acao perigo" onclick="removerParticipante('${idStreaming}','${p.idUsuario}')" title="Remover da divisão">${ICONE_EXCLUIR}</button>
      </div>
    </div>`;
}

function editarParticipante(idStreaming, idUsuario) {
  const grupo = ultimoResultadoDivisao.grupos.find(g => g.idStreaming === idStreaming);
  const participante = grupo ? grupo.participantes.find(p => p.idUsuario === idUsuario) : null;
  if (!participante) return;

  const card = document.getElementById(`card-${idStreaming}-${idUsuario}`);
  card.classList.add('novo');
  card.innerHTML = `
    <div class="coluna"><div class="rotulo-mini">Usuário</div><div class="valor-mini">${participante.nomeUsuario}</div></div>
    <div class="coluna">
      <div class="rotulo-mini">Cotas</div>
      <input type="number" min="1" step="1" value="${participante.cotas}" id="editar-${idStreaming}-${idUsuario}-cotas">
    </div>
    <div class="coluna"><div class="rotulo-mini">Valor</div><div class="valor-mini mono">recalculado ao salvar</div></div>
    <div class="coluna-acoes">
      <button class="botao-salvar-card" onclick="salvarEdicaoParticipante('${idStreaming}','${idUsuario}')">Salvar</button>
      <button class="icone-acao" onclick="carregarDivisaoAgrupada()" title="Cancelar">${ICONE_FECHAR}</button>
    </div>`;
}

async function salvarEdicaoParticipante(idStreaming, idUsuario) {
  const cotas = Number(document.getElementById(`editar-${idStreaming}-${idUsuario}-cotas`).value) || 0;
  if (cotas <= 0) {
    exibirToast('Informe uma quantidade de cotas válida (ou use o ícone de excluir para remover).', 'erro');
    return;
  }
  const resultado = await chamarBackend('definirCotas', { idStreaming, cotas: [{ idUsuario, cotas }] });
  if (!resultado.sucesso) { exibirToast(resultado.mensagem || 'Erro ao salvar.', 'erro'); return; }
  exibirToast('Cotas atualizadas!');
  carregarDivisaoAgrupada();
}

async function removerParticipante(idStreaming, idUsuario) {
  const grupo = ultimoResultadoDivisao.grupos.find(g => g.idStreaming === idStreaming);
  const participante = grupo ? grupo.participantes.find(p => p.idUsuario === idUsuario) : null;
  const nome = participante ? participante.nomeUsuario : 'este usuário';

  if (!confirm(`Remover ${nome} da divisão deste streaming?`)) return;

  const resultado = await chamarBackend('definirCotas', { idStreaming, cotas: [{ idUsuario, cotas: 0 }] });
  if (!resultado.sucesso) { exibirToast(resultado.mensagem || 'Erro ao remover.', 'erro'); return; }
  exibirToast('Participante removido da divisão.');
  carregarDivisaoAgrupada();
}

function adicionarCardNovoUsuario(idStreaming) {
  fecharCardNovo();

  const fila = document.getElementById('fila-divisao-' + idStreaming);
  const idTemp = 'novo-' + idStreaming;
  const div = document.createElement('div');
  div.className = 'card-divisao novo';
  div.id = idTemp;
  div.innerHTML = `
    <div class="coluna">
      <div class="rotulo-mini">Usuário</div>
      <select class="browser-default" id="${idTemp}-usuario"></select>
    </div>
    <div class="coluna">
      <div class="rotulo-mini">Cotas</div>
      <input type="number" min="1" step="1" value="1" id="${idTemp}-cotas">
    </div>
    <div class="coluna">
      <div class="rotulo-mini">Valor</div>
      <div class="valor-mini mono">calculado ao salvar</div>
    </div>
    <div class="coluna-acoes">
      <button class="botao-salvar-card" onclick="salvarNovoParticipante('${idStreaming}', '${idTemp}')">Salvar</button>
      <button class="icone-acao" onclick="fecharCardNovo()" title="Cancelar">${ICONE_FECHAR}</button>
    </div>`;
  const botaoAdd = fila.querySelector('.btn-add-usuario');
  fila.insertBefore(div, botaoAdd);
  preencherSelectUsuariosDisponiveis(idStreaming, idTemp);
}

function preencherSelectUsuariosDisponiveis(idStreaming, idTemp) {
  const grupo = ultimoResultadoDivisao.grupos.find(g => g.idStreaming === idStreaming);
  const idsParticipantes = new Set((grupo ? grupo.participantes : []).map(p => p.idUsuario));
  const disponiveis = usuariosCache.filter(u => !idsParticipantes.has(u.id));
  const select = document.getElementById(idTemp + '-usuario');
  select.innerHTML = disponiveis.length
    ? disponiveis.map(u => `<option value="${u.id}">${u.nome}</option>`).join('')
    : '<option value="">Todos os usuários já participam</option>';
}

async function salvarNovoParticipante(idStreaming, idTemp) {
  const idUsuario = document.getElementById(idTemp + '-usuario').value;
  const cotas = Number(document.getElementById(idTemp + '-cotas').value) || 0;
  if (!idUsuario || cotas <= 0) {
    exibirToast('Selecione um usuário e informe uma quantidade de cotas válida.', 'erro');
    return;
  }
  const resultado = await chamarBackend('definirCotas', { idStreaming, cotas: [{ idUsuario, cotas }] });
  if (!resultado.sucesso) { exibirToast(resultado.mensagem || 'Erro ao salvar.', 'erro'); return; }
  exibirToast('Usuário adicionado à divisão!');
  carregarDivisaoAgrupada();
}

/* ============================== PLANOS DE PAGAMENTO ============================== */
async function prepararFormularioPlano() {
  if (usuariosCache.length === 0) {
    const r = await chamarBackend('listarUsuarios');
    usuariosCache = r.usuarios || [];
  }
  const selectPagante = document.getElementById('form-plano-pagante');
  selectPagante.innerHTML = '<option value="">—</option>' + usuariosCache.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
}

async function carregarPlanosGeral() {
  if (streamingsCache.length === 0) {
    const r = await chamarBackend('listarStreamings');
    streamingsCache = r.streamings || [];
  }
  const resultado = await chamarBackend('listarPlanos', {});
  planosCache = resultado.planos || [];

  document.getElementById('corpo-tabela-planos').innerHTML = planosCache.map(p => {
    const streaming = streamingsCache.find(s => s.id === p.idStreaming);
    const logoHtml = streaming && streaming.urlLogo
      ? `<img src="${streaming.urlLogo}" style="height:22px;vertical-align:middle;margin-right:8px;">`
      : '';
    return `
    <tr>
      <td>${logoHtml}</td>
      <td>${formatarData(p.dataInicio)}</td>
      <td>${p.dataFim ? formatarData(p.dataFim) : 'Vigente'}</td>
      <td class="mono">${formatarMoeda(p.valorContratado)}</td>
      <td class="mono">${formatarMoeda(p.valorSemDesconto)}</td>
      <td>${formatarParcelas(p)}</td>
      <td><button class="link-acao" onclick="editarPlano('${p.id}')">Editar</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" class="vazio">Nenhum plano cadastrado ainda.</td></tr>';
}

/**
 * Formata a coluna Parcelas: "1x" para pagamento único, ou
 * "6x (2 de 6)" quando parcelado, mostrando em qual parcela o plano está
 * hoje (baseado em quantos meses se passaram desde a data de início).
 */
function formatarParcelas(p) {
  const parcelas = Number(p.parcelas) || 1;
  if (parcelas <= 1) return '1x';

  const inicio = new Date(p.dataInicio);
  const hoje = new Date();
  let parcelaAtual = (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth()) + 1;
  if (parcelaAtual < 1) parcelaAtual = 1;
  if (parcelaAtual > parcelas) parcelaAtual = parcelas;

  return `${parcelas}x (${parcelaAtual} de ${parcelas})`;
}

function editarPlano(id) {
  const p = planosCache.find(x => x.id === id);
  if (!p) return;

  document.getElementById('titulo-form-plano').textContent = 'Editar plano de pagamento';
  document.getElementById('form-plano-id').value = p.id;
  document.getElementById('select-plano-streaming').value = p.idStreaming;
  document.getElementById('form-plano-valor-contratado').value = p.valorContratado;
  document.getElementById('form-plano-valor-sem-desconto').value = p.valorSemDesconto;
  document.getElementById('form-plano-parcelas').value = p.parcelas;
  document.getElementById('form-plano-pagante').value = p.idPagante || '';

  const dataInicio = new Date(p.dataInicio);
  const isoInicio = formatarDataISO(dataInicio);
  document.getElementById('form-plano-data-inicio').value = isoInicio;
  if (instanciaDatepickerPlanoInicio) {
    instanciaDatepickerPlanoInicio.setDate(dataInicio);
    if (instanciaDatepickerPlanoInicio.setInputValue) instanciaDatepickerPlanoInicio.setInputValue();
  }

  if (p.dataFim) {
    const dataFim = new Date(p.dataFim);
    document.getElementById('form-plano-data-fim').value = formatarDataISO(dataFim);
    if (instanciaDatepickerPlanoFim) {
      instanciaDatepickerPlanoFim.setDate(dataFim);
      if (instanciaDatepickerPlanoFim.setInputValue) instanciaDatepickerPlanoFim.setInputValue();
    }
  } else {
    document.getElementById('form-plano-data-fim').value = '';
  }

  // Reaplica a trava/cálculo automático da data de fim conforme as parcelas.
  recalcularDataFimPlano();
}

function limparFormPlano() {
  document.getElementById('titulo-form-plano').textContent = 'Novo plano de pagamento';
  document.getElementById('form-plano-id').value = '';
  document.getElementById('form-plano-valor-contratado').value = '';
  document.getElementById('form-plano-valor-sem-desconto').value = '';
  document.getElementById('form-plano-parcelas').value = 1;
  document.getElementById('form-plano-data-inicio').value = '';
  document.getElementById('form-plano-data-fim').value = '';
  document.getElementById('form-plano-pagante').value = '';
  recalcularDataFimPlano();
}

async function salvarPlano(evento) {
  evento.preventDefault();
  const id = document.getElementById('form-plano-id').value;
  const idStreaming = document.getElementById('select-plano-streaming').value;
  const dados = {
    idStreaming,
    valorContratado: document.getElementById('form-plano-valor-contratado').value,
    valorSemDesconto: document.getElementById('form-plano-valor-sem-desconto').value,
    parcelas: document.getElementById('form-plano-parcelas').value || 1,
    dataInicio: document.getElementById('form-plano-data-inicio').value,
    dataFim: document.getElementById('form-plano-data-fim').value || null,
    idPagante: document.getElementById('form-plano-pagante').value
  };

  const resultado = id
    ? await chamarBackend('atualizarPlano', { id, plano: dados })
    : await chamarBackend('criarPlano', { plano: dados });

  const mensagemPadrao = id ? 'Plano atualizado!' : 'Plano criado! O plano anterior (se existia) foi encerrado automaticamente.';
  exibirToast(resultado.mensagem || (resultado.sucesso ? mensagemPadrao : 'Erro ao salvar.'), resultado.sucesso ? 'sucesso' : 'erro');
  if (resultado.sucesso) { limparFormPlano(); carregarPlanosGeral(); }
}

/* ============================== CONFIGURAÇÕES ============================== */
async function carregarConfiguracoes() {
  const resultado = await chamarBackend('obterConfiguracoes');
  if (!resultado.sucesso) return;
  document.getElementById('form-config-dia').value = resultado.diaVencimento || 10;
  document.getElementById('form-config-nome').value = resultado.nomeRecebedor || '';
  document.getElementById('form-config-pix').value = resultado.chavePix || '';
}

async function salvarConfiguracoes(evento) {
  evento.preventDefault();
  const configuracoes = {
    diaVencimento: document.getElementById('form-config-dia').value,
    nomeRecebedor: document.getElementById('form-config-nome').value.trim(),
    chavePix: document.getElementById('form-config-pix').value.trim()
  };
  const resultado = await chamarBackend('atualizarConfiguracoes', { configuracoes });
  exibirToast(resultado.sucesso ? 'Configurações salvas!' : (resultado.mensagem || 'Erro ao salvar.'), resultado.sucesso ? 'sucesso' : 'erro');
}

/* ============================== FINANCEIRO ============================== */
async function carregarFinanceiro() {
  const resultado = await chamarBackend('listarExtratoGeral');
  if (!resultado.sucesso) { exibirToast(resultado.mensagem, 'erro'); return; }

  document.getElementById('corpo-tabela-financeiro').innerHTML = resultado.extrato.map(r => {
    let tag = '<span class="tag tag-pendente">Pendente</span>';
    if (r.pago) tag = '<span class="tag tag-pago">Pago</span>';
    else if (r.informouPagamento) tag = '<span class="tag tag-aguardando">Gerou QR Code</span>';
    const quandoInformadoAttr = (!r.pago && r.informouPagamento) ? `'${r.quandoInformou}'` : 'null';
    return `
    <tr>
      <td>${r.nomeUsuario}</td>
      <td>${formatarData(r.vencimento)}</td>
      <td class="mono">${formatarMoeda(r.valorDevidoInicial)}</td>
      <td class="mono">${formatarMoeda(r.encargos || 0)}</td>
      <td class="mono">${formatarMoeda(r.valorTotal)}</td>
      <td>${tag}</td>
      <td>${!r.pago ? `<button class="link-acao" onclick="confirmarPagamento('${r.id}', ${r.valorTotal}, ${quandoInformadoAttr})">Confirmar recebimento</button>` : formatarData(r.dataPagamento)}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" class="vazio">Nenhum lançamento no extrato geral.</td></tr>';
}

async function confirmarPagamento(idExtrato, valorSugerido, quandoInformou) {
  const valorPago = prompt('Valor recebido:', valorSugerido);
  if (valorPago === null) return;

  // Se o usuário já informou o pagamento pelo app, usa a data que ele
  // informou (QUANDO) em vez de perguntar — DATA PAGAMENTO <- QUANDO.
  let dataPagamento = quandoInformou;
  if (!dataPagamento) {
    dataPagamento = prompt('Data do pagamento (AAAA-MM-DD):', new Date().toISOString().substring(0, 10));
    if (dataPagamento === null) return;
  }

  const resultado = await chamarBackend('confirmarPagamento', { idExtrato, valorPago, dataPagamento });
  exibirToast(resultado.sucesso ? 'Pagamento confirmado!' : (resultado.mensagem || 'Erro ao confirmar.'), resultado.sucesso ? 'sucesso' : 'erro');
  if (resultado.sucesso) carregarFinanceiro();
}

async function gerarCobrancasMensais() {
  if (!confirm('Gerar as cobranças deste mês para todos os usuários com cotas ativas?')) return;
  const resultado = await chamarBackend('gerarCobrancasMensais');
  exibirToast(resultado.mensagem || (resultado.sucesso ? 'Cobranças geradas!' : 'Erro ao gerar cobranças.'), resultado.sucesso ? 'sucesso' : 'erro');
  if (resultado.sucesso) carregarFinanceiro();
}