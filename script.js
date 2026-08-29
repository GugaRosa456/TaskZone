/* ==========================================================================
   TaskZone — script.js
   Aplicação de gerenciamento de tarefas pessoais (Casa / Escola / Jogos).
   100% JavaScript puro, sem backend — todos os dados ficam no localStorage.
   ========================================================================== */

/* ==========================================================================
   TaskZone — script.js (Parte 1: dados)
   Camada de dados: localStorage, tarefas de demonstração, metadados de
   categorias/prioridades/conquistas e funções utilitárias de data.
   ========================================================================== */

const TZ = {}; // namespace único para evitar poluir o escopo global

TZ.KEYS = {
  TAREFAS: "taskzone_tarefas",
  TEMA: "taskzone_tema",
  CONFIG: "taskzone_config",
  CONQUISTAS: "taskzone_conquistas",
  SEED: "taskzone_seed_aplicada"
};

TZ.CATEGORIAS = {
  casa:   { nome: "Casa",              icone: "🏠", cor: "casa" },
  escola: { nome: "Escola / Faculdade", icone: "🎓", cor: "escola" },
  jogos:  { nome: "Jogos",             icone: "🎮", cor: "jogos" }
};

TZ.PRIORIDADES = {
  alta:  { nome: "Alta prioridade",  icone: "🔴", peso: 3 },
  media: { nome: "Média prioridade", icone: "🟡", peso: 2 },
  baixa: { nome: "Baixa prioridade", icone: "🟢", peso: 1 }
};

TZ.REPETICOES = {
  nao: "Não repetir",
  diaria: "Todos os dias",
  semanal: "Toda semana",
  mensal: "Todo mês"
};

TZ.CONQUISTAS_DEF = [
  { id: "primeira", icone: "🏆", nome: "Primeira tarefa", desc: "Conclua sua primeira tarefa.", meta: (s) => s.totalConcluidas >= 1 },
  { id: "sequencia7", icone: "🔥", nome: "Em sequência", desc: "Conclua tarefas durante 7 dias seguidos.", meta: (s) => s.sequenciaAtual >= 7 },
  { id: "centenario", icone: "💯", nome: "Centenário", desc: "Conclua 100 tarefas.", meta: (s) => s.totalConcluidas >= 100 },
  { id: "estudioso", icone: "🎓", nome: "Estudioso", desc: "Conclua 25 tarefas da escola/faculdade.", meta: (s) => s.porCategoria.escola.concluidas >= 25 },
  { id: "gamer", icone: "🎮", nome: "Gamer", desc: "Conclua 25 tarefas relacionadas a jogos.", meta: (s) => s.porCategoria.jogos.concluidas >= 25 },
  { id: "casaOrganizada", icone: "🏠", nome: "Casa organizada", desc: "Conclua 25 tarefas de casa.", meta: (s) => s.porCategoria.casa.concluidas >= 25 }
];

/* -------------------------------------------------------------------- */
/* Tarefas de demonstração                                               */
/* -------------------------------------------------------------------- */
TZ.gerarId = () => "t-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

TZ.dataISO = (offsetDias = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
};

TZ.tarefasDemo = () => {
  const agora = new Date().toISOString();
  return [
    { id: TZ.gerarId(), nome: "Arrumar o quarto", descricao: "Organizar roupas e mesa de estudo.", categoria: "casa", vencimento: TZ.dataISO(0), horario: "", prioridade: "media", repeticao: "nao", observacao: "", status: "pendente", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Estudar Java", descricao: "Revisar coleções e streams.", categoria: "escola", vencimento: TZ.dataISO(0), horario: "19:00", prioridade: "alta", repeticao: "nao", observacao: "", status: "pendente", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Fazer trabalho da faculdade", descricao: "Trabalho de Engenharia de Software.", categoria: "escola", vencimento: TZ.dataISO(-2), horario: "", prioridade: "alta", repeticao: "nao", observacao: "", status: "pendente", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Completar missão principal", descricao: "Avançar na campanha do jogo novo.", categoria: "jogos", vencimento: TZ.dataISO(1), horario: "", prioridade: "baixa", repeticao: "nao", observacao: "", status: "pendente", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Conseguir novo equipamento", descricao: "Farmar recursos para o upgrade.", categoria: "jogos", vencimento: TZ.dataISO(3), horario: "", prioridade: "baixa", repeticao: "nao", observacao: "", status: "pendente", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Tirar o lixo", descricao: "", categoria: "casa", vencimento: TZ.dataISO(0), horario: "", prioridade: "media", repeticao: "diaria", observacao: "", status: "pendente", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Lavar a louça", descricao: "", categoria: "casa", vencimento: TZ.dataISO(-1), horario: "", prioridade: "baixa", repeticao: "nao", observacao: "", status: "concluida", criadoEm: TZ.dataISO(-1), concluidoEm: new Date(Date.now() - 86400000).toISOString(), arquivada: false }
  ];
};

TZ.garantirSeed = () => {
  if (!localStorage.getItem(TZ.KEYS.SEED)) {
    localStorage.setItem(TZ.KEYS.TAREFAS, JSON.stringify(TZ.tarefasDemo()));
    localStorage.setItem(TZ.KEYS.SEED, "1");
  }
};

/* -------------------------------------------------------------------- */
/* Leitura / escrita no localStorage                                     */
/* -------------------------------------------------------------------- */
TZ.lerTarefas = () => {
  TZ.garantirSeed();
  try { return JSON.parse(localStorage.getItem(TZ.KEYS.TAREFAS)) || []; }
  catch (e) { console.error("Erro ao ler tarefas:", e); return []; }
};
TZ.salvarTarefas = (tarefas) => localStorage.setItem(TZ.KEYS.TAREFAS, JSON.stringify(tarefas));

TZ.lerTema = () => localStorage.getItem(TZ.KEYS.TEMA) || "escuro";
TZ.salvarTema = (t) => localStorage.setItem(TZ.KEYS.TEMA, t);

TZ.lerConfig = () => {
  try { return { animacoes: true, ...JSON.parse(localStorage.getItem(TZ.KEYS.CONFIG) || "{}") }; }
  catch (e) { return { animacoes: true }; }
};
TZ.salvarConfig = (cfg) => localStorage.setItem(TZ.KEYS.CONFIG, JSON.stringify(cfg));

TZ.lerConquistas = () => {
  try { return JSON.parse(localStorage.getItem(TZ.KEYS.CONQUISTAS)) || []; }
  catch (e) { return []; }
};
TZ.salvarConquistas = (lista) => localStorage.setItem(TZ.KEYS.CONQUISTAS, JSON.stringify(lista));

TZ.comecarDoZero = () => {
  localStorage.setItem(TZ.KEYS.TAREFAS, JSON.stringify([]));
  localStorage.setItem(TZ.KEYS.SEED, "1");
};
TZ.restaurarDemo = () => {
  localStorage.setItem(TZ.KEYS.TAREFAS, JSON.stringify(TZ.tarefasDemo()));
  localStorage.setItem(TZ.KEYS.SEED, "1");
};
TZ.apagarTudo = () => {
  Object.values(TZ.KEYS).forEach(k => localStorage.removeItem(k));
};

/* -------------------------------------------------------------------- */
/* Utilitários de data                                                   */
/* -------------------------------------------------------------------- */
TZ.hojeISO = () => new Date().toISOString().slice(0, 10);

TZ.formatarDataBR = (isoDate) => {
  if (!isoDate) return "";
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
};

TZ.formatarDataHoraBR = (isoDateTime) => {
  if (!isoDateTime) return "";
  const d = new Date(isoDateTime);
  const data = d.toLocaleDateString("pt-BR");
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
};

TZ.formatarHoraBR = (isoDateTime) => {
  if (!isoDateTime) return "";
  return new Date(isoDateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

TZ.isHoje = (isoDate) => isoDate === TZ.hojeISO();

TZ.isAtrasada = (tarefa) => {
  if (tarefa.status === "concluida" || !tarefa.vencimento) return false;
  return tarefa.vencimento < TZ.hojeISO();
};

TZ.diasAtraso = (isoDate) => {
  const hoje = new Date(TZ.hojeISO() + "T00:00:00");
  const venc = new Date(isoDate + "T00:00:00");
  return Math.max(Math.round((hoje - venc) / 86400000), 0);
};

TZ.nomeDiaCurto = (data) => data.toLocaleDateString("pt-BR", { weekday: "short" });

/* -------------------------------------------------------------------- */
/* Recorrência                                                           */
/* -------------------------------------------------------------------- */
TZ.proximaData = (isoDate, tipo) => {
  const d = new Date(isoDate + "T00:00:00");
  if (tipo === "diaria") d.setDate(d.getDate() + 1);
  else if (tipo === "semanal") d.setDate(d.getDate() + 7);
  else if (tipo === "mensal") d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
};

/* -------------------------------------------------------------------- */
/* Estatísticas agregadas — usado no dashboard, estatísticas e conquistas */
/* -------------------------------------------------------------------- */
TZ.calcularEstatisticas = (tarefas) => {
  const ativas = tarefas.filter(t => !t.arquivada);
  const concluidas = ativas.filter(t => t.status === "concluida");
  const pendentes = ativas.filter(t => t.status === "pendente");
  const atrasadas = pendentes.filter(TZ.isAtrasada);
  const hoje = ativas.filter(t => t.vencimento && TZ.isHoje(t.vencimento));
  const hojeConcluidas = hoje.filter(t => t.status === "concluida");

  const porCategoria = {};
  Object.keys(TZ.CATEGORIAS).forEach(cat => {
    const doCat = ativas.filter(t => t.categoria === cat);
    porCategoria[cat] = {
      total: doCat.length,
      concluidas: doCat.filter(t => t.status === "concluida").length
    };
  });

  const categoriaComMais = Object.keys(porCategoria).reduce((a, b) => porCategoria[a].total >= porCategoria[b].total ? a : b, "casa");
  const categoriaComMelhorTaxa = Object.keys(porCategoria).reduce((a, b) => {
    const taxaA = porCategoria[a].total > 0 ? porCategoria[a].concluidas / porCategoria[a].total : 0;
    const taxaB = porCategoria[b].total > 0 ? porCategoria[b].concluidas / porCategoria[b].total : 0;
    return taxaA >= taxaB ? a : b;
  }, "casa");

  return {
    total: ativas.length,
    totalConcluidas: concluidas.length,
    totalPendentes: pendentes.length,
    totalAtrasadas: atrasadas.length,
    hojeTotal: hoje.length,
    hojeConcluidas: hojeConcluidas.length,
    progressoHoje: hoje.length > 0 ? Math.round((hojeConcluidas.length / hoje.length) * 100) : 0,
    progressoGeral: ativas.length > 0 ? Math.round((concluidas.length / ativas.length) * 100) : 0,
    porCategoria,
    categoriaComMais,
    categoriaComMelhorTaxa,
    sequenciaAtual: TZ.calcularSequencia(ativas)
  };
};

/* Sequência: quantos dias consecutivos (contando hoje para trás) tiveram
   ao menos uma tarefa concluída. */
TZ.calcularSequencia = (tarefas) => {
  const diasComConclusao = new Set(
    tarefas.filter(t => t.status === "concluida" && t.concluidoEm)
      .map(t => t.concluidoEm.slice(0, 10))
  );
  let sequencia = 0;
  let cursor = new Date(TZ.hojeISO() + "T00:00:00");

  // Se hoje ainda não tem conclusão, a sequência é contada a partir de ontem
  // (para não zerar a sequência só porque o dia ainda não acabou).
  if (!diasComConclusao.has(TZ.hojeISO())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (diasComConclusao.has(iso)) {
      sequencia++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return sequencia;
};

/* ==========================================================================
   TaskZone — script.js (Parte 2: tarefas — CRUD, modal, filtros, busca)
   ========================================================================== */

TZ.estado = {
  viewAtual: "dashboard",
  filtroRapido: "todas",       // todas | pendentes | concluidas | atrasadas | hoje
  filtroCategoria: "todas",    // todas | casa | escola | jogos
  ordenacao: "recentes",       // recentes | antigas | prioridade | vencimento | nome
  busca: "",
  idEmEdicao: null,
  idParaExcluir: null,
  diaCalendarioSelecionado: null,
  mesCalendario: new Date()
};

/* -------------------------------------------------------------------- */
/* Modal de tarefa (criar/editar)                                        */
/* -------------------------------------------------------------------- */
function abrirModalTarefa(id, categoriaPreDefinida) {
  const form = document.getElementById("form-tarefa");
  form.reset();
  document.querySelectorAll(".priority-picker .pick-option").forEach(o => o.classList.remove("selected"));
  document.querySelectorAll(".category-picker .pick-option").forEach(o => o.classList.remove("selected"));

  if (id) {
    TZ.estado.idEmEdicao = id;
    const tarefa = TZ.lerTarefas().find(t => t.id === id);
    if (!tarefa) return;
    document.getElementById("modal-tarefa-titulo").textContent = "Editar tarefa";
    document.getElementById("tarefa-nome").value = tarefa.nome;
    document.getElementById("tarefa-descricao").value = tarefa.descricao || "";
    document.getElementById("tarefa-vencimento").value = tarefa.vencimento || "";
    document.getElementById("tarefa-horario").value = tarefa.horario || "";
    document.getElementById("tarefa-repeticao").value = tarefa.repeticao || "nao";
    document.getElementById("tarefa-observacao").value = tarefa.observacao || "";
    selecionarPickOption("category-picker", tarefa.categoria);
    selecionarPickOption("priority-picker", tarefa.prioridade);
  } else {
    TZ.estado.idEmEdicao = null;
    document.getElementById("modal-tarefa-titulo").textContent = "Nova tarefa";
    document.getElementById("tarefa-vencimento").value = TZ.hojeISO();
    selecionarPickOption("category-picker", categoriaPreDefinida || "casa");
    selecionarPickOption("priority-picker", "media");
  }

  abrirModal("modal-tarefa");
  document.getElementById("tarefa-nome").focus();
}

function selecionarPickOption(grupoId, valor) {
  const grupo = document.getElementById(grupoId);
  if (!grupo) return;
  grupo.querySelectorAll(".pick-option").forEach(o => {
    o.classList.toggle("selected", o.dataset.valor === valor);
  });
  grupo.dataset.selecionado = valor;
}

function inicializarPickers() {
  ["category-picker", "priority-picker"].forEach(grupoId => {
    const grupo = document.getElementById(grupoId);
    if (!grupo) return;
    grupo.addEventListener("click", (e) => {
      const opt = e.target.closest(".pick-option");
      if (!opt) return;
      selecionarPickOption(grupoId, opt.dataset.valor);
    });
  });
}

function salvarTarefaForm(e) {
  e.preventDefault();

  const nome = document.getElementById("tarefa-nome").value.trim();
  const descricao = document.getElementById("tarefa-descricao").value.trim();
  const vencimento = document.getElementById("tarefa-vencimento").value;
  const horario = document.getElementById("tarefa-horario").value;
  const repeticao = document.getElementById("tarefa-repeticao").value;
  const observacao = document.getElementById("tarefa-observacao").value.trim();
  const categoria = document.getElementById("category-picker").dataset.selecionado || "casa";
  const prioridade = document.getElementById("priority-picker").dataset.selecionado || "media";

  if (!nome) return;

  const tarefas = TZ.lerTarefas();

  if (TZ.estado.idEmEdicao) {
    const idx = tarefas.findIndex(t => t.id === TZ.estado.idEmEdicao);
    if (idx > -1) {
      tarefas[idx] = { ...tarefas[idx], nome, descricao, categoria, vencimento, horario, prioridade, repeticao, observacao };
    }
  } else {
    tarefas.push({
      id: TZ.gerarId(), nome, descricao, categoria, vencimento, horario, prioridade, repeticao, observacao,
      status: "pendente", criadoEm: new Date().toISOString(), concluidoEm: null, arquivada: false
    });
  }

  TZ.salvarTarefas(tarefas);
  fecharModal("modal-tarefa");
  atualizarViewAtual();
  verificarNovasConquistas();
}

/* -------------------------------------------------------------------- */
/* Ações sobre tarefas: concluir, desfazer, excluir, arquivar             */
/* -------------------------------------------------------------------- */
function alternarConclusao(id) {
  const tarefas = TZ.lerTarefas();
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;

  if (tarefa.status === "concluida") {
    tarefa.status = "pendente";
    tarefa.concluidoEm = null;
  } else {
    tarefa.status = "concluida";
    tarefa.concluidoEm = new Date().toISOString();

    // Gera a próxima ocorrência se a tarefa for recorrente
    if (tarefa.repeticao && tarefa.repeticao !== "nao" && tarefa.vencimento) {
      tarefas.push({
        id: TZ.gerarId(),
        nome: tarefa.nome,
        descricao: tarefa.descricao,
        categoria: tarefa.categoria,
        vencimento: TZ.proximaData(tarefa.vencimento, tarefa.repeticao),
        horario: tarefa.horario,
        prioridade: tarefa.prioridade,
        repeticao: tarefa.repeticao,
        observacao: tarefa.observacao,
        status: "pendente",
        criadoEm: new Date().toISOString(),
        concluidoEm: null,
        arquivada: false
      });
    }
  }

  TZ.salvarTarefas(tarefas);
  atualizarViewAtual();
  verificarNovasConquistas();
}

function pedirExclusao(id) {
  TZ.estado.idParaExcluir = id;
  abrirModal("modal-confirmar-exclusao");
}

function confirmarExclusao() {
  if (!TZ.estado.idParaExcluir) return;
  let tarefas = TZ.lerTarefas();
  tarefas = tarefas.filter(t => t.id !== TZ.estado.idParaExcluir);
  TZ.salvarTarefas(tarefas);
  TZ.estado.idParaExcluir = null;
  fecharModal("modal-confirmar-exclusao");
  atualizarViewAtual();
}

function alternarArquivamento(id) {
  const tarefas = TZ.lerTarefas();
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;
  tarefa.arquivada = !tarefa.arquivada;
  TZ.salvarTarefas(tarefas);
  atualizarViewAtual();
}

/* -------------------------------------------------------------------- */
/* Filtragem, busca e ordenação                                          */
/* -------------------------------------------------------------------- */
function obterTarefasFiltradas(incluirArquivadas = false) {
  let tarefas = TZ.lerTarefas().filter(t => incluirArquivadas ? t.arquivada : !t.arquivada);

  const { filtroRapido, filtroCategoria, ordenacao, busca } = TZ.estado;

  if (filtroRapido === "pendentes") tarefas = tarefas.filter(t => t.status === "pendente");
  else if (filtroRapido === "concluidas") tarefas = tarefas.filter(t => t.status === "concluida");
  else if (filtroRapido === "atrasadas") tarefas = tarefas.filter(TZ.isAtrasada);
  else if (filtroRapido === "hoje") tarefas = tarefas.filter(t => t.vencimento && TZ.isHoje(t.vencimento));

  if (filtroCategoria !== "todas") tarefas = tarefas.filter(t => t.categoria === filtroCategoria);

  if (busca.trim()) {
    const termo = busca.trim().toLowerCase();
    tarefas = tarefas.filter(t =>
      t.nome.toLowerCase().includes(termo) ||
      (t.descricao || "").toLowerCase().includes(termo) ||
      TZ.CATEGORIAS[t.categoria].nome.toLowerCase().includes(termo)
    );
  }

  tarefas = ordenarTarefas(tarefas, ordenacao);
  return tarefas;
}

function ordenarTarefas(tarefas, ordenacao) {
  const copia = [...tarefas];
  switch (ordenacao) {
    case "antigas":
      return copia.sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm));
    case "prioridade":
      return copia.sort((a, b) => TZ.PRIORIDADES[b.prioridade].peso - TZ.PRIORIDADES[a.prioridade].peso);
    case "vencimento":
      return copia.sort((a, b) => (a.vencimento || "9999").localeCompare(b.vencimento || "9999"));
    case "nome":
      return copia.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    case "recentes":
    default:
      return copia.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  }
}

/* -------------------------------------------------------------------- */
/* Renderização de um card de tarefa (reutilizado em várias views)       */
/* -------------------------------------------------------------------- */
function renderizarCardTarefa(tarefa, opcoes = {}) {
  const cat = TZ.CATEGORIAS[tarefa.categoria];
  const pri = TZ.PRIORIDADES[tarefa.prioridade];
  const atrasada = TZ.isAtrasada(tarefa);
  const concluida = tarefa.status === "concluida";

  const classes = [
    "task-card",
    `prioridade-${tarefa.prioridade}`,
    concluida ? "concluida" : "",
    atrasada ? "atrasada" : ""
  ].filter(Boolean).join(" ");

  const metaVencimento = tarefa.vencimento
    ? `<span class="meta-item">📅 ${TZ.formatarDataBR(tarefa.vencimento)}${tarefa.horario ? " · " + tarefa.horario : ""}</span>`
    : "";

  const metaAtraso = atrasada
    ? `<span class="chip tag-atrasada">⚠️ Atrasada há ${TZ.diasAtraso(tarefa.vencimento)} dia(s)</span>`
    : "";

  const metaRepeticao = tarefa.repeticao && tarefa.repeticao !== "nao"
    ? `<span class="meta-item">🔁 ${TZ.REPETICOES[tarefa.repeticao]}</span>`
    : "";

  const conclusaoHtml = concluida
    ? `<div class="task-conclusao">✓ Concluída em ${TZ.formatarDataHoraBR(tarefa.concluidoEm)}</div>`
    : "";

  const botaoArquivar = opcoes.mostrarArquivar !== false
    ? `<button onclick="alternarArquivamento('${tarefa.id}')" title="${tarefa.arquivada ? "Restaurar" : "Arquivar"}">${tarefa.arquivada ? "♻️" : "🗄️"}</button>`
    : "";

  return `
    <div class="${classes}" data-id="${tarefa.id}">
      <div class="task-check" onclick="alternarConclusao('${tarefa.id}')" role="checkbox" aria-checked="${concluida}" tabindex="0" title="${concluida ? "Desfazer conclusão" : "Concluir tarefa"}">${concluida ? "✓" : ""}</div>
      <div class="task-body">
        <div class="task-top-row">
          <div>
            <div class="task-nome">${escaparHtml(tarefa.nome)}</div>
            ${tarefa.descricao ? `<div class="task-desc">${escaparHtml(tarefa.descricao)}</div>` : ""}
          </div>
        </div>
        <div class="task-meta">
          <span class="chip tag-${cat.cor}">${cat.icone} ${cat.nome}</span>
          <span class="chip tag-${tarefa.prioridade}">${pri.icone} ${pri.nome}</span>
          ${metaVencimento}
          ${metaRepeticao}
          ${metaAtraso}
        </div>
        ${conclusaoHtml}
      </div>
      <div class="task-actions">
        <button onclick="abrirModalTarefa('${tarefa.id}')" title="Editar">✏️</button>
        ${botaoArquivar}
        <button onclick="pedirExclusao('${tarefa.id}')" title="Excluir">🗑️</button>
      </div>
    </div>`;
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

/* -------------------------------------------------------------------- */
/* View: Todas as tarefas / categorias                                   */
/* -------------------------------------------------------------------- */
function renderizarViewTarefas() {
  const lista = document.getElementById("lista-tarefas");
  if (!lista) return;

  const tarefas = obterTarefasFiltradas(false);

  if (tarefas.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="ic">📭</div>
        <p>Nenhuma tarefa encontrada com os filtros atuais.</p>
        <button class="btn btn-primary btn-sm" onclick="abrirModalTarefa()">+ Nova tarefa</button>
      </div>`;
    return;
  }

  lista.innerHTML = tarefas.map(t => renderizarCardTarefa(t)).join("");
}

function definirFiltroCategoria(categoria) {
  TZ.estado.filtroCategoria = categoria;
  TZ.estado.filtroRapido = "todas";
  trocarView("tarefas");
  sincronizarControlesFiltro();
  renderizarViewTarefas();
}

function sincronizarControlesFiltro() {
  document.querySelectorAll("[data-filtro-rapido]").forEach(el =>
    el.classList.toggle("active", el.dataset.filtroRapido === TZ.estado.filtroRapido));
  document.querySelectorAll("[data-filtro-categoria]").forEach(el =>
    el.classList.toggle("active", el.dataset.filtroCategoria === TZ.estado.filtroCategoria));
  const selectOrdenacao = document.getElementById("select-ordenacao");
  if (selectOrdenacao) selectOrdenacao.value = TZ.estado.ordenacao;
  const inputBusca = document.getElementById("input-busca");
  if (inputBusca) inputBusca.value = TZ.estado.busca;
}

function inicializarControlesTarefas() {
  document.querySelectorAll("[data-filtro-rapido]").forEach(btn => {
    btn.addEventListener("click", () => {
      TZ.estado.filtroRapido = btn.dataset.filtroRapido;
      sincronizarControlesFiltro();
      renderizarViewTarefas();
    });
  });

  document.querySelectorAll("[data-filtro-categoria]").forEach(btn => {
    btn.addEventListener("click", () => {
      TZ.estado.filtroCategoria = btn.dataset.filtroCategoria;
      sincronizarControlesFiltro();
      renderizarViewTarefas();
    });
  });

  const selectOrdenacao = document.getElementById("select-ordenacao");
  if (selectOrdenacao) {
    selectOrdenacao.addEventListener("change", () => {
      TZ.estado.ordenacao = selectOrdenacao.value;
      renderizarViewTarefas();
    });
  }

  const inputBusca = document.getElementById("input-busca");
  if (inputBusca) {
    inputBusca.addEventListener("input", () => {
      TZ.estado.busca = inputBusca.value;
      renderizarViewTarefas();
    });
  }

  const btnNovaTarefa = document.getElementById("btn-nova-tarefa");
  if (btnNovaTarefa) btnNovaTarefa.addEventListener("click", () => abrirModalTarefa());
  const btnFab = document.getElementById("btn-fab-nova-tarefa");
  if (btnFab) btnFab.addEventListener("click", () => abrirModalTarefa());

  const formTarefa = document.getElementById("form-tarefa");
  if (formTarefa) formTarefa.addEventListener("submit", salvarTarefaForm);

  const btnConfirmarExclusao = document.getElementById("btn-confirmar-exclusao");
  if (btnConfirmarExclusao) btnConfirmarExclusao.addEventListener("click", confirmarExclusao);
}

/* -------------------------------------------------------------------- */
/* View: Arquivadas                                                      */
/* -------------------------------------------------------------------- */
function renderizarViewArquivadas() {
  const lista = document.getElementById("lista-arquivadas");
  if (!lista) return;
  const tarefas = TZ.lerTarefas().filter(t => t.arquivada);

  if (tarefas.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="ic">🗄️</div><p>Nenhuma tarefa arquivada.</p></div>`;
    return;
  }
  lista.innerHTML = tarefas.map(t => renderizarCardTarefa(t)).join("");
}

/* ==========================================================================
   TaskZone — script.js (Parte 3: Dashboard)
   ========================================================================== */

function renderizarDashboard() {
  const tarefas = TZ.lerTarefas().filter(t => !t.arquivada);
  const stats = TZ.calcularEstatisticas(tarefas);

  document.getElementById("metric-total").textContent = stats.total;
  document.getElementById("metric-concluidas").textContent = stats.totalConcluidas;
  document.getElementById("metric-pendentes").textContent = stats.totalPendentes;
  const elAtrasadas = document.getElementById("metric-atrasadas");
  elAtrasadas.textContent = stats.totalAtrasadas;
  elAtrasadas.classList.toggle("alerta", stats.totalAtrasadas > 0);

  renderizarAnelProgresso(stats);
  renderizarProgressoCategorias(stats);
  renderizarResumoInteligente(stats);
  renderizarNotificacoesDashboard(stats);
  renderizarTarefasHoje(tarefas);
  renderizarHistorico(tarefas);
}

/* -------------------------------------------------------------------- */
/* Anel de progresso (SVG) — "Progresso de hoje"                         */
/* -------------------------------------------------------------------- */
function renderizarAnelProgresso(stats) {
  const circulo = document.getElementById("ring-fill");
  const label = document.getElementById("ring-pct");
  const sub = document.getElementById("ring-sub");
  if (!circulo) return;

  const raio = 54;
  const circunferencia = 2 * Math.PI * raio;
  const pct = stats.progressoHoje;
  const offset = circunferencia - (pct / 100) * circunferencia;

  circulo.style.strokeDasharray = `${circunferencia}`;
  circulo.style.strokeDashoffset = `${circunferencia}`; // estado inicial para animar
  requestAnimationFrame(() => {
    circulo.style.strokeDashoffset = `${offset}`;
  });

  label.textContent = `${pct}%`;
  sub.textContent = stats.hojeTotal > 0
    ? `${stats.hojeConcluidas} de ${stats.hojeTotal} tarefas concluídas`
    : "Nenhuma tarefa para hoje";
}

/* -------------------------------------------------------------------- */
/* Progresso por categoria                                               */
/* -------------------------------------------------------------------- */
function renderizarProgressoCategorias(stats) {
  const container = document.getElementById("progresso-categorias");
  if (!container) return;

  container.innerHTML = Object.keys(TZ.CATEGORIAS).map(cat => {
    const meta = TZ.CATEGORIAS[cat];
    const dados = stats.porCategoria[cat];
    const pct = dados.total > 0 ? Math.round((dados.concluidas / dados.total) * 100) : 0;
    return `
      <div class="cat-progress-item">
        <div class="cat-progress-top">
          <span class="nome">${meta.icone} ${meta.nome}</span>
          <span class="num mono">${dados.concluidas}/${dados.total}</span>
        </div>
        <div class="progress-track"><div class="progress-fill ${meta.cor}" style="width:${pct}%"></div></div>
      </div>`;
  }).join("");
}

/* -------------------------------------------------------------------- */
/* Resumo inteligente do dia                                             */
/* -------------------------------------------------------------------- */
function renderizarResumoInteligente(stats) {
  const container = document.getElementById("resumo-inteligente");
  if (!container) return;

  let resumo;
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  if (stats.hojeTotal === 0) {
    resumo = { ic: "🌤️", titulo: `${saudacao}!`, texto: "Você não tem tarefas com vencimento hoje. Que tal planejar algo?" };
  } else if (stats.hojeConcluidas === stats.hojeTotal) {
    resumo = { ic: "🎉", titulo: "Tudo certo!", texto: "Você concluiu todas as tarefas de hoje. Parabéns!" };
  } else if (stats.totalAtrasadas > 0) {
    resumo = { ic: "⚠️", titulo: "Atenção!", texto: `Você possui ${stats.totalAtrasadas} tarefa(s) atrasada(s). Dê uma olhada nelas.` };
  } else if (stats.hojeConcluidas > 0) {
    resumo = { ic: "🔥", titulo: "Mandou bem!", texto: `Você já concluiu ${stats.hojeConcluidas} de ${stats.hojeTotal} tarefas hoje.` };
  } else {
    resumo = { ic: "☀️", titulo: `${saudacao}!`, texto: `Você tem ${stats.hojeTotal} tarefa(s) para hoje.` };
  }

  container.innerHTML = `
    <span class="ic">${resumo.ic}</span>
    <div>
      <h3>${resumo.titulo}</h3>
      <p>${resumo.texto}</p>
    </div>`;
}

/* -------------------------------------------------------------------- */
/* Notificações visuais do dashboard                                     */
/* -------------------------------------------------------------------- */
function renderizarNotificacoesDashboard(stats) {
  const container = document.getElementById("notificacoes-dashboard");
  if (!container) return;

  const notices = [];
  if (stats.hojeTotal - stats.hojeConcluidas > 0) {
    notices.push({ tipo: "info", icone: "🔔", texto: `Você possui ${stats.hojeTotal - stats.hojeConcluidas} tarefa(s) vencendo hoje.` });
  }
  if (stats.totalAtrasadas > 0) {
    notices.push({ tipo: "warn", icone: "⚠️", texto: `Você possui ${stats.totalAtrasadas} tarefa(s) atrasada(s).` });
  }

  container.innerHTML = notices.map((n, i) => `
    <div class="notice ${n.tipo}">
      <span>${n.icone}</span>
      <span>${n.texto}</span>
      <button class="notice-close" onclick="this.parentElement.remove()" aria-label="Fechar notificação">✕</button>
    </div>`).join("");
}

/* -------------------------------------------------------------------- */
/* Tarefas de hoje                                                       */
/* -------------------------------------------------------------------- */
function renderizarTarefasHoje(tarefas) {
  const container = document.getElementById("lista-tarefas-hoje");
  if (!container) return;

  const doDia = tarefas
    .filter(t => t.vencimento && TZ.isHoje(t.vencimento))
    .sort((a, b) => TZ.PRIORIDADES[b.prioridade].peso - TZ.PRIORIDADES[a.prioridade].peso);

  if (doDia.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ic">📭</div><p>Nenhuma tarefa vence hoje.</p></div>`;
    return;
  }

  container.innerHTML = doDia.map(t => renderizarCardTarefa(t, { mostrarArquivar: false })).join("");
}

/* -------------------------------------------------------------------- */
/* Histórico de tarefas concluídas, agrupado por dia                     */
/* -------------------------------------------------------------------- */
function renderizarHistorico(tarefas) {
  const container = document.getElementById("lista-historico");
  if (!container) return;

  const concluidas = tarefas
    .filter(t => t.status === "concluida" && t.concluidoEm)
    .sort((a, b) => new Date(b.concluidoEm) - new Date(a.concluidoEm));

  if (concluidas.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ic">🕒</div><p>Nenhuma tarefa concluída ainda.</p></div>`;
    return;
  }

  const grupos = {};
  concluidas.forEach(t => {
    const diaISO = t.concluidoEm.slice(0, 10);
    const label = rotuloDia(diaISO);
    if (!grupos[label]) grupos[label] = [];
    grupos[label].push(t);
  });

  container.innerHTML = Object.keys(grupos).map(label => `
    <div class="history-group">
      <div class="history-group-title">${label}</div>
      ${grupos[label].map(t => {
        const cat = TZ.CATEGORIAS[t.categoria];
        return `
          <div class="history-item">
            <span>
              <span class="chip tag-${cat.cor}" style="margin-right:8px;">${cat.icone}</span>
              <span class="nome">${escaparHtml(t.nome)}</span>
            </span>
            <span class="quando">${TZ.formatarHoraBR(t.concluidoEm)}</span>
          </div>`;
      }).join("")}
    </div>`).join("");
}

function rotuloDia(diaISO) {
  if (diaISO === TZ.hojeISO()) return "Hoje";
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  if (diaISO === ontem.toISOString().slice(0, 10)) return "Ontem";
  return TZ.formatarDataBR(diaISO);
}

/* ==========================================================================
   TaskZone — script.js (Parte 4: Calendário, Estatísticas, Conquistas)
   ========================================================================== */

/* -------------------------------------------------------------------- */
/* Calendário                                                             */
/* -------------------------------------------------------------------- */
const NOMES_MES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function renderizarCalendario() {
  const grid = document.getElementById("calendar-grid");
  const titulo = document.getElementById("calendar-titulo");
  if (!grid) return;

  const ref = TZ.estado.mesCalendario;
  const ano = ref.getFullYear();
  const mes = ref.getMonth();
  titulo.textContent = `${NOMES_MES[mes]} ${ano}`;

  const tarefas = TZ.lerTarefas().filter(t => !t.arquivada && t.vencimento);
  const tarefasPorDia = {};
  tarefas.forEach(t => {
    tarefasPorDia[t.vencimento] = (tarefasPorDia[t.vencimento] || 0) + 1;
  });

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  let html = DIAS_SEMANA.map(d => `<div class="calendar-weekday">${d}</div>`).join("");

  for (let i = 0; i < primeiroDiaSemana; i++) {
    html += `<div class="calendar-day vazio"></div>`;
  }

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const isHoje = iso === TZ.hojeISO();
    const isSelecionado = iso === TZ.estado.diaCalendarioSelecionado;
    const temTarefas = tarefasPorDia[iso] > 0;

    html += `
      <button type="button" class="calendar-day ${isHoje ? "hoje" : ""} ${isSelecionado ? "selecionado" : ""}" data-dia="${iso}">
        <span>${dia}</span>
        ${temTarefas ? `<span class="dots"><span></span></span>` : ""}
      </button>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll(".calendar-day[data-dia]").forEach(btn => {
    btn.addEventListener("click", () => {
      TZ.estado.diaCalendarioSelecionado = btn.dataset.dia;
      renderizarCalendario();
      renderizarPainelDiaCalendario();
    });
  });

  renderizarPainelDiaCalendario();
}

function renderizarPainelDiaCalendario() {
  const painel = document.getElementById("calendar-day-panel");
  if (!painel) return;

  const diaSelecionado = TZ.estado.diaCalendarioSelecionado;
  if (!diaSelecionado) {
    painel.innerHTML = `<div class="empty-state"><div class="ic">📅</div><p>Clique em um dia para ver as tarefas.</p></div>`;
    return;
  }

  const tarefas = TZ.lerTarefas().filter(t => !t.arquivada && t.vencimento === diaSelecionado);

  painel.innerHTML = `
    <div class="section-title">Tarefas de ${TZ.formatarDataBR(diaSelecionado)}</div>
    ${tarefas.length === 0
      ? `<div class="empty-state"><div class="ic">📭</div><p>Nenhuma tarefa neste dia.</p></div>`
      : `<div class="task-list">${tarefas.map(t => renderizarCardTarefa(t)).join("")}</div>`}
  `;
}

function inicializarCalendario() {
  const btnAnterior = document.getElementById("calendar-mes-anterior");
  const btnProximo = document.getElementById("calendar-mes-proximo");
  const btnHoje = document.getElementById("calendar-ir-hoje");

  if (btnAnterior) btnAnterior.addEventListener("click", () => {
    TZ.estado.mesCalendario.setMonth(TZ.estado.mesCalendario.getMonth() - 1);
    renderizarCalendario();
  });
  if (btnProximo) btnProximo.addEventListener("click", () => {
    TZ.estado.mesCalendario.setMonth(TZ.estado.mesCalendario.getMonth() + 1);
    renderizarCalendario();
  });
  if (btnHoje) btnHoje.addEventListener("click", () => {
    TZ.estado.mesCalendario = new Date();
    TZ.estado.diaCalendarioSelecionado = TZ.hojeISO();
    renderizarCalendario();
  });
}

/* -------------------------------------------------------------------- */
/* Estatísticas                                                          */
/* -------------------------------------------------------------------- */
function renderizarEstatisticas() {
  const tarefas = TZ.lerTarefas().filter(t => !t.arquivada);
  const stats = TZ.calcularEstatisticas(tarefas);

  document.getElementById("stat-total-criadas").textContent = tarefas.length;
  document.getElementById("stat-total-concluidas").textContent = stats.totalConcluidas;
  document.getElementById("stat-total-atrasadas").textContent = stats.totalAtrasadas;
  document.getElementById("stat-sequencia").textContent = stats.sequenciaAtual;
  document.getElementById("stat-sequencia-desc").textContent =
    stats.sequenciaAtual > 0
      ? `Você completou pelo menos uma tarefa nos últimos ${stats.sequenciaAtual} dia(s).`
      : "Conclua uma tarefa hoje para começar sua sequência.";

  document.getElementById("stat-categoria-mais").textContent =
    `${TZ.CATEGORIAS[stats.categoriaComMais].icone} ${TZ.CATEGORIAS[stats.categoriaComMais].nome}`;
  document.getElementById("stat-categoria-taxa").textContent =
    `${TZ.CATEGORIAS[stats.categoriaComMelhorTaxa].icone} ${TZ.CATEGORIAS[stats.categoriaComMelhorTaxa].nome}`;

  document.getElementById("stat-progresso-geral-pct").textContent = `${stats.progressoGeral}%`;
  document.getElementById("stat-progresso-geral-fill").style.width = `${stats.progressoGeral}%`;
  document.getElementById("stat-progresso-geral-desc").textContent =
    `${stats.totalConcluidas} tarefas concluídas de ${stats.total} totais`;
}

/* -------------------------------------------------------------------- */
/* Conquistas                                                            */
/* -------------------------------------------------------------------- */
function renderizarConquistas() {
  const container = document.getElementById("grid-conquistas");
  if (!container) return;

  const tarefas = TZ.lerTarefas().filter(t => !t.arquivada);
  const stats = TZ.calcularEstatisticas(tarefas);
  const desbloqueadas = new Set(TZ.lerConquistas());

  container.innerHTML = TZ.CONQUISTAS_DEF.map(c => {
    const conquistada = desbloqueadas.has(c.id) || c.meta(stats);
    return `
      <div class="achievement-card ${conquistada ? "desbloqueada" : ""}">
        <div class="ic">${c.icone}</div>
        <h4>${c.nome}</h4>
        <p>${c.desc}</p>
        <div class="status">${conquistada ? "Desbloqueada" : "Bloqueada"}</div>
      </div>`;
  }).join("");
}

/* Verifica se novas conquistas foram desbloqueadas após uma ação
   (concluir tarefa, criar tarefa) e persiste no localStorage. */
function verificarNovasConquistas() {
  const tarefas = TZ.lerTarefas().filter(t => !t.arquivada);
  const stats = TZ.calcularEstatisticas(tarefas);
  const desbloqueadas = new Set(TZ.lerConquistas());
  let houveNova = false;

  TZ.CONQUISTAS_DEF.forEach(c => {
    if (!desbloqueadas.has(c.id) && c.meta(stats)) {
      desbloqueadas.add(c.id);
      houveNova = true;
    }
  });

  if (houveNova) {
    TZ.salvarConquistas(Array.from(desbloqueadas));
    if (TZ.estado.viewAtual === "conquistas") renderizarConquistas();
  }
}

/* ==========================================================================
   TaskZone — script.js (Parte 5: Modo Foco, Configurações, navegação, init)
   ========================================================================== */

/* -------------------------------------------------------------------- */
/* Modo Foco (Pomodoro)                                                  */
/* -------------------------------------------------------------------- */
TZ.foco = {
  tarefaId: null,
  duracaoMin: 25,
  segundosRestantes: 25 * 60,
  rodando: false,
  intervalo: null
};

function renderizarViewFoco() {
  const select = document.getElementById("foco-select-tarefa");
  if (!select) return;

  const pendentes = TZ.lerTarefas().filter(t => !t.arquivada && t.status === "pendente");
  select.innerHTML = `<option value="">Selecione uma tarefa...</option>` +
    pendentes.map(t => `<option value="${t.id}">${TZ.CATEGORIAS[t.categoria].icone} ${escaparHtml(t.nome)}</option>`).join("");

  if (TZ.foco.tarefaId && pendentes.some(t => t.id === TZ.foco.tarefaId)) {
    select.value = TZ.foco.tarefaId;
  }

  atualizarInfoTarefaFoco();
  atualizarDisplayTimer();
}

function atualizarInfoTarefaFoco() {
  const nomeEl = document.getElementById("foco-tarefa-nome");
  const descEl = document.getElementById("foco-tarefa-desc");
  const btnConcluir = document.getElementById("btn-foco-concluir");
  if (!nomeEl) return;

  const tarefa = TZ.lerTarefas().find(t => t.id === TZ.foco.tarefaId);
  if (tarefa) {
    nomeEl.textContent = tarefa.nome;
    descEl.textContent = tarefa.descricao || "Sem descrição.";
    btnConcluir.disabled = false;
  } else {
    nomeEl.textContent = "Nenhuma tarefa selecionada";
    descEl.textContent = "Escolha uma tarefa acima para focar nela.";
    btnConcluir.disabled = true;
  }
}

function inicializarModoFoco() {
  const select = document.getElementById("foco-select-tarefa");
  if (select) {
    select.addEventListener("change", () => {
      TZ.foco.tarefaId = select.value || null;
      atualizarInfoTarefaFoco();
    });
  }

  document.querySelectorAll("[data-foco-preset]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (TZ.foco.rodando) return;
      document.querySelectorAll("[data-foco-preset]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      TZ.foco.duracaoMin = parseInt(btn.dataset.focoPreset);
      TZ.foco.segundosRestantes = TZ.foco.duracaoMin * 60;
      atualizarDisplayTimer();
    });
  });

  document.getElementById("btn-foco-iniciar").addEventListener("click", iniciarTimerFoco);
  document.getElementById("btn-foco-pausar").addEventListener("click", pausarTimerFoco);
  document.getElementById("btn-foco-reiniciar").addEventListener("click", reiniciarTimerFoco);
  document.getElementById("btn-foco-concluir").addEventListener("click", () => {
    if (TZ.foco.tarefaId) {
      alternarConclusao(TZ.foco.tarefaId);
      TZ.foco.tarefaId = null;
      renderizarViewFoco();
    }
  });
}

function iniciarTimerFoco() {
  if (TZ.foco.rodando) return;
  TZ.foco.rodando = true;
  document.getElementById("foco-mensagem").classList.remove("show");

  TZ.foco.intervalo = setInterval(() => {
    TZ.foco.segundosRestantes--;
    atualizarDisplayTimer();
    if (TZ.foco.segundosRestantes <= 0) {
      pausarTimerFoco();
      const msg = document.getElementById("foco-mensagem");
      msg.textContent = "🎉 Tempo encerrado! Faça uma pausa.";
      msg.classList.add("show");
    }
  }, 1000);
}

function pausarTimerFoco() {
  TZ.foco.rodando = false;
  clearInterval(TZ.foco.intervalo);
}

function reiniciarTimerFoco() {
  pausarTimerFoco();
  TZ.foco.segundosRestantes = TZ.foco.duracaoMin * 60;
  document.getElementById("foco-mensagem").classList.remove("show");
  atualizarDisplayTimer();
}

function atualizarDisplayTimer() {
  const display = document.getElementById("foco-timer-display");
  const anel = document.getElementById("foco-ring-fill");
  if (!display) return;

  const min = Math.floor(TZ.foco.segundosRestantes / 60);
  const seg = TZ.foco.segundosRestantes % 60;
  display.textContent = `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;

  const raio = 118;
  const circunferencia = 2 * Math.PI * raio;
  const totalSegundos = TZ.foco.duracaoMin * 60;
  const progresso = totalSegundos > 0 ? TZ.foco.segundosRestantes / totalSegundos : 0;
  anel.style.strokeDasharray = `${circunferencia}`;
  anel.style.strokeDashoffset = `${circunferencia * (1 - progresso)}`;
}

/* -------------------------------------------------------------------- */
/* Exportar / Importar dados                                             */
/* -------------------------------------------------------------------- */
function exportarDados() {
  const dados = {
    tarefas: TZ.lerTarefas(),
    conquistas: TZ.lerConquistas(),
    config: TZ.lerConfig(),
    tema: TZ.lerTema(),
    exportadoEm: new Date().toISOString(),
    versao: 1
  };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `taskzone-backup-${TZ.hojeISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importarDados(arquivo) {
  const leitor = new FileReader();
  leitor.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      if (!Array.isArray(dados.tarefas)) throw new Error("Formato inválido");

      if (!confirm("Importar este arquivo substituirá suas tarefas atuais. Deseja continuar?")) return;

      TZ.salvarTarefas(dados.tarefas);
      if (Array.isArray(dados.conquistas)) TZ.salvarConquistas(dados.conquistas);
      if (dados.config) TZ.salvarConfig(dados.config);
      if (dados.tema) TZ.salvarTema(dados.tema);

      alert("Dados importados com sucesso!");
      location.reload();
    } catch (err) {
      console.error("Erro ao importar arquivo:", err);
      alert("Não foi possível importar este arquivo. Verifique se é um backup válido do TaskZone.");
    }
  };
  leitor.readAsText(arquivo);
}

/* -------------------------------------------------------------------- */
/* Configurações                                                         */
/* -------------------------------------------------------------------- */
function inicializarConfiguracoes() {
  const toggleAnimacoes = document.getElementById("toggle-animacoes");
  if (toggleAnimacoes) {
    const cfg = TZ.lerConfig();
    toggleAnimacoes.checked = cfg.animacoes;
    aplicarAnimacoes(cfg.animacoes);
    toggleAnimacoes.addEventListener("change", () => {
      const cfgAtual = TZ.lerConfig();
      cfgAtual.animacoes = toggleAnimacoes.checked;
      TZ.salvarConfig(cfgAtual);
      aplicarAnimacoes(cfgAtual.animacoes);
    });
  }

  const btnLimparConcluidas = document.getElementById("btn-limpar-concluidas");
  if (btnLimparConcluidas) {
    btnLimparConcluidas.addEventListener("click", () => {
      if (!confirm("Isso excluirá permanentemente todas as tarefas concluídas. Deseja continuar?")) return;
      const tarefas = TZ.lerTarefas().filter(t => t.status !== "concluida");
      TZ.salvarTarefas(tarefas);
      atualizarViewAtual();
      alert("Tarefas concluídas removidas.");
    });
  }

  const btnRestaurarDemo = document.getElementById("btn-restaurar-demo");
  if (btnRestaurarDemo) {
    btnRestaurarDemo.addEventListener("click", () => {
      if (!confirm("Isso substituirá suas tarefas atuais pelos dados de demonstração. Deseja continuar?")) return;
      TZ.restaurarDemo();
      location.reload();
    });
  }

  const btnComecarZero = document.getElementById("btn-comecar-zero");
  if (btnComecarZero) {
    btnComecarZero.addEventListener("click", () => {
      if (!confirm("Isso apagará todas as tarefas de demonstração e deixará sua lista vazia. Deseja continuar?")) return;
      TZ.comecarDoZero();
      location.reload();
    });
  }

  const btnExportar = document.getElementById("btn-exportar-dados");
  if (btnExportar) btnExportar.addEventListener("click", exportarDados);

  const inputImportar = document.getElementById("input-importar-dados");
  if (inputImportar) {
    inputImportar.addEventListener("change", () => {
      if (inputImportar.files && inputImportar.files[0]) {
        importarDados(inputImportar.files[0]);
        inputImportar.value = "";
      }
    });
  }

  const btnApagarTudo = document.getElementById("btn-apagar-tudo");
  if (btnApagarTudo) {
    btnApagarTudo.addEventListener("click", () => {
      if (!confirm("Isso apagará TODOS os seus dados do TaskZone permanentemente, incluindo tarefas e conquistas. Esta ação não pode ser desfeita. Deseja continuar?")) return;
      TZ.apagarTudo();
      location.reload();
    });
  }
}

function aplicarAnimacoes(ativas) {
  document.body.classList.toggle("sem-animacoes", !ativas);
}

/* -------------------------------------------------------------------- */
/* Tema claro/escuro                                                     */
/* -------------------------------------------------------------------- */
function inicializarTema() {
  const tema = TZ.lerTema();
  document.documentElement.setAttribute("data-tema", tema);
  document.body.setAttribute("data-tema", tema);

  document.querySelectorAll(".toggle-tema-btn").forEach(btn => {
    atualizarIconeTema(btn, tema);
    btn.addEventListener("click", () => {
      const atual = document.body.getAttribute("data-tema");
      const novo = atual === "claro" ? "escuro" : "claro";
      document.documentElement.setAttribute("data-tema", novo);
      document.body.setAttribute("data-tema", novo);
      TZ.salvarTema(novo);
      document.querySelectorAll(".toggle-tema-btn").forEach(b => atualizarIconeTema(b, novo));
    });
  });
}

function atualizarIconeTema(btn, tema) {
  btn.textContent = tema === "claro" ? "☀️" : "🌙";
}

/* -------------------------------------------------------------------- */
/* Navegação entre views (SPA)                                           */
/* -------------------------------------------------------------------- */
const RENDERIZADORES_VIEW = {
  dashboard: renderizarDashboard,
  tarefas: renderizarViewTarefas,
  calendario: renderizarCalendario,
  estatisticas: renderizarEstatisticas,
  conquistas: renderizarConquistas,
  foco: renderizarViewFoco,
  arquivadas: renderizarViewArquivadas
};

const TITULOS_VIEW = {
  dashboard: ["Dashboard", "Aqui está o que você precisa fazer hoje"],
  tarefas: ["Todas as tarefas", "Gerencie, filtre e organize suas tarefas"],
  calendario: ["Calendário", "Visualize suas tarefas por dia"],
  estatisticas: ["Minhas estatísticas", "Acompanhe sua evolução"],
  conquistas: ["Conquistas", "Suas medalhas conquistadas no TaskZone"],
  foco: ["Modo Foco", "Concentre-se em uma tarefa por vez"],
  arquivadas: ["Tarefas arquivadas", "Restaure tarefas antigas quando precisar"],
  configuracoes: ["Configurações", "Personalize e faça backup dos seus dados"]
};

function trocarView(viewId) {
  TZ.estado.viewAtual = viewId;

  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === `view-${viewId}`));
  document.querySelectorAll("[data-nav]").forEach(l => l.classList.toggle("active", l.dataset.nav === viewId));

  const titulos = TITULOS_VIEW[viewId];
  if (titulos) {
    document.getElementById("topbar-titulo").textContent = titulos[0];
    document.getElementById("topbar-subtitulo").textContent = titulos[1];
  }

  fecharSidebarMobile();

  if (RENDERIZADORES_VIEW[viewId]) RENDERIZADORES_VIEW[viewId]();

  const fab = document.getElementById("btn-fab-nova-tarefa");
  if (fab) fab.style.display = (viewId === "tarefas" || viewId === "dashboard") ? "flex" : "none";
}

function atualizarViewAtual() {
  if (RENDERIZADORES_VIEW[TZ.estado.viewAtual]) RENDERIZADORES_VIEW[TZ.estado.viewAtual]();
  // O dashboard também precisa refletir mudanças feitas em outras views
  if (TZ.estado.viewAtual !== "dashboard") renderizarDashboard();
}

function inicializarNavegacao() {
  document.querySelectorAll("[data-nav]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      trocarView(link.dataset.nav);
    });
  });
}

/* -------------------------------------------------------------------- */
/* Menu mobile (hambúrguer)                                              */
/* -------------------------------------------------------------------- */
function inicializarMenuMobile() {
  const btn = document.getElementById("btn-hamburguer");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  if (btn) btn.addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.classList.add("open");
  });
  if (overlay) overlay.addEventListener("click", fecharSidebarMobile);
}

function fecharSidebarMobile() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
}

/* -------------------------------------------------------------------- */
/* Modal (utilitário genérico)                                           */
/* -------------------------------------------------------------------- */
function abrirModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add("open");
}
function fecharModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove("open");
}
document.addEventListener("click", (e) => {
  if (e.target.classList && e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
});

/* -------------------------------------------------------------------- */
/* Inicialização geral                                                   */
/* -------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  TZ.garantirSeed();
  inicializarTema();
  inicializarNavegacao();
  inicializarMenuMobile();
  inicializarPickers();
  inicializarControlesTarefas();
  inicializarCalendario();
  inicializarModoFoco();
  inicializarConfiguracoes();

  TZ.estado.diaCalendarioSelecionado = TZ.hojeISO();

  trocarView("dashboard");
  verificarNovasConquistas();
});
