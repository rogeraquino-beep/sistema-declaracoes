function fileToBase64(file) {
  return new Promise((resolve, reject) => {
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

// Função auxiliar para extrair o ID real do objeto funcionário
function getFuncionarioId(f) {
  if (!f || typeof f !== 'object') return null;
  // Procura pelas chaves de ID mais comuns no Supabase/Banco de dados
  const idVal = f.id ?? f.funcionario_id ?? f.id_funcionario ?? f.codigo ?? f.matricula;
  if (idVal !== undefined && idVal !== null && idVal !== '') {
    return idVal;
  }
  // Se não encontrar nas chaves comuns, pega o primeiro valor válido do objeto
  const values = Object.values(f);
  return values.length > 0 ? values[0] : null;
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
        funcionarios.forEach(f => {
          const fid = getFuncionarioId(f);
          if (fid) funcMap[fid] = f;
        });
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
              const fKey = d.funcionario_id || d.funcionarioId;
              const f = funcMap[fKey];
              const isHoras = d.tipo === "horas";
              const dataInicial = d.data_inicial || d.dataInicial || d.data;
              const dataFinal = d.data_final || d.dataFinal || dataInicial;
              
              const periodo = isHoras 
                ? App.formatDate(d.data) 
                : `${App.formatDate(dataInicial)} até ${App.formatDate(dataFinal)}`;
              
              const qtd = isHoras 
                ? `${d.quantidade_horas ?? d.quantidadeHoras ?? 0}h` 
                : `${d.quantidade_dias ?? d.quantidadeDias ?? 0} dia(s)`;
                
              const anexo = d.arquivo_url || d.arquivoUrl || d.arquivo_base64 || d.arquivoBase64;

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
      
      // Log no console para inspecionar a estrutura dos funcionários cadastrados
      console.log("Funcionários retornados do Supabase:", funcs);

      let decl = null;
      if (id) {
        decl = await App.get("declaracoes", id).catch(() => null);
      }

      const isEdit = !!decl;
      const funcIdAtual = decl?.funcionario_id || decl?.funcionarioId;
      const anexoAtual = decl?.arquivo_url || decl?.arquivoUrl || decl?.arquivo_base64 || decl?.arquivoBase64;

      App.layout(
        isEdit ? "Editar Declaração" : "Nova Declaração", 
        isEdit ? "Atualização dos dados da declaração" : "Lançamento e anexação do documento", 
        `
        <div class="card panel">
          <form id="declForm" class="form">
            <div class="grid-2">
              <div class="field">
                <label for="funcionarioSelect">Funcionário *</label>
                <select id="funcionarioSelect" name="funcionario_id" class="input" required>
                  <option value="">Selecione...</option>
                  ${funcs.map(f => {
                    const realId = getFuncionarioId(f);
                    const selected = decl && (funcIdAtual == realId || String(funcIdAtual) === String(realId)) ? "selected" : "";
                    const nomeStr = f.nome || f.nome_funcionario || "Sem nome";
                    const matStr = f.matricula || f.cpf || "000";
                    return `<option value="${realId}" ${selected}>${App.escapeHTML(nomeStr)} — ${App.escapeHTML(matStr)}</option>`;
                  }).join("")}
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
        const hInicial = decl?.hora_inicial || decl?.horaInicial || '';
        const hFinal = decl?.hora_final || decl?.horaFinal || '';
        const qHoras = decl?.quantidade_horas ?? decl?.quantidadeHoras ?? '';

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
        const dInicial = decl?.data_inicial || decl?.dataInicial || decl?.data || '';
        const dFinal = decl?.data_final || decl?.dataFinal || '';
        const qDias = decl?.quantidade_dias ?? decl?.quantidadeDias ?? '';

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

    const selectEl = document.getElementById("funcionarioSelect");
    const rawFuncId = selectEl ? selectEl.value : "";

    if (!rawFuncId || rawFuncId === "undefined" || rawFuncId === "null" || rawFuncId.trim() === "") {
      App.toast("Por favor, selecione um funcionário válido.", "danger");
      return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
      const tipo = document.getElementById("tipo").value;
      const fileInput = document.getElementById("arquivo");

      let anexoData = declAntiga?.arquivo_url || declAntiga?.arquivoUrl || declAntiga?.arquivo_base64 || declAntiga?.arquivoBase64 || null;

      if (fileInput.files.length > 0) {
        anexoData = await fileToBase64(fileInput.files[0]);
      }

      // Converte para número se for numérico, senão preserva string/UUID
      const funcIdParsed = (!isNaN(rawFuncId) && rawFuncId.trim() !== "") ? Number(rawFuncId) : rawFuncId;

      const obs = document.getElementById("observacoes").value || "";

      const payload = {
        funcionario_id: funcIdParsed,
        tipo: tipo,
        observacoes: obs,
        arquivo_base64: anexoData,
        arquivo_url: anexoData
      };

      if (declAntiga?.id) {
        payload.id = declAntiga.id;
      }

      if (tipo === "horas") {
        payload.data = document.getElementById("data").value;
        payload.hora_inicial = document.getElementById("horaInicial").value || null;
        payload.hora_final = document.getElementById("horaFinal").value || null;
        payload.quantidade_horas = parseFloat(document.getElementById("quantidadeHoras").value) || 0;
      } else {
        const dIni = document.getElementById("dataInicial").value;
        const dFim = document.getElementById("dataFinal").value || dIni;
        payload.data_inicial = dIni;
        payload.data_final = dFim;
        payload.data = dIni;
        payload.quantidade_dias = parseInt(document.getElementById("quantidadeDias").value, 10) || 1;
      }

      console.log("Payload enviado ao Supabase:", payload);

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