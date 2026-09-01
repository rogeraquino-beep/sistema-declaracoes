async save(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    
    const record = {
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

    // Adiciona o ID apenas se estiver editando um registro existente
    if (this.editingId) {
      record.id = this.editingId;
    }

    const all = await App.getAll("funcionarios");
    const duplicate = all.find(x => x.matricula === record.matricula && x.id !== record.id);
    if (duplicate) { 
      App.toast("Já existe funcionário com essa matrícula.", "warning"); 
      return; 
    }

    const saved = await App.put("funcionarios", record);
    const targetId = saved?.id || record.id;

    App.toast(this.editingId ? "Funcionário atualizado com sucesso!" : "Funcionário cadastrado com sucesso!");
    setTimeout(() => location.href = `funcionario.html?id=${encodeURIComponent(targetId)}`, 500);
  }