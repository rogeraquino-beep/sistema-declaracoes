/* =====================================================
   CONFIGURAÇÃO
===================================================== */

const SUPABASE_URL =
  "https://cujlebxqqposqomtfvdk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_qgZR9bAPNGjYoG-2i_Z5Jg_1Rg3UzBx";

const BUCKET =
  "declaracoes";

const REST_URL =
  `${SUPABASE_URL}/rest/v1`;

const STORAGE_URL =
  `${SUPABASE_URL}/storage/v1`;


/* =====================================================
   CABEÇALHOS
===================================================== */

function supabaseHeaders(extra = {}) {

  return {

    apikey:
      SUPABASE_KEY,

    Authorization:
      `Bearer ${SUPABASE_KEY}`,

    "Content-Type":
      "application/json",

    ...extra

  };

}


/* =====================================================
   UPLOAD DO ARQUIVO
===================================================== */

async function uploadArquivo(file) {

  if (!file) {

    return null;

  }


  if (
    file.size >
    10 * 1024 * 1024
  ) {

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
    !tiposPermitidos.includes(
      file.type
    )
  ) {

    throw new Error(
      "Envie somente PDF, JPG, JPEG ou PNG."
    );

  }


  const nomeSeguro =
    file.name
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );


  const caminho =
    `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}_${nomeSeguro}`;


  const resposta =
    await fetch(

      `${STORAGE_URL}/object/${BUCKET}/${caminho}`,

      {

        method:
          "POST",

        headers: {

          ...supabaseHeaders(),

          "Content-Type":
            file.type,

          "x-upsert":
            "false"

        },

        body:
          file

      }

    );


  if (
    !resposta.ok
  ) {

    const erro =
      await resposta.text();

    console.error(
      "Erro no Storage:",
      erro
    );

    throw new Error(
      "Não foi possível enviar o arquivo."
    );

  }


  const urlPublica =

    `${STORAGE_URL}/object/public/` +
    `${BUCKET}/${caminho}`;


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
   EXCLUIR ARQUIVO
===================================================== */

async function excluirArquivo(url) {

  if (!url) {

    return;

  }


  try {

    const marcador =
      `/object/public/${BUCKET}/`;


    const posicao =
      url.indexOf(marcador);


    if (
      posicao === -1
    ) {

      return;

    }


    const caminho =
      url.substring(
        posicao +
        marcador.length
      );


    await fetch(

      `${STORAGE_URL}/object/${BUCKET}/${caminho}`,

      {

        method:
          "DELETE",

        headers:
          supabaseHeaders()

      }

    );

  } catch (
    erro
  ) {

    console.warn(
      "Erro ao excluir arquivo:",
      erro
    );

  }

}


/* =====================================================
   FORMATAR DATA
===================================================== */

function formatarData(data) {

  if (!data) {

    return "—";

  }


  const partes =
    String(data)
      .slice(0, 10)
      .split("-");


  if (
    partes.length !== 3
  ) {

    return data;

  }


  return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


/* =====================================================
   ESCAPAR HTML
===================================================== */

function esc(value = "") {

  return String(value)

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
   CARREGAR FUNCIONÁRIOS
===================================================== */

async function carregarFuncionarios() {

  const resposta =
    await fetch(

      `${REST_URL}/funcionarios?select=id,nome_completo,matricula&order=nome_completo.asc`,

      {

        headers:
          supabaseHeaders()

      }

    );


  if (
    !resposta.ok
  ) {

    throw new Error(
      await resposta.text()
    );

  }


  return await resposta.json();

}


/* =====================================================
   CARREGAR DECLARAÇÕES
===================================================== */

async function carregarDeclaracoes() {

  const resposta =
    await fetch(

      `${REST_URL}/declaracoes?select=*&order=id.desc`,

      {

        headers:
          supabaseHeaders()

      }

    );


  if (
    !resposta.ok
  ) {

    throw new Error(
      await resposta.text()
    );

  }


  return await resposta.json();

}


/* =====================================================
   CARREGAR UMA DECLARAÇÃO
===================================================== */

async function carregarDeclaracao(id) {

  const resposta =
    await fetch(

      `${REST_URL}/declaracoes?id=eq.${encodeURIComponent(id)}&select=*`,

      {

        headers:
          supabaseHeaders()

      }

    );


  if (
    !resposta.ok
  ) {

    throw new Error(
      await resposta.text()
    );

  }


  const dados =
    await resposta.json();


  return dados[0] || null;

}


/* =====================================================
   PÁGINA DE DECLARAÇÕES
===================================================== */

const DeclaracoesPage = {

  async init() {

    try {

      const [
        declaracoes,
        funcionarios
      ] = await Promise.all([

        carregarDeclaracoes(),

        carregarFuncionarios()

      ]);


      const funcionariosMap =
        Object.fromEntries(

          funcionarios.map(
            f => [
              String(f.id),
              f
            ]
          )

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

              </div>

              `

              :

              `

              <div class="table-wrap">

                <table>

                  <thead>

                    <tr>

                      <th>
                        ID
                      </th>

                      <th>
                        Funcionário
                      </th>

                      <th>
                        Tipo
                      </th>

                      <th>
                        Data / Período
                      </th>

                      <th>
                        Qtd.
                      </th>

                      <th>
                        Anexo
                      </th>

                      <th>
                        Observações
                      </th>

                      <th>
                        Ações
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    ${

                      declaracoes.map(

                        d => {

                          const funcionario =

                            funcionariosMap[
                              String(
                                d.funcionario_id
                              )
                            ];


                          const horas =
                            d.tipo === "horas";


                          const dataInicial =
                            d.data_inicio ||
                            d.data_inicial ||
                            d.data;


                          const dataFinal =
                            d.data_fim ||
                            d.data_final ||
                            d.data;


                          const periodo =

                            horas

                              ?

                              formatarData(
                                d.data
                              )

                              :

                              `${formatarData(
                                dataInicial
                              )} até ${formatarData(
                                dataFinal
                              )}`;


                          const quantidade =

                            horas

                              ?

                              `${Number(
                                d.quantidade_horas || 0
                              )}h`

                              :

                              `${Number(
                                d.quantidade_dias || 0
                              )} dia(s)`;


                          return `

                            <tr>

                              <td>
                                #${d.id}
                              </td>


                              <td>

                                <strong>

                                  ${esc(
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
                                  d.arquivo_url

                                    ?

                                    `

                                    <a
                                      href="${d.arquivo_url}"
                                      target="_blank"
                                      class="badge badge-hours"
                                      style="text-decoration:none;"
                                    >

                                      📎 Ver Anexo

                                    </a>

                                    `

                                    :

                                    `<span style="color:#888;">
                                      Sem anexo
                                    </span>`

                                }

                              </td>


                              <td>

                                ${esc(
                                  d.observacoes ||
                                  d.descricao ||
                                  "—"
                                )}

                              </td>


                              <td>

                                <a
                                  href="nova-declaracao.html?id=${d.id}"
                                  class="btn btn-secondary btn-sm"
                                >
                                  Editar
                                </a>


                                <button
                                  class="btn btn-danger btn-sm"
                                  onclick="
                                    DeclaracoesPage.excluir(
                                      '${d.id}'
                                    )
                                  "
                                >
                                  Excluir
                                </button>

                              </td>

                            </tr>

                          `;

                        }

                      ).join("")

                    }

                  </tbody>

                </table>

              </div>

              `

          }

        </div>

        `

      );

    } catch (
      erro
    ) {

      console.error(
        erro
      );

      App.toast(
        "Erro ao carregar declarações.",
        "danger"
      );

    }

  },


  async excluir(id) {

    if (
      !confirm(
        "Deseja excluir esta declaração?"
      )
    ) {

      return;

    }


    try {

      const declaracao =
        await carregarDeclaracao(
          id
        );


      if (
        declaracao?.arquivo_url
      ) {

        await excluirArquivo(
          declaracao.arquivo_url
        );

      }


      const resposta =
        await fetch(

          `${REST_URL}/declaracoes?id=eq.${encodeURIComponent(id)}`,

          {

            method:
              "DELETE",

            headers:
              supabaseHeaders()

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

    } catch (
      erro
    ) {

      console.error(
        erro
      );

      App.toast(
        "Erro ao excluir declaração.",
        "danger"
      );

    }

  }

};


/* =====================================================
   NOVA / EDITAR DECLARAÇÃO
===================================================== */

const NovaDeclaracaoPage = {

  funcionarios: [],


  async init() {

    const parametros =
      new URLSearchParams(
        window.location.search
      );


    const id =
      parametros.get("id");


    try {

      this.funcionarios =
        await carregarFuncionarios();


      let declaracao =
        null;


      if (id) {

        declaracao =
          await carregarDeclaracao(
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
                  for="funcionario"
                >
                  Funcionário *
                </label>


                <select
                  id="funcionario"
                  class="input"
                  required
                >

                  <option value="">
                    Selecione um funcionário...
                  </option>


                  ${

                    this.funcionarios

                      .map(

                        funcionario => {

                          const idFuncionario =
                            Number(
                              funcionario.id
                            );


                          if (
                            !Number.isInteger(
                              idFuncionario
                            )
                          ) {

                            return "";

                          }


                          const selecionado =

                            editando &&

                            Number(
                              declaracao.funcionario_id
                            ) ===
                            idFuncionario

                              ? "selected"

                              : "";


                          return `

                            <option
                              value="${idFuncionario}"
                              ${selecionado}
                            >

                              ${esc(
                                funcionario.nome_completo
                              )}

                              —
                              ${esc(
                                funcionario.matricula || ""
                              )}

                            </option>

                          `;

                        }

                      )
                      .join("")

                  }

                </select>

              </div>


              <div class="field">

                <label
                  for="tipo"
                >
                  Tipo de declaração *
                </label>


                <select
                  id="tipo"
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


            <div
              id="campos"
            ></div>


            <div class="field">

              <label
                for="observacoes"
              >
                Observações
              </label>


              <textarea
                id="observacoes"
                class="input"
                rows="3"
                placeholder="Informações adicionais..."
              >${esc(
                declaracao?.observacoes ||
                declaracao?.descricao ||
                ""
              )}</textarea>

            </div>


            <div class="field">

              <label
                for="arquivo"
              >

                ${
                  editando
                    ? "Substituir declaração (opcional)"
                    : "Anexar declaração"
                }

              </label>


              <input
                type="file"
                id="arquivo"
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

                PDF, JPG, JPEG ou PNG.
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


      this.configurarCampos(
        declaracao
      );


    } catch (
      erro
    ) {

      console.error(
        erro
      );

      App.toast(
        "Erro ao abrir declaração.",
        "danger"
      );

    }

  },


  configurarCampos(
    declaracao
  ) {

    const tipo =
      document.getElementById(
        "tipo"
      );

    const campos =
      document.getElementById(
        "campos"
      );


    function renderizar() {

      if (
        tipo.value === "horas"
      ) {

        campos.innerHTML = `

          <div class="field">

            <label for="data">
              Data *
            </label>

            <input
              type="date"
              id="data"
              class="input"
              value="${declaracao?.data || ""}"
              required
            >

          </div>


          <div class="field">

            <label for="horaInicial">
              Horário inicial
            </label>

            <input
              type="time"
              id="horaInicial"
              class="input"
              value="${declaracao?.hora_inicial || ""}"
            >

          </div>


          <div class="field">

            <label for="horaFinal">
              Horário final
            </label>

            <input
              type="time"
              id="horaFinal"
              class="input"
              value="${declaracao?.hora_final || ""}"
            >

          </div>


          <div class="field">

            <label for="quantidadeHoras">
              Quantidade de horas
            </label>

            <input
              type="number"
              id="quantidadeHoras"
              class="input"
              step="0.5"
              min="0"
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

            <label for="dataInicial">
              Data inicial *
            </label>

            <input
              type="date"
              id="dataInicial"
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

            <label for="dataFinal">
              Data final
            </label>

            <input
              type="date"
              id="dataFinal"
              class="input"
              value="${
                declaracao?.data_fim ||
                declaracao?.data_final ||
                ""
              }"
            >

          </div>


          <div class="field">

            <label for="quantidadeDias">
              Quantidade de dias
            </label>

            <input
              type="number"
              id="quantidadeDias"
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
          "data"
        ) ||

        document.getElementById(
          "dataInicial"
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

    }


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
     SALVAR DECLARAÇÃO
  =================================================== */

  async salvar(
    evento,
    declaracaoAntiga
  ) {

    evento.preventDefault();


    const funcionarioSelect =
      document.getElementById(
        "funcionario"
      );


    /*
      AQUI ESTÁ A CORREÇÃO PRINCIPAL.

      Pegamos DIRETAMENTE o value do select
      e convertemos para número.
    */

    const funcionarioId =
      Number(
        funcionarioSelect.value
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

        "ID recebido:",
        funcionarioSelect.value

      );

      return;

    }


    const tipo =
      document.getElementById(
        "tipo"
      ).value;


    const observacoes =
      document.getElementById(
        "observacoes"
      ).value || "";


    const arquivoInput =
      document.getElementById(
        "arquivo"
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
        Mantém anexo antigo
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


      /*
        Se selecionou novo arquivo,
        envia primeiro para o Storage.
      */

      if (

        arquivoInput &&

        arquivoInput.files &&

        arquivoInput.files.length > 0

      ) {

        botao.textContent =
          "Enviando arquivo...";


        const resultado =
          await uploadArquivo(

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
        Montagem dos dados exatamente
        com os nomes da tabela.
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
        HORAS
      */

      if (
        tipo === "horas"
      ) {

        dados.data =
          document.getElementById(
            "data"
          ).value;


        dados.hora_inicial =
          document.getElementById(
            "horaInicial"
          ).value || null;


        dados.hora_final =
          document.getElementById(
            "horaFinal"
          ).value || null;


        dados.quantidade_horas =
          Number(
            document.getElementById(
              "quantidadeHoras"
            ).value
          ) || 0;

      }


      /*
        DIAS
      */

      else {

        const dataInicial =
          document.getElementById(
            "dataInicial"
          ).value;


        const dataFinal =
          document.getElementById(
            "dataFinal"
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
              "quantidadeDias"
            ).value
          ) || 1;

      }


      console.log(
        "DADOS QUE SERÃO ENVIADOS:",
        dados
      );


      botao.textContent =
        "Salvando...";


      /*
        NOVA DECLARAÇÃO
      */

      if (
        !declaracaoAntiga
      ) {

        const resposta =
          await fetch(

            `${REST_URL}/declaracoes`,

            {

              method:
                "POST",

              headers:
                supabaseHeaders({

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

          const erro =
            await resposta.text();


          /*
            Se o banco rejeitou,
            e já enviamos o arquivo,
            tenta excluir o arquivo
            para não deixar lixo.
          */

          if (
            arquivoUrl &&
            !declaracaoAntiga
          ) {

            await excluirArquivo(
              arquivoUrl
            );

          }


          throw new Error(
            erro
          );

        }

      }


      /*
        EDITAR DECLARAÇÃO
      */

      else {

        const id =
          declaracaoAntiga.id;


        const resposta =
          await fetch(

            `${REST_URL}/declaracoes?id=eq.${encodeURIComponent(id)}`,

            {

              method:
                "PATCH",

              headers:
                supabaseHeaders({

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
          Se substituiu o arquivo,
          exclui o antigo.
        */

        if (

          declaracaoAntiga.arquivo_url &&

          declaracaoAntiga.arquivo_url !==
            arquivoUrl

        ) {

          await excluirArquivo(

            declaracaoAntiga.arquivo_url

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


    } catch (
      erro
    ) {

      console.error(
        "ERRO AO SALVAR:",
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