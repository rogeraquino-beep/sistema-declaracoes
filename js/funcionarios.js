
const FuncionariosPage = {
  funcionarios: [],
  async init() {
    await App.seedDemoData();
    App.layout("Funcionários", "Cadastro e consulta dos servidores da escola", `
      <div class="page-header">
        <div><h2>Funcionários</h2><p>Pesquise, visualize e gerencie os funcionários cadastrados.</p></div>
        <a class="btn btn-primary no-print" href="novo-funcionario.html">＋ Novo Funcionário</a>
      </div>
      <section class="card panel">
        <div class="toolbar">
          <div class="grow search-box"><span>⌕</span><input class="input" id="searchFuncionario" placeholder="Pesquisar funcionário..." autocomplete="off"></div>
        </div>
        <div id="funcionariosTable"></div>
      </section>
    `);
    this.funcionarios = await App.getAll("funcionarios");
    document.getElementById("searchFuncionario").addEventListener("input", e => this.render(e.target.value));
    this.render("");
  },
  render(query="") {
    const q = query.trim().toLowerCase();
    const rows = this.funcionarios.filter(f => [f.nome,f.matricula,f.cargo,f.setor,f.vinculo].some(v => String(v||"").toLowerCase().includes(q)))
      .sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
    const root = document.getElementById("funcionariosTable");
    if (!rows.length) {
      root.innerHTML = `<div class="empty"><strong>Nenhum funcionário encontrado</strong>Tente outro termo de pesquisa.</div>`;
      return;
    }
    root.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Funcionário</th><th>Matrícula</th><th>Cargo</th><th>Setor</th><th>Vínculo</th><th>Declarações</th><th>Ações</th></tr></thead><tbody>
      ${rows.map(f=>`<tr>
        <td><a href="funcionario.html?id=${encodeURIComponent(f.id)}"><strong>${App.escapeHTML(f.nome)}</strong></a></td>
        <td>${App.escapeHTML(f.matricula)}</td><td>${App.escapeHTML(f.cargo)}</td><td>${App.escapeHTML(f.setor)}</td>
        <td><span class="badge ${f.vinculo==="Efetivo"?"badge-success":"badge-warning"}">${App.escapeHTML(f.vinculo)}</span></td>
        <td><span id="count-${f.id}">...</span></td>
        <td><div class="actions">
          <a class="btn btn-secondary btn-sm" href="funcionario.html?id=${encodeURIComponent(f.id)}">Abrir</a>
          <button class="btn btn-danger btn-sm" onclick="FuncionariosPage.confirmDelete('${f.id}')">Excluir</button>
        </div></td>
      </tr>`).join("")}
    </tbody></table></div>`;
    this.fillCounts();
  },
  async fillCounts() {
    const declaracoes = await App.getAll("declaracoes");
    const counts = {};
    declaracoes.forEach(d => counts[d.funcionarioId]=(counts[d.funcionarioId]||0)+1);
    this.funcionarios.forEach(f => {
      const el = document.getElementById(`count-${f.id}`);
      if (el) el.textContent = counts[f.id] || 0;
    });
  },
  async confirmDelete(id) {
    const f = this.funcionarios.find(x=>x.id===id);
    if (!f) return;
    const decs = (await App.getAll("declaracoes")).filter(d=>d.funcionarioId===id);
    App.openModal({
      title:"Excluir funcionário",
      body:`<div class="alert alert-danger">Tem certeza que deseja excluir <strong>${App.escapeHTML(f.nome)}</strong>? ${decs.length ? `Este funcionário possui ${decs.length} declaração(ões) e elas também serão excluídas.` : ""}</div>`,
      footer:`<button class="btn btn-secondary" data-close-modal>Cancelar</button><button class="btn btn-danger" id="confirmDeleteFun">Excluir</button>`
    });
    document.getElementById("confirmDeleteFun").addEventListener("click", async ()=>{
      for (const d of decs) await App.remove("declaracoes", d.id);
      await App.remove("funcionarios", id);
      App.closeModal();
      App.toast("Funcionário excluído.");
      this.funcionarios = await App.getAll("funcionarios");
      this.render(document.getElementById("searchFuncionario")?.value || "");
    });
  }
};

const NovoFuncionarioPage = {
  editingId: null,
  async init() {
    await App.seedDemoData();
    const params = new URLSearchParams(location.search);
    this.editingId = params.get("id");
    const current = this.editingId ? await App.get("funcionarios", this.editingId) : null;
    App.layout(current ? "Editar Funcionário" : "Novo Funcionário", "Cadastro de dados funcionais", `
      <div class="page-header">
        <div><h2>${current ? "Editar funcionário" : "Novo funcionário"}</h2><p>Preencha os dados abaixo.</p></div>
      </div>
      <section class="card panel">
        <form id="funcionarioForm">
          <div class="form-grid">
            ${this.input("nome","Nome completo",current?.nome||"",true)}
            ${this.input("matricula","Matrícula",current?.matricula||"",true)}
            ${this.input("cargo","Cargo/Função",current?.cargo||"",true)}
            ${this.input("setor","Setor",current?.setor||"",true)}
            <div class="form-group"><label class="form-label">Tipo de vínculo <span class="required">*</span></label>
              <select class="select" name="vinculo" required><option value="">Selecione</option>${["Efetivo","Contratado","Outros"].map(v=>`<option ${current?.vinculo===v?"selected":""}>${v}</option>`).join("")}</select>
            </div>
            ${this.input("dataAdmissao","Data de admissão",current?.dataAdmissao||"","", "date")}
            ${this.input("cpf","CPF",current?.cpf||"")}
            ${this.input("telefone","Telefone",current?.telefone||"")}
            ${this.input("email","E-mail",current?.email||"","", "email")}
            <div class="form-group"><label class="form-label">Status</label><select class="select" name="status"><option ${(!current||current.status==="Ativo")?"selected":""}>Ativo</option><option ${current?.status==="Inativo"?"selected":""}>Inativo</option></select></div>
            ${this.input("observacoes","Observações",current?.observacoes||"",false,"textarea")}
          </div>
          <div class="form-actions">
            <a class="btn btn-secondary" href="funcionarios.html">Cancelar</a>
            <button class="btn btn-primary" type="submit">Salvar funcionário</button>
          </div>
        </form>
      </section>
    `);
    document.getElementById("funcionarioForm").addEventListener("submit", e => this.save(e));
  },
  input(name,label,value="",required=false,type="text"){
    if(type==="textarea") return `<div class="form-group full"><label class="form-label">${label}</label><textarea class="textarea" name="${name}">${App.escapeHTML(value)}</textarea></div>`;
    return `<div class="form-group"><label class="form-label">${label}${required?` <span class="required">*</span>`:""}</label><input class="input" type="${type}" name="${name}" value="${App.escapeHTML(value)}" ${required?"required":""}></div>`;
  },
  async save(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const record = {
      id: this.editingId || App.uid("fun"),
      nome: String(fd.get("nome")||"").trim(),
      matricula: String(fd.get("matricula")||"").trim(),
      cargo: String(fd.get("cargo")||"").trim(),
      setor: String(fd.get("setor")||"").trim(),
      vinculo: fd.get("vinculo"),
      dataAdmissao: fd.get("dataAdmissao")||"",
      cpf: String(fd.get("cpf")||"").trim(),
      telefone: String(fd.get("telefone")||"").trim(),
      email: String(fd.get("email")||"").trim(),
      status: fd.get("status")||"Ativo",
      observacoes: String(fd.get("observacoes")||"").trim()
    };
    const all = await App.getAll("funcionarios");
    const duplicate = all.find(x=>x.matricula===record.matricula && x.id!==record.id);
    if (duplicate) { App.toast("Já existe funcionário com essa matrícula.", "warning"); return; }
    await App.put("funcionarios", record);
    App.toast(this.editingId ? "Funcionário atualizado com sucesso!" : "Funcionário cadastrado com sucesso!");
    setTimeout(()=>location.href = `funcionario.html?id=${encodeURIComponent(record.id)}`, 500);
  }
};
