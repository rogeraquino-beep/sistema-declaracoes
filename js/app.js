
const App = (() => {
  const DB_NAME = "sistemaDeclaracoesDB";
  const DB_VERSION = 1;
  let dbPromise = null;

  const NAV = [
    { key: "dashboard", href: "index.html", icon: "⌂", label: "Dashboard" },
    { key: "funcionarios", href: "funcionarios.html", icon: "👥", label: "Funcionários" },
    { key: "declaracoes", href: "declaracoes.html", icon: "📄", label: "Declarações" },
    { key: "nova-declaracao", href: "nova-declaracao.html", icon: "＋", label: "Nova Declaração" },
    { key: "novo-funcionario", href: "novo-funcionario.html", icon: "＋", label: "Novo Funcionário" },
    { key: "relatorios", href: "relatorios.html", icon: "▥", label: "Relatórios" }
  ];

  function uid(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function escapeHTML(value = "") {
    return String(value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";
    const [y,m,d] = String(dateValue).slice(0,10).split("-");
    if (!y || !m || !d) return dateValue;
    return `${d}/${m}/${y}`;
  }

  function formatBytes(bytes=0) {
    if (!bytes) return "0 KB";
    const units = ["B","KB","MB","GB"];
    let i = 0, n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function initials(name = "") {
    return name.trim().split(/\s+/).slice(0,2).map(part => part[0]?.toUpperCase() || "").join("") || "FN";
  }

  function getPageKey() {
    return document.body.dataset.page || "";
  }

  function layout(title, subtitle, content) {
    const page = getPageKey();
    document.title = `${title} | Sistema de Declarações`;
    document.getElementById("app").innerHTML = `
      <div class="app-shell">
        <aside class="sidebar" id="sidebar">
          <div class="brand">
            <div class="brand-mark">EC</div>
            <div class="brand-text">
              <strong>Sistema de Declarações</strong>
              <span>E.M. Profª Eunice Carneiro</span>
            </div>
          </div>
          <nav class="nav">
            ${NAV.map(item => `
              <a href="${item.href}" class="${item.key === page ? "active" : ""}">
                <span class="nav-icon">${item.icon}</span>
                <span>${item.label}</span>
              </a>
            `).join("")}
          </nav>
          <div class="sidebar-footer">Armazenamento local • IndexedDB</div>
        </aside>
        <main class="main">
          <header class="topbar">
            <div style="display:flex;align-items:center;gap:12px">
              <button class="menu-toggle" id="menuToggle" aria-label="Abrir menu">☰</button>
              <div class="topbar-title">
                <h1>${escapeHTML(title)}</h1>
                <p>${escapeHTML(subtitle)}</p>
              </div>
            </div>
            <div class="no-print" style="display:flex;gap:8px">
              <a class="btn btn-secondary btn-sm" href="nova-declaracao.html">＋ Nova declaração</a>
            </div>
          </header>
          <section class="content">${content}</section>
        </main>
      </div>
      <div id="modalRoot"></div>
    `;
    document.getElementById("menuToggle")?.addEventListener("click", () => {
      document.getElementById("sidebar")?.classList.toggle("open");
    });
  }

  function openModal({title, body, footer = ""}) {
    const root = document.getElementById("modalRoot");
    root.innerHTML = `
      <div class="modal-backdrop show" id="modalBackdrop">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close" aria-label="Fechar" data-close-modal>×</button>
          </div>
          <div class="modal-body">${body}</div>
          ${footer ? `<div class="modal-footer">${footer}</div>` : ""}
        </div>
      </div>
    `;
    root.querySelectorAll("[data-close-modal]").forEach(btn => btn.addEventListener("click", closeModal));
    root.querySelector("#modalBackdrop")?.addEventListener("click", e => {
      if (e.target.id === "modalBackdrop") closeModal();
    });
    document.addEventListener("keydown", escClose);
  }

  function escClose(e) { if (e.key === "Escape") closeModal(); }
  function closeModal() {
    const root = document.getElementById("modalRoot");
    if (root) root.innerHTML = "";
    document.removeEventListener("keydown", escClose);
  }

  function toast(message, type="success") {
    const id = "toastRoot";
    let root = document.getElementById(id);
    if (!root) {
      root = document.createElement("div");
      root.id = id;
      root.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:5000;display:flex;flex-direction:column;gap:10px";
      document.body.appendChild(root);
    }
    const item = document.createElement("div");
    const map = {success:"alert-success", warning:"alert-warning", danger:"alert-danger", info:"alert-info"};
    item.className = `alert ${map[type] || map.info}`;
    item.style.cssText += "box-shadow:0 12px 30px rgba(16,24,40,.14);max-width:360px;margin:0;";
    item.innerHTML = escapeHTML(message);
    root.appendChild(item);
    setTimeout(() => item.remove(), 3200);
  }

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("funcionarios")) {
          const store = db.createObjectStore("funcionarios", { keyPath: "id" });
          store.createIndex("nome", "nome", { unique: false });
          store.createIndex("matricula", "matricula", { unique: false });
        }
        if (!db.objectStoreNames.contains("declaracoes")) {
          const store = db.createObjectStore("declaracoes", { keyPath: "id" });
          store.createIndex("funcionarioId", "funcionarioId", { unique: false });
          store.createIndex("data", "data", { unique: false });
          store.createIndex("tipo", "tipo", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function tx(storeName, mode="readonly") {
    const db = await openDB();
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  async function add(storeName, value) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName, "readwrite");
        const req = store.add(value);
        req.onsuccess = () => resolve(value);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  async function put(storeName, value) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName, "readwrite");
        const req = store.put(value);
        req.onsuccess = () => resolve(value);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  async function get(storeName, key) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName, "readonly");
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  async function getAll(storeName) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName, "readonly");
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  async function remove(storeName, key) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName, "readwrite");
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  async function clearStore(storeName) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName, "readwrite");
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function seedDemoData() {
    const funcionarios = await getAll("funcionarios");
    if (funcionarios.length) return;
    // DADOS FICTÍCIOS DE DEMONSTRAÇÃO
    const demo = [
      {id:uid("fun"), nome:"Maria de Souza", matricula:"00125", cargo:"Professora", setor:"Ensino Fundamental", vinculo:"Efetivo", dataAdmissao:"2022-02-15", cpf:"000.000.000-00", telefone:"(00) 00000-0000", email:"maria.exemplo@escola.local", status:"Ativo", observacoes:"Dado fictício para demonstração."},
      {id:uid("fun"), nome:"João Pereira", matricula:"00126", cargo:"ASEB", setor:"Administrativo", vinculo:"Contratado", dataAdmissao:"2025-02-03", cpf:"000.000.000-01", telefone:"(00) 00000-0001", email:"joao.exemplo@escola.local", status:"Ativo", observacoes:"Dado fictício para demonstração."},
      {id:uid("fun"), nome:"Ana Carolina Santos", matricula:"00127", cargo:"Supervisora", setor:"Pedagógico", vinculo:"Efetivo", dataAdmissao:"2021-08-12", cpf:"000.000.000-02", telefone:"(00) 00000-0002", email:"ana.exemplo@escola.local", status:"Ativo", observacoes:"Dado fictício para demonstração."}
    ];
    for (const f of demo) await add("funcionarios", f);
    const declarations = [
      {id:uid("dec"), funcionarioId:demo[0].id, tipo:"horas", data:"2026-08-25", horaInicial:"08:00", horaFinal:"12:00", quantidadeHoras:4, quantidadeDias:0, dataInicial:"2026-08-25", dataFinal:"2026-08-25", observacoes:"Demonstração", arquivo:null, nomeArquivo:"", tipoArquivo:"", tamanhoArquivo:0, dataCadastro:new Date().toISOString()},
      {id:uid("dec"), funcionarioId:demo[1].id, tipo:"dias", data:"2026-08-20", horaInicial:"", horaFinal:"", quantidadeHoras:0, quantidadeDias:2, dataInicial:"2026-08-19", dataFinal:"2026-08-20", observacoes:"Demonstração", arquivo:null, nomeArquivo:"", tipoArquivo:"", tamanhoArquivo:0, dataCadastro:new Date().toISOString()},
      {id:uid("dec"), funcionarioId:demo[2].id, tipo:"horas", data:"2026-08-22", horaInicial:"13:00", horaFinal:"16:00", quantidadeHoras:3, quantidadeDias:0, dataInicial:"2026-08-22", dataFinal:"2026-08-22", observacoes:"Demonstração", arquivo:null, nomeArquivo:"", tipoArquivo:"", tamanhoArquivo:0, dataCadastro:new Date().toISOString()}
    ];
    for (const d of declarations) await add("declaracoes", d);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportBackup() {
    const funcionarios = await getAll("funcionarios");
    const declaracoes = await getAll("declaracoes");
    const payload = {version:1, generatedAt:new Date().toISOString(), funcionarios, declaracoes};
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
    downloadBlob(blob, `backup-sistema-declaracoes-${new Date().toISOString().slice(0,10)}.json`);
  }

  async function importBackup(file) {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (!payload || !Array.isArray(payload.funcionarios) || !Array.isArray(payload.declaracoes)) {
      throw new Error("Formato de backup inválido.");
    }
    await clearStore("funcionarios");
    await clearStore("declaracoes");
    for (const f of payload.funcionarios) await add("funcionarios", f);
    for (const d of payload.declaracoes) await add("declaracoes", d);
  }

  async function counts() {
    const funcionarios = await getAll("funcionarios");
    const declaracoes = await getAll("declaracoes");
    return {
      funcionarios: funcionarios.length,
      declaracoes: declaracoes.length,
      horas: declaracoes.filter(d => d.tipo === "horas").length,
      dias: declaracoes.filter(d => d.tipo === "dias").length,
      listaFuncionarios: funcionarios,
      listaDeclaracoes: declaracoes
    };
  }

  return {
    NAV, uid, escapeHTML, formatDate, formatBytes, initials,
    getPageKey, layout, openModal, closeModal, toast,
    add, put, get, getAll, remove, seedDemoData,
    fileToDataURL, downloadBlob, exportBackup, importBackup, counts
  };
})();

const DashboardPage = {
  async init() {
    await App.seedDemoData();
    const stats = await App.counts();
    App.layout("Dashboard", "Visão geral do sistema interno de declarações", `
      <div class="page-header">
        <div>
          <h2>Visão geral</h2>
          <p>Acompanhe funcionários e documentos cadastrados.</p>
        </div>
        <div class="actions no-print">
          <a class="btn btn-primary" href="nova-declaracao.html">＋ Nova Declaração</a>
          <a class="btn btn-secondary" href="novo-funcionario.html">＋ Novo Funcionário</a>
        </div>
      </div>

      <div class="cards">
        ${this.statCard("Funcionários", stats.funcionarios, "👥")}
        ${this.statCard("Declarações", stats.declaracoes, "📄")}
        ${this.statCard("Declarações de Horas", stats.horas, "◷")}
        ${this.statCard("Declarações de Dias", stats.dias, "▣")}
      </div>

      <div class="grid-2">
        <section class="card panel">
          <div class="panel-header">
            <h3>Declarações recentes</h3>
            <a href="declaracoes.html" class="btn btn-secondary btn-sm">Ver todas</a>
          </div>
          ${this.recentTable(stats.listaDeclaracoes, stats.listaFuncionarios)}
        </section>

        <section class="card panel">
          <div class="panel-header"><h3>Ações rápidas</h3></div>
          <div class="quick-actions">
            <a href="funcionarios.html">👥 Gerenciar funcionários</a>
            <a href="declaracoes.html">📄 Consultar declarações</a>
            <a href="relatorios.html">▥ Abrir relatórios</a>
            <a href="nova-declaracao.html">＋ Lançar documento</a>
            <a href="#" id="exportBackupLink">⇩ Exportar backup</a>
            <a href="#" id="importBackupLink">⇧ Importar backup</a>
          </div>
          <input type="file" id="backupInput" accept=".json,application/json" class="hidden">
          <div style="margin-top:16px" class="alert alert-warning">
            Esta versão usa armazenamento local do navegador. Para documentos reais, recomenda-se autenticação e banco seguro antes da implantação oficial.
          </div>
        </section>
      </div>
    `);

    document.getElementById("exportBackupLink")?.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await App.exportBackup();
        App.toast("Backup exportado com sucesso.");
      } catch (err) {
        console.error(err);
        App.toast("Não foi possível exportar o backup.", "danger");
      }
    });

    document.getElementById("importBackupLink")?.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("backupInput")?.click();
    });

    document.getElementById("backupInput")?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        if (!confirm("Importar este backup substituirá os dados atuais do navegador. Deseja continuar?")) {
          e.target.value = "";
          return;
        }
        await App.importBackup(file);
        App.toast("Backup restaurado com sucesso.");
        setTimeout(() => location.reload(), 600);
      } catch (err) {
        console.error(err);
        App.toast("Backup inválido ou impossível de restaurar.", "danger");
      } finally {
        e.target.value = "";
      }
    });
  },
  statCard(label, value, icon) {
    return `<div class="card stat-card"><div><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div><div class="stat-icon">${icon}</div></div>`;
  },
  recentTable(list, funcs) {
    const map = Object.fromEntries(funcs.map(f => [f.id, f]));
    const rows = [...list].sort((a,b) => String(b.dataCadastro||"").localeCompare(String(a.dataCadastro||""))).slice(0,8);
    if (!rows.length) return `<div class="empty"><strong>Nenhuma declaração</strong>Cadastre a primeira declaração para começar.</div>`;
    return `<div class="table-wrap"><table><thead><tr><th>Funcionário</th><th>Tipo</th><th>Data</th><th>Quantidade</th><th>Documento</th><th>Ações</th></tr></thead><tbody>
      ${rows.map(d => {
        const f = map[d.funcionarioId];
        return `<tr>
          <td><strong>${App.escapeHTML(f?.nome || "Funcionário removido")}</strong></td>
          <td><span class="badge ${d.tipo==="horas"?"badge-hours":"badge-days"}">${d.tipo==="horas"?"Horas":"Dias"}</span></td>
          <td>${App.formatDate(d.data)}</td>
          <td>${d.tipo==="horas"?`${d.quantidadeHoras||0} h`:`${d.quantidadeDias||0} dia(s)`}</td>
          <td>${d.nomeArquivo?App.escapeHTML(d.nomeArquivo):"—"}</td>
          <td><button class="btn btn-secondary btn-sm" onclick="DeclaracoesPage.visualizar('${d.id}')">Visualizar</button></td>
        </tr>`;
      }).join("")}
    </tbody></table></div>`;
  }
};


// Backup global: disponível pelo console e preparado para futura área de configurações.
// FUTURO: adicionar uma página de configurações para exibir explicitamente estes controles.
window.backupSistema = {
  exportar: App.exportBackup,
  importar: async (file) => {
    await App.importBackup(file);
    location.reload();
  }
};
