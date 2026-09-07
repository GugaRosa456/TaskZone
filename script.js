/* ==========================================================================
   TaskZone — script.js (v2)
   Gerenciador de tarefas pessoais com quadro Kanban (A Fazer / Em andamento /
   Concluído), sistema de XP/Nível, conquistas, calendário, modo foco e
   configurações. 100% JavaScript puro — todos os dados ficam no localStorage.
   ========================================================================== */

/* ==========================================================================
   TaskZone — script.js (v2 — Parte 1: dados)
   Camada de dados: localStorage, tarefas de demonstração, metadados de
   categorias/prioridades/status/conquistas, utilitários de data e o
   sistema de XP/Nível.
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
  alta:  { nome: "Alta prioridade",  icone: "🔴", peso: 3, xp: 35 },
  media: { nome: "Média prioridade", icone: "🟡", peso: 2, xp: 20 },
  baixa: { nome: "Baixa prioridade", icone: "🟢", peso: 1, xp: 10 }
};

/* Três estágios reais de andamento — a peça central do quadro Kanban.
   "afazer" e "pendente" são tratados como sinônimos em dados antigos
   (ver TZ.normalizarStatus) para manter compatibilidade com backups. */
TZ.STATUS = {
  afazer:    { nome: "A Fazer",       icone: "○", classe: "afazer" },
  andamento: { nome: "Em andamento",  icone: "◐", classe: "andamento" },
  concluida: { nome: "Concluído",     icone: "●", classe: "concluido" }
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
  { id: "casaOrganizada", icone: "🏠", nome: "Casa organizada", desc: "Conclua 25 tarefas de casa.", meta: (s) => s.porCategoria.casa.concluidas >= 25 },
  { id: "nivel5", icone: "⭐", nome: "Em ascensão", desc: "Alcance o nível 5 de XP.", meta: (s) => s.nivel.nivel >= 5 }
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
    { id: TZ.gerarId(), nome: "Arrumar o quarto", descricao: "Organizar roupas e mesa de estudo.", categoria: "casa", vencimento: TZ.dataISO(0), horario: "", prioridade: "media", repeticao: "nao", observacao: "", status: "afazer", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Estudar Java", descricao: "Revisar coleções e streams.", categoria: "escola", vencimento: TZ.dataISO(0), horario: "19:00", prioridade: "alta", repeticao: "nao", observacao: "", status: "andamento", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Fazer trabalho da faculdade", descricao: "Trabalho de Engenharia de Software.", categoria: "escola", vencimento: TZ.dataISO(-2), horario: "", prioridade: "alta", repeticao: "nao", observacao: "", status: "afazer", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Completar missão principal", descricao: "Avançar na campanha do jogo novo.", categoria: "jogos", vencimento: TZ.dataISO(1), horario: "", prioridade: "baixa", repeticao: "nao", observacao: "", status: "afazer", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Conseguir novo equipamento", descricao: "Farmar recursos para o upgrade.", categoria: "jogos", vencimento: TZ.dataISO(3), horario: "", prioridade: "baixa", repeticao: "nao", observacao: "", status: "andamento", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Tirar o lixo", descricao: "", categoria: "casa", vencimento: TZ.dataISO(0), horario: "", prioridade: "media", repeticao: "diaria", observacao: "", status: "afazer", criadoEm: agora, concluidoEm: null, arquivada: false },
    { id: TZ.gerarId(), nome: "Lavar a louça", descricao: "", categoria: "casa", vencimento: TZ.dataISO(-1), horario: "", prioridade: "baixa", repeticao: "nao", observacao: "", status: "concluida", criadoEm: TZ.dataISO(-1), concluidoEm: new Date(Date.now() - 86400000).toISOString(), arquivada: false }
  ];
};

TZ.garantirSeed = () => {
  if (!localStorage.getItem(TZ.KEYS.SEED)) {
    localStorage.setItem(TZ.KEYS.TAREFAS, JSON.stringify(TZ.tarefasDemo()));
    localStorage.setItem(TZ.KEYS.SEED, "1");
  }
};

/* Normaliza tarefas vindas de backups antigos (antes de existir "andamento"):
   qualquer status desconhecido ou "pendente" vira "afazer". */
TZ.normalizarStatus = (tarefa) => {
  if (tarefa.status !== "andamento" && tarefa.status !== "concluida") {
    tarefa.status = "afazer";
  }
  return tarefa;
};

/* -------------------------------------------------------------------- */
/* Leitura / escrita no localStorage                                     */
/* -------------------------------------------------------------------- */
TZ.lerTarefas = () => {
  TZ.garantirSeed();
  try {
    const lista = JSON.parse(localStorage.getItem(TZ.KEYS.TAREFAS)) || [];
    return lista.map(TZ.normalizarStatus);
  } catch (e) { console.error("Erro ao ler tarefas:", e); return []; }
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
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
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
/* Sistema de XP / Nível — recompensa por concluir tarefas                */
/* Recalculado sempre a partir do histórico de tarefas concluídas, sem   */
/* precisar de uma chave extra no localStorage (evita dessincronização). */
/* -------------------------------------------------------------------- */
TZ.calcularXPTotal = (tarefas) => {
  return tarefas
    .filter(t => t.status === "concluida")
    .reduce((soma, t) => soma + (TZ.PRIORIDADES[t.prioridade]?.xp || 10), 0);
};

/* Curva de nível: cada nível N exige N*100 XP a mais que o anterior
   (nível 1: 0-100, nível 2: 100-300, nível 3: 300-600, ...). */
TZ.infoNivel = (xpTotal) => {
  let nivel = 1;
  let xpParaProximo = 100;
  let xpAcumuladoAnterior = 0;

  while (xpTotal >= xpAcumuladoAnterior + xpParaProximo) {
    xpAcumuladoAnterior += xpParaProximo;
    nivel++;
    xpParaProximo = nivel * 100;
  }

  const xpNoNivel = xpTotal - xpAcumuladoAnterior;
  return {
    nivel,
    xpTotal,
    xpNoNivel,
    xpParaProximo,
    percentual: Math.round((xpNoNivel / xpParaProximo) * 100)
  };
};

/* -------------------------------------------------------------------- */
/* Estatísticas agregadas — usado no dashboard, estatísticas e conquistas */
/* -------------------------------------------------------------------- */
TZ.calcularEstatisticas = (tarefas) => {
  const ativas = tarefas.filter(t => !t.arquivada);
  const concluidas = ativas.filter(t => t.status === "concluida");
  const emAndamento = ativas.filter(t => t.status === "andamento");
  const aFazer = ativas.filter(t => t.status === "afazer");
  const naoConcluidas = ativas.filter(t => t.status !== "concluida");
  const atrasadas = naoConcluidas.filter(TZ.isAtrasada);
  const hoje = ativas.filter(t => t.vencimento && TZ.isHoje(t.vencimento));
  const hojeConcluidas = hoje.filter(t => t.status === "concluida");

  const porCategoria = {};
  Object.keys(TZ.CATEGORIAS).forEach(cat => {
    const doCat = ativas.filter(t => t.categoria === cat);
    porCategoria[cat] = { total: doCat.length, concluidas: doCat.filter(t => t.status === "concluida").length };
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
    totalEmAndamento: emAndamento.length,
    totalAFazer: aFazer.length,
    totalPendentes: naoConcluidas.length,
    totalAtrasadas: atrasadas.length,
    hojeTotal: hoje.length,
    hojeConcluidas: hojeConcluidas.length,
    progressoHoje: hoje.length > 0 ? Math.round((hojeConcluidas.length / hoje.length) * 100) : 0,
    progressoGeral: ativas.length > 0 ? Math.round((concluidas.length / ativas.length) * 100) : 0,
    porCategoria,
    categoriaComMais,
    categoriaComMelhorTaxa,
    sequenciaAtual: TZ.calcularSequencia(ativas),
    nivel: TZ.infoNivel(TZ.calcularXPTotal(ativas))
  };
};

/* Sequência: quantos dias consecutivos (contando hoje para trás) tiveram
   ao menos uma tarefa concluída. */
TZ.calcularSequencia = (tarefas) => {
  const diasComConclusao = new Set(
    tarefas.filter(t => t.status === "concluida" && t.concluidoEm).map(t => t.concluidoEm.slice(0, 10))
  );
  let sequencia = 0;
  let cursor = new Date(TZ.hojeISO() + "T00:00:00");

  if (!diasComConclusao.has(TZ.hojeISO())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (diasComConclusao.has(iso)) {
      sequencia++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return sequencia;
};

/* -------------------------------------------------------------------- */
/* Pequeno helper de debounce, usado na busca em tempo real               */
/* -------------------------------------------------------------------- */
TZ.debounce = (fn, atrasoMs = 200) => {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), atrasoMs);
  };
};

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

/* ==========================================================================
   TaskZone — script.js (v2 — Parte 2: tarefas, quadro Kanban)
   ========================================================================== */

TZ.estado = {
  viewAtual: "dashboard",
  filtroCategoria: "todas",    // todas | casa | escola | jogos
  filtroData: "todas",         // todas | hoje | atrasadas
  ordenacao: "recentes",       // recentes | antigas | prioridade | vencimento | nome
  busca: "",
  idEmEdicao: null,
  ultimaTarefaExcluida: null,  // guarda a tarefa apagada por 6s para permitir "Desfazer"
  diaCalendarioSelecionado: null,
  mesCalendario: new Date(),
  arrastandoId: null
};

/* -------------------------------------------------------------------- */
/* Modal de tarefa (criar/editar) — inclui o seletor de status            */
/* -------------------------------------------------------------------- */
function abrirModalTarefa(id, categoriaPreDefinida, statusPreDefinido) {
  const form = document.getElementById("form-tarefa");
  form.reset();
  document.querySelectorAll(".priority-picker .pick-option, .category-picker .pick-option, .status-picker .pick-option")
    .forEach(o => o.classList.remove("selected"));

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
    selecionarPickOption("status-picker", tarefa.status);
  } else {
    TZ.estado.idEmEdicao = null;
    document.getElementById("modal-tarefa-titulo").textContent = "Nova tarefa";
    document.getElementById("tarefa-vencimento").value = TZ.hojeISO();
    selecionarPickOption("category-picker", categoriaPreDefinida || (TZ.estado.filtroCategoria !== "todas" ? TZ.estado.filtroCategoria : "casa"));
    selecionarPickOption("priority-picker", "media");
    selecionarPickOption("status-picker", statusPreDefinido || "afazer");
  }

  abrirModal("modal-tarefa");
  document.getElementById("tarefa-nome").focus();
}

function selecionarPickOption(grupoId, valor) {
  const grupo = document.getElementById(grupoId);
  if (!grupo) return;
  grupo.querySelectorAll(".pick-option").forEach(o => o.classList.toggle("selected", o.dataset.valor === valor));
  grupo.dataset.selecionado = valor;
}

function inicializarPickers() {
  ["category-picker", "priority-picker", "status-picker"].forEach(grupoId => {
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
  const status = document.getElementById("status-picker").dataset.selecionado || "afazer";

  if (!nome) return;

  const tarefas = TZ.lerTarefas();
  const eraEdicao = !!TZ.estado.idEmEdicao;
  let statusAnterior = null;

  if (eraEdicao) {
    const idx = tarefas.findIndex(t => t.id === TZ.estado.idEmEdicao);
    if (idx > -1) {
      statusAnterior = tarefas[idx].status;
      tarefas[idx] = { ...tarefas[idx], nome, descricao, categoria, vencimento, horario, prioridade, repeticao, observacao, status };
      if (status === "concluida" && statusAnterior !== "concluida") {
        tarefas[idx].concluidoEm = new Date().toISOString();
        gerarProximaOcorrenciaSeRecorrente(tarefas, tarefas[idx]);
      } else if (status !== "concluida") {
        tarefas[idx].concluidoEm = null;
      }
    }
  } else {
    tarefas.push({
      id: TZ.gerarId(), nome, descricao, categoria, vencimento, horario, prioridade, repeticao, observacao,
      status, criadoEm: new Date().toISOString(),
      concluidoEm: status === "concluida" ? new Date().toISOString() : null,
      arquivada: false
    });
  }

  TZ.salvarTarefas(tarefas);
  fecharModal("modal-tarefa");
  atualizarViewAtual();

  if (status === "concluida" && statusAnterior !== "concluida") {
    dispararCelebracaoConclusao(prioridade);
  } else {
    mostrarToast(eraEdicao ? "Tarefa atualizada." : "Tarefa criada.", "success");
  }
  verificarNovasConquistas();
}

/* Cria rapidamente uma tarefa a partir do campo de "adicionar rápido" do
   quadro Kanban — usa a categoria filtrada atual (ou "casa") e prioridade
   média como padrão, para não interromper o fluxo com o modal completo. */
function adicionarTarefaRapida(nome) {
  nome = nome.trim();
  if (!nome) return;

  const categoria = TZ.estado.filtroCategoria !== "todas" ? TZ.estado.filtroCategoria : "casa";
  const tarefas = TZ.lerTarefas();
  tarefas.push({
    id: TZ.gerarId(), nome, descricao: "", categoria, vencimento: TZ.hojeISO(), horario: "",
    prioridade: "media", repeticao: "nao", observacao: "", status: "afazer",
    criadoEm: new Date().toISOString(), concluidoEm: null, arquivada: false
  });
  TZ.salvarTarefas(tarefas);
  atualizarViewAtual();
  mostrarToast("Tarefa adicionada ao quadro.", "success");
}

/* -------------------------------------------------------------------- */
/* Mudança de status — usada pelo drag-and-drop, pelo status-stepper e   */
/* pelo checkbox de conclusão nas listas fora do quadro                   */
/* -------------------------------------------------------------------- */
function definirStatusTarefa(id, novoStatus) {
  const tarefas = TZ.lerTarefas();
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa || tarefa.status === novoStatus) return;

  const statusAnterior = tarefa.status;
  tarefa.status = novoStatus;

  if (novoStatus === "concluida") {
    tarefa.concluidoEm = new Date().toISOString();
    gerarProximaOcorrenciaSeRecorrente(tarefas, tarefa);
  } else {
    tarefa.concluidoEm = null;
  }

  TZ.salvarTarefas(tarefas);
  atualizarViewAtual();

  if (novoStatus === "concluida" && statusAnterior !== "concluida") {
    dispararCelebracaoConclusao(tarefa.prioridade);
  }
  verificarNovasConquistas();
}

function gerarProximaOcorrenciaSeRecorrente(tarefas, tarefa) {
  if (tarefa.repeticao && tarefa.repeticao !== "nao" && tarefa.vencimento) {
    tarefas.push({
      id: TZ.gerarId(), nome: tarefa.nome, descricao: tarefa.descricao, categoria: tarefa.categoria,
      vencimento: TZ.proximaData(tarefa.vencimento, tarefa.repeticao), horario: tarefa.horario,
      prioridade: tarefa.prioridade, repeticao: tarefa.repeticao, observacao: tarefa.observacao,
      status: "afazer", criadoEm: new Date().toISOString(), concluidoEm: null, arquivada: false
    });
  }
}

/* Mantido para os locais que ainda usam um "checkbox" simples (dashboard,
   calendário, arquivadas): alterna entre concluída e a-fazer. */
function alternarConclusao(id) {
  const tarefa = TZ.lerTarefas().find(t => t.id === id);
  if (!tarefa) return;
  definirStatusTarefa(id, tarefa.status === "concluida" ? "afazer" : "concluida");
}

/* -------------------------------------------------------------------- */
/* Exclusão com "Desfazer" (toast) em vez de um segundo modal a cada vez  */
/* -------------------------------------------------------------------- */
function pedirExclusao(id) {
  const tarefa = TZ.lerTarefas().find(t => t.id === id);
  if (!tarefa) return;
  document.getElementById("confirmar-exclusao-nome").textContent = tarefa.nome;
  TZ.estado.idParaExcluir = id;
  abrirModal("modal-confirmar-exclusao");
}

function confirmarExclusao() {
  if (!TZ.estado.idParaExcluir) return;
  let tarefas = TZ.lerTarefas();
  const tarefa = tarefas.find(t => t.id === TZ.estado.idParaExcluir);
  tarefas = tarefas.filter(t => t.id !== TZ.estado.idParaExcluir);
  TZ.salvarTarefas(tarefas);
  TZ.estado.idParaExcluir = null;
  fecharModal("modal-confirmar-exclusao");
  atualizarViewAtual();

  TZ.estado.ultimaTarefaExcluida = tarefa;
  mostrarToast(`"${tarefa.nome}" foi excluída.`, "info", {
    textoAcao: "Desfazer",
    aoClicarAcao: () => desfazerExclusao()
  });
}

function desfazerExclusao() {
  if (!TZ.estado.ultimaTarefaExcluida) return;
  const tarefas = TZ.lerTarefas();
  tarefas.push(TZ.estado.ultimaTarefaExcluida);
  TZ.salvarTarefas(tarefas);
  TZ.estado.ultimaTarefaExcluida = null;
  atualizarViewAtual();
  mostrarToast("Tarefa restaurada.", "success");
}

function alternarArquivamento(id) {
  const tarefas = TZ.lerTarefas();
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;
  tarefa.arquivada = !tarefa.arquivada;
  TZ.salvarTarefas(tarefas);
  atualizarViewAtual();
  mostrarToast(tarefa.arquivada ? "Tarefa arquivada." : "Tarefa restaurada dos arquivos.", "info");
}

/* -------------------------------------------------------------------- */
/* Filtragem, busca e ordenação (compartilhadas pelo quadro Kanban)      */
/* -------------------------------------------------------------------- */
function obterTarefasFiltradas(incluirArquivadas = false) {
  let tarefas = TZ.lerTarefas().filter(t => incluirArquivadas ? t.arquivada : !t.arquivada);
  const { filtroCategoria, filtroData, ordenacao, busca } = TZ.estado;

  if (filtroCategoria !== "todas") tarefas = tarefas.filter(t => t.categoria === filtroCategoria);
  if (filtroData === "hoje") tarefas = tarefas.filter(t => t.vencimento && TZ.isHoje(t.vencimento));
  else if (filtroData === "atrasadas") tarefas = tarefas.filter(TZ.isAtrasada);

  if (busca.trim()) {
    const termo = busca.trim().toLowerCase();
    tarefas = tarefas.filter(t =>
      t.nome.toLowerCase().includes(termo) ||
      (t.descricao || "").toLowerCase().includes(termo) ||
      TZ.CATEGORIAS[t.categoria].nome.toLowerCase().includes(termo)
    );
  }

  return ordenarTarefas(tarefas, ordenacao);
}

function ordenarTarefas(tarefas, ordenacao) {
  const copia = [...tarefas];
  switch (ordenacao) {
    case "antigas": return copia.sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm));
    case "prioridade": return copia.sort((a, b) => TZ.PRIORIDADES[b.prioridade].peso - TZ.PRIORIDADES[a.prioridade].peso);
    case "vencimento": return copia.sort((a, b) => (a.vencimento || "9999").localeCompare(b.vencimento || "9999"));
    case "nome": return copia.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    default: return copia.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  }
}

/* -------------------------------------------------------------------- */
/* Quadro Kanban                                                          */
/* -------------------------------------------------------------------- */
const COLUNAS_KANBAN = [
  { status: "afazer", titulo: "A Fazer", icone: "afazer" },
  { status: "andamento", titulo: "Em andamento", icone: "andamento" },
  { status: "concluida", titulo: "Concluído", icone: "concluido" }
];

function renderizarViewTarefas() {
  const board = document.getElementById("kanban-board");
  if (!board) return;

  const tarefas = obterTarefasFiltradas(false);

  board.innerHTML = COLUNAS_KANBAN.map(col => {
    const doColuna = tarefas.filter(t => t.status === col.status);
    return `
      <div class="kanban-column" data-status="${col.status}">
        <div class="kanban-column-header">
          <h3><span class="kanban-dot ${col.icone}"></span> ${col.titulo}</h3>
          <span class="kanban-column-count mono">${doColuna.length}</span>
        </div>
        <div class="kanban-cards" data-status="${col.status}">
          ${doColuna.length === 0
            ? `<div class="kanban-empty">Nenhuma tarefa aqui.</div>`
            : doColuna.map(renderizarCardKanban).join("")}
        </div>
      </div>`;
  }).join("");

  inicializarDragAndDrop();
}

function renderizarCardKanban(tarefa) {
  const cat = TZ.CATEGORIAS[tarefa.categoria];
  const pri = TZ.PRIORIDADES[tarefa.prioridade];
  const atrasada = TZ.isAtrasada(tarefa);

  const metaVencimento = tarefa.vencimento
    ? `<span class="meta-item">📅 ${TZ.formatarDataBR(tarefa.vencimento)}${tarefa.horario ? " · " + tarefa.horario : ""}</span>`
    : "";
  const metaRepeticao = tarefa.repeticao && tarefa.repeticao !== "nao" ? `<span class="meta-item">🔁</span>` : "";
  const metaAtraso = atrasada ? `<span class="chip tag-atrasada">⚠️ ${TZ.diasAtraso(tarefa.vencimento)}d atraso</span>` : "";

  return `
    <div class="kanban-card prioridade-${tarefa.prioridade} ${tarefa.status === "concluida" ? "concluida" : ""} ${atrasada ? "atrasada" : ""}"
         data-id="${tarefa.id}" draggable="true">
      <div class="kc-top">
        <span class="kc-nome">${escaparHtml(tarefa.nome)}</span>
        <div class="kc-actions">
          <button onclick="abrirModalTarefa('${tarefa.id}')" title="Editar">✏️</button>
          <button onclick="alternarArquivamento('${tarefa.id}')" title="Arquivar">🗄️</button>
          <button onclick="pedirExclusao('${tarefa.id}')" title="Excluir">🗑️</button>
        </div>
      </div>
      <div class="kc-meta">
        <span class="chip tag-${cat.cor}">${cat.icone} ${cat.nome}</span>
        <span class="chip tag-${tarefa.prioridade}">${pri.icone}</span>
        ${metaVencimento}
        ${metaRepeticao}
        ${metaAtraso}
      </div>
      <div class="status-stepper" role="group" aria-label="Mover tarefa">
        ${COLUNAS_KANBAN.map(c => `
          <button type="button" class="${tarefa.status === c.status ? "active st-" + c.icone : ""}"
                  onclick="definirStatusTarefa('${tarefa.id}', '${c.status}')">${c.titulo}</button>
        `).join("")}
      </div>
    </div>`;
}

/* Drag-and-drop nativo (desktop). No mobile/teclado, o status-stepper
   dentro do próprio card garante que mover uma tarefa nunca dependa de
   arrastar — funciona igual em qualquer dispositivo. */
function inicializarDragAndDrop() {
  document.querySelectorAll(".kanban-card").forEach(card => {
    card.addEventListener("dragstart", () => {
      TZ.estado.arrastandoId = card.dataset.id;
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });

  document.querySelectorAll(".kanban-column").forEach(coluna => {
    coluna.addEventListener("dragover", (e) => {
      e.preventDefault();
      coluna.classList.add("drag-over");
    });
    coluna.addEventListener("dragleave", () => coluna.classList.remove("drag-over"));
    coluna.addEventListener("drop", (e) => {
      e.preventDefault();
      coluna.classList.remove("drag-over");
      if (TZ.estado.arrastandoId) {
        definirStatusTarefa(TZ.estado.arrastandoId, coluna.dataset.status);
        TZ.estado.arrastandoId = null;
      }
    });
  });
}

function definirFiltroCategoria(categoria) {
  TZ.estado.filtroCategoria = categoria;
  trocarView("tarefas");
  sincronizarControlesFiltro();
  renderizarViewTarefas();
}

function sincronizarControlesFiltro() {
  document.querySelectorAll("[data-filtro-categoria]").forEach(el =>
    el.classList.toggle("active", el.dataset.filtroCategoria === TZ.estado.filtroCategoria));
  document.querySelectorAll("[data-filtro-data]").forEach(el =>
    el.classList.toggle("active", el.dataset.filtroData === TZ.estado.filtroData));
  const selectOrdenacao = document.getElementById("select-ordenacao");
  if (selectOrdenacao) selectOrdenacao.value = TZ.estado.ordenacao;
  const inputBusca = document.getElementById("input-busca");
  if (inputBusca) inputBusca.value = TZ.estado.busca;
}

function inicializarControlesTarefas() {
  document.querySelectorAll("[data-filtro-categoria]").forEach(btn => {
    btn.addEventListener("click", () => {
      TZ.estado.filtroCategoria = btn.dataset.filtroCategoria;
      sincronizarControlesFiltro();
      renderizarViewTarefas();
    });
  });

  document.querySelectorAll("[data-filtro-data]").forEach(btn => {
    btn.addEventListener("click", () => {
      TZ.estado.filtroData = btn.dataset.filtroData;
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
    const buscarComDebounce = TZ.debounce(() => {
      TZ.estado.busca = inputBusca.value;
      renderizarViewTarefas();
    }, 180);
    inputBusca.addEventListener("input", buscarComDebounce);
  }

  const formQuickAdd = document.getElementById("form-quick-add");
  if (formQuickAdd) {
    formQuickAdd.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("input-quick-add");
      adicionarTarefaRapida(input.value);
      input.value = "";
      input.focus();
    });
  }

  const btnFab = document.getElementById("btn-fab-nova-tarefa");
  if (btnFab) btnFab.addEventListener("click", () => abrirModalTarefa());

  const formTarefa = document.getElementById("form-tarefa");
  if (formTarefa) formTarefa.addEventListener("submit", salvarTarefaForm);

  const btnConfirmarExclusao = document.getElementById("btn-confirmar-exclusao");
  if (btnConfirmarExclusao) btnConfirmarExclusao.addEventListener("click", confirmarExclusao);
}

/* -------------------------------------------------------------------- */
/* Renderização de card em formato de lista (dashboard, calendário,      */
/* arquivadas) — mais simples que o card do Kanban, com checkbox único.  */
/* -------------------------------------------------------------------- */
function renderizarCardTarefa(tarefa, opcoes = {}) {
  const cat = TZ.CATEGORIAS[tarefa.categoria];
  const pri = TZ.PRIORIDADES[tarefa.prioridade];
  const atrasada = TZ.isAtrasada(tarefa);
  const concluida = tarefa.status === "concluida";

  const classes = ["task-card", `prioridade-${tarefa.prioridade}`, concluida ? "concluida" : "", atrasada ? "atrasada" : ""].filter(Boolean).join(" ");

  const metaVencimento = tarefa.vencimento
    ? `<span class="meta-item">📅 ${TZ.formatarDataBR(tarefa.vencimento)}${tarefa.horario ? " · " + tarefa.horario : ""}</span>`
    : "";
  const metaAtraso = atrasada ? `<span class="chip tag-atrasada">⚠️ Atrasada há ${TZ.diasAtraso(tarefa.vencimento)} dia(s)</span>` : "";
  const metaRepeticao = tarefa.repeticao && tarefa.repeticao !== "nao" ? `<span class="meta-item">🔁 ${TZ.REPETICOES[tarefa.repeticao]}</span>` : "";
  const chipStatus = tarefa.status === "andamento" ? `<span class="chip tag-status-andamento">◐ Em andamento</span>` : "";
  const conclusaoHtml = concluida ? `<div class="task-conclusao">✓ Concluída em ${TZ.formatarDataHoraBR(tarefa.concluidoEm)}</div>` : "";
  const botaoArquivar = opcoes.mostrarArquivar !== false
    ? `<button onclick="alternarArquivamento('${tarefa.id}')" title="${tarefa.arquivada ? "Restaurar" : "Arquivar"}">${tarefa.arquivada ? "♻️" : "🗄️"}</button>`
    : "";

  return `
    <div class="${classes}" data-id="${tarefa.id}">
      <div class="task-check" onclick="alternarConclusao('${tarefa.id}')" role="checkbox" aria-checked="${concluida}" tabindex="0" title="${concluida ? "Desfazer conclusão" : "Concluir tarefa"}">${concluida ? "✓" : ""}</div>
      <div class="task-body">
        <div class="task-nome">${escaparHtml(tarefa.nome)}</div>
        ${tarefa.descricao ? `<div class="task-desc">${escaparHtml(tarefa.descricao)}</div>` : ""}
        <div class="task-meta">
          <span class="chip tag-${cat.cor}">${cat.icone} ${cat.nome}</span>
          <span class="chip tag-${tarefa.prioridade}">${pri.icone} ${pri.nome}</span>
          ${chipStatus}
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

function renderizarViewArquivadas() {
  const lista = document.getElementById("lista-arquivadas");
  if (!lista) return;
  const tarefas = TZ.lerTarefas().filter(t => t.arquivada);
  lista.innerHTML = tarefas.length === 0
    ? `<div class="empty-state"><div class="ic">🗄️</div><p>Nenhuma tarefa arquivada.</p></div>`
    : tarefas.map(t => renderizarCardTarefa(t)).join("");
}

/* ==========================================================================
   TaskZone — script.js (v2 — Parte 3: Dashboard)
   ========================================================================== */

function renderizarDashboard() {
  const tarefas = TZ.lerTarefas().filter(t => !t.arquivada);
  const stats = TZ.calcularEstatisticas(tarefas);

  renderizarHeroBanner(stats);
  renderizarTrilhasCategorias(stats);
  renderizarNotificacoesDashboard(stats);
  renderizarTarefasHoje(tarefas);
  renderizarHistorico(tarefas);
  atualizarSeloNivelSidebar(stats);
}

/* -------------------------------------------------------------------- */
/* Hero: saudação + pílulas de contagem + barra de XP + sequência         */
/* -------------------------------------------------------------------- */
function renderizarHeroBanner(stats) {
  const headline = document.getElementById("hero-headline");
  const sub = document.getElementById("hero-sub");
  if (!headline) return;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  let frase, sublinha;

  if (stats.hojeTotal === 0) {
    frase = `${saudacao}. Nada marcado para hoje.`;
    sublinha = "Aproveite para adiantar algo do quadro ou planejar a semana.";
  } else if (stats.hojeConcluidas === stats.hojeTotal) {
    frase = "Tudo certo por hoje.";
    sublinha = `Você concluiu as ${stats.hojeTotal} tarefas marcadas para hoje. 🎉`;
  } else if (stats.totalAtrasadas > 0) {
    frase = "Vamos colocar isso em dia?";
    sublinha = `Você tem ${stats.totalAtrasadas} tarefa(s) atrasada(s) esperando por você.`;
  } else if (stats.hojeConcluidas > 0) {
    frase = "Mandando bem hoje.";
    sublinha = `${stats.hojeConcluidas} de ${stats.hojeTotal} tarefas de hoje já concluídas.`;
  } else {
    frase = `${saudacao}. Hora de agir.`;
    sublinha = `Você tem ${stats.hojeTotal} tarefa(s) para hoje.`;
  }

  headline.textContent = frase;
  sub.textContent = sublinha;

  document.getElementById("hero-total").textContent = stats.total;
  document.getElementById("hero-andamento").textContent = stats.totalEmAndamento;
  document.getElementById("hero-concluidas").textContent = stats.totalConcluidas;
  const pillAtrasadas = document.getElementById("hero-pill-atrasadas");
  document.getElementById("hero-atrasadas").textContent = stats.totalAtrasadas;
  pillAtrasadas.classList.toggle("alerta", stats.totalAtrasadas > 0);

  document.getElementById("xp-hero-nivel").textContent = `Nível ${stats.nivel.nivel}`;
  document.getElementById("xp-hero-valores").innerHTML = `<strong>${stats.nivel.xpNoNivel}</strong> / ${stats.nivel.xpParaProximo} XP`;
  document.getElementById("xp-hero-fill").style.width = `${stats.nivel.percentual}%`;

  const streakPill = document.getElementById("streak-pill");
  streakPill.innerHTML = stats.sequenciaAtual > 0
    ? `🔥 ${stats.sequenciaAtual} dia(s) seguidos`
    : `✨ Comece hoje sua sequência`;
}

function atualizarSeloNivelSidebar(stats) {
  const badge = document.getElementById("sidebar-nivel-badge");
  const fill = document.getElementById("sidebar-xp-fill");
  const label = document.getElementById("sidebar-xp-label");
  if (!badge) return;
  badge.textContent = stats.nivel.nivel;
  fill.style.width = `${stats.nivel.percentual}%`;
  label.textContent = `${stats.nivel.xpNoNivel}/${stats.nivel.xpParaProximo} XP`;
}

/* -------------------------------------------------------------------- */
/* Trilhas de progresso por categoria                                    */
/* -------------------------------------------------------------------- */
function renderizarTrilhasCategorias(stats) {
  const container = document.getElementById("progresso-categorias");
  if (!container) return;

  container.innerHTML = Object.keys(TZ.CATEGORIAS).map(cat => {
    const meta = TZ.CATEGORIAS[cat];
    const dados = stats.porCategoria[cat];
    const pct = dados.total > 0 ? Math.round((dados.concluidas / dados.total) * 100) : 0;
    return `
      <div class="trilha-item">
        <div class="trilha-top">
          <span class="nome">${meta.icone} ${meta.nome}</span>
          <span class="num mono">${dados.concluidas}/${dados.total}</span>
        </div>
        <div class="trilha-track">
          <div class="trilha-fill ${meta.cor}" style="width:${pct}%"></div>
          <div class="trilha-waypoints"><span></span><span></span><span></span><span></span><span></span></div>
        </div>
      </div>`;
  }).join("");
}

/* -------------------------------------------------------------------- */
/* Notificações visuais do dashboard                                     */
/* -------------------------------------------------------------------- */
function renderizarNotificacoesDashboard(stats) {
  const container = document.getElementById("notificacoes-dashboard");
  if (!container) return;

  const notices = [];
  const faltamHoje = stats.hojeTotal - stats.hojeConcluidas;
  if (faltamHoje > 0) notices.push({ tipo: "info", icone: "🔔", texto: `Você possui ${faltamHoje} tarefa(s) vencendo hoje.` });
  if (stats.totalAtrasadas > 0) notices.push({ tipo: "warn", icone: "⚠️", texto: `Você possui ${stats.totalAtrasadas} tarefa(s) atrasada(s).` });

  container.innerHTML = notices.map(n => `
    <div class="notice ${n.tipo}">
      <span>${n.icone}</span><span>${n.texto}</span>
      <button class="notice-close" onclick="this.parentElement.remove()" aria-label="Fechar notificação">✕</button>
    </div>`).join("");
}

/* -------------------------------------------------------------------- */
/* Tarefas de hoje                                                       */
/* -------------------------------------------------------------------- */
function renderizarTarefasHoje(tarefas) {
  const container = document.getElementById("lista-tarefas-hoje");
  if (!container) return;

  const doDia = tarefas.filter(t => t.vencimento && TZ.isHoje(t.vencimento))
    .sort((a, b) => TZ.PRIORIDADES[b.prioridade].peso - TZ.PRIORIDADES[a.prioridade].peso);

  container.innerHTML = doDia.length === 0
    ? `<div class="empty-state"><div class="ic">📭</div><p>Nenhuma tarefa vence hoje.</p></div>`
    : doDia.map(t => renderizarCardTarefa(t, { mostrarArquivar: false })).join("");
}

/* -------------------------------------------------------------------- */
/* Histórico de tarefas concluídas, agrupado por dia                     */
/* -------------------------------------------------------------------- */
function renderizarHistorico(tarefas) {
  const container = document.getElementById("lista-historico");
  if (!container) return;

  const concluidas = tarefas.filter(t => t.status === "concluida" && t.concluidoEm)
    .sort((a, b) => new Date(b.concluidoEm) - new Date(a.concluidoEm));

  if (concluidas.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ic">🕒</div><p>Nenhuma tarefa concluída ainda.</p></div>`;
    return;
  }

  const grupos = {};
  concluidas.forEach(t => {
    const label = rotuloDia(t.concluidoEm.slice(0, 10));
    (grupos[label] = grupos[label] || []).push(t);
  });

  container.innerHTML = Object.keys(grupos).map(label => `
    <div class="history-group">
      <div class="history-group-title">${label}</div>
      ${grupos[label].map(t => {
        const cat = TZ.CATEGORIAS[t.categoria];
        return `
          <div class="history-item">
            <span><span class="chip tag-${cat.cor}" style="margin-right:8px;">${cat.icone}</span><span class="nome">${escaparHtml(t.nome)}</span></span>
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
   TaskZone — script.js (v2 — Parte 4: Calendário, Estatísticas, Conquistas)
   ========================================================================== */

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
  tarefas.forEach(t => { tarefasPorDia[t.vencimento] = (tarefasPorDia[t.vencimento] || 0) + 1; });

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  let html = DIAS_SEMANA.map(d => `<div class="calendar-weekday">${d}</div>`).join("");
  for (let i = 0; i < primeiroDiaSemana; i++) html += `<div class="calendar-day vazio"></div>`;

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const isHoje = iso === TZ.hojeISO();
    const isSelecionado = iso === TZ.estado.diaCalendarioSelecionado;
    const temTarefas = tarefasPorDia[iso] > 0;
    html += `
      <button type="button" class="calendar-day ${isHoje ? "hoje" : ""} ${isSelecionado ? "selecionado" : ""}" data-dia="${iso}">
        <span>${dia}</span>${temTarefas ? `<span class="dots"><span></span></span>` : ""}
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
  document.getElementById("calendar-mes-anterior")?.addEventListener("click", () => {
    TZ.estado.mesCalendario.setMonth(TZ.estado.mesCalendario.getMonth() - 1);
    renderizarCalendario();
  });
  document.getElementById("calendar-mes-proximo")?.addEventListener("click", () => {
    TZ.estado.mesCalendario.setMonth(TZ.estado.mesCalendario.getMonth() + 1);
    renderizarCalendario();
  });
  document.getElementById("calendar-ir-hoje")?.addEventListener("click", () => {
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
  document.getElementById("stat-sequencia-desc").textContent = stats.sequenciaAtual > 0
    ? `Você completou pelo menos uma tarefa nos últimos ${stats.sequenciaAtual} dia(s).`
    : "Conclua uma tarefa hoje para começar sua sequência.";

  document.getElementById("stat-categoria-mais").textContent = `${TZ.CATEGORIAS[stats.categoriaComMais].icone} ${TZ.CATEGORIAS[stats.categoriaComMais].nome}`;
  document.getElementById("stat-categoria-taxa").textContent = `${TZ.CATEGORIAS[stats.categoriaComMelhorTaxa].icone} ${TZ.CATEGORIAS[stats.categoriaComMelhorTaxa].nome}`;

  document.getElementById("stat-progresso-geral-pct").textContent = `${stats.progressoGeral}%`;
  document.getElementById("stat-progresso-geral-fill").style.width = `${stats.progressoGeral}%`;
  document.getElementById("stat-progresso-geral-desc").textContent = `${stats.totalConcluidas} tarefas concluídas de ${stats.total} totais`;

  document.getElementById("stat-nivel-atual").textContent = stats.nivel.nivel;
  document.getElementById("stat-xp-total").textContent = `${stats.nivel.xpTotal} XP`;
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

function verificarNovasConquistas() {
  const tarefas = TZ.lerTarefas().filter(t => !t.arquivada);
  const stats = TZ.calcularEstatisticas(tarefas);
  const desbloqueadas = new Set(TZ.lerConquistas());
  const novas = [];

  TZ.CONQUISTAS_DEF.forEach(c => {
    if (!desbloqueadas.has(c.id) && c.meta(stats)) {
      desbloqueadas.add(c.id);
      novas.push(c);
    }
  });

  if (novas.length > 0) {
    TZ.salvarConquistas(Array.from(desbloqueadas));
    if (TZ.estado.viewAtual === "conquistas") renderizarConquistas();
    novas.forEach(c => mostrarToast(`Conquista desbloqueada: ${c.icone} ${c.nome}`, "success"));
  }
}

/* ==========================================================================
   TaskZone — script.js (v2 — Parte 5: Foco, Config, toast/confete, init)
   ========================================================================== */

/* -------------------------------------------------------------------- */
/* Toasts — substituem a maioria dos alert() por feedback não bloqueante  */
/* -------------------------------------------------------------------- */
function mostrarToast(mensagem, tipo = "info", opcoes = {}) {
  const stack = document.getElementById("toast-stack");
  if (!stack) return;

  const icones = { success: "✅", info: "ℹ️", warn: "⚠️" };
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.innerHTML = `
    <span class="toast-ic">${icones[tipo] || "ℹ️"}</span>
    <span>${mensagem}</span>
    ${opcoes.textoAcao ? `<button class="toast-undo">${opcoes.textoAcao}</button>` : ""}
  `;
  stack.appendChild(toast);

  if (opcoes.textoAcao && opcoes.aoClicarAcao) {
    toast.querySelector(".toast-undo").addEventListener("click", () => {
      opcoes.aoClicarAcao();
      removerToast(toast);
    });
  }

  const duracao = opcoes.duracaoMs || (opcoes.textoAcao ? 6000 : 3200);
  setTimeout(() => removerToast(toast), duracao);
}

function removerToast(toast) {
  if (!toast || !toast.parentElement) return;
  toast.classList.add("saindo");
  setTimeout(() => toast.remove(), 200);
}

/* -------------------------------------------------------------------- */
/* Confete leve em DOM puro — disparado ao concluir uma tarefa            */
/* -------------------------------------------------------------------- */
function dispararConfete() {
  const layer = document.getElementById("confetti-layer");
  if (!layer) return;
  const cores = ["#FFC542", "#7FD8A6", "#6EC1E4", "#C792EA", "#FF6B6B"];

  for (let i = 0; i < 26; i++) {
    const peca = document.createElement("span");
    peca.className = "confetti-piece";
    peca.style.left = `${Math.random() * 100}vw`;
    peca.style.background = cores[Math.floor(Math.random() * cores.length)];
    peca.style.animationDuration = `${1.4 + Math.random() * 1.2}s`;
    peca.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(peca);
    setTimeout(() => peca.remove(), 2800);
  }
}

function dispararCelebracaoConclusao(prioridade) {
  const xp = TZ.PRIORIDADES[prioridade]?.xp || 10;
  dispararConfete();
  mostrarToast(`Tarefa concluída! +${xp} XP`, "success");
}

/* -------------------------------------------------------------------- */
/* Modo Foco (Pomodoro)                                                  */
/* -------------------------------------------------------------------- */
TZ.foco = { tarefaId: null, duracaoMin: 25, segundosRestantes: 25 * 60, rodando: false, intervalo: null };

function renderizarViewFoco() {
  const select = document.getElementById("foco-select-tarefa");
  if (!select) return;

  const pendentes = TZ.lerTarefas().filter(t => !t.arquivada && t.status !== "concluida");
  select.innerHTML = `<option value="">Selecione uma tarefa...</option>` +
    pendentes.map(t => `<option value="${t.id}">${TZ.CATEGORIAS[t.categoria].icone} ${escaparHtml(t.nome)}</option>`).join("");

  if (TZ.foco.tarefaId && pendentes.some(t => t.id === TZ.foco.tarefaId)) select.value = TZ.foco.tarefaId;

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
  document.getElementById("foco-select-tarefa")?.addEventListener("change", (e) => {
    TZ.foco.tarefaId = e.target.value || null;
    if (TZ.foco.tarefaId) definirStatusTarefa(TZ.foco.tarefaId, "andamento");
    atualizarInfoTarefaFoco();
  });

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
      definirStatusTarefa(TZ.foco.tarefaId, "concluida");
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
function pausarTimerFoco() { TZ.foco.rodando = false; clearInterval(TZ.foco.intervalo); }
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
  const dados = { tarefas: TZ.lerTarefas(), conquistas: TZ.lerConquistas(), config: TZ.lerConfig(), tema: TZ.lerTema(), exportadoEm: new Date().toISOString(), versao: 2 };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `taskzone-backup-${TZ.hojeISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  mostrarToast("Backup exportado.", "success");
}

function importarDados(arquivo) {
  const leitor = new FileReader();
  leitor.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      if (!Array.isArray(dados.tarefas)) throw new Error("Formato inválido");
      if (!confirm("Importar este arquivo substituirá suas tarefas atuais. Deseja continuar?")) return;

      TZ.salvarTarefas(dados.tarefas.map(TZ.normalizarStatus));
      if (Array.isArray(dados.conquistas)) TZ.salvarConquistas(dados.conquistas);
      if (dados.config) TZ.salvarConfig(dados.config);
      if (dados.tema) TZ.salvarTema(dados.tema);

      mostrarToast("Dados importados com sucesso!", "success");
      setTimeout(() => location.reload(), 900);
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

  document.getElementById("btn-limpar-concluidas")?.addEventListener("click", () => {
    if (!confirm("Isso excluirá permanentemente todas as tarefas concluídas. Deseja continuar?")) return;
    const tarefas = TZ.lerTarefas().filter(t => t.status !== "concluida");
    TZ.salvarTarefas(tarefas);
    atualizarViewAtual();
    mostrarToast("Tarefas concluídas removidas.", "info");
  });

  document.getElementById("btn-restaurar-demo")?.addEventListener("click", () => {
    if (!confirm("Isso substituirá suas tarefas atuais pelos dados de demonstração. Deseja continuar?")) return;
    TZ.restaurarDemo();
    location.reload();
  });

  document.getElementById("btn-comecar-zero")?.addEventListener("click", () => {
    if (!confirm("Isso apagará todas as tarefas de demonstração e deixará sua lista vazia. Deseja continuar?")) return;
    TZ.comecarDoZero();
    location.reload();
  });

  document.getElementById("btn-exportar-dados")?.addEventListener("click", exportarDados);

  const inputImportar = document.getElementById("input-importar-dados");
  if (inputImportar) {
    inputImportar.addEventListener("change", () => {
      if (inputImportar.files && inputImportar.files[0]) {
        importarDados(inputImportar.files[0]);
        inputImportar.value = "";
      }
    });
  }

  document.getElementById("btn-apagar-tudo")?.addEventListener("click", () => {
    if (!confirm("Isso apagará TODOS os seus dados do TaskZone permanentemente, incluindo tarefas e conquistas. Esta ação não pode ser desfeita. Deseja continuar?")) return;
    TZ.apagarTudo();
    location.reload();
  });
}

function aplicarAnimacoes(ativas) { document.body.classList.toggle("sem-animacoes", !ativas); }

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
      const novo = document.body.getAttribute("data-tema") === "claro" ? "escuro" : "claro";
      document.documentElement.setAttribute("data-tema", novo);
      document.body.setAttribute("data-tema", novo);
      TZ.salvarTema(novo);
      document.querySelectorAll(".toggle-tema-btn").forEach(b => atualizarIconeTema(b, novo));
    });
  });
}
function atualizarIconeTema(btn, tema) { btn.textContent = tema === "claro" ? "☀️" : "🌙"; }

/* -------------------------------------------------------------------- */
/* Navegação entre views (SPA)                                           */
/* -------------------------------------------------------------------- */
const RENDERIZADORES_VIEW = {
  dashboard: renderizarDashboard, tarefas: renderizarViewTarefas, calendario: renderizarCalendario,
  estatisticas: renderizarEstatisticas, conquistas: renderizarConquistas, foco: renderizarViewFoco,
  arquivadas: renderizarViewArquivadas
};
const TITULOS_VIEW = {
  dashboard: ["Dashboard", "Aqui está o que você precisa fazer hoje"],
  tarefas: ["Quadro de tarefas", "Arraste entre as colunas ou use os botões do card"],
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
  if (TZ.estado.viewAtual !== "dashboard") renderizarDashboard();
}

function inicializarNavegacao() {
  document.querySelectorAll("[data-nav]").forEach(link => {
    link.addEventListener("click", (e) => { e.preventDefault(); trocarView(link.dataset.nav); });
  });
}

function inicializarMenuMobile() {
  const btn = document.getElementById("btn-hamburguer");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  btn?.addEventListener("click", () => { sidebar.classList.add("open"); overlay.classList.add("open"); });
  overlay?.addEventListener("click", fecharSidebarMobile);
}
function fecharSidebarMobile() {
  document.querySelector(".sidebar")?.classList.remove("open");
  document.getElementById("sidebar-overlay")?.classList.remove("open");
}

/* -------------------------------------------------------------------- */
/* Modal (utilitário genérico) — fecha com ESC e ao clicar fora           */
/* -------------------------------------------------------------------- */
function abrirModal(id) { document.getElementById(id)?.classList.add("open"); }
function fecharModal(id) { document.getElementById(id)?.classList.remove("open"); }
document.addEventListener("click", (e) => {
  if (e.target.classList?.contains("modal-overlay")) e.target.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open"));
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
