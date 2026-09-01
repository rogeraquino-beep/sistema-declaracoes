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
          <div class="grid-3">
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
          <div class="grid-2">
            <div class="field">
              <label>Quantidade de horas</label>
              <input type="number" id="quantidadeHoras" step="0.5" min="0" placeholder="Ex: 2">
            </div>
          </div>
        `;
      } else {
        campos.innerHTML = `
          <div class="grid-3">
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
      const fileInput = document.getElementById("arquivo");
      let fileData = {};

      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        fileData = {
          nomeArquivo: file.name,
          tipoArquivo: file.type,
          tamanhoArquivo: file.size
        };
      }

      const payload = {
        funcionarioId: document.getElementById("funcionarioId").value,
        tipo: tipo,
        observacoes: document.getElementById("observacoes").value,
        ...fileData
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