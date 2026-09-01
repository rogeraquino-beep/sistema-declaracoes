
function declarationBadge(tipo){
  return `<span class="badge ${tipo==="horas"?"badge-hours":"badge-days"}">${tipo==="horas"?"Horas":"Dias"}</span>`;
}
function quantityLabel(d){
  return d.tipo==="horas" ? `${Number(d.quantidadeHoras||0)} h` : `${Number(d.quantidadeDias||0)} dia(s)`;
}
function periodLabel(d){
  if (d.tipo==="dias") return `${App.formatDate(d.dataInicial)} → ${App.formatDate(d.dataFinal)}`;
  return `${d.horaInicial||"—"} → ${d.horaFinal||"—"}`;
}
function serializeCSV(value){
  return `"${String(value ?? "").replace(/"/g,'""')}"`;
}

const DeclaracoesPage = {
  all: [], funcs: [],
  async init(){
    await App.seedDemoData();
    App.layout("Declarações", "Consulta de todos os documentos lançados", `
      <div class="page-header">
        <div><h2>Todas as declarações</h2><p>Pesquise e filtre documentos por funcionário, tipo e período.</p></div>
        <a class="btn btn-primary" href="nova-declaracao.html">＋ Nova Declaração</a>
      </div>
      <section class="card panel">
        <div class="toolbar">
          <div class="grow search-box"><span>⌕</span><input class="input" id="searchDec" placeholder="Pesquisar declaração..." autocomplete="off"></div>
          <select class="select" id="filterFuncionario" style="width:auto;min-width:180px"><option value="">Todos os funcionários</option></select>
          <select class="select" id="filterTipo" style="width:auto;min-width:130px"><option value="">Todas</option><option value="horas">Horas</option><option value="dias">Dias</option></select>
          <input class="input" id="filterStart" type="date" style="width:auto">
          <input class="input" id="filterEnd" type="date" style="width:auto">
        </div>
        <div id="declaracoesTable"></div>
      </section>
    `);
    this.all = await App.getAll("declaracoes");
    this.funcs = await App.getAll("funcionarios");
    const select = document.getElementById("filterFuncionario");
    this.funcs.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")).forEach(f=>select.insertAdjacentHTML("beforeend", `<option value="${f.id}">${App.escapeHTML(f.nome)}</option>`));
    ["searchDec","filterFuncionario","filterTipo","filterStart","filterEnd"].forEach(id => document.getElementById(id).addEventListener("input", ()=>this.render()));
    this.render();
  },
  render(){
    const q = document.getElementById("searchDec").value.trim().toLowerCase();
    const fid = document.getElementById("filterFuncionario").value;
    const tipo = document.getElementById("filterTipo").value;
    const start = document.getElementById("filterStart").value;
    const end = document.getElementById("filterEnd").value;
    const fmap = Object.fromEntries(this.funcs.map(f=>[f.id,f]));
    const rows = this.all.filter(d=>{
      const f = fmap[d.funcionarioId];
      const blob = `${f?.nome||""} ${d.nomeArquivo||""} ${d.observacoes||""}`.toLowerCase();
      return (!q || blob.includes(q)) && (!fid || d.funcionarioId===fid) && (!tipo || d.tipo===tipo) &&
        (!start || d.data>=start) && (!end || d.data<=end);
    }).sort((a,b)=>String(b.data||"").localeCompare(String(a.data||"")));
    const root = document.getElementById("declaracoesTable");
    if(!rows.length){root.innerHTML=`<div class="empty"><strong>Nenhuma declaração encontrada</strong>Ajuste os filtros ou cadastre uma nova declaração.</div>`;return;}
    root.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Funcionário</th><th>Tipo</th><th>Data</th><th>Quantidade</th><th>Período</th><th>Documento</th><th>Ações</th></tr></thead><tbody>
      ${rows.map(d=>{
        const f=fmap[d.funcionarioId];
        return `<tr>
          <td><a href="funcionario.html?id=${encodeURIComponent(d.funcionarioId)}"><strong>${App.escapeHTML(f?.nome||"Removido")}</strong></a></td>
          <td>${declarationBadge(d.tipo)}</td><td>${App.formatDate(d.data)}</td><td>${quantityLabel(d)}</td><td>${periodLabel(d)}</td>
          <td>${d.nomeArquivo?App.escapeHTML(d.nomeArquivo):"—"}</td>
          <td><div class="actions">
            <button class="btn btn-secondary btn-sm" onclick="DeclaracoesPage.visualizar('${d.id}')">Visualizar</button>
            <button class="btn btn-secondary btn-sm" onclick="DeclaracoesPage.editar('${d.id}')">Editar</button>
            <button class="btn btn-danger btn-sm" onclick="DeclaracoesPage.excluir('${d.id}')">Excluir</button>
          </div></td>
        </tr>`;
      }).join("")}
    </tbody></table></div>`;
  },
  async visualizar(id){
    const d=await App.get("declaracoes",id);
    if(!d){App.toast("Declaração não encontrada.","danger");return;}
    const title = `${d.tipo==="horas"?"Declaração de Horas":"Declaração de Dias"} — ${App.formatDate(d.data)}`;
    if(!d.arquivo){
      App.openModal({title,body:`<div class="empty"><strong>Sem documento anexado</strong>Esta declaração foi cadastrada sem PDF/JPG/PNG.</div>`});
      return;
    }
    if((d.tipoArquivo||"").includes("pdf")){
      const blob = await fetch(d.arquivo).then(r=>r.blob());
      const url = URL.createObjectURL(blob);
      App.openModal({title, body:`<iframe class="preview-frame" src="${url}" title="Visualização do PDF"></iframe>`, footer:`
        <button class="btn btn-secondary" data-close-modal>Fechar</button>
        <button class="btn btn-secondary" id="newTabBtn">Abrir em nova aba</button>
        <button class="btn btn-primary" id="downloadBtn">Download</button>`});
      document.getElementById("newTabBtn").onclick=()=>window.open(url,"_blank");
      document.getElementById("downloadBtn").onclick=()=>App.downloadBlob(blob,d.nomeArquivo||"declaracao.pdf");
      document.querySelector("[data-close-modal]")?.addEventListener("click",()=>setTimeout(()=>URL.revokeObjectURL(url),100));
    }else{
      App.openModal({title,body:`<img class="preview-image" src="${d.arquivo}" alt="${App.escapeHTML(d.nomeArquivo||"Documento")}">`,footer:`<button class="btn btn-secondary" data-close-modal>Fechar</button><button class="btn btn-primary" id="downloadBtn">Download</button>`});
      document.getElementById("downloadBtn").onclick=async()=>{
        const blob=await fetch(d.arquivo).then(r=>r.blob());
        App.downloadBlob(blob,d.nomeArquivo||"documento");
      };
      document.querySelector("[data-close-modal]")?.addEventListener("click",()=>{});
    }
  },
  editar(id){location.href=`nova-declaracao.html?id=${encodeURIComponent(id)}`},
  async excluir(id){
    const d=await App.get("declaracoes",id); if(!d)return;
    App.openModal({title:"Excluir declaração",body:`<div class="alert alert-danger">Tem certeza que deseja excluir esta declaração?</div>`,footer:`<button class="btn btn-secondary" data-close-modal>Cancelar</button><button class="btn btn-danger" id="confirmDeleteDec">Excluir</button>`});
    document.getElementById("confirmDeleteDec").onclick=async()=>{
      await App.remove("declaracoes",id);App.closeModal();App.toast("Declaração excluída.");this.all=await App.getAll("declaracoes");this.render();
    };
  }
};

const FuncionarioPage = {
  async init(){
    await App.seedDemoData();
    const id=new URLSearchParams(location.search).get("id");
    const f=await App.get("funcionarios",id);
    if(!f){App.layout("Funcionário","Registro não encontrado",`<div class="card panel"><div class="empty"><strong>Funcionário não encontrado</strong><a class="btn btn-secondary" href="funcionarios.html">Voltar</a></div></div>`);return;}
    const decs=(await App.getAll("declaracoes")).filter(d=>d.funcionarioId===id).sort((a,b)=>String(b.data||"").localeCompare(String(a.data||"")));
    App.layout("Perfil do Funcionário", f.nome, `
      <div class="page-header">
        <div><h2>Perfil do funcionário</h2><p>Dados funcionais e histórico de declarações.</p></div>
        <div class="actions">
          <a class="btn btn-secondary" href="novo-funcionario.html?id=${encodeURIComponent(f.id)}">Editar funcionário</a>
          <a class="btn btn-primary" href="nova-declaracao.html?funcionarioId=${encodeURIComponent(f.id)}">＋ Nova Declaração</a>
        </div>
      </div>
      <section class="card profile-head">
        <div class="avatar">${App.initials(f.nome)}</div>
        <div><h2>${App.escapeHTML(f.nome)}</h2><p>${App.escapeHTML(f.cargo)} • ${App.escapeHTML(f.setor)}</p></div>
        <div><span class="badge ${f.status==="Ativo"?"badge-success":"badge-danger"}">${App.escapeHTML(f.status)}</span></div>
      </section>
      <div class="info-grid">
        ${this.info("Matrícula",f.matricula)}${this.info("Cargo",f.cargo)}${this.info("Setor",f.setor)}${this.info("Vínculo",f.vinculo)}
        ${this.info("Data de admissão",App.formatDate(f.dataAdmissao))}${this.info("Telefone",f.telefone)}${this.info("E-mail",f.email)}${this.info("CPF",f.cpf)}
      </div>
      <section class="card panel" style="margin-top:20px">
        <div class="panel-header"><h3>Histórico de declarações</h3><span class="badge badge-success">${decs.length} documento(s)</span></div>
        ${this.table(decs)}
      </section>
      ${f.observacoes?`<section class="card panel" style="margin-top:20px"><div class="panel-header"><h3>Observações</h3></div><p style="white-space:pre-wrap;color:var(--muted)">${App.escapeHTML(f.observacoes)}</p></section>`:""}
    `);
  },
  info(label,value){return `<div class="info-item"><span>${label}</span><strong>${App.escapeHTML(value||"—")}</strong></div>`},
  table(decs){
    if(!decs.length)return `<div class="empty"><strong>Nenhuma declaração cadastrada</strong>Use o botão “Nova Declaração” para lançar o primeiro documento.</div>`;
    return `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Quantidade</th><th>Período</th><th>Documento</th><th>Ações</th></tr></thead><tbody>${decs.map(d=>`<tr>
      <td>${App.formatDate(d.data)}</td><td>${declarationBadge(d.tipo)}</td><td>${quantityLabel(d)}</td><td>${periodLabel(d)}</td><td>${d.nomeArquivo?App.escapeHTML(d.nomeArquivo):"—"}</td>
      <td><div class="actions"><button class="btn btn-secondary btn-sm" onclick="DeclaracoesPage.visualizar('${d.id}')">Visualizar</button><a class="btn btn-secondary btn-sm" href="nova-declaracao.html?id=${encodeURIComponent(d.id)}">Editar</a></div></td>
    </tr>`).join("")}</tbody></table></div>`;
  }
};

const NovaDeclaracaoPage = {
  editingId:null, oldFile:null, funcionarioIdPreset:null,
  async init(){
    await App.seedDemoData();
    const params=new URLSearchParams(location.search);
    this.editingId=params.get("id");
    this.funcionarioIdPreset=params.get("funcionarioId");
    const existing=this.editingId?await App.get("declaracoes",this.editingId):null;
    this.oldFile=existing?.arquivo?{arquivo:existing.arquivo,nomeArquivo:existing.nomeArquivo,tipoArquivo:existing.tipoArquivo,tamanhoArquivo:existing.tamanhoArquivo}:null;
    const funcs=await App.getAll("funcionarios");
    App.layout(existing?"Editar Declaração":"Nova Declaração","Lançamento e anexação do documento",`
      <div class="page-header"><div><h2>${existing?"Editar declaração":"Nova declaração"}</h2><p>Associe o documento a um funcionário e registre os dados da declaração.</p></div></div>
      <section class="card panel">
        <form id="declaracaoForm">
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Funcionário <span class="required">*</span></label><select class="select" name="funcionarioId" required><option value="">Selecione</option>${funcs.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")).map(f=>`<option value="${f.id}" ${(existing?.funcionarioId||this.funcionarioIdPreset)===f.id?"selected":""}>${App.escapeHTML(f.nome)} — ${App.escapeHTML(f.matricula)}</option>`).join("")}</select></div>
            <div class="form-group"><label class="form-label">Tipo de declaração <span class="required">*</span></label><select class="select" name="tipo" id="tipoDec" required><option value="horas" ${existing?.tipo==="horas"?"selected":""}>Declaração de Horas</option><option value="dias" ${existing?.tipo==="dias"?"selected":""}>Declaração de Dias</option></select></div>
            <div class="form-group"><label class="form-label">Data <span class="required">*</span></label><input class="input" type="date" name="data" required value="${existing?.data||""}"></div>
          </div>
          <div id="hoursFields" class="${existing?.tipo==="dias"?"hidden":""}" style="margin-top:18px">
            <div class="form-grid-3">
              <div class="form-group"><label class="form-label">Horário inicial</label><input class="input" type="time" name="horaInicial" value="${existing?.horaInicial||""}"></div>
              <div class="form-group"><label class="form-label">Horário final</label><input class="input" type="time" name="horaFinal" value="${existing?.horaFinal||""}"></div>
              <div class="form-group"><label class="form-label">Quantidade de horas</label><input class="input" type="number" min="0" step="0.25" name="quantidadeHoras" value="${existing?.quantidadeHoras??""}"></div>
            </div>
          </div>
          <div id="daysFields" class="${existing?.tipo==="dias"?"":"hidden"}" style="margin-top:18px">
            <div class="form-grid-3">
              <div class="form-group"><label class="form-label">Data inicial</label><input class="input" type="date" name="dataInicial" value="${existing?.dataInicial||""}"></div>
              <div class="form-group"><label class="form-label">Data final</label><input class="input" type="date" name="dataFinal" value="${existing?.dataFinal||""}"></div>
              <div class="form-group"><label class="form-label">Quantidade de dias</label><input class="input" type="number" min="0" step="1" name="quantidadeDias" value="${existing?.quantidadeDias??""}"></div>
            </div>
          </div>
          <div class="form-group full" style="margin-top:18px"><label class="form-label">Observações</label><textarea class="textarea" name="observacoes" placeholder="Informações adicionais...">${App.escapeHTML(existing?.observacoes||"")}</textarea></div>
          <div class="form-group full" style="margin-top:18px">
            <label class="form-label">Anexar declaração</label>
            <input class="input" type="file" id="arquivo" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png">
            <div class="form-help">Aceitos: PDF, JPG, JPEG e PNG.</div>
          </div>
          <div id="filePreview">${existing?.nomeArquivo?`<div class="file-box"><div><div class="file-name">📄 ${App.escapeHTML(existing.nomeArquivo)}</div><div class="file-meta">${App.formatBytes(existing.tamanhoArquivo)}</div></div><button type="button" class="btn btn-secondary btn-sm" id="removeFile">Remover anexo</button></div>`:""}</div>
          <div class="form-actions">
            <a class="btn btn-secondary" href="${this.funcionarioIdPreset||existing?.funcionarioId?`funcionario.html?id=${encodeURIComponent(this.funcionarioIdPreset||existing?.funcionarioId)}`:"declaracoes.html"}">Cancelar</a>
            <button class="btn btn-primary" type="submit">Salvar declaração</button>
          </div>
        </form>
      </section>
    `);
    document.getElementById("tipoDec").addEventListener("change",this.toggleFields);
    document.getElementById("arquivo").addEventListener("change",this.previewFile);
    if(document.getElementById("removeFile"))document.getElementById("removeFile").addEventListener("click",()=>{this.oldFile=null;document.getElementById("filePreview").innerHTML="";});
    document.getElementById("declaracaoForm").addEventListener("submit",e=>this.save(e));
  },
  toggleFields(){
    const type=document.getElementById("tipoDec").value;
    document.getElementById("hoursFields").classList.toggle("hidden",type!=="horas");
    document.getElementById("daysFields").classList.toggle("hidden",type!=="dias");
  },
  async previewFile(e){
    const file=e.target.files[0]; if(!file)return;
    document.getElementById("filePreview").innerHTML=`<div class="file-box"><div><div class="file-name">${file.type.startsWith("image/")?"🖼️":"📄"} ${App.escapeHTML(file.name)}</div><div class="file-meta">${App.formatBytes(file.size)}</div></div></div>`;
  },
  async save(e){
    e.preventDefault();
    const form=e.currentTarget, fd=new FormData(form);
    const file=document.getElementById("arquivo").files[0];
    if(file && !["application/pdf","image/jpeg","image/png"].includes(file.type)){App.toast("Formato de arquivo não suportado.","warning");return;}
    let fileData=this.oldFile;
    try {
      if(file) {
        const up=await App.uploadFile(file,"declaracoes");
        if(this.oldFile?.arquivo) await App.deleteFileByUrl(this.oldFile.arquivo);
        fileData={arquivo:up.url,nomeArquivo:up.name,tipoArquivo:up.type,tamanhoArquivo:up.size};
      }
    } catch(err) { console.error(err); App.toast("Erro ao enviar o arquivo.","danger"); return; }
    const type=fd.get("tipo");
    const record={
      id:this.editingId||null, funcionarioId:fd.get("funcionarioId"), tipo:type, data:fd.get("data"),
      dataInicial:type==="dias"?fd.get("dataInicial"):fd.get("data"), dataFinal:type==="dias"?fd.get("dataFinal"):fd.get("data"),
      horaInicial:type==="horas"?fd.get("horaInicial"):"", horaFinal:type==="horas"?fd.get("horaFinal"):"",
      quantidadeHoras:type==="horas"?Number(fd.get("quantidadeHoras")||0):0, quantidadeDias:type==="dias"?Number(fd.get("quantidadeDias")||0):0,
      observacoes:String(fd.get("observacoes")||"").trim(),
      arquivo:fileData?.arquivo||null, nomeArquivo:fileData?.nomeArquivo||"", tipoArquivo:fileData?.tipoArquivo||"", tamanhoArquivo:fileData?.tamanhoArquivo||0,
      dataCadastro:new Date().toISOString()
    };
    if(!record.funcionarioId || !record.data){App.toast("Preencha os campos obrigatórios.","warning");return;}
    // FUTURO: substituir IndexedDB por Supabase/API mantendo as mesmas funções de CRUD.
    const saved=await App.put("declaracoes",record); record.id=saved.id;
    App.toast(this.editingId?"Declaração atualizada com sucesso!":"Declaração salva com sucesso!");
    setTimeout(()=>location.href=`funcionario.html?id=${encodeURIComponent(record.funcionarioId)}`,500);
  }
};
