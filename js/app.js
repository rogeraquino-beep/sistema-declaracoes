function toDB(store, x) {
    let payload = {};
    if (store === "funcionarios") {
      payload = { 
        nome_completo: x.nome, 
        matricula: x.matricula, 
        cargo_funcao: x.cargo, 
        setor: x.setor, 
        tipo_vinculo: x.vinculo, 
        data_admissao: x.dataAdmissao || null, 
        cpf: x.cpf, 
        telefone: x.telefone, 
        email: x.email, 
        status: x.status, 
        observacoes: x.observacoes 
      };
      // Inclui ID no payload apenas se for EDIÇÃO
      if (x.id) payload.id = x.id;
    } 
    else if (store === "declaracoes") {
      payload = { 
        funcionario_id: x.funcionarioId, 
        tipo: x.tipo, 
        data: x.data, 
        data_inicial: x.dataInicial || null, 
        data_final: x.dataFinal || null, 
        hora_inicial: x.horaInicial || null, 
        hora_final: x.horaFinal || null, 
        quantidade_horas: x.quantidadeHoras || 0, 
        quantidade_dias: x.quantidadeDias || 0, 
        observacoes: x.observacoes || null, 
        arquivo: x.arquivo || null, 
        nome_arquivo: x.nomeArquivo || null, 
        tipo_arquivo: x.tipoArquivo || null, 
        tamanho_arquivo: x.tamanhoArquivo || 0, 
        data_cadastro: x.dataCadastro || new Date().toISOString() 
      };
      if (x.id) payload.id = x.id;
    } 
    else if (store === "faltas") {
      payload = { 
        funcionario_id: x.funcionarioId, 
        data: x.data, 
        tipo: x.tipo || 'Falta', 
        justificativa: x.justificativa || null, 
        observacoes: x.observacoes || null 
      };
      if (x.id) payload.id = x.id;
    } 
    else {
      payload = { ...x };
    }
    return payload;
  }

  async function add(store, value) {
    const dataToSend = toDB(store, value);
    delete dataToSend.id; // Garante exclusão de ID local em inserções

    const r = await api(`/${store}`, {
      method: "POST",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify(dataToSend)
    });
    
    const item = Array.isArray(r) ? r[0] : r;
    return fromDB(store, item || value);
  }

  async function put(store, value) {
    if (value.id) {
      const dataToSend = toDB(store, value);
      const r = await api(`/${store}?id=eq.${encodeURIComponent(value.id)}`, {
        method: "PATCH",
        headers: { "Prefer": "return=representation" },
        body: JSON.stringify(dataToSend)
      });
      const item = Array.isArray(r) ? r[0] : r;
      return fromDB(store, item || value);
    }
    return add(store, value);
  }