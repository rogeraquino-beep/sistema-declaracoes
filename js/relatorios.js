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
      <div class="page-header">
        <div>
          <h2>Relatórios</h2>
          <p>Filtre os lançamentos e gere um resumo para impressão ou CSV.</p>
        </div>
        <div class="actions no-print">
          <button class="btn btn-secondary" id="btnImprimir">🖨 Imprimir relatório</button>
          <button class="btn btn-primary" id="btnExportar">⬇ Exportar CSV</button>
        </div>
      </div>

      <div class="card panel no-print mb-4">
        <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end;">
          <div class="form-group" style="flex: 1 1 200px; margin-bottom: 0;">
            <label class="form-label">Funcionário</label>
            <select class="form-control" id="filtroFuncionario">
              <option value="todos">Todos os funcionários</option>
              ${funcs.map(f => `<option value="${f.id}">${App.escapeHTML(f.nome)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group" style="flex: 1 1 180px; margin-bottom: 0;">
            <label class="form-label">Tipo de Declaração</label>
            <select class="form-control" id="filtroTipo">
              <option value="todos">Todos os tipos</option>
              <option value="horas">Horas</option>
              <option value="dias">Dias</option>
            </select>
          </div>
          <div class="form-group" style="flex: 1 1 150px; margin-bottom: 0;">
            <label class="form-label">Data inicial</label>
            <input type="date" class="form-control" id="filtroInicio">
          </div>
          <div class="form-group" style="flex: 1 1 150px; margin-bottom: 0;">
            <label class="form-label">Data final</label>
            <input type="date" class="form-control" id="filtroFim">
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
      <div class="cards mb-4">
        <div class="card stat-card">
          <div>
            <div class="stat-label">Total de declarações</div>
            <div class="stat-value">${filtered.length}</div>
          </div>
        </div>
        <div class="card stat-card">
          <div>
            <div class="stat-label">Total de horas</div>
            <div class="stat-value">${totalHoras} h</div>
          </div>
        </div>
        <div class="card stat-card">
          <div>
            <div class="stat-label">Total de dias</div>
            <div class="stat-value">${totalDias} dia(s)</div>
          </div>
        </div>
        <div class="card stat-card">
          <div>
            <div class="stat-label">Funcionários com declarações</div>
            <div class="stat-value">${funcsUnicos}</div>
          </div>
        </div>
      </div>

      <div class="card panel">
        <div class="panel-header">
          <h3>Detalhamento</h3>
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