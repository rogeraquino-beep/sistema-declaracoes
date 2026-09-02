const RelatoriosPage = {
  async init() {
    const funcs = await App.getAll("funcionarios");
    const decls = await App.getAll("declaracoes");

    this.state = {
      funcionarios: funcs,
      declaracoes: decls,
      funcionarioId: "todos",
      tipo: "todos",
      inicio: "",
      fim: ""
    };

    App.layout("Relatórios", "Análise consolidada das declarações", `
      <style>
        .filter-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-bottom: 24px;
        }
        .filter-grid {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1fr 1fr;
          gap: 16px;
          align-items: flex-end;
        }
        @media (max-width: 992px) {
          .filter-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 576px) {
          .filter-grid { grid-template-columns: 1fr; }
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .filter-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }
        .filter-control {
          width: 100%;
          height: 42px;
          padding: 8px 12px;
          font-size: 14px;
          color: #1f2937;
          background-color: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .filter-control:focus {
          background-color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .stat-card-custom {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .stat-card-custom .stat-label {
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 6px;
        }
        .stat-card-custom .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }
      </style>

      <div class="page-header" style="margin-bottom: 24px;">
        <div>
          <h2 style="margin: 0; font-size: 24px; color: #111827;">Relatórios</h2>
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Filtre os lançamentos e gere um resumo para impressão ou CSV.</p>
        </div>
        <div class="actions no-print" style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" id="btnImprimir">🖨 Imprimir relatório</button>
          <button class="btn btn-primary" id="btnExportar">⬇ Exportar CSV</button>
        </div>
      </div>

      <div class="filter-card no-print">
        <div class="filter-grid">
          <div class="filter-group">
            <label class="filter-label">Funcionário</label>
            <select class="filter-control" id="filtroFuncionario">
              <option value="todos">Todos os funcionários</option>
              ${funcs.map(f => `<option value="${f.id}">${App.escapeHTML(f.nome)}</option>`).join("")}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Tipo de Declaração</label>
            <select class="filter-control" id="filtroTipo">
              <option value="todos">Todos os tipos</option>
              <option value="horas">Horas</option>
              <option value="dias">Dias</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Data inicial</label>
            <input type="date" class="filter-control" id="filtroInicio">
          </div>
          <div class="filter-group">
            <label class="filter-label">Data final</label>
            <input type="date" class="filter-control" id="filtroFim">
          </div>
        </div>
      </div>

      <div id="relatorioResultados"></div>
    `);

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    document.getElementById("filtroFuncionario")?.addEventListener("change", e => {
      this.state.funcionarioId = e.target.value;
      this.render();
    });
    document.getElementById("filtroTipo")?.addEventListener("change", e => {
      this.state.tipo = e.target.value;
      this.render();
    });
    document.getElementById("filtroInicio")?.addEventListener("change", e => {
      this.state.inicio = e.target.value;
      this.render();
    });
    document.getElementById("filtroFim")?.addEventListener("change", e => {
      this.state.fim = e.target.value;
      this.render();
    });
    document.getElementById("btnImprimir")?.addEventListener("click", () => window.print());
    document.getElementById("btnExportar")?.addEventListener("click", () => this.exportCSV());
  },

  getFiltered() {
    const { declaracoes, funcionarioId, tipo, inicio, fim } = this.state;
    return declaracoes.filter(d => {
      if (funcionarioId !== "todos" && String(d.funcionarioId) !== String(funcionarioId)) return false;
      if (tipo !== "todos" && d.tipo !== tipo) return false;
      const dataRef = d.data || d.dataInicial;
      if (inicio && dataRef < inicio) return false;
      if (fim && dataRef > fim) return false;
      return true;
    });
  },

  render() {
    const filtered = this.getFiltered();
    const mapFunc = Object.fromEntries(this.state.funcionarios.map(f => [f.id, f]));

    const totalHoras = filtered.filter(d => d.tipo === "horas").reduce((acc, d) => acc + Number(d.quantidadeHoras || 0), 0);
    const totalDias = filtered.filter(d => d.tipo === "dias").reduce((acc, d) => acc + Number(d.quantidadeDias || 0), 0);
    const funcsUnicos = new Set(filtered.map(d => d.funcionarioId)).size;

    const container = document.getElementById("relatorioResultados");
    if (!container) return;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="stat-card-custom">
          <div>
            <div class="stat-label">Total de declarações</div>
            <div class="stat-value">${filtered.length}</div>
          </div>
        </div>
        <div class="stat-card-custom">
          <div>
            <div class="stat-label">Total de horas</div>
            <div class="stat-value">${totalHoras} h</div>
          </div>
        </div>
        <div class="stat-card-custom">
          <div>
            <div class="stat-label">Total de dias</div>
            <div class="stat-value">${totalDias} dia(s)</div>
          </div>
        </div>
        <div class="stat-card-custom">
          <div>
            <div class="stat-label">Funcionários com declarações</div>
            <div class="stat-value">${funcsUnicos}</div>
          </div>
        </div>
      </div>

      <div class="card panel">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 18px;">Detalhamento</h3>
          <span class="badge badge-hours">${filtered.length} registro(s)</span>
        </div>
        ${
          !filtered.length
            ? `<div class="empty"><strong>Nenhum registro</strong>Não há dados para os filtros selecionados.</div>`
            : `<div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Funcionário</th>
                      <th>Cargo / Setor</th>
                      <th>Tipo</th>
                      <th>Data / Período</th>
                      <th>Quantidade</th>
                      <th>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filtered.map(d => {
                      const f = mapFunc[d.funcionarioId];
                      const qtd = d.tipo === "horas" ? `${d.quantidadeHoras || 0} h` : `${d.quantidadeDias || 0} dia(s)`;
                      const dataFmt = d.tipo === "horas" 
                        ? App.formatDate(d.data) 
                        : `${App.formatDate(d.dataInicial)} até ${App.formatDate(d.dataFinal)}`;
                      
                      return `<tr>
                        <td><strong>${App.escapeHTML(f?.nome || "Não encontrado")}</strong></td>
                        <td>${App.escapeHTML(f?.cargo || "—")} / ${App.escapeHTML(f?.setor || "—")}</td>
                        <td><span class="badge ${d.tipo === "horas" ? "badge-hours" : "badge-days"}">${d.tipo === "horas" ? "Horas" : "Dias"}</span></td>
                        <td>${dataFmt}</td>
                        <td><strong>${qtd}</strong></td>
                        <td>${App.escapeHTML(d.observacoes || "—")}</td>
                      </tr>`;
                    }).join("")}
                  </tbody>
                </table>
              </div>`
        }
      </div>
    `;
  },

  exportCSV() {
    const filtered = this.getFiltered();
    if (!filtered.length) {
      App.toast("Nenhum dado para exportar.", "warning");
      return;
    }

    const mapFunc = Object.fromEntries(this.state.funcionarios.map(f => [f.id, f]));
    const headers = ["Funcionario", "Cargo", "Setor", "Tipo", "Data_Inicial", "Data_Final", "Quantidade", "Observacoes"];
    
    const rows = filtered.map(d => {
      const f = mapFunc[d.funcionarioId];
      const qtd = d.tipo === "horas" ? `${d.quantidadeHoras || 0}h` : `${d.quantidadeDias || 0}d`;
      return [
        `"${(f?.nome || "").replace(/"/g, '""')}"`,
        `"${(f?.cargo || "").replace(/"/g, '""')}"`,
        `"${(f?.setor || "").replace(/"/g, '""')}"`,
        `"${d.tipo}"`,
        `"${d.data || d.dataInicial || ""}"`,
        `"${d.dataFinal || ""}"`,
        `"${qtd}"`,
        `"${(d.observacoes || "").replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_declaracoes_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};