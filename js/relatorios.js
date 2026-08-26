
const RelatoriosPage = {
  all: [], funcs: [],
  async init(){
    await App.seedDemoData();
    App.layout("Relatórios","Análise consolidada das declarações",`
      <div class="page-header">
        <div><h2>Relatórios</h2><p>Filtre os lançamentos e gere um resumo para impressão ou CSV.</p></div>
        <div class="actions no-print"><button class="btn btn-secondary" id="printBtn">🖨 Imprimir relatório</button><button class="btn btn-primary" id="csvBtn">⇩ Exportar CSV</button></div>
      </div>
      <section class="card panel no-print">
        <div class="toolbar">
          <select class="select" id="rFuncionario" style="min-width:220px"><option value="">Todos os funcionários</option></select>
          <select class="select" id="rTipo" style="min-width:150px"><option value="">Todos os tipos</option><option value="horas">Horas</option><option value="dias">Dias</option></select>
          <input class="input" id="rStart" type="date" style="max-width:180px">
          <input class="input" id="rEnd" type="date" style="max-width:180px">
        </div>
      </section>
      <div id="reportContent"></div>
    `);
    this.all=await App.getAll("declaracoes"); this.funcs=await App.getAll("funcionarios");
    this.funcs.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")).forEach(f=>document.getElementById("rFuncionario").insertAdjacentHTML("beforeend",`<option value="${f.id}">${App.escapeHTML(f.nome)}</option>`));
    ["rFuncionario","rTipo","rStart","rEnd"].forEach(id=>document.getElementById(id).addEventListener("input",()=>this.render()));
    document.getElementById("printBtn").onclick=()=>window.print();
    document.getElementById("csvBtn").onclick=()=>this.exportCSV();
    this.render();
  },
  filtered(){
    const fid=document.getElementById("rFuncionario").value,tipo=document.getElementById("rTipo").value,start=document.getElementById("rStart").value,end=document.getElementById("rEnd").value;
    return this.all.filter(d=>(!fid||d.funcionarioId===fid)&&(!tipo||d.tipo===tipo)&&(!start||d.data>=start)&&(!end||d.data<=end));
  },
  render(){
    const rows=this.filtered(), fmap=Object.fromEntries(this.funcs.map(f=>[f.id,f]));
    const totalHoras=rows.filter(d=>d.tipo==="horas").reduce((s,d)=>s+Number(d.quantidadeHoras||0),0);
    const totalDias=rows.filter(d=>d.tipo==="dias").reduce((s,d)=>s+Number(d.quantidadeDias||0),0);
    const employees=new Set(rows.map(d=>d.funcionarioId)).size;
    document.getElementById("reportContent").innerHTML=`
      <div class="report-grid">
        ${this.card("Total de declarações",rows.length)}
        ${this.card("Total de horas",totalHoras)}
        ${this.card("Total de dias",totalDias)}
        ${this.card("Funcionários com declarações",employees)}
      </div>
      <section class="card panel">
        <div class="panel-header"><h3>Detalhamento</h3><span class="badge badge-success">${rows.length} registro(s)</span></div>
        <div class="table-wrap">${rows.length?`<table><thead><tr><th>Funcionário</th><th>Tipo</th><th>Data</th><th>Quantidade</th><th>Período</th><th>Documento</th></tr></thead><tbody>${rows.sort((a,b)=>String(b.data).localeCompare(String(a.data))).map(d=>`<tr><td>${App.escapeHTML(fmap[d.funcionarioId]?.nome||"Removido")}</td><td>${d.tipo==="horas"?"Horas":"Dias"}</td><td>${App.formatDate(d.data)}</td><td>${quantityLabel(d)}</td><td>${periodLabel(d)}</td><td>${App.escapeHTML(d.nomeArquivo||"—")}</td></tr>`).join("")}</tbody></table>`:`<div class="empty"><strong>Nenhum registro</strong>Não há dados para os filtros selecionados.</div>`}</div>
      </section>
      <div class="print-only" style="margin-top:16px;font-size:12px;color:#555">Relatório gerado pelo Sistema de Declarações — E.M. Profª Eunice Carneiro.</div>
    `;
  },
  card(label,value){return `<div class="card report-card"><div class="kpi">${value}</div><div class="kpi-label">${label}</div></div>`},
  async exportCSV(){
    const rows=this.filtered(), fmap=Object.fromEntries(this.funcs.map(f=>[f.id,f]));
    const header=["Funcionário","Matrícula","Tipo","Data","Quantidade","Período","Documento","Observações"];
    const csv=[header,...rows.map(d=>[
      fmap[d.funcionarioId]?.nome||"Removido",fmap[d.funcionarioId]?.matricula||"",d.tipo==="horas"?"Horas":"Dias",App.formatDate(d.data),quantityLabel(d),periodLabel(d),d.nomeArquivo||"",d.observacoes||""
    ])].map(row=>row.map(serializeCSV).join(";")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    App.downloadBlob(blob,`relatorio-declaracoes-${new Date().toISOString().slice(0,10)}.csv`);
  }
};

document.addEventListener("DOMContentLoaded",async()=>{
  const backupButton=document.createElement("button");
  if (!document.getElementById("globalBackupActions")) {
    const host=document.getElementById("modalRoot");
    if(host) host.innerHTML="";
  }
});
