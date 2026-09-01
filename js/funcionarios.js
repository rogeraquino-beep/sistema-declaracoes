const FuncionariosPage = {
  async init() {
    try {
      const funcionarios = await App.getAll("funcionarios");
      App.layout("Funcionários", "Gerenciamento de servidores e funcionários", `
        <div class="page-header">
          <div>
            <h2>Lista de Funcionários</h2>
            <p>Cadastre e gerencie os dados dos servidores.</p>
          </div>
          <div class="actions no-print">
            <a href="novo-funcionario.html" class="btn btn-primary">＋ Novo Funcionário</a>
          </div>
        </div>

        <div class="card panel">
          <div class="panel-header">
            <h3>Cadastrados</h3>
            <span class="badge badge-hours">${funcionarios.length} no total</span>
          </div>
          ${this.renderTable(funcionarios)}
        </div>
      `);
    } catch (err) {
      console.error(err);
      App.toast("Erro ao carregar funcionários", "danger");
    }
  },

  renderTable(list) {
    if (!list.length) {
      return `<div class="empty"><strong>Nenhum funcionário encontrado</strong><p>Cadastre o primeiro servidor para começar.</p></div>`;
    }

    return `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Matrícula</th>
              <th>Cargo / Funções</th>
              <th>Setor</th>
              <th>Vínculo</th>
              <th class="no-print">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(f => `
              <tr>
                <td><strong>${App.escapeHTML(f.nome)}</strong></td>
                <td><code>${App.escapeHTML(f.matricula || "—")}</code></td>
                <td>${App.escapeHTML(f.cargo || "—")}</td>
                <td>${App.escapeHTML(f.setor || "—")}</td>
                <td><span class="badge badge-days">${App.escapeHTML(f.vinculo || "Servidor")}</span></td>
                <td class="no-print">
                  <a href="funcionario.html?id=${f.id}" class="btn btn-secondary btn-sm">Ver / Editar</a>
                  <button class="btn btn-danger btn-sm" onclick="FuncionariosPage.deleteItem('${f.id}')">Excluir</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  async deleteItem(id) {
    if (!confirm("Tem certeza que deseja excluir este funcionário?")) return;
    try {
      await App.remove("funcionarios", id);
      App.toast("Funcionário excluído com sucesso!");
      this.init();
    } catch (err) {
      console.error(err);
      App.toast("Erro ao excluir: " + err.message, "danger");
    }
  }
};

const FuncionarioPage = {
  async init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
      window.location.href = "funcionarios.html";
      return;
    }

    try {
      const funcionario = await App.get("funcionarios", id);

      if (!funcionario) {
        App.toast("Funcionário não encontrado", "danger");
        setTimeout(() => window.location.href = "funcionarios.html", 1500);
        return;
      }

      App.layout("Detalhes do Funcionário", "Edição e consulta de dados cadastrais", `
        <div class="card panel">
          <form id="funcEditForm" class="form">
            <div class="grid-2">
              <div class="field">
                <label>Nome Completo *</label>
                <input type="text" id="nome" class="input" value="${App.escapeHTML(funcionario.nome || "")}" required>
              </div>
              <div class="field">
                <label>Matrícula</label>
                <input type="text" id="matricula" class="input" value="${App.escapeHTML(funcionario.matricula || "")}">
              </div>
            </div>

            <div class="grid-3">
              <div class="field">
                <label>Cargo / Função</label>
                <input type="text" id="cargo" class="input" value="${App.escapeHTML(funcionario.cargo || "")}">
              </div>
              <div class="field">
                <label>Setor</label>
                <input type="text" id="setor" class="input" value="${App.escapeHTML(funcionario.setor || "")}">
              </div>
              <div class="field">
                <label>Vínculo</label>
                <input type="text" id="vinculo" class="input" value="${App.escapeHTML(funcionario.vinculo || "")}">
              </div>
            </div>

            <div class="field">
              <label>Observações</label>
              <textarea id="observacoes" class="input" rows="3">${App.escapeHTML(funcionario.observacoes || "")}</textarea>
            </div>

            <div class="form-actions">
              <a href="funcionarios.html" class="btn btn-secondary">Voltar</a>
              <button type="submit" class="btn btn-primary">Salvar Alterações</button>
            </div>
          </form>
        </div>
      `);

      document.getElementById("funcEditForm").addEventListener("submit", e => this.save(e, id));
    } catch (err) {
      console.error(err);
      App.toast("Erro ao carregar dados do funcionário", "danger");
    }
  },

  async save(e, id) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
      const payload = {
        id: id,
        nome: document.getElementById("nome").value,
        matricula: document.getElementById("matricula").value,
        cargo: document.getElementById("cargo").value,
        setor: document.getElementById("setor").value,
        vinculo: document.getElementById("vinculo").value,
        observacoes: document.getElementById("observacoes").value
      };

      await App.put("funcionarios", payload);
      App.toast("Dados atualizados com sucesso!");
      setTimeout(() => window.location.href = "funcionarios.html", 1000);
    } catch (err) {
      console.error(err);
      App.toast("Erro ao atualizar dados: " + (err.message || err), "danger");
      btn.disabled = false;
    }
  }
};

const NovoFuncionarioPage = {
  async init() {
    App.layout("Novo Funcionário", "Cadastro de novo servidor no sistema", `
      <div class="card panel">
        <form id="novoFuncForm" class="form">
          <div class="grid-2">
            <div class="field">
              <label>Nome Completo *</label>
              <input type="text" id="nome" class="input" required placeholder="Digite o nome completo">
            </div>
            <div class="field">
              <label>Matrícula</label>
              <input type="text" id="matricula" class="input" placeholder="Ex: 0000">
            </div>
          </div>

          <div class="grid-3">
            <div class="field">
              <label>Cargo / Função</label>
              <input type="text" id="cargo" class="input" placeholder="Ex: Professor">
            </div>
            <div class="field">
              <label>Setor</label>
              <input type="text" id="setor" class="input" placeholder="Ex: Secretaria">
            </div>
            <div class="field">
              <label>Vínculo</label>
              <input type="text" id="vinculo" class="input" placeholder="Ex: Efetivo">
            </div>
          </div>

          <div class="field">
            <label>Observações</label>
            <textarea id="observacoes" class="input" rows="3" placeholder="Informações adicionais..."></textarea>
          </div>

          <div class="form-actions">
            <a href="funcionarios.html" class="btn btn-secondary">Cancelar</a>
            <button type="submit" class="btn btn-primary">Salvar Funcionário</button>
          </div>
        </form>
      </div>
    `);

    document.getElementById("novoFuncForm").addEventListener("submit", e => this.save(e));
  },

  async save(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
      const payload = {
        nome: document.getElementById("nome").value,
        matricula: document.getElementById("matricula").value,
        cargo: document.getElementById("cargo").value,
        setor: document.getElementById("setor").value,
        vinculo: document.getElementById("vinculo").value,
        observacoes: document.getElementById("observacoes").value
      };

      await App.add("funcionarios", payload);
      App.toast("Funcionário cadastrado com sucesso!");
      setTimeout(() => window.location.href = "funcionarios.html", 1000);
    } catch (err) {
      console.error(err);
      App.toast("Erro ao cadastrar funcionário: " + (err.message || err), "danger");
      btn.disabled = false;
    }
  }
};