import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const localKey = "taskzone_tarefas";
let tasks = [], filter = "open", editing = null, ready = false, busy = false;
let dbApi, db, user, unsubscribe, pendingLocal = [], session = 0;
const uid = () => crypto.randomUUID();
const notice = message => { $("notice").textContent = message; };
const isDone = task => task.status === "concluida";

function validate(data) {
  if (!Array.isArray(data) || data.some(t => !t || typeof t.nome !== "string" ||
      !t.nome.trim() || typeof t.id !== "string" || !t.id || t.id.includes("/") ||
      t.id === "." || t.id === "..")) throw Error("O arquivo contém tarefas inválidas.");
  return data;
}
function localTasks() {
  return validate(JSON.parse(localStorage.getItem(localKey) ?? "[]"));
}
function button(label, className, action) {
  const element = document.createElement("button");
  element.textContent = label;
  element.className = className;
  element.onclick = action;
  return element;
}
function render() {
  const matches = tasks.filter(t => filter === "archive" ? t.arquivada :
    !t.arquivada && isDone(t) === (filter === "done"));
  matches.sort((a,b) => (a.vencimento || "9999").localeCompare(b.vencimento || "9999") ||
    a.nome.localeCompare(b.nome,"pt-BR"));
  const list = $("list");
  list.replaceChildren();
  if (!matches.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = !ready ? "Aguardando a lista de tarefas…" :
      ({open:"Tudo em dia. Nenhuma tarefa aberta.", done:"Suas tarefas concluídas aparecem aqui.", archive:"Nenhuma tarefa arquivada."})[filter];
    list.append(p);
  }
  for (const t of matches) {
    const row = document.createElement("article");
    const check = button(isDone(t) ? "✓" : "", "check", () => run(() => patch(t.id,{
      status:isDone(t) ? "afazer" : "concluida", concluidoEm:isDone(t) ? null : new Date().toISOString()
    })));
    check.setAttribute("aria-label",(isDone(t) ? "Reabrir " : "Concluir ") + t.nome);
    const title = button("", "task", () => openEditor(t));
    const name = document.createElement("strong");
    name.textContent = t.nome;
    const meta = document.createElement("small");
    meta.textContent = [t.status === "andamento" && "Em andamento", t.vencimento?.split("-").reverse().join("/"),
      t.horario, t.descricao, t.observacao].filter(Boolean).join(" · ");
    title.append(name,meta);
    const archive = button(t.arquivada ? "Restaurar" : "Arquivar","",() => run(() => patch(t.id,{arquivada:!t.arquivada})));
    row.append(check,title,archive);
    list.append(row);
  }
  for (const el of document.querySelectorAll("#list button,#add,#import,#export,#save,#migrate")) el.disabled = !ready || busy;
}
async function run(action) {
  if (!ready || busy) return;
  busy = true;
  notice("");
  render();
  try { await action(); }
  catch(error) { notice("Operação não concluída. " + error.message); }
  finally { busy = false; render(); }
}
function localWrite(change) {
  const list = localTasks();
  change(list);
  localStorage.setItem(localKey,JSON.stringify(list));
  tasks = list;
}
function ref(id) { return dbApi.doc(db,"users",user.uid,"tasks",id); }
async function patch(id, fields) {
  if (user) await dbApi.updateDoc(ref(id),fields);
  else localWrite(list => {
    const t = list.find(t => t.id === id);
    if (!t) throw Error("Tarefa ausente.");
    Object.assign(t,fields);
  });
}
async function merge(incoming) {
  if (!user) {
    localWrite(list => {
      const ids = new Set(list.map(t => t.id));
      for (const t of incoming) if (!ids.has(t.id)) { list.push(t); ids.add(t.id); }
    });
    return;
  }
  const originalSession = session;
  for (const t of incoming) {
    if (session !== originalSession) throw Error("A conta mudou. Repita a importação na conta desejada.");
    const dest = ref(t.id);
    await dbApi.runTransaction(db, async tx => {
      if (!(await tx.get(dest)).exists()) tx.set(dest,t);
    });
  }
}
function openEditor(t) {
  editing = t || null;
  $("dialogTitle").textContent = t ? "Editar tarefa" : "Nova tarefa";
  $("name").value = t?.nome ?? "";
  $("description").value = t?.descricao ?? "";
  $("due").value = t?.vencimento ?? "";
  $("editor").showModal();
}
$("add").onclick = () => openEditor(null);
$("cancel").onclick = () => $("editor").close();
$("form").onsubmit = event => {
  event.preventDefault();
  run(async () => {
    const fields = {nome:$("name").value.trim(), descricao:$("description").value.trim(), vencimento:$("due").value};
    if (!fields.nome) throw Error("Digite o nome da tarefa.");
    if (editing) await patch(editing.id,fields);
    else {
      const task = {...fields,id:uid(),status:"afazer",arquivada:false,criadoEm:new Date().toISOString()};
      if (user) await dbApi.setDoc(ref(task.id),task);
      else localWrite(list => list.push(task));
      selectFilter("open");
    }
    $("editor").close();
  });
};
function selectFilter(next) {
  filter = next;
  for (const b of document.querySelectorAll("[data-filter]")) b.setAttribute("aria-pressed",b.dataset.filter === filter);
  render();
}
for (const b of document.querySelectorAll("[data-filter]")) b.onclick = () => selectFilter(b.dataset.filter);
$("import").onclick = () => $("file").click();
$("file").onchange = event => {
  const file = event.target.files[0];
  event.target.value = "";
  if (file) run(async () => { await merge(validate(JSON.parse(await file.text()).tarefas)); notice("Backup importado."); });
};
$("export").onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({versao:3,tarefas:tasks},null,2)],{type:"application/json"}));
  const link = document.createElement("a");
  link.href = url; link.download = "taskzone-backup.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
};
$("migrate").onclick = () => run(async () => {
  await merge(pendingLocal);
  localStorage.setItem("taskzone_migrado_" + user.uid,JSON.stringify(pendingLocal));
  $("migration").hidden = true;
  notice("Tarefas deste navegador copiadas para a conta.");
});
function showLocal(message) {
  tasks = localTasks(); ready = true;
  $("sync").textContent = message;
  render();
}
window.addEventListener("storage",event => {
  if (!user && ready && (event.key === localKey || event.key === null)) {
    try { tasks = localTasks(); render(); } catch(error) { notice(error.message); }
  }
});
async function start() {
  $("today").textContent = new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"numeric",month:"long"}).format(new Date());
  render();
  if (!firebaseConfig) return showLocal("Salvo neste navegador. A sincronização com Google aguarda configuração.");
  const sdk = "https://www.gstatic.com/firebasejs/10.14.1/";
  const [app, authApi, store] = await Promise.all(["firebase-app.js","firebase-auth.js","firebase-firestore.js"].map(path => import(sdk + path)));
  const instance = app.initializeApp(firebaseConfig);
  const auth = authApi.getAuth(instance);
  dbApi = store; db = store.getFirestore(instance);
  $("login").onclick = () => authApi.signInWithPopup(auth,new authApi.GoogleAuthProvider()).catch(e => notice(e.message));
  $("logout").onclick = () => authApi.signOut(auth).catch(e => notice(e.message));
  authApi.onAuthStateChanged(auth,account => {
    const current = ++session;
    unsubscribe?.(); user = account; tasks = []; ready = false; notice("");
    $("editor").close(); $("migration").hidden = true;
    $("identity").textContent = account?.email || "";
    $("login").hidden = !!account; $("logout").hidden = !account;
    render();
    if (!account) {
      try { showLocal("Salvo neste navegador. Entre com Google para acessar suas tarefas em outros computadores."); }
      catch(e) { notice(e.message); }
      return;
    }
    $("sync").textContent = "Conectando à sua lista…";
    unsubscribe = store.onSnapshot(store.collection(db,"users",account.uid,"tasks"),{includeMetadataChanges:true},snapshot => {
      if (current !== session) return;
      tasks = snapshot.docs.map(doc => ({...doc.data(),id:doc.id}));
      ready = !snapshot.metadata.fromCache;
      $("sync").textContent = !ready ? "Aguardando conexão com o Google…" : snapshot.metadata.hasPendingWrites ? "Salvando…" : "Sincronizado com sua conta Google";
      render();
      try {
        pendingLocal = localTasks();
        $("migration").hidden = !ready || !pendingLocal.length || localStorage.getItem("taskzone_migrado_" + account.uid) === JSON.stringify(pendingLocal);
        $("migrationText").textContent = pendingLocal.length + " tarefa(s) neste navegador.";
      } catch(e) { notice("Não foi possível ler a lista antiga. " + e.message); }
    }, error => {
      if (current !== session) return;
      ready = false; render(); $("sync").textContent = "Falha ao sincronizar. Recarregue para tentar novamente."; notice(error.message);
    });
  });
}
start().catch(error => { notice("Falha ao abrir o TaskZone. " + error.message); });
