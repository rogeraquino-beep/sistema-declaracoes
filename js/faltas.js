function extrairIdFuncionario(f) {
  if (!f || typeof f !== 'object') return "";
  const possiveisChaves = ['id', 'funcionario_id', 'id_funcionario', 'codigo', 'cpf', 'matricula'];
  for (const key of possiveisChaves) {
    if (f[key] !== undefined && f[key] !== null && String(f[key]).trim() !== "") {
      return String(f[key]);
    }
  }
  return "";
}

const FaltasPage = {
  funcionariosLista: [],

  async init() {
    try {
      const [faltas, funcionarios] = await Promise.all([
        App.getAll("faltas").catch(() => []),
        App.getAll("funcionarios").catch(() => [])
      ]);

      this.funcionariosLista = funcionarios || [];

      const funcMap = {};
      if (Array.isArray(funcionarios)) {
        funcionarios.forEach(f => {
          const fid = extrairIdFuncionario(f);
          if (fid) funcMap[fid] = f;
        });
      }

      App.layout("Controle de Faltas", "Registre e consulte as faltas dos funcionários.", `
        <div class="page-header">
          <div>
            <h2>Controle de Faltas</h2>
            <p>Registre e consulte as faltas dos funcionários.</p>
          </div>
          <div class="actions no-print">
            <button class="btn btn-primary" onclick="FaltasPage.openModal()">＋ Registrar falta</button>
          </div>
        </div>

        <div class="card panel">
          <div class="panel-header">
            <h3>Registros de Faltas</h3>
            <span class="badge badge-days">${(faltas || []).length} no total</span>
          </div>
          ${this.renderTable(faltas || [], funcMap)}
        </div>

        <!-- Modal Registrar Falta -->
        <div id="modalFalta" class="modal-backdrop" style="display:none;">
          <div class="modal card">
            <div class="modal-header">
              <h3>Registrar falta</h3>
              <button type="button" class="close-btn" onclick="FaltasPage.closeModal()">&times;</button>
            </div>
            <form id="faltaForm" class="form">
              <input type="hidden" id="faltaId">
              <div class="field">
                <label for="faltaFuncionario">Funcionário *</label>
                <select id="faltaFuncionario" class="input" required>
                  <option value="">Selecione...</option>
                  ${this.funcionariosLista.map((f, idx) => {
                    const fid = extrairIdFuncionario(f);
                    const nome = f.nome_completo || f.nome || "Funcionário";
                    return `<option value="${fid}" data-index="${idx}">${App.escapeHTML(nome)}</option>`;
                  }).join("")}
                </select>
              </div>

              <div class="field">
                <label for="faltaData">Data *</label>
                <input type="date" id="faltaData" class="input" required>
              </div>

              <div class="field">
                <label for="faltaTipo">Tipo / Categoria *</label>
                <select id="faltaTipo" class="input" required>
                  <option value="Falta Injustificada">Falta Injustificada</option>
                  <option value="Falta Justificada">Falta Justificada</option>
                  <option value="Atestado">Atestado Médico</option>
                  <option value="Licença">Licença</option>
                </select>
              </div>

              <div class="field">
                <label for="faltaJustificativa">Justificativa / Observação</label>
                <textarea id="faltaJustificativa" class="input" rows="3" placeholder="Detalhes ou justificativa..."></textarea>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="FaltasPage.closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      `);

      this.bindEvents();
    } catch (err) {
      console.error("Erro ao carregar faltas:", err);
      App.toast("Erro ao carregar faltas", "danger");
    }
  },

  renderTable(list, funcMap) {
    if (!list || !list.length) {
      return `<div class="empty"><strong>Nenhuma falta registrada</strong><p>Clique em "+ Registrar falta" para adicionar.</p></div>`;
    }

    const rows = [...list].sort((a, b) => String(b.id).localeCompare(String(a.id)));

    return `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Funcionário</th>
              <th>Data</th>
              <th>Tipo</th>
              <th>Justificativa / Observação</th>
              <th class="no-print">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(f => {
              const fKey = String(f.funcionario_id || f.id_funcionario || "");
              const func = funcMap[fKey];
              const dataFalta = f.data_falta || f.data_registro || f.data_inicio || f.data || f.created_at;
              const tipoFalta = f.tipo_falta || f.tipo || f.categoria || f.motivo || "Falta";
              const justFalta = f.justificativa || f.observacoes || f.observacao || f.descricao || "—";

              return `
                <tr>
                  <td><code>#${f.id}</code></td>
                  <td><strong>${App.escapeHTML(func?.nome_completo || func?.nome || "Funcionário não encontrado")}</strong></td>
                  <td>${App.formatDate(dataFalta)}</td>
                  <td><span class="badge badge-days">${App.escapeHTML(tipoFalta)}</span></td>
                  <td>${App.escapeHTML(justFalta)}</td>
                  <td class="no-print">
                    <button class="btn btn-danger btn-sm" onclick="FaltasPage.deleteItem('${f.id}')">Excluir</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  bindEvents() {
    const form = document.getElementById("faltaForm");
    if (form) {
      form.addEventListener("submit", e => this.save(e));
    }
  },

  openModal() {
    const modal = document.getElementById("modalFalta");
    if (modal) {
      document.getElementById("faltaForm").reset();
      document.getElementById("faltaId").value = "";
      document.getElementById("faltaData").value = new Date().toISOString().slice(0, 10);
      modal.style.display = "flex";
    }
  },

  closeModal() {
    const modal = document.getElementById("modalFalta");
    if (modal) modal.style.display = "none";
  },

  async save(e) {
    e.preventDefault();

    const funcSelect = document.getElementById("faltaFuncionario");
    const funcId = funcSelect ? funcSelect.value : "";
    const dataVal = document.getElementById("faltaData").value;
    const tipoVal = document.getElementById("faltaTipo").value;
    const justVal = document.getElementById("faltaJustificativa").value || "";

    if (!funcId) {
      App.toast("Selecione um funcionário.", "danger");
      return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    // Tentativa 1: Estrutura com nomes padronizados no Supabase (data_falta e tipo_falta)
    let payload = {
      funcionario_id: String(funcId),
      data_falta: dataVal,
      tipo_falta: tipoVal,
      justificativa: justVal,
      observacoes: justVal
    };

    try {
      await App.add("faltas", payload);
      App.toast("Falta registrada com sucesso!");
      this.closeModal();
      this.init();
    } catch (err1) {
      console.warn("Tentativa 1 falhou, tentando estrutura alternativa...", err1);

      // Tentativa 2: Mapeamento enxuto adaptado para colunas dinâmicas
      try {
        const payloadAlt = {
          funcionario_id: String(funcId),
          data_inicio: dataVal,
          motivo: tipoVal,
          descricao: justVal
        };

        await App.add("faltas", payloadAlt);
        App.toast("Falta registrada com sucesso!");
        this.closeModal();
        this.init();
      } catch (err2) {
        console.error("Erro final ao salvar falta:", err2);
        App.toast("Erro ao salvar: " + (err2.message || err1.message), "danger");
      }
    } finally {
      btn.disabled = false;
    }
  },

  async deleteItem(id) {
    if (!confirm("Tem certeza que deseja excluir esta falta?")) return;
    try {
      await App.remove("faltas", id);
      App.toast("Falta excluída com sucesso!");
      this.init();
    } catch (err) {
      console.error(err);
      App.toast("Erro ao excluir: " + err.message, "danger");
    }
  }
};