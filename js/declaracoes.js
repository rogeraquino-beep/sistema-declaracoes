function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    // Validação preventiva de tamanho (máximo ~3MB para evitar travamento)
    if (file.size > 3 * 1024 * 1024) {
      reject(new Error("O arquivo é muito grande. Escolha um arquivo de até 3MB."));
      return;
    }
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
              const f = funcMap[d.funcionarioId || d.funcionario_id];
              const isHoras = d.tipo === "horas";
              const dataInicial = d.dataInicial || d.data_inicial || d.data;
              const dataFinal = d.dataFinal || d.data_final || dataInicial;
              
              const periodo = isHoras 
                ? App.formatDate(d.data) 
                : `${App.formatDate(dataInicial)} até ${App.formatDate(dataFinal)}`;
              
              const qtd = isHoras ? `${d.quantidadeHoras || d.quantidade_horas || 0}h` : `${d.quantidadeDias || d.quantidade_dias || 0} dia(s)`;
              const anexo = d.arquivoUrl || d.arquivo_url || d.arquivoBase64 || d.arquivo_base64;

              return `
                <tr>
                  <td><code>#${d.id}</code></td>
                  <td><strong>${App.escapeHTML(f?.nome || "Funcionário não encontrado")}</strong></td>
                  <td><span class="badge ${isHoras ? "badge-hours" : "badge-days"}">${isHoras ? "Horas" : "Dias"}</span></td>
                  <td>${periodo}</td>
                  <td>${qtd}</td>
                  <td>
                    ${anexo 
                      ? `<a href="${anexo}" target="_blank" class="badge badge-hours" style="text-decoration:none;">📎 Ver Anexo</a>` 
                      : `<span style="color:#888;">Sem anexo</span>`}
                  </td>
                  <td>${App.escapeHTML(d.observacoes || "—")}</td>
                  <td class="no-print">
                    <a href="nova-declaracao.html?id=${d.id}" class="btn btn-secondary btn-sm">Editar</a>
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
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    try {
      const funcs = await App.getAll("funcionarios").catch(() => []);
      let decl = null;

      if (id) {
        decl = await App.get("declaracoes", id).catch(() => null);
      }

      const isEdit = !!decl;
      const funcIdAtual = decl?.funcionarioId || decl?.funcionario_id;
      const anexoAtual = decl?.arquivoUrl || decl?.arquivo_url || decl?.arquivoBase64 || decl?.arquivo_base64;

      App.layout(
        isEdit ? "Editar Declaração" : "Nova Declaração", 
        isEdit ? "Atualização dos dados da declaração" : "Lançamento e anexação do documento", 
        `
        <div class="card panel">
          <form id="declForm" class="form">
            <div class="grid-2">
              <div class="field">
                <label for="funcionarioId">Funcionário *</label>
                <select id="funcionarioId" class="input" required>
                  <option value="">Selecione...</option>
                  ${funcs.map(f => `<option value="${f.id}" ${decl && funcIdAtual == f.id ? "selected" : ""}>${App.escapeHTML(f.nome)} — ${App.escapeHTML(f.matricula || "Sem mat.")}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="tipo">Tipo de declaração *</label>
                <select id="tipo" class="input" required>
                  <option value="horas" ${decl && decl.tipo === "horas" ? "selected" : ""}>Declaração de Horas</option>
                  <option value="dias" ${decl && decl.tipo === "dias" ? "selected" : ""}>Declaração de Dias</option>
                </select>
              </div>
            </div>

            <div id="camposDinamicos"></div>

            <div class="field">
              <label for="observacoes">Observações</label>
              <textarea id="observacoes" class="input" rows="3" placeholder="Informações adicionais...">${App.escapeHTML(decl?.observacoes || "")}</textarea>
            </div>

            <div class="field">
              <label for="arquivo">${isEdit ? "Substituir declaração (opcional)" : "Anexar declaração"}</label>
              <input type="file" id="arquivo" class="input-file" accept=".pdf,image/*">
              ${anexoAtual ? `<p style="margin-top:8px;"><a href="${anexoAtual}" target="_blank" class="badge badge-hours" style="text-decoration:none;">📎 Visualizar Anexo Atual</a></p>` : ''}
            </div>

            <div class="form-actions">
              <a href="declaracoes.html" class="btn btn-secondary">Cancelar</a>
              <button type="submit" class="btn btn-primary">${isEdit ? "Salvar Alterações" : "Salvar declaração"}</button>
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
        const hInicial = decl?.horaInicial || decl?.hora_inicial || '';
        const hFinal = decl?.horaFinal || decl?.hora_final || '';
        const qHoras = decl?.quantidadeHoras || decl?.quantidade_horas || '';

        campos.innerHTML = `
          <div class="grid-3">
            <div class="field">
              <label for="data">Data *</label>
              <input type="date" id="data" class="input" value="${decl?.data || ''}" required>
            </div>
            <div class="field">
              <label for="horaInicial">Horário inicial</label>
              <input type="time" id="horaInicial" class="input" value="${hInicial}">
            </div>
            <div class="field">
              <label for="horaFinal">Horário final</label>
              <input type="time" id="horaFinal" class="input" value="${hFinal}">
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="quantidadeHoras">Quantidade de horas</label>
              <input type="number" id="quantidadeHoras" class="input" step="0.5" min="0" value="${qHoras}" placeholder="Ex: 2">
            </div>
          </div>
        `;
      } else {
        const dInicial = decl?.dataInicial || decl?.data_inicial || decl?.data || '';
        const dFinal = decl?.dataFinal || decl?.data_final || '';
        const qDias = decl?.quantidadeDias || decl?.quantidade_dias || '';

        campos.innerHTML = `
          <div class="grid-3">
            <div class="field">
              <label for="dataInicial">Data inicial *</label>
              <input type="date" id="dataInicial" class="input" value="${dInicial}" required>
            </div>
            <div class="field">
              <label for="dataFinal">Data final</label>
              <input type="date" id="dataFinal" class="input" value="${dFinal}">
            </div>
            <div class="field">
              <label for="quantidadeDias">Quantidade de dias</label>
              <input type="number" id="quantidadeDias" class="input" step="1" min="1" value="${qDias}" placeholder="Ex: 1">
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

    document.getElementById("declForm").addEventListener("submit", e => this.save(e, decl));
  },

  async save(e, declAntiga) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
      const tipo = document.getElementById("tipo").value;
      const fileInput = document.getElementById("arquivo");

      let anexoData = declAntiga?.arquivoUrl || declAntiga?.arquivo_url || declAntiga?.arquivoBase64 || declAntiga?.arquivo_base64 || null;

      if (fileInput.files.length > 0) {
        anexoData = await fileToBase64(fileInput.files[0]);
      }

      const funcId = document.getElementById("funcionarioId").value;
      const obs = document.getElementById("observacoes").value;

      // Monta o objeto compatível com colunas camelCase e snake_case
      const payload = {
        funcionarioId: funcId,
        funcionario_id: funcId,
        tipo: tipo,
        observacoes: obs,
        arquivoBase64: anexoData,
        arquivo_base64: anexoData,
        arquivoUrl: anexoData,
        arquivo_url: anexoData
      };

      if (declAntiga?.id) {
        payload.id = declAntiga.id;
      }

      if (tipo === "horas") {
        const dataVal = document.getElementById("data").value;
        const hIni = document.getElementById("horaInicial").value || null;
        const hFim = document.getElementById("horaFinal").value || null;
        const qHoras = parseFloat(document.getElementById("quantidadeHoras").value) || 0;

        payload.data = dataVal;
        payload.horaInicial = hIni;
        payload.hora_inicial = hIni;
        payload.horaFinal = hFim;
        payload.hora_final = hFim;
        payload.quantidadeHoras = qHoras;
        payload.quantidade_horas = qHoras;
      } else {
        const dIni = document.getElementById("dataInicial").value;
        const dFim = document.getElementById("dataFinal").value || dIni;
        const qDias = parseInt(document.getElementById("quantidadeDias").value, 10) || 1;

        payload.dataInicial = dIni;
        payload.data_inicial = dIni;
        payload.dataFinal = dFim;
        payload.data_final = dFim;
        payload.data = dIni;
        payload.quantidadeDias = qDias;
        payload.quantidade_dias = qDias;
      }

      if (declAntiga?.id) {
        await App.put("declaracoes", payload);
        App.toast("Declaração atualizada com sucesso!");
      } else {
        await App.add("declaracoes", payload);
        App.toast("Declaração cadastrada com sucesso!");
      }

      setTimeout(() => window.location.href = "declaracoes.html", 1000);
    } catch (err) {
      console.error(err);
      App.toast("Erro ao salvar: " + (err.message || err), "danger");
      btn.disabled = false;
    }
  }
};