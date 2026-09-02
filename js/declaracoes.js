/* =====================================================
   CONFIGURAÇÃO ESPECÍFICA DAS DECLARAÇÕES
   O app.js já possui SUPABASE_URL e SUPABASE_KEY.
===================================================== */

const DECL_REST_URL =
  "https://cujlebxqqposqomtfvdk.supabase.co/rest/v1";

const DECL_STORAGE_URL =
  "https://cujlebxqqposqomtfvdk.supabase.co/storage/v1";

const DECL_BUCKET =
  "declaracoes";


/* =====================================================
   HEADERS
===================================================== */

function declaracoesHeaders(extra = {}) {

  return {
    apikey: SUPABASE_KEY,

    Authorization:
      `Bearer ${SUPABASE_KEY}`,

    "Content-Type":
      "application/json",

    ...extra
  };

}


/* =====================================================
   UPLOAD DE PDF / JPG / JPEG / PNG
===================================================== */

async function uploadArquivoDeclaracao(file) {

  if (!file) {
    return null;
  }


  if (file.size > 10 * 1024 * 1024) {

    throw new Error(
      "O arquivo deve ter no máximo 10MB."
    );

  }


  const tiposPermitidos = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];


  if (
    file.type &&
    !tiposPermitidos.includes(file.type)
  ) {

    throw new Error(
      "Formato não permitido. Use PDF, JPG, JPEG ou PNG."
    );

  }


  const nomeSeguro = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");


  const caminho =
    `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}_${nomeSeguro}`;


  const urlUpload =
    `${DECL_STORAGE_URL}/object/` +
    `${DECL_BUCKET}/${caminho}`;


  const resposta = await fetch(
    urlUpload,
    {
      method: "POST",

      headers: {
        apikey:
          SUPABASE_KEY,

        Authorization:
          `Bearer ${SUPABASE_KEY}`,

        "Content-Type":
          file.type ||
          "application/octet-stream",

        "x-upsert":
          "false"
      },

      body: file
    }
  );


  if (!resposta.ok) {

    const erro =
      await resposta.text();

    console.error(
      "Erro no upload:",
      erro
    );

    throw new Error(
      "Não foi possível enviar o arquivo: " +
      erro
    );

  }


  const urlPublica =
    `${DECL_STORAGE_URL}/object/public/` +
    `${DECL_BUCKET}/${caminho}`;


  return {

    url:
      urlPublica,

    nome:
      file.name,

    tipo:
      file.type,

    tamanho:
      file.size,

    caminho:
      caminho
  };

}


/* =====================================================
   EXCLUIR ARQUIVO DO STORAGE
===================================================== */

async function excluirArquivoDeclaracao(
  urlArquivo
) {

  if (!urlArquivo) {
    return;
  }


  try {

    const marcador =
      `/object/public/${DECL_BUCKET}/`;


    const posicao =
      urlArquivo.indexOf(
        marcador
      );


    if (posicao === -1) {
      return;
    }


    const caminho =
      urlArquivo.substring(
        posicao + marcador.length
      );


    const urlDelete =
      `${DECL_STORAGE_URL}/object/` +
      `${DECL_BUCKET}/${caminho}`;


    const resposta =
      await fetch(
        urlDelete,
        {
          method:
            "DELETE",

          headers: {
            apikey:
              SUPABASE_KEY,

            Authorization:
              `Bearer ${SUPABASE_KEY}`
          }
        }
      );


    if (!resposta.ok) {

      console.warn(
        "Não foi possível excluir o arquivo antigo.",
        await resposta.text()
      );

    }

  } catch (erro) {

    console.warn(
      "Erro ao excluir arquivo:",
      erro
    );

  }

}


/* =====================================================
   PEGAR FUNCIONÁRIOS DIRETAMENTE DO SUPABASE
===================================================== */

async function buscarFuncionariosDeclaracao() {

  const resposta =
    await fetch(
      `${DECL_REST_URL}/funcionarios` +
      `?select=id,nome_completo,matricula` +
      `&order=nome_completo.asc`,
      {
        headers:
          declaracoesHeaders()
      }
    );


  if (!resposta.ok) {

    throw new Error(
      await resposta.text()
    );

  }


  return await resposta.json();

}


/* =====================================================
   BUSCAR DECLARAÇÕES
===================================================== */

async function buscarTodasDeclaracoes() {

  const resposta =
    await fetch(
      `${DECL_REST_URL}/declaracoes` +
      `?select=*` +
      `&order=id.desc`,
      {
        headers:
          declaracoesHeaders()
      }
    );


  if (!resposta.ok) {

    throw new Error(
      await resposta.text()
    );

  }


  return await resposta.json();

}


/* =====================================================
   BUSCAR UMA DECLARAÇÃO
===================================================== */

async function buscarDeclaracaoPorId(id) {

  const resposta =
    await fetch(
      `${DECL_REST_URL}/declaracoes` +
      `?id=eq.${encodeURIComponent(id)}` +
      `&select=*`,
      {
        headers:
          declaracoesHeaders()
      }
    );


  if (!resposta.ok) {

    throw new Error(
      await resposta.text()
    );

  }


  const dados =
    await resposta.json();


  return dados[0] || null;

}


/* =====================================================
   FORMATAR DATA
===================================================== */

function formatarDataDeclaracao(data) {

  if (!data) {
    return "—";
  }


  const partes =
    String(data)
      .substring(0, 10)
      .split("-");


  if (
    partes.length !== 3
  ) {
    return data;
  }


  return (
    `${partes[2]}/` +
    `${partes[1]}/` +
    `${partes[0]}`
  );

}


/* =====================================================
   ESCAPAR HTML
===================================================== */

function escaparDeclaracao(valor = "") {

  return String(valor)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =====================================================
   PÁGINA DECLARAÇÕES
===================================================== */

const DeclaracoesPage = {

  async init() {

    try {

      const [
        declaracoes,
        funcionarios
      ] = await Promise.all([

        buscarTodasDeclaracoes(),

        buscarFuncionariosDeclaracao()

      ]);


      const mapaFuncionarios =
        {};


      funcionarios.forEach(
        funcionario => {

          mapaFuncionarios[
            String(
              funcionario.id
            )
          ] =
            funcionario;

        }
      );


      App.layout(

        "Declarações",

        "Listagem de todas as declarações registradas",

        `

        <div class="page-header">

          <div>

            <h2>
              Lista de Declarações
            </h2>

            <p>
              Gerencie e consulte os documentos de horas e dias.
            </p>

          </div>


          <div class="actions no-print">

            <a
              href="nova-declaracao.html"
              class="btn btn-primary"
            >
              ＋ Nova Declaração
            </a>

          </div>

        </div>


        <div class="card panel">

          <div class="panel-header">

            <h3>
              Registros
            </h3>

            <span class="badge badge-hours">
              ${declaracoes.length}
              no total
            </span>

          </div>


          ${
            declaracoes.length === 0

              ?

              `

              <div class="empty">

                <strong>
                  Nenhuma declaração encontrada
                </strong>

                <p>
                  Cadastre a primeira declaração.
                </p>

              </div>

              `

              :

              `

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

                      <th>Ações</th>

                    </tr>

                  </thead>


                  <tbody>

                    ${declaracoes.map(
                      declaracao => {

                        const funcionario =
                          mapaFuncionarios[
                            String(
                              declaracao.funcionario_id
                            )
                          ];


                        const horas =
                          declaracao.tipo ===
                          "horas";


                        const dataInicial =

                          declaracao.data_inicio ||

                          declaracao.data_inicial ||

                          declaracao.data;


                        const dataFinal =

                          declaracao.data_fim ||

                          declaracao.data_final ||

                          declaracao.data;


                        const periodo =

                          horas

                            ?

                            formatarDataDeclaracao(
                              declaracao.data
                            )

                            :

                            `${formatarDataDeclaracao(
                              dataInicial
                            )} até ${formatarDataDeclaracao(
                              dataFinal
                            )}`;


                        const quantidade =

                          horas

                            ?

                            `${Number(
                              declaracao.quantidade_horas ||
                              0
                            )}h`

                            :

                            `${Number(
                              declaracao.quantidade_dias ||
                              0
                            )} dia(s)`;


                        return `

                          <tr>

                            <td>
                              #${declaracao.id}
                            </td>


                            <td>

                              <strong>

                                ${escaparDeclaracao(
                                  funcionario?.nome_completo ||
                                  "Funcionário não encontrado"
                                )}

                              </strong>

                            </td>


                            <td>

                              <span
                                class="badge ${
                                  horas
                                    ? "badge-hours"
                                    : "badge-days"
                                }"
                              >

                                ${
                                  horas
                                    ? "Horas"
                                    : "Dias"
                                }

                              </span>

                            </td>


                            <td>
                              ${periodo}
                            </td>


                            <td>
                              ${quantidade}
                            </td>


                            <td>

                              ${
                                declaracao.arquivo_url

                                  ?

                                  `

                                  <a
                                    href="${declaracao.arquivo_url}"
                                    target="_blank"
                                    class="badge badge-hours"
                                    style="text-decoration:none;"
                                  >

                                    📎 Ver Anexo

                                  </a>

                                  `

                                  :

                                  `

                                  <span
                                    style="color:#888;"
                                  >
                                    Sem anexo
                                  </span>

                                  `

                              }

                            </td>


                            <td>

                              ${escaparDeclaracao(
                                declaracao.observacoes ||
                                declaracao.descricao ||
                                "—"
                              )}

                            </td>


                            <td>

                              <a
                                href="
                                  nova-declaracao.html?id=${
                                    declaracao.id
                                  }
                                "
                                class="
                                  btn
                                  btn-secondary
                                  btn-sm
                                "
                              >
                                Editar
                              </a>


                              <button
                                class="
                                  btn
                                  btn-danger
                                  btn-sm
                                "
                                onclick="
                                  DeclaracoesPage.excluir(
                                    '${declaracao.id}'
                                  )
                                "
                              >
                                Excluir
                              </button>

                            </td>

                          </tr>

                        `;

                      }
                    ).join("")}

                  </tbody>

                </table>

              </div>

              `
          }

        </div>

        `

      );

    } catch (erro) {

      console.error(
        "Erro ao carregar declarações:",
        erro
      );

      App.toast(
        "Erro ao carregar as declarações.",
        "danger"
      );

    }

  },


  async excluir(id) {

    if (
      !confirm(
        "Tem certeza que deseja excluir esta declaração?"
      )
    ) {

      return;

    }


    try {

      const declaracao =
        await buscarDeclaracaoPorId(
          id
        );


      if (
        declaracao?.arquivo_url
      ) {

        await excluirArquivoDeclaracao(
          declaracao.arquivo_url
        );

      }


      const resposta =
        await fetch(

          `${DECL_REST_URL}/declaracoes` +
          `?id=eq.${encodeURIComponent(id)}`,

          {

            method:
              "DELETE",

            headers:
              declaracoesHeaders()
          }

        );


      if (
        !resposta.ok
      ) {

        throw new Error(
          await resposta.text()
        );

      }


      App.toast(
        "Declaração excluída com sucesso!"
      );


      await this.init();

    } catch (erro) {

      console.error(
        erro
      );

      App.toast(
        "Erro ao excluir: " +
        erro.message,
        "danger"
      );

    }

  }

};


/* =====================================================
   NOVA DECLARAÇÃO
===================================================== */

const NovaDeclaracaoPage = {

  funcionarios: [],


  async init() {

    const parametros =
      new URLSearchParams(
        window.location.search
      );


    const id =
      parametros.get(
        "id"
      );


    try {

      this.funcionarios =
        await buscarFuncionariosDeclaracao();


      let declaracao =
        null;


      if (id) {

        declaracao =
          await buscarDeclaracaoPorId(
            id
          );

      }


      const editando =
        !!declaracao;


      App.layout(

        editando
          ? "Editar Declaração"
          : "Nova Declaração",

        editando
          ? "Atualização dos dados da declaração"
          : "Lançamento e anexação do documento",

        `

        <div class="card panel">

          <form
            id="formDeclaracao"
            class="form"
          >


            <div class="grid-2">


              <div class="field">

                <label
                  for="funcionarioDeclaracao"
                >
                  Funcionário *
                </label>


                <select
                  id="funcionarioDeclaracao"
                  class="input"
                  required
                >

                  <option value="">
                    Selecione um funcionário...
                  </option>


                  ${this.funcionarios.map(
                    funcionario => {

                      const fid =
                        Number(
                          funcionario.id
                        );


                      if (
                        !Number.isInteger(fid) ||
                        fid <= 0
                      ) {

                        return "";

                      }


                      const selecionado =

                        editando &&

                        Number(
                          declaracao.funcionario_id
                        ) === fid

                          ? "selected"

                          : "";


                      return `

                        <option
                          value="${fid}"
                          ${selecionado}
                        >

                          ${escaparDeclaracao(
                            funcionario.nome_completo
                          )}

                          —

                          ${escaparDeclaracao(
                            funcionario.matricula ||
                            ""
                          )}

                        </option>

                      `;

                    }
                  ).join("")}

                </select>

              </div>


              <div class="field">

                <label for="tipoDeclaracao">
                  Tipo de declaração *
                </label>


                <select
                  id="tipoDeclaracao"
                  class="input"
                  required
                >

                  <option
                    value="horas"
                    ${
                      editando &&
                      declaracao.tipo === "horas"
                        ? "selected"
                        : ""
                    }
                  >
                    Declaração de Horas
                  </option>


                  <option
                    value="dias"
                    ${
                      editando &&
                      declaracao.tipo === "dias"
                        ? "selected"
                        : ""
                    }
                  >
                    Declaração de Dias
                  </option>

                </select>

              </div>

            </div>


            <div id="camposDeclaracao"></div>


            <div class="field">

              <label for="observacoesDeclaracao">
                Observações
              </label>


              <textarea
                id="observacoesDeclaracao"
                class="input"
                rows="3"
                placeholder="Informações adicionais..."
              >${escaparDeclaracao(
                declaracao?.observacoes ||
                declaracao?.descricao ||
                ""
              )}</textarea>

            </div>


            <div class="field">

              <label for="arquivoDeclaracao">

                ${
                  editando
                    ? "Substituir declaração (opcional)"
                    : "Anexar declaração"
                }

              </label>


              <input
                type="file"
                id="arquivoDeclaracao"
                class="input-file"
                accept=".pdf,.jpg,.jpeg,.png"
              >


              <small
                style="
                  display:block;
                  margin-top:6px;
                  color:#666;
                "
              >

                Formatos aceitos:
                PDF, JPG, JPEG e PNG.
                Máximo: 10MB.

              </small>


              ${
                declaracao?.arquivo_url

                  ?

                  `

                  <p
                    style="margin-top:10px;"
                  >

                    <a
                      href="${declaracao.arquivo_url}"
                      target="_blank"
                      class="badge badge-hours"
                      style="text-decoration:none;"
                    >

                      📎 Visualizar Anexo Atual

                    </a>

                  </p>

                  `

                  :

                  ""

              }

            </div>


            <div class="form-actions">

              <a
                href="declaracoes.html"
                class="btn btn-secondary"
              >
                Cancelar
              </a>


              <button
                type="submit"
                class="btn btn-primary"
              >

                ${
                  editando
                    ? "Salvar Alterações"
                    : "Salvar declaração"
                }

              </button>

            </div>


          </form>

        </div>

        `
      );


      this.configurarFormulario(
        declaracao
      );


    } catch (erro) {

      console.error(
        "Erro ao carregar formulário:",
        erro
      );

      App.toast(
        "Erro ao carregar o formulário.",
        "danger"
      );

    }

  },


  configurarFormulario(
    declaracao
  ) {

    const tipo =
      document.getElementById(
        "tipoDeclaracao"
      );


    const campos =
      document.getElementById(
        "camposDeclaracao"
      );


    const renderizar =
      () => {


        if (
          tipo.value === "horas"
        ) {

          campos.innerHTML = `

            <div class="field">

              <label for="dataDeclaracao">
                Data *
              </label>

              <input
                type="date"
                id="dataDeclaracao"
                class="input"
                value="${
                  declaracao?.data ||
                  ""
                }"
                required
              >

            </div>


            <div class="field">

              <label for="horaInicialDeclaracao">
                Horário inicial
              </label>

              <input
                type="time"
                id="horaInicialDeclaracao"
                class="input"
                value="${
                  declaracao?.hora_inicial ||
                  ""
                }"
              >

            </div>


            <div class="field">

              <label for="horaFinalDeclaracao">
                Horário final
              </label>

              <input
                type="time"
                id="horaFinalDeclaracao"
                class="input"
                value="${
                  declaracao?.hora_final ||
                  ""
                }"
              >

            </div>


            <div class="field">

              <label for="quantidadeHorasDeclaracao">
                Quantidade de horas
              </label>

              <input
                type="number"
                id="quantidadeHorasDeclaracao"
                class="input"
                min="0"
                step="0.5"
                value="${
                  declaracao?.quantidade_horas ??
                  ""
                }"
              >

            </div>

          `;

        } else {

          campos.innerHTML = `

            <div class="field">

              <label for="dataInicialDeclaracao">
                Data inicial *
              </label>

              <input
                type="date"
                id="dataInicialDeclaracao"
                class="input"
                value="${
                  declaracao?.data_inicio ||
                  declaracao?.data_inicial ||
                  declaracao?.data ||
                  ""
                }"
                required
              >

            </div>


            <div class="field">

              <label for="dataFinalDeclaracao">
                Data final
              </label>

              <input
                type="date"
                id="dataFinalDeclaracao"
                class="input"
                value="${
                  declaracao?.data_fim ||
                  declaracao?.data_final ||
                  ""
                }"
              >

            </div>


            <div class="field">

              <label for="quantidadeDiasDeclaracao">
                Quantidade de dias
              </label>

              <input
                type="number"
                id="quantidadeDiasDeclaracao"
                class="input"
                min="1"
                step="1"
                value="${
                  declaracao?.quantidade_dias ??
                  ""
                }"
              >

            </div>

          `;

        }


        const campoData =

          document.getElementById(
            "dataDeclaracao"
          )

          ||

          document.getElementById(
            "dataInicialDeclaracao"
          );


        if (
          campoData &&
          !campoData.value
        ) {

          campoData.value =
            new Date()
              .toISOString()
              .slice(0, 10);

        }

      };


    tipo.addEventListener(
      "change",
      renderizar
    );


    renderizar();


    document
      .getElementById(
        "formDeclaracao"
      )
      .addEventListener(
        "submit",
        evento =>
          this.salvar(
            evento,
            declaracao
          )
      );

  },


  /* ===================================================
     SALVAR
  =================================================== */

  async salvar(
    evento,
    declaracaoAntiga
  ) {

    evento.preventDefault();


    const select =
      document.getElementById(
        "funcionarioDeclaracao"
      );


    /*
      CORREÇÃO PRINCIPAL:
      pega DIRETAMENTE o ID numérico
      da tabela funcionarios.
    */

    const funcionarioId =
      Number(
        select.value
      );


    if (
      !Number.isInteger(
        funcionarioId
      ) ||
      funcionarioId <= 0
    ) {

      App.toast(
        "Selecione um funcionário válido.",
        "danger"
      );

      console.error(
        "ID do funcionário:",
        select.value
      );

      return;

    }


    const tipo =
      document.getElementById(
        "tipoDeclaracao"
      ).value;


    const observacoes =
      document.getElementById(
        "observacoesDeclaracao"
      ).value || "";


    const arquivoInput =
      document.getElementById(
        "arquivoDeclaracao"
      );


    const botao =
      evento.target.querySelector(
        'button[type="submit"]'
      );


    const textoOriginal =
      botao.textContent;


    botao.disabled =
      true;


    try {


      /*
        Mantém os dados do anexo antigo.
      */

      let arquivoUrl =
        declaracaoAntiga?.arquivo_url ||
        null;


      let arquivoNome =
        declaracaoAntiga?.arquivo_nome ||
        null;


      let tipoArquivo =
        declaracaoAntiga?.tipo_arquivo ||
        null;


      let tamanhoArquivo =
        Number(
          declaracaoAntiga?.tamanho_arquivo ||
          0
        );


      const arquivoAntigo =
        declaracaoAntiga?.arquivo_url ||
        null;


      /*
        UPLOAD DO NOVO ARQUIVO
      */

      if (

        arquivoInput &&

        arquivoInput.files &&

        arquivoInput.files.length > 0

      ) {

        botao.textContent =
          "Enviando arquivo...";


        const resultado =
          await uploadArquivoDeclaracao(

            arquivoInput.files[0]

          );


        arquivoUrl =
          resultado.url;


        arquivoNome =
          resultado.nome;


        tipoArquivo =
          resultado.tipo;


        tamanhoArquivo =
          resultado.tamanho;

      }


      /*
        OBJETO FINAL PARA O SUPABASE
      */

      const dados = {

        funcionario_id:
          funcionarioId,

        tipo:
          tipo,

        data:
          null,

        data_inicio:
          null,

        data_fim:
          null,

        data_inicial:
          null,

        data_final:
          null,

        hora_inicial:
          null,

        hora_final:
          null,

        quantidade_horas:
          0,

        quantidade_dias:
          0,

        observacoes:
          observacoes || null,

        descricao:
          observacoes || null,

        arquivo_url:
          arquivoUrl,

        arquivo_nome:
          arquivoNome,

        tipo_arquivo:
          tipoArquivo,

        tamanho_arquivo:
          tamanhoArquivo

      };


      /*
        DECLARAÇÃO DE HORAS
      */

      if (
        tipo === "horas"
      ) {

        dados.data =
          document.getElementById(
            "dataDeclaracao"
          ).value;


        dados.hora_inicial =
          document.getElementById(
            "horaInicialDeclaracao"
          ).value ||
          null;


        dados.hora_final =
          document.getElementById(
            "horaFinalDeclaracao"
          ).value ||
          null;


        dados.quantidade_horas =
          Number(
            document.getElementById(
              "quantidadeHorasDeclaracao"
            ).value
          ) || 0;

      }


      /*
        DECLARAÇÃO DE DIAS
      */

      else {

        const dataInicial =
          document.getElementById(
            "dataInicialDeclaracao"
          ).value;


        const dataFinal =
          document.getElementById(
            "dataFinalDeclaracao"
          ).value ||
          dataInicial;


        dados.data =
          dataInicial;


        dados.data_inicio =
          dataInicial;


        dados.data_fim =
          dataFinal;


        dados.data_inicial =
          dataInicial;


        dados.data_final =
          dataFinal;


        dados.quantidade_dias =
          Number(
            document.getElementById(
              "quantidadeDiasDeclaracao"
            ).value
          ) || 1;

      }


      console.log(
        "DADOS DA DECLARAÇÃO:",
        dados
      );


      botao.textContent =
        "Salvando...";


      /*
        CRIAR
      */

      if (
        !declaracaoAntiga
      ) {

        const resposta =
          await fetch(

            `${DECL_REST_URL}/declaracoes`,

            {

              method:
                "POST",

              headers:
                declaracoesHeaders({

                  Prefer:
                    "return=representation"

                }),

              body:
                JSON.stringify(
                  dados
                )

            }

          );


        if (
          !resposta.ok
        ) {

          /*
            Se o banco rejeitar,
            excluímos o arquivo que
            acabou de ser enviado.
          */

          if (
            arquivoUrl
          ) {

            await excluirArquivoDeclaracao(
              arquivoUrl
            );

          }


          throw new Error(
            await resposta.text()
          );

        }

      }


      /*
        EDITAR
      */

      else {

        const resposta =
          await fetch(

            `${DECL_REST_URL}/declaracoes` +
            `?id=eq.${encodeURIComponent(
              declaracaoAntiga.id
            )}`,

            {

              method:
                "PATCH",

              headers:
                declaracoesHeaders({

                  Prefer:
                    "return=representation"

                }),

              body:
                JSON.stringify(
                  dados
                )

            }

          );


        if (
          !resposta.ok
        ) {

          throw new Error(
            await resposta.text()
          );

        }


        /*
          Se trocou o arquivo,
          apaga o arquivo antigo.
        */

        if (

          arquivoAntigo &&

          arquivoAntigo !==
            arquivoUrl

        ) {

          await excluirArquivoDeclaracao(
            arquivoAntigo
          );

        }

      }


      App.toast(

        declaracaoAntiga

          ? "Declaração atualizada com sucesso!"

          : "Declaração cadastrada com sucesso!"

      );


      setTimeout(
        () => {

          window.location.href =
            "declaracoes.html";

        },
        800
      );


    } catch (erro) {

      console.error(
        "ERRO AO SALVAR DECLARAÇÃO:",
        erro
      );


      App.toast(

        "Erro ao salvar: " +
        (
          erro.message ||
          erro
        ),

        "danger"
      );


      botao.disabled =
        false;


      botao.textContent =
        textoOriginal;

    }

  }

};