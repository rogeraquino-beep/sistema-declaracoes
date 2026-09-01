const SUPABASE_URL = "https://cujlebxqqposqomtfvdk.supabase.co";
const SUPABASE_KEY = "sb_publishable_qgZR9bAPNGjYoG-2i_Z5Jg_1Rg3UzBx";

const App = (() => {
  const NAV = [
    { key: "dashboard", href: "index.html", icon: "⌂", label: "Dashboard" },
    { key: "funcionarios", href: "funcionarios.html", icon: "👥", label: "Funcionários" },
    { key: "declaracoes", href: "declaracoes.html", icon: "📄", label: "Declarações" },
    { key: "nova-declaracao", href: "nova-declaracao.html", icon: "＋", label: "Nova Declaração" },
    { key: "novo-funcionario", href: "novo-funcionario.html", icon: "＋", label: "Novo Funcionário" },
    { key: "faltas", href: "faltas.html", icon: "📅", label: "Faltas" },
    { key: "relatorios", href: "relatorios.html", icon: "▥", label: "Relatórios" }
  ];

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
          <div class="sidebar-footer">Banco de dados online • Supabase</div>
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

  const API = SUPABASE_URL + "/rest/v1";

  async function api(path, options = {}) {
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    const res = await fetch(API + path, { ...options, headers });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || "Erro no Supabase");
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  function generateId() {
    return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
  }

  function fromDB(store, x) {
    if (!x) return x;
    if (store === "funcionarios") return { id: String(x.id), nome: x.nome_completo || x.nome, matricula: x.matricula, cargo: x.cargo_funcao || x.cargo, setor: x.setor, vinculo: x.tipo_vinculo || x.vinculo, dataAdmissao: x.data_admissao || x.dataAdmissao, cpf: x.cpf, telefone: x.telefone, email: x.email, status: x.status, observacoes: x.observacoes };
    if (store === "declaracoes") return { id: String(x.id), funcionarioId: String(x.funcionario_id), tipo: x.tipo, data: x.data, dataInicial: x.data_inicial, dataFinal: x.data_final, horaInicial: x.hora_inicial, horaFinal: x.hora_final, quantidadeHoras: x.quantidade_horas, quantidadeDias: x.quantidade_dias, observacoes: x.observacoes, arquivo: x.arquivo, nomeArquivo: x.nome_arquivo, tipoArquivo: x.tipo_arquivo, tamanhoArquivo: x.tamanho_arquivo, dataCadastro: x.data_cadastro };
    if (store === "faltas") return { id: String(x.id), funcionarioId: String(x.funcionario_id), data: x.data, tipo: x.tipo, justificativa: x.justificativa, observacoes: x.observacoes, createdAt: x.created_at };
    return { ...x, id: String(x.id) };
  }

  function toDB(store, x) {
    let payload = {};
    if (store === "funcionarios") {
      payload = { 
        id: x.id ? Number(x.id) : generateId(),
        nome_completo: x.nome, 
        matricula: x.matricula, 
        cargo_funcao: x.cargo, 
        setor: x.setor, 
        tipo_vinculo: x.vinculo, 
        data_admissao: x.dataAdmissao || null, 
        cpf: x.cpf, 
        telefone: x.telefone, 
        email: x.email, 
        status: x.status, 
        observacoes: x.observacoes 
      };
    } 
    else if (store === "declaracoes") {
      payload = { 
        id: x.id ? Number(x.id) : generateId(),
        funcionario_id: Number(x.funcionarioId), 
        tipo: x.tipo, 
        data: x.data, 
        data_inicial: x.dataInicial || null, 
        data_final: x.dataFinal || null, 
        hora_inicial: x.horaInicial || null, 
        hora_final: x.horaFinal || null, 
        quantidade_horas: x.quantidadeHoras || 0, 
        quantidade_dias: x.quantidadeDias || 0, 
        observacoes: x.observacoes || null, 
        arquivo: x.arquivo || null, 
        nome_arquivo: x.nomeArquivo || null, 
        tipo_arquivo: x.tipoArquivo || null, 
        tamanho_arquivo: x.tamanhoArquivo || 0, 
        data_cadastro: x.dataCadastro || new Date().toISOString() 
      };
    } 
    else if (store === "faltas") {
      payload = { 
        id: x.id ? Number(x.id) : generateId(),
        funcionario_id: Number(x.funcionarioId), 
        data: x.data, 
        tipo: x.tipo || 'Falta', 
        justificativa: x.justificativa || null, 
        observacoes: x.observacoes || null 
      };
    } 
    else {
      payload = { ...x };
      if (!payload.id) payload.id = generateId();
    }
    return payload;
  }

  async function add(store, value) {
    const dataToSend = toDB(store, value);
    const r = await api(`/${store}`, {
      method: "POST",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify(dataToSend)
    });
    const item = Array.isArray(r) ? r[0] : r;
    return fromDB(store, item || dataToSend);
  }

  async function put(store, value) {
    if (value.id) {
      const dataToSend = toDB(store, value);
      const r = await api(`/${store}?id=eq.${encodeURIComponent(value.id)}`, {
        method: "PATCH",
        headers: { "Prefer": "return=representation" },
        body: JSON.stringify(dataToSend)
      });
      const item = Array.isArray(r) ? r[0] : r;
      return fromDB(store, item || value);
    }
    return add(store, value);
  }

  async function get(store, key) { 
    const r = await api(`/${store}?id=eq.${encodeURIComponent(key)}&select=*`); 
    return fromDB(store, r?.[0] || null); 
  }
  
  async function getAll(store) { 
    const r = await api(`/${store}?select=*&order=id.asc`); 
    return (r || []).map(x => fromDB(store, x)); 
  }
  
  async function remove(store, key) { await api(`/${store}?id=eq.${encodeURIComponent(key)}`, { method: "DELETE" }); return true; }
  async function seedDemoData() { return; }

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
    escapeHTML, formatDate, getPageKey, layout, openModal, closeModal, toast,
    add, put, get, getAll, remove, seedDemoData, counts
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
          </div>
          <div style="margin-top:16px" class="alert alert-warning">
            Dados salvos online no Supabase.
          </div>
        </section>
      </div>
    `);
  },
  statCard(label, value, icon) {
    return `<div class="card stat-card"><div><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div><div class="stat-icon">${icon}</div></div>`;
  },
  recentTable(list, funcs) {
    const map = Object.fromEntries(funcs.map(f => [f.id, f]));
    const rows = [...list].sort((a,b) => String(b.dataCadastro||"").localeCompare(String(a.dataCadastro||""))).slice(0,8);
    if (!rows.length) return `<div class="empty"><strong>Nenhuma declaração</strong>Cadastre a primeira declaração para começar.</div>`;
    return `<div class="table-wrap"><table><thead><tr><th>Funcionário</th><th>Tipo</th><th>Data</th><th>Quantidade</th><th>Documento</th></tr></thead><tbody>
      ${rows.map(d => {
        const f = map[d.funcionarioId];
        return `<tr>
          <td><strong>${App.escapeHTML(f?.nome || "Funcionário removido")}</strong></td>
          <td><span class="badge ${d.tipo==="horas"?"badge-hours":"badge-days"}">${d.tipo==="horas"?"Horas":"Dias"}</span></td>
          <td>${App.formatDate(d.data)}</td>
          <td>${d.tipo==="horas"?`${d.quantidadeHoras||0} h`:`${d.quantidadeDias||0} dia(s)`}</td>
          <td>${d.nomeArquivo?App.escapeHTML(d.nomeArquivo):"—"}</td>
        </tr>`;
      }).join("")}
    </tbody></table></div>`;
  }
};