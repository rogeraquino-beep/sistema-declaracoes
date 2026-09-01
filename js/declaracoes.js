const DeclaracoesPage = {
  async init() {
    try {
      const [declaracoes, funcionarios] = await Promise.all([
        App.getAll("declaracoes"),
        App.getAll("funcionarios")
      ]);

      const funcMap = Object.fromEntries(funcionarios.map(f => [f.id, f]));

      App.layout("Declarações", "Listagem de todas as declarações registradas", `
        <div class="page-header">
          <div>
            <h2>Lista de Declarações</h2>
            <p>Gerencie e consulte os documentos de horas e dias.</p>
          </div>
          <div class="actions no-print">
            <a href="nova-declaracao.html" class="btn btn-primary">＋ Nova Declaração</a>
          </div>
        </div>

        <div class="card panel">
          <div class="panel-header">
            <h3>Registros</h3>
            <span class="badge badge-hours">${declaracoes.length} no total</span>
          </div>
          ${this.renderTable(declaracoes, funcMap)}
        </div>
      `);
    } catch (err) {
      console.error("Erro ao carregar declarações:", err);
      App.toast("Erro ao carregar dados do banco", "danger");
    }
  },

  renderTable(list, funcMap) {
    if (!list.length) {
      return `<div class="empty"><strong>Nenhuma declaração encontrada</strong><p>Clique em "+ Nova Declaração" para cadastrar.</p></div>`;
    }

    const rows = [...list].sort((a, b) => Number(b.id) - Number(a.id));

    return `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Funcionário</th>
              <th>Tipo</th>
              <th>Data / Período</th>
              <th>Qtd.</th>
              <th>Observações</th>
              <th class="no-print">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(d => {
              const f = funcMap[d.funcionarioId];
              const isHoras = d.tipo === "horas";
              const periodo = isHoras 
                ? App.formatDate(d.data) 
                : `${App.formatDate(d.dataInicial || d.data)} até ${App.formatDate(d.dataFinal || d.dataInicial || d.data)}`;
              const qtd = isHoras ? `${d.quantidadeHoras || 0}h` : `${d.quantidadeDias || 0} dia(s)`;

              return `
                <tr>
                  <td><code>#${d.id}</code></td>
                  <td><strong>${App.escapeHTML(f?.nome || "Funcionário não encontrado")}</strong></td>
                  <td><span class="badge ${isHoras ? "badge-hours" : "badge-days"}">${isHoras ? "Horas" : "Dias"}</span></td>
                  <td>${periodo}</td>
                  <td>${qtd}</td>
                  <td>${App.escapeHTML(d.observacoes || "—")}</td>
                  <td class="no-print">
                    <button class="btn btn-danger btn-sm" onclick="DeclaracoesPage.deleteItem('${d.id}')">Excluir</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  async deleteItem(id) {
    if (!confirm("Tem certeza que deseja excluir esta declaração?")) return;
    try {
      await App.remove("declaracoes", id);
      App.toast("Declaração excluída com sucesso!");
      this.init();
    } catch (err) {
      console.error(err);
      App.toast("Erro ao excluir declaração: " + err.message, "danger");
    }
  }
};

const NovaDeclaracaoPage = {
  async init() {
    try {
      const funcs = await App.getAll("funcionarios");
      App.layout("Nova Declaração", "Lançamento e anexação do documento", `
        <div class="card panel">
          <form id="declForm" class="form">
            <div class="grid-2">
              <div class="field">
                <label>Funcionário *</label>
                <select id="funcionarioId" required>
                  <option value="">Selecione...</option>
                  ${funcs.map(f => `<option value="${f.id}">${App.escapeHTML(f.nome)} — ${App.escapeHTML(f.matricula || "Sem mat.")}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label>Tipo de declaração *</label>
                <select id="tipo" required>
                  <option value="horas">Declaração de Horas</option>
                  <option value="dias">Declaração de Dias</option>
                </select>
              </div>
            </div>

            <div id="camposDinamicos"></div>

            <div class="field">
              <label>Observações</label>
              <textarea id="observacoes" rows="3" placeholder="Informações adicionais..."></textarea>
            </div>

            <div class="field">
              <label>Anexar declaração</label>
              <input type="file" id="arquivo" accept=".pdf,image/*">
              <small class="help">Aceitos: PDF, JPG, JPEG e PNG.</small>
            </div>

            <div class="form-actions">
              <a href="declaracoes.html" class="btn btn-secondary">Cancelar</a>
              <button type="submit" class="btn btn-primary">Salvar declaração</button>
            </div>
          </form>
        </div>
      `);

      this.bindEvents();
    } catch (err) {
      console.error("Erro ao inicializar página:", err);
      App.toast("Erro ao carregar lista de funcionários", "danger");
    }
  },

  bindEvents() {
    const tipo = document.getElementById("tipo");
    const campos = document.getElementById("camposDinamicos");

    const renderCampos = () => {
      if (tipo.value === "horas") {
        campos.innerHTML = `
          <div class="grid-2" style="margin-bottom: 1rem;">
            <div class="grid-3" style="grid-column: span 2;">
              <div class="field">
                <label>Data *</label>
                <input type="date" id="data" required>
              </div>
              <div class="field">
                <label>Horário inicial</label>
                <input type="time" id="horaInicial">
              </div>
              <div class="field">
                <label>Horário final</label>
                <input type="time" id="horaFinal">
              </div>
            </div>
          </div>
          <div class="grid-2" style="margin-bottom: 1rem;">
            <div class="field">
              <label>Quantidade de horas</label>
              <input type="number" id="quantidadeHoras" step="0.5" min="0" placeholder="Ex: 2">
            </div>
          </div>
        `;
      } else {
        campos.innerHTML = `
          <div class="grid-3" style="margin-bottom: 1rem;">
            <div class="field">
              <label>Data inicial *</label>
              <input type="date" id="dataInicial" required>
            </div>
            <div class="field">
              <label>Data final</label>
              <input type="date" id="dataFinal">
            </div>
            <div class="field">
              <label>Quantidade de dias</label>
              <input type="number" id="quantidadeDias" step="1" min="1" placeholder="Ex: 1">
            </div>
          </div>
        `;
      }

      const inputData = document.getElementById("data") || document.getElementById("dataInicial");
      if (inputData && !inputData.value) {
        inputData.value = new Date().toISOString().slice(0, 10);
      }
    };

    tipo.addEventListener("change", renderCampos);
    renderCampos();

    document.getElementById("declForm").addEventListener("submit", e => this.save(e));
  },

  async save(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
      const tipo = document.getElementById("tipo").value;
      const payload = {
        funcionarioId: document.getElementById("funcionarioId").value,
        tipo: tipo,
        observacoes: document.getElementById("observacoes").value
      };

      if (tipo === "horas") {
        payload.data = document.getElementById("data").value;
        payload.horaInicial = document.getElementById("horaInicial").value || null;
        payload.horaFinal = document.getElementById("horaFinal").value || null;
        payload.quantidadeHoras = parseFloat(document.getElementById("quantidadeHoras").value) || 0;
      } else {
        payload.dataInicial = document.getElementById("dataInicial").value;
        payload.dataFinal = document.getElementById("dataFinal").value || payload.dataInicial;
        payload.data = payload.dataInicial;
        payload.quantidadeDias = parseInt(document.getElementById("quantidadeDias").value, 10) || 1;
      }

      await App.add("declaracoes", payload);
      App.toast("Declaração salva com sucesso!");
      setTimeout(() => window.location.href = "declaracoes.html", 1000);
    } catch (err) {
      console.error(err);
      App.toast("Erro ao salvar declaração: " + (err.message || err), "danger");
      btn.disabled = false;
    }
  }
};