/* =====================================================
   CONFIGURAÇÃO DO SUPABASE STORAGE
===================================================== */

const STORAGE_SUPABASE_URL =
  "https://cujlebxqqposqomtfvdk.supabase.co";

const STORAGE_SUPABASE_KEY =
  "sb_publishable_qgZR9bAPNGjYoG-2i_Z5Jg_1Rg3UzBx";

const STORAGE_BUCKET = "declaracoes";


/* =====================================================
   UPLOAD DE ARQUIVO PARA O SUPABASE STORAGE
===================================================== */

async function uploadArquivoSupabase(file) {

  if (!file) {
    return null;
  }

  // Limite de 10 MB
  if (file.size > 10 * 1024 * 1024) {
    throw new Error(
      "O arquivo é muito grande. Escolha um arquivo de até 10MB."
    );
  }


  // Limpa caracteres especiais do nome
  const nomeSeguro = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");


  // Cria nome único
  const nomeArquivo =
    `declaracoes/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}_${nomeSeguro}`;


  const urlUpload =
    `${STORAGE_SUPABASE_URL}/storage/v1/object/` +
    `${STORAGE_BUCKET}/${nomeArquivo}`;


  const resposta = await fetch(urlUpload, {

    method: "POST",

    headers: {

      "apikey": STORAGE_SUPABASE_KEY,

      "Authorization":
        `Bearer ${STORAGE_SUPABASE_KEY}`,

      "Content-Type":
        file.type || "application/octet-stream",

      "x-upsert": "false"

    },

    body: file

  });


  if (!resposta.ok) {

    const erro =
      await resposta.text();

    console.error(
      "Erro ao enviar arquivo:",
      erro
    );

    throw new Error(
      "Erro ao enviar o arquivo para o Supabase: " +
      erro
    );

  }


  // URL pública do arquivo
  const urlPublica =
    `${STORAGE_SUPABASE_URL}/storage/v1/object/public/` +
    `${STORAGE_BUCKET}/${nomeArquivo}`;


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
      nomeArquivo

  };

}


/* =====================================================
   EXCLUIR ARQUIVO DO STORAGE
===================================================== */

async function excluirArquivoSupabase(urlArquivo) {

  if (!urlArquivo) {
    return;
  }


  try {

    const parte =
      `/object/public/${STORAGE_BUCKET}/`;


    const indice =
      urlArquivo.indexOf(parte);


    if (indice === -1) {
      return;
    }


    const caminho =
      urlArquivo.substring(
        indice + parte.length
      );


    const urlDelete =
      `${STORAGE_SUPABASE_URL}/storage/v1/object/` +
      `${STORAGE_BUCKET}/${caminho}`;


    const resposta =
      await fetch(
        urlDelete,
        {

          method:
            "DELETE",

          headers: {

            "apikey":
              STORAGE_SUPABASE_KEY,

            "Authorization":
              `Bearer ${STORAGE_SUPABASE_KEY}`

          }

        }
      );


    if (!resposta.ok) {

      console.warn(
        "Não foi possível excluir o arquivo antigo."
      );

    }

  } catch (erro) {

    console.warn(
      "Erro ao excluir arquivo antigo:",
      erro
    );

  }

}


/* =====================================================
   FUNÇÃO PARA PEGAR O ID DO FUNCIONÁRIO
===================================================== */

function extrairIdFuncionario(f) {

  if (!f || typeof f !== "object") {
    return "";
  }


  const possiveisChaves = [

    "id",

    "funcionarioId",

    "funcionario_id",

    "id_funcionario",

    "codigo",

    "cpf",

    "matricula"

  ];


  for (
    const key of possiveisChaves
  ) {

    if (

      f[key] !== undefined &&

      f[key] !== null &&

      String(f[key]).trim() !== ""

    ) {

      return String(
        f[key]
      );

    }

  }


  return "";

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

        App
          .getAll("declaracoes")
          .catch(() => []),

        App
          .getAll("funcionarios")
          .catch(() => [])

      ]);


      const funcMap = {};


      if (
        Array.isArray(funcionarios)
      ) {

        funcionarios.forEach(f => {

          const fid =
            extrairIdFuncionario(f);


          if (fid) {

            funcMap[fid] =
              f;

          }

        });

      }


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

              ${(declaracoes || []).length}
              no total

            </span>

          </div>


          ${this.renderTable(
            declaracoes || [],
            funcMap
          )}

        </div>

        `

      );


    } catch (err) {

      console.error(
        "Erro ao carregar declarações:",
        err
      );


      App.toast(

        "Erro ao carregar dados: " +
        (err.message || err),

        "danger"

      );

    }

  },


  renderTable(
    list,
    funcMap
  ) {

    if (
      !list ||
      !list.length
    ) {

      return `

        <div class="empty">

          <strong>
            Nenhuma declaração encontrada
          </strong>

          <p>
            Clique em "+ Nova Declaração"
            para cadastrar.
          </p>

        </div>

      `;

    }


    const rows =
      [...list].sort(
        (a, b) =>
          String(b.id)
            .localeCompare(
              String(a.id)
            )
      );


    return `

      <div class="table-wrap">

        <table>

          <thead>

            <tr>

              <th>ID</th>

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

              <th class="no-print">
                Ações
              </th>

            </tr>

          </thead>


          <tbody>

            ${rows.map(d => {


              const fKey =
                String(
                  d.funcionarioId || ""
                );


              const f =
                funcMap[fKey];


              const isHoras =
                d.tipo === "horas";


              const dataInicial =
                d.dataInicial ||
                d.data;


              const dataFinal =
                d.dataFinal ||
                dataInicial;


              const periodo =
                isHoras

                  ? App.formatDate(
                      d.data
                    )

                  : `${App.formatDate(
                      dataInicial
                    )} até ${App.formatDate(
                      dataFinal
                    )}`;


              const qtd =
                isHoras

                  ? `${d.quantidadeHoras ?? 0}h`

                  : `${d.quantidadeDias ?? 0} dia(s)`;


              const anexo =
                d.arquivo;


              return `

                <tr>

                  <td>

                    <code>
                      #${d.id}
                    </code>

                  </td>


                  <td>

                    <strong>

                      ${App.escapeHTML(

                        f?.nome ||

                        "Funcionário não encontrado"

                      )}

                    </strong>

                  </td>


                  <td>

                    <span class="badge ${
                      isHoras
                        ? "badge-hours"
                        : "badge-days"
                    }">

                      ${
                        isHoras
                          ? "Horas"
                          : "Dias"
                      }

                    </span>

                  </td>


                  <td>

                    ${periodo}

                  </td>


                  <td>

                    ${qtd}

                  </td>


                  <td>

                    ${
                      anexo

                        ? `

                          <a

                            href="${anexo}"

                            target="_blank"

                            class="badge badge-hours"

                            style="
                              text-decoration:none;
                            "

                          >

                            📎 Ver Anexo

                          </a>

                        `

                        : `

                          <span
                            style="
                              color:#888;
                            "
                          >

                            Sem anexo

                          </span>

                        `
                    }

                  </td>


                  <td>

                    ${App.escapeHTML(

                      d.observacoes || "—"

                    )}

                  </td>


                  <td class="no-print">


                    <a

                      href="nova-declaracao.html?id=${d.id}"

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
                        DeclaracoesPage.deleteItem(
                          '${d.id}'
                        )
                      "

                    >

                      Excluir

                    </button>


                  </td>


                </tr>

              `;

            }).join("")}


          </tbody>

        </table>

      </div>

    `;

  },


  async deleteItem(id) {

    if (

      !confirm(

        "Tem certeza que deseja excluir esta declaração?"

      )

    ) {

      return;

    }


    try {

      const declaracao =
        await App.get(
          "declaracoes",
          id
        );


      // Exclui o arquivo do Storage
      if (
        declaracao?.arquivo
      ) {

        await excluirArquivoSupabase(
          declaracao.arquivo
        );

      }


      // Exclui a declaração do banco
      await App.remove(

        "declaracoes",

        id

      );


      App.toast(
        "Declaração excluída com sucesso!"
      );


      this.init();


    } catch (err) {

      console.error(err);


      App.toast(

        "Erro ao excluir: " +
        (err.message || err),

        "danger"

      );

    }

  }

};


/* =====================================================
   NOVA DECLARAÇÃO
===================================================== */

const NovaDeclaracaoPage = {


  funcionariosLista: [],


  async init() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    const id =
      params.get("id");


    try {


      this.funcionariosLista =

        await App
          .getAll("funcionarios")
          .catch(() => []);


      let decl =
        null;


      if (id) {

        decl =

          await App
            .get(
              "declaracoes",
              id
            )
            .catch(() => null);

      }


      const isEdit =
        !!decl;


      const funcIdAtual =
        String(
          decl?.funcionarioId || ""
        );


      const anexoAtual =
        decl?.arquivo || null;


      App.layout(


        isEdit

          ? "Editar Declaração"

          : "Nova Declaração",


        isEdit

          ? "Atualização dos dados da declaração"

          : "Lançamento e anexação do documento",


        `

        <div class="card panel">


          <form

            id="declForm"

            class="form"

          >


            <div class="grid-2">


              <div class="field">


                <label
                  for="funcionarioSelect"
                >

                  Funcionário *

                </label>


                <select

                  id="funcionarioSelect"

                  class="input"

                  required

                >


                  <option value="">

                    Selecione um funcionário...

                  </option>


                  ${this.funcionariosLista.map(
                    (f, idx) => {


                      const realId =
                        extrairIdFuncionario(f);


                      const selected =

                        decl &&

                        funcIdAtual === realId

                          ? "selected"

                          : "";


                      const nomeStr =
                        f.nome ||
                        "Funcionário";


                      const matStr =
                        f.matricula ||
                        "000";


                      return `

                        <option

                          value="${realId}"

                          data-index="${idx}"

                          ${selected}

                        >

                          ${App.escapeHTML(
                            nomeStr
                          )}

                          —

                          ${App.escapeHTML(
                            matStr
                          )}

                        </option>

                      `;

                    }
                  ).join("")}


                </select>


              </div>


              <div class="field">


                <label for="tipo">

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
                      decl &&
                      decl.tipo === "horas"

                        ? "selected"

                        : ""
                    }

                  >

                    Declaração de Horas

                  </option>


                  <option

                    value="dias"

                    ${
                      decl &&
                      decl.tipo === "dias"

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
              id="camposDinamicos"
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

                placeholder="
                  Informações adicionais...
                "

              >${App.escapeHTML(
                decl?.observacoes || ""
              )}</textarea>


            </div>


            <div class="field">


              <label
                for="arquivo"
              >

                ${
                  isEdit

                    ? "Substituir declaração (opcional)"

                    : "Anexar declaração"
                }

              </label>


              <input

                type="file"

                id="arquivo"

                class="input-file"

                accept="
                  .pdf,
                  image/jpeg,
                  image/png,
                  image/jpg
                "

              >


              <small
                style="
                  display:block;
                  margin-top:6px;
                  color:#666;
                "
              >

                Formatos aceitos:
                PDF, JPG e PNG.
                Máximo: 10MB.

              </small>


              ${
                anexoAtual

                  ? `

                    <p
                      style="
                        margin-top:10px;
                      "
                    >

                      <a

                        href="${anexoAtual}"

                        target="_blank"

                        class="
                          badge
                          badge-hours
                        "

                        style="
                          text-decoration:none;
                        "

                      >

                        📎 Visualizar Anexo Atual

                      </a>

                    </p>

                  `

                  : ""
              }


            </div>


            <div class="form-actions">


              <a

                href="declaracoes.html"

                class="
                  btn
                  btn-secondary
                "

              >

                Cancelar

              </a>


              <button

                type="submit"

                class="
                  btn
                  btn-primary
                "

              >

                ${
                  isEdit

                    ? "Salvar Alterações"

                    : "Salvar declaração"
                }

              </button>


            </div>


          </form>


        </div>

        `

      );


      this.bindEvents(
        decl
      );


    } catch (err) {

      console.error(err);


      App.toast(

        "Erro ao carregar formulário: " +
        (err.message || err),

        "danger"

      );

    }

  },


  bindEvents(decl) {


    const tipo =
      document.getElementById(
        "tipo"
      );


    const campos =
      document.getElementById(
        "camposDinamicos"
      );


    const renderCampos =
      () => {


        if (
          tipo.value === "horas"
        ) {


          const hInicial =
            decl?.horaInicial || "";


          const hFinal =
            decl?.horaFinal || "";


          const qHoras =
            decl?.quantidadeHoras ?? "";


          campos.innerHTML = `


            <div class="field">


              <label for="data">

                Data *

              </label>


              <input

                type="date"

                id="data"

                class="input"

                value="${decl?.data || ""}"

                required

              >


            </div>


            <div class="field">


              <label
                for="horaInicial"
              >

                Horário inicial

              </label>


              <input

                type="time"

                id="horaInicial"

                class="input"

                value="${hInicial}"

              >


            </div>


            <div class="field">


              <label
                for="horaFinal"
              >

                Horário final

              </label>


              <input

                type="time"

                id="horaFinal"

                class="input"

                value="${hFinal}"

              >


            </div>


            <div class="field">


              <label
                for="quantidadeHoras"
              >

                Quantidade de horas

              </label>


              <input

                type="number"

                id="quantidadeHoras"

                class="input"

                step="0.5"

                min="0"

                value="${qHoras}"

                placeholder="Ex: 2"

              >


            </div>

          `;


        } else {


          const dInicial =

            decl?.dataInicial ||

            decl?.data ||

            "";


          const dFinal =

            decl?.dataFinal ||

            "";


          const qDias =

            decl?.quantidadeDias ??

            "";


          campos.innerHTML = `


            <div class="field">


              <label
                for="dataInicial"
              >

                Data inicial *

              </label>


              <input

                type="date"

                id="dataInicial"

                class="input"

                value="${dInicial}"

                required

              >


            </div>


            <div class="field">


              <label
                for="dataFinal"
              >

                Data final

              </label>


              <input

                type="date"

                id="dataFinal"

                class="input"

                value="${dFinal}"

              >


            </div>


            <div class="field">


              <label
                for="quantidadeDias"
              >

                Quantidade de dias

              </label>


              <input

                type="number"

                id="quantidadeDias"

                class="input"

                step="1"

                min="1"

                value="${qDias}"

                placeholder="Ex: 1"

              >


            </div>

          `;

        }


        const inputData =

          document.getElementById(
            "data"
          )

          ||

          document.getElementById(
            "dataInicial"
          );


        if (

          inputData &&

          !inputData.value

        ) {

          inputData.value =

            new Date()

              .toISOString()

              .slice(0, 10);

        }

      };


    tipo.addEventListener(

      "change",

      renderCampos

    );


    renderCampos();


    document

      .getElementById(
        "declForm"
      )

      .addEventListener(

        "submit",

        e => this.save(
          e,
          decl
        )

      );

  },


  async save(
    e,
    declAntiga
  ) {


    e.preventDefault();


    const selectEl =
      document.getElementById(
        "funcionarioSelect"
      );


    let rawFuncId =

      selectEl

        ? selectEl.value

        : "";


    if (

      !rawFuncId &&

      selectEl &&

      selectEl.selectedIndex >= 0

    ) {


      const selectedOption =

        selectEl.options[
          selectEl.selectedIndex
        ];


      const idx =

        selectedOption.getAttribute(
          "data-index"
        );


      if (

        idx !== null &&

        this.funcionariosLista[idx]

      ) {

        rawFuncId =

          extrairIdFuncionario(

            this.funcionariosLista[idx]

          );

      }

    }


    if (

      !rawFuncId ||

      String(rawFuncId)
        .trim() === ""

    ) {


      App.toast(

        "Selecione um funcionário válido.",

        "danger"

      );


      return;

    }


    const btn =

      e.target.querySelector(

        'button[type="submit"]'

      );


    btn.disabled =
      true;


    const textoOriginal =
      btn.textContent;


    try {


      const tipo =

        document

          .getElementById("tipo")

          .value;


      const fileInput =

        document.getElementById(
          "arquivo"
        );


      // Mantém o arquivo antigo
      let anexoData =

        declAntiga?.arquivo ||

        null;


      let nomeArquivo =

        declAntiga?.nomeArquivo ||

        null;


      let tipoArquivo =

        declAntiga?.tipoArquivo ||

        null;


      let tamanhoArquivo =

        declAntiga?.tamanhoArquivo ||

        0;


      let arquivoAntigo =
        null;


      /* =============================================
         ENVIA O NOVO ARQUIVO PARA O STORAGE
      ============================================= */

      if (

        fileInput &&

        fileInput.files.length > 0

      ) {


        const file =

          fileInput.files[0];


        arquivoAntigo =

          declAntiga?.arquivo ||

          null;


        btn.textContent =
          "Enviando arquivo...";


        const arquivoEnviado =

          await uploadArquivoSupabase(
            file
          );


        anexoData =

          arquivoEnviado.url;


        nomeArquivo =

          arquivoEnviado.nome;


        tipoArquivo =

          arquivoEnviado.tipo;


        tamanhoArquivo =

          arquivoEnviado.tamanho;

      }


      const obs =

        document

          .getElementById(
            "observacoes"
          )

          .value ||

        "";


      /* =============================================
         PAYLOAD
      ============================================= */

      const payload = {


        funcionarioId:

          String(
            rawFuncId
          ),


        tipo:

          tipo,


        observacoes:

          obs,


        arquivo:

          anexoData,


        nomeArquivo:

          nomeArquivo,


        tipoArquivo:

          tipoArquivo,


        tamanhoArquivo:

          tamanhoArquivo

      };


      if (
        declAntiga?.id
      ) {

        payload.id =
          declAntiga.id;

      }


      /* =============================================
         DECLARAÇÃO DE HORAS
      ============================================= */

      if (
        tipo === "horas"
      ) {


        payload.data =

          document

            .getElementById(
              "data"
            )

            .value;


        payload.horaInicial =

          document

            .getElementById(
              "horaInicial"
            )

            .value ||

          null;


        payload.horaFinal =

          document

            .getElementById(
              "horaFinal"
            )

            .value ||

          null;


        payload.quantidadeHoras =

          parseFloat(

            document

              .getElementById(
                "quantidadeHoras"
              )

              .value

          )

          ||

          0;


        payload.dataInicial =
          null;

        payload.dataFinal =
          null;

        payload.quantidadeDias =
          0;

      }


      /* =============================================
         DECLARAÇÃO DE DIAS
      ============================================= */

      else {


        const dIni =

          document

            .getElementById(
              "dataInicial"
            )

            .value;


        const dFim =

          document

            .getElementById(
              "dataFinal"
            )

            .value ||

          dIni;


        payload.dataInicial =
          dIni;


        payload.dataFinal =
          dFim;


        payload.data =
          dIni;


        payload.quantidadeDias =

          parseInt(

            document

              .getElementById(
                "quantidadeDias"
              )

              .value,

            10

          )

          ||

          1;


        payload.horaInicial =
          null;

        payload.horaFinal =
          null;

        payload.quantidadeHoras =
          0;

      }


      console.log(
        "Payload enviado:",
        payload
      );


      btn.textContent =
        "Salvando...";


      /* =============================================
         SALVAR NO SUPABASE
      ============================================= */

      if (
        declAntiga?.id
      ) {


        await App.put(

          "declaracoes",

          payload

        );


        /* =========================================
           SE TROCOU O ARQUIVO,
           EXCLUI O ARQUIVO ANTIGO
        ========================================= */

        if (

          arquivoAntigo &&

          arquivoAntigo !== anexoData

        ) {

          await excluirArquivoSupabase(
            arquivoAntigo
          );

        }


        App.toast(

          "Declaração atualizada com sucesso!"

        );


      } else {


        await App.add(

          "declaracoes",

          payload

        );


        App.toast(

          "Declaração cadastrada com sucesso!"

        );

      }


      setTimeout(() => {

        window.location.href =
          "declaracoes.html";

      }, 800);


    } catch (err) {


      console.error(

        "Erro ao salvar declaração:",

        err

      );


      App.toast(

        "Erro ao salvar: " +

        (err.message || err),

        "danger"

      );


      btn.disabled =
        false;


      btn.textContent =
        textoOriginal;

    }

  }

};