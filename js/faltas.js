const FaltasPage = {
  async init() {
    const funcs = await App.getAll("funcionarios");
    const faltas = await App.getAll("faltas");

    this.state = {
      funcionarios: funcs,
      faltas: faltas
    };

    App.layout("Controle de Faltas", "Registre e consulte as faltas dos funcionários.", `
      <style>
        .custom-modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 8px 4px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 576px) {
          .form-row { grid-template-columns: 1fr; }
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-field label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        .form-field input, 
        .form-field select, 
        .form-field textarea {
          width: 100%;
          padding: 10px 14px;
          font-size: 14px;
          color: #1f2937;
          background-color: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .form-field input:focus, 
        .form-field select:focus, 
        .form-field textarea:focus {
          background-color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .form-field textarea {
          resize: vertical;
          min-height: 80px;
        }
      </style>

      <div class="page-header" style="margin-bottom: 24px;">
        <div>
          <h2 style="margin: 0; font-size: 24px; color: #111827;">Controle de Faltas</h2>
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Registre e consulte as faltas dos funcionários.</p>
        </div>
        <div class="actions no-print">
          <button class="btn btn-primary" id="btnNovaFalta" style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">＋</span> Registrar falta
          </button>
        </div>
      </div>

      <div class="card panel">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 18px;">Registros de Faltas</h3>
          <span class="badge badge-hours">${faltas.length} no total</span>
        </div>
        <div id="tabelaFaltasContainer"></div>
      </div>
    `);

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    document.getElementById("btnNovaFalta")?.addEventListener("click", () => this.openModalFalta());
  },

  render() {
    const container = document.getElementById("tabelaFaltasContainer");
    if (!container) return;

    const { faltas, funcionarios } = this.state;
    const mapFunc = Object.fromEntries(funcionarios.map(f => [f.id, f]));

    if (!faltas.length) {
      container.innerHTML = `<div class="empty"><strong>Nenhuma falta registrada</strong>Clique em "Registrar falta" para adicionar o primeiro registro.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Funcionário</th>
              <th>Data</th>
              <th>Motivo</th>
              <th>Justificativa / Observação</th>
              <th style="text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${faltas.map(f => {
              const func = mapFunc[f.funcionario_id];
              return `
                <tr>
                  <td><code style="background:#f3f4f6; padding:2px 6px; border-radius:4px; font-size:12px;">#${f.id}</code></td>
                  <td><strong>${App.escapeHTML(func?.nome || "Funcionário removido")}</strong></td>
                  <td>${App.formatDate(f.data_falta)}</td>
                  <td><span class="badge badge-days">${App.escapeHTML(f.motivo || "Falta Injustificada")}</span></td>
                  <td>${App.escapeHTML(f.justificativa || "—")}</td>
                  <td style="text-align: right;">
                    <button class="btn btn-danger btn-sm" onclick="FaltasPage.excluir('${f.id}')">Excluir</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  openModalFalta() {
    const { funcionarios } = this.state;

    App.openModal({
      title: "Registrar falta",
      body: `
        <form id="formFalta" class="custom-modal-form">
          <div class="form-field">
            <label for="faltaFuncionario">Funcionário *</label>
            <select id="faltaFuncionario" required>
              <option value="">Selecione um funcionário...</option>
              ${funcionarios.map(f => `<option value="${f.id}">${App.escapeHTML(f.nome)}</option>`).join("")}
            </select>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="faltaData">Data da falta *</label>
              <input type="date" id="faltaData" value="${new Date().toISOString().slice(0,10)}" required>
            </div>
            <div class="form-field">
              <label for="faltaMotivo">Motivo *</label>
              <select id="faltaMotivo" required>
                <option value="Falta Injustificada">Falta Injustificada</option>
                <option value="Falta Justificada">Falta Justificada</option>
                <option value="Atestado Médico">Atestado Médico</option>
                <option value="Licença / Outros">Licença / Outros</option>
              </select>
            </div>
          </div>

          <div class="form-field">
            <label for="faltaJustificativa">Justificativa / Observação</label>
            <textarea id="faltaJustificativa" placeholder="Digite aqui os detalhes ou justificativa da falta..."></textarea>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary" data-close-modal>Cancelar</button>
        <button class="btn btn-primary" id="btnSalvarFalta">Salvar Registro</button>
      `
    });

    document.getElementById("btnSalvarFalta")?.addEventListener("click", () => this.salvar());
  },

  async salvar() {
    const funcId = document.getElementById("faltaFuncionario")?.value;
    const data = document.getElementById("faltaData")?.value;
    const motivo = document.getElementById("faltaMotivo")?.value;
    const justificativa = document.getElementById("faltaJustificativa")?.value;

    if (!funcId || !data) {
      App.toast("Preencha os campos obrigatórios.", "warning");
      return;
    }

    try {
      await App.add("faltas", {
        funcionario_id: funcId,
        data_falta: data,
        motivo: motivo,
        justificativa: justificativa
      });

      App.toast("Falta registrada com sucesso!", "success");
      App.closeModal();

      // Recarrega lista
      this.state.faltas = await App.getAll("faltas");
      this.render();
    } catch (err) {
      console.error(err);
      App.toast("Erro ao salvar falta.", "danger");
    }
  },

  async excluir(id) {
    if (!confirm("Tem certeza que deseja excluir esta falta?")) return;

    try {
      await App.remove("faltas", id);
      App.toast("Falta removida!", "info");
      this.state.faltas = await App.getAll("faltas");
      this.render();
    } catch (err) {
      console.error(err);
      App.toast("Erro ao excluir registro.", "danger");
    }
  }
};