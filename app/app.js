const local = new PouchDB('notas');

const remoto = new PouchDB(COUCH_URL, {
  auth: { username: COUCH_USER, password: COUCH_PASS }
});

const statusEl = document.getElementById('status');
const listaEl = document.getElementById('lista');

local.sync(remoto, { live: true, retry: true })
  .on('active', () => statusEl.textContent = 'Sincronizando...')
  .on('paused', () => statusEl.textContent = 'Sincronizado ou offline aguardando conexão')
  .on('denied', e => statusEl.textContent = 'Acesso negado: ' + e)
  .on('error', e => statusEl.textContent = 'Erro de sincronização: ' + e.message);

const campoTitulo = document.getElementById('titulo');
const campoTexto = document.getElementById('texto');
const campoBusca = document.getElementById('busca');
const botaoSalvar = document.getElementById('salvar');
const botaoCancelar = document.getElementById('cancelar');

let editando = null;

local.changes({ live: true, since: 'now' }).on('change', mostrarNotas);

campoBusca.addEventListener('input', mostrarNotas);

function formatarData(doc) {
  const data = new Date(doc.criadoEm || doc._id);
  return isNaN(data) ? '' : data.toLocaleString('pt-BR');
}

async function mostrarNotas() {
  const filtro = campoBusca.value.trim().toLowerCase();
  const res = await local.allDocs({ include_docs: true, descending: true });
  listaEl.innerHTML = '';

  res.rows.map(linha => linha.doc)
    .filter(doc =>((doc.titulo || '') + ' ' + (doc.texto || '')).toLowerCase().includes(filtro))
    .forEach(doc => {
      const li = document.createElement('li');

      const conteudo = document.createElement('div');

      const titulo = document.createElement('span');
      titulo.className = 'nota-titulo';
      titulo.textContent = doc.titulo || '(sem título)';

      const texto = document.createElement('span');
      texto.className = 'nota-texto';
      texto.textContent = doc.texto;

      const data = document.createElement('span');
      data.className = 'nota-data';
      data.textContent = formatarData(doc) + (doc.editadoEm ? ' (editada)' : '');

      conteudo.append(titulo, texto, data);

      const botaoEditar = document.createElement('button');
      botaoEditar.textContent = 'Editar';
      botaoEditar.onclick = () => entrarNoModoEdicao(doc);

      const botaoExcluir = document.createElement('button');
      botaoExcluir.textContent = 'Excluir';
      botaoExcluir.onclick = () =>{
        if (editando && editando._id === doc._id) sairDoModoEdicao();
        local.remove(doc);
      };

      const acoes = document.createElement('div');
      acoes.className = 'acoes';
      acoes.append(botaoEditar, botaoExcluir);

      li.append(conteudo, acoes);
      listaEl.appendChild(li);
    });
}

function entrarNoModoEdicao(doc) {
  editando = doc;
  campoTitulo.value = doc.titulo || '';
  campoTexto.value = doc.texto || '';
  botaoSalvar.textContent = 'Atualizar nota';
  botaoCancelar.hidden = false;
  campoTitulo.focus();
}

function sairDoModoEdicao() {
  editando = null;
  campoTitulo.value = '';
  campoTexto.value = '';
  botaoSalvar.textContent = 'Salvar nota';
  botaoCancelar.hidden = true;
}

botaoCancelar.onclick = sairDoModoEdicao;

botaoSalvar.onclick = async () => {
  const titulo = campoTitulo.value.trim();
  const texto = campoTexto.value.trim();
  if (!titulo && !texto) return;

  if (editando) {
    const atual = await local.get(editando._id);
    await local.put({ ...atual, titulo, texto, editadoEm: new Date().toISOString() });
  } else {
    const agora = new Date().toISOString();
    await local.put({ _id: agora, titulo, texto, criadoEm: agora });
  }

  sairDoModoEdicao();
};
mostrarNotas();
