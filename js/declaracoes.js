function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

const DeclaracoesPage = {
  async init() {
    try {
      const [declaracoes, funcionarios] = await Promise.all([
        App.getAll("declaracoes").catch(() => []),
        App.getAll("funcionarios").catch(() => [])
      ]);

      const funcMap = {};
      if (Array.isArray(funcionarios)) {
        funcionarios.forEach(f => { funcMap[f.id] = f; });
      }

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
            <span class="badge badge-hours">${(declaracoes || []).length} no total</span>
          </div>
          ${this.renderTable(declaracoes || [], funcMap)}
        </div>
      `);
    } catch (err) {
      console.error("Erro ao carregar declarações:", err);
      App.toast("Erro ao carregar dados", "danger");
    }
  },

  renderTable(list, funcMap) {
    if (!list || !list.length) {
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
              <th>Anexo</th>
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
              const temAnexo = d.arquivoUrl || d.arquivoBase64;

              return `
                <tr>
                  <td><code>#${d.id}</code></td>
                  <td><strong>${App.escapeHTML(f?.nome || "Funcionário não encontrado")}</strong></td>
                  <td><span class="badge ${isHoras ? "badge-hours" : "badge-days"}">${isHoras ? "Horas" : "Dias"}</span></td>
                  <td>${periodo}</td>
                  <td>${qtd}</td>
                  <td>
                    ${temAnexo 
                      ? `<a href="${d.arquivoUrl || d.arquivoBase64}" target="_blank" class="badge badge-hours" style="text-decoration:none;">📎 Ver Anexo</a>` 
                      : `<span style="color:#888;">Sem anexo</span>`}
                  </td>
                  <td>${App.escapeHTML(d.observacoes || "—")}</td>
                  <td class="no-print">
                    <a href="declaracao.html?id=${d.id}" class="btn btn-secondary btn-sm">Editar</a>
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
      App.toast("Erro ao excluir: " + err.message, "danger");
    }
  }
};

const NovaDeclaracaoPage = {
  async init() {
    try {
      const funcs = await App.getAll("funcionarios").catch(() => []);
      App.layout("Nova Declaração", "Lançamento e anexação do documento", `
        <div class="card panel">
          <form id="declForm" class="form">
            <div class="grid-2">
              <div class="field">
                <label for="funcionarioId">Funcionário *</label>
                <select id="funcionarioId" class="input" required>
                  <option value="">Selecione...</option>
                  ${funcs.map(f => `<option value="${f.id}">${App.escapeHTML(f.nome)} — ${App.escapeHTML(f.matricula || "Sem mat.")}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="tipo">Tipo de declaração *</label>
                <select id="tipo" class="input" required>
                  <option value="horas">Declaração de Horas</option>
                  <option value="dias">Declaração de Dias</option>
                </select>
              </div>
            </div>

            <div id="camposDinamicos"></div>

            <div class="field">
              <label for="observacoes">Observações</label>
              <textarea id="observacoes" class="input" rows="3" placeholder="Informações adicionais..."></textarea>
            </div>

            <div class="field">
              <label for="arquivo">Anexar declaração</label>
              <input type="file" id="arquivo" class="input-file" accept=".pdf,image/*">
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
      console.error(err);
      App.toast("Erro ao abrir formulário", "danger");
    }
  },

  bindEvents() {
    const tipo = document.getElementById("tipo");
    const campos = document.getElementById("camposDinamicos");

    const renderCampos = () => {
      if (tipo.value === "horas") {
        campos.innerHTML = `
          <div class="grid-3">
            <div class="field">
              <label for="data">Data *</label>
              <input type="date" id="data" class="input" required>
            </div>
            <div class="field">
              <label for="horaInicial">Horário inicial</label>
              <input type="time" id="horaInicial" class="input">
            </div>
            <div class="field">
              <label for="horaFinal">Horário final</label>
              <input type="time" id="horaFinal" class="input">
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="quantidadeHoras">Quantidade de horas</label>
              <input type="number" id="quantidadeHoras" class="input" step="0.5" min="0" placeholder="Ex: 2">
            </div>
          </div>
        `;
      } else {
        campos.innerHTML = `
          <div class="grid-3">
            <div class="field">
              <label for="dataInicial">Data inicial *</label>
              <input type="date" id="dataInicial" class="input" required>
            </div>
            <div class="field">
              <label for="dataFinal">Data final</label>
              <input type="date" id="dataFinal" class="input">
            </div>
            <div class="field">
              <label for="quantidadeDias">Quantidade de dias</label>
              <input type="number" id="quantidadeDias" class="input" step="1" min="1" placeholder="Ex: 1">
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
      const fileInput = document.getElementById("arquivo");

      let arquivoBase64 = null;
      if (fileInput.files.length > 0) {
        arquivoBase64 = await fileToBase64(fileInput.files[0]);
      }

      const payload = {
        funcionarioId: document.getElementById("funcionarioId").value,
        tipo: tipo,
        observacoes: document.getElementById("observacoes").value,
        arquivoBase64: arquivoBase64
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
      App.toast("Erro ao salvar declaração", "danger");
      btn.disabled = false;
    }
  }
};

const EditarDeclaracaoPage = {
  async init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
      window.location.href = "declaracoes.html";
      return;
    }

    try {
      const [decl, funcs] = await Promise.all([
        App.get("declaracoes", id),
        App.getAll("funcionarios").catch(() => [])
      ]);

      if (!decl) {
        App.toast("Declaração não encontrada", "danger");
        setTimeout(() => window.location.href = "declaracoes.html", 1500);
        return;
      }

      const temAnexo = decl.arquivoUrl || decl.arquivoBase64;

      App.layout("Editar Declaração", "Atualização dos dados da declaração", `
        <div class="card panel">
          <form id="editDeclForm" class="form">
            <div class="grid-2">
              <div class="field">
                <label for="funcionarioId">Funcionário *</label>
                <select id="funcionarioId" class="input" required>
                  <option value="">Selecione...</option>
                  ${funcs.map(f => `<option value="${f.id}" ${f.id == decl.funcionarioId ? "selected" : ""}>${App.escapeHTML(f.nome)} — ${App.escapeHTML(f.matricula || "Sem mat.")}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="tipo">Tipo de declaração *</label>
                <select id="tipo" class="input" required>
                  <option value="horas" ${decl.tipo === "horas" ? "selected" : ""}>Declaração de Horas</option>
                  <option value="dias" ${decl.tipo === "dias" ? "selected" : ""}>Declaração de Dias</option>
                </select>
              </div>
            </div>

            <div id="camposDinamicos"></div>

            <div class="field">
              <label for="observacoes">Observações</label>
              <textarea id="observacoes" class="input" rows="3">${App.escapeHTML(decl.observacoes || "")}</textarea>
            </div>

            <div class="field">
              <label for="arquivo">Substituir / Anexar declaração</label>
              <input type="file" id="arquivo" class="input-file" accept=".pdf,image/*">
              ${temAnexo ? `<p style="margin-top:5px;"><a href="${decl.arquivoUrl || decl.arquivoBase64}" target="_blank" class="badge badge-hours" style="text-decoration:none;">📎 Visualizar Anexo Atual</a></p>` : ''}
            </div>

            <div class="form-actions">
              <a href="declaracoes.html" class="btn btn-secondary">Cancelar</a>
              <button type="submit" class="btn btn-primary">Salvar Alterações</button>
            </div>
          </form>
        </div>
      `);

      this.bindEvents(decl);
    } catch (err) {
      console.error(err);
      App.toast("Erro ao carregar formulário", "danger");
    }
  },

  bindEvents(decl) {
    const tipo = document.getElementById("tipo");
    const campos = document.getElementById("camposDinamicos");

    const renderCampos = () => {
      if (tipo.value === "horas") {
        campos.innerHTML = `
          <div class="grid-3">
            <div class="field">
              <label for="data">Data *</label>
              <input type="date" id="data" class="input" value="${decl.data || ''}" required>
            </div>
            <div class="field">
              <label for="horaInicial">Horário inicial</label>
              <input type="time" id="horaInicial" class="input" value="${decl.horaInicial || ''}">
            </div>
            <div class="field">
              <label for="horaFinal">Horário final</label>
              <input type="time" id="horaFinal" class="input" value="${decl.horaFinal || ''}">
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="quantidadeHoras">Quantidade de horas</label>
              <input type="number" id="quantidadeHoras" class="input" step="0.5" min="0" value="${decl.quantidadeHoras || ''}">
            </div>
          </div>
        `;
      } else {
        campos.innerHTML = `
          <div class="grid-3">
            <div class="field">
              <label for="dataInicial">Data inicial *</label>
              <input type="date" id="dataInicial" class="input" value="${decl.dataInicial || decl.data || ''}" required>
            </div>
            <div class="field">
              <label for="dataFinal">Data final</label>
              <input type="date" id="dataFinal" class="input" value="${decl.dataFinal || ''}">
            </div>
            <div class="field">
              <label for="quantidadeDias">Quantidade de dias</label>
              <input type="number" id="quantidadeDias" class="input" step="1" min="1" value="${decl.quantidadeDias || ''}">
            </div>
          </div>
        `;
      }
    };

    tipo.addEventListener("change", renderCampos);
    renderCampos();

    document.getElementById("editDeclForm").addEventListener("submit", e => this.save(e, decl));
  },

  async save(e, declAntiga) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
      const tipo = document.getElementById("tipo").value;
      const fileInput = document.getElementById("arquivo");

      let arquivoBase64 = declAntiga.arquivoBase64 || null;
      if (fileInput.files.length > 0) {
        arquivoBase64 = await fileToBase64(fileInput.files[0]);
      }

      const payload = {
        id: declAntiga.id,
        funcionarioId: document.getElementById("funcionarioId").value,
        tipo: tipo,
        observacoes: document.getElementById("observacoes").value,
        arquivoBase64: arquivoBase64,
        arquivoUrl: declAntiga.arquivoUrl || null
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

      await App.put("declaracoes", payload);
      App.toast("Declaração atualizada com sucesso!");
      setTimeout(() => window.location.href = "declaracoes.html", 1000);
    } catch (err) {
      console.error(err);
      App.toast("Erro ao atualizar declaração", "danger");
      btn.disabled = false;
    }
  }
};