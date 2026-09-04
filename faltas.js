/* =====================================================
   CONTROLE DE FALTAS
   COM RELATÓRIO POR FUNCIONÁRIO
===================================================== */


/* =====================================================
   UTILITÁRIOS
===================================================== */

function escaparFalta(valor = "") {

  return String(valor)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


function normalizarFalta(falta) {

  if (!falta) {
    return {};
  }


  /*
    O app.js transforma os campos do banco para:

    funcionarioId
    data
    tipo
    justificativa
    observacoes

    Mas deixamos compatibilidade também
    com os nomes antigos.
  */

  return {

    id:
      falta.id,

    funcionarioId:
      falta.funcionarioId ??
      falta.funcionario_id ??
      "",

    data:
      falta.data ??
      falta.data_falta ??
      "",

    tipo:
      falta.tipo ??
      falta.motivo ??
      "Falta Injustificada",

    justificativa:
      falta.justificativa ??
      "",

    observacoes:
      falta.observacoes ??
      "",

    createdAt:
      falta.createdAt ??
      falta.created_at ??
      ""

  };

}


function formatarDataFalta(data) {

  if (!data) {
    return "—";
  }


  const partes =
    String(data)
      .slice(0, 10)
      .split("-");


  if (partes.length !== 3) {
    return data;
  }


  return (
    `${partes[2]}/` +
    `${partes[1]}/` +
    `${partes[0]}`
  );

}


/* =====================================================
   PÁGINA DE FALTAS
===================================================== */

const FaltasPage = {

  state: {

    funcionarios: [],

    faltas: []

  },


  async init() {

    try {

      const [
        funcionarios,
        faltas
      ] = await Promise.all([

        App.getAll(
          "funcionarios"
        ),

        App.getAll(
          "faltas"
        )

      ]);


      this.state = {

        funcionarios:
          Array.isArray(
            funcionarios
          )
            ? funcionarios
            : [],

        faltas:

          Array.isArray(
            faltas
          )

            ? faltas.map(
                normalizarFalta
              )

            : []

      };


      this.renderLayout();

      this.bindEvents();

      this.render();

    } catch (erro) {

      console.error(
        "Erro ao carregar faltas:",
        erro
      );


      App.layout(

        "Controle de Faltas",

        "Registre e consulte as faltas dos funcionários.",

        `

        <div
          class="alert alert-danger"
        >

          Não foi possível carregar
          os registros de faltas.

          <br><br>

          ${escaparFalta(
            erro.message || erro
          )}

        </div>

        `

      );

    }

  },


  /* ===================================================
     LAYOUT
  =================================================== */

  renderLayout() {

    App.layout(

      "Controle de Faltas",

      "Registre e consulte as faltas dos funcionários.",

      `

      <style>

        .faltas-toolbar {

          display:flex;

          gap:8px;

          flex-wrap:wrap;

        }


        .faltas-resumo {

          display:grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap:12px;

          margin-bottom:20px;

        }


        .falta-resumo-card {

          background:#fff;

          border:1px solid #e5e7eb;

          border-radius:12px;

          padding:18px;

        }


        .falta-resumo-label {

          font-size:13px;

          color:#6b7280;

          margin-bottom:5px;

        }


        .falta-resumo-valor {

          font-size:26px;

          font-weight:700;

          color:#111827;

        }


        .custom-modal-form {

          display:flex;

          flex-direction:column;

          gap:16px;

          padding:8px 4px;

        }


        .form-row {

          display:grid;

          grid-template-columns:
            1fr 1fr;

          gap:16px;

        }


        .form-field {

          display:flex;

          flex-direction:column;

          gap:6px;

        }


        .form-field label {

          font-size:13px;

          font-weight:600;

          color:#374151;

        }


        .form-field input,

        .form-field select,

        .form-field textarea {

          width:100%;

          padding:10px 14px;

          font-size:14px;

          color:#1f2937;

          background:#f9fafb;

          border:1px solid #d1d5db;

          border-radius:8px;

          outline:none;

          box-sizing:border-box;

        }


        .form-field textarea {

          resize:vertical;

          min-height:80px;

        }


        .relatorio-faltas {

          background:#fff;

          color:#111827;

        }


        .relatorio-cabecalho {

          border-bottom:
            2px solid #1f4b8f;

          padding-bottom:12px;

          margin-bottom:18px;

        }


        .relatorio-funcionario {

          background:#f8fafc;

          border:1px solid #e5e7eb;

          border-radius:10px;

          padding:15px;

          margin-bottom:18px;

        }


        .relatorio-cards {

          display:grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap:10px;

          margin-bottom:20px;

        }


        .relatorio-card {

          border:1px solid #e5e7eb;

          border-radius:10px;

          padding:14px;

          text-align:center;

        }


        .relatorio-card-label {

          font-size:12px;

          color:#6b7280;

        }


        .relatorio-card-value {

          font-size:24px;

          font-weight:700;

          margin-top:4px;

        }


        @media (max-width: 768px) {

          .faltas-resumo {

            grid-template-columns:1fr;

          }


          .relatorio-cards {

            grid-template-columns:1fr;

          }


          .form-row {

            grid-template-columns:1fr;

          }

        }


        @media print {

          body * {

            visibility:hidden;

          }


          #relatorioImpressao,

          #relatorioImpressao * {

            visibility:visible;

          }


          #relatorioImpressao {

            position:absolute;

            left:0;

            top:0;

            width:100%;

            padding:20px;

          }

        }

      </style>


      <div
        class="page-header"
        style="margin-bottom:24px;"
      >

        <div>

          <h2
            style="
              margin:0;
              font-size:24px;
              color:#111827;
            "
          >

            Controle de Faltas

          </h2>


          <p
            style="
              margin:4px 0 0;
              color:#6b7280;
              font-size:14px;
            "
          >

            Registre, consulte e gere relatórios
            de faltas por funcionário.

          </p>

        </div>


        <div
          class="faltas-toolbar no-print"
        >

          <button
            class="btn btn-secondary"
            id="btnRelatorioFaltas"
          >

            📊 Relatório por funcionário

          </button>


          <button
            class="btn btn-primary"
            id="btnNovaFalta"
          >

            ＋ Registrar falta

          </button>

        </div>

      </div>


      <div
        class="faltas-resumo"
      >

        <div
          class="falta-resumo-card"
        >

          <div class="falta-resumo-label">

            Total de faltas

          </div>

          <div
            class="falta-resumo-valor"
            id="totalFaltas"
          >
            0
          </div>

        </div>


        <div
          class="falta-resumo-card"
        >

          <div class="falta-resumo-label">

            Funcionários com faltas

          </div>

          <div
            class="falta-resumo-valor"
            id="funcionariosComFalta"
          >
            0
          </div>

        </div>


        <div
          class="falta-resumo-card"
        >

          <div class="falta-resumo-label">

            Faltas justificadas

          </div>

          <div
            class="falta-resumo-valor"
            id="faltasJustificadas"
          >
            0
          </div>

        </div>

      </div>


      <div class="card panel">

        <div
          class="panel-header"
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:16px;
          "
        >

          <h3
            style="
              margin:0;
              font-size:18px;
            "
          >

            Registros de Faltas

          </h3>


          <span
            class="badge badge-hours"
            id="badgeTotalFaltas"
          >
            0 no total
          </span>

        </div>


        <div
          id="tabelaFaltasContainer"
        ></div>

      </div>

      `

    );

  },


  /* ===================================================
     EVENTOS
  =================================================== */

  bindEvents() {

    document
      .getElementById(
        "btnNovaFalta"
      )
      ?.addEventListener(
        "click",
        () =>
          this.openModalFalta()
      );


    document
      .getElementById(
        "btnRelatorioFaltas"
      )
      ?.addEventListener(
        "click",
        () =>
          this.openModalRelatorio()
      );

  },


  /* ===================================================
     RENDERIZAÇÃO
  =================================================== */

  render() {

    const container =
      document.getElementById(
        "tabelaFaltasContainer"
      );


    if (!container) {
      return;
    }


    const faltas =
      this.state.faltas;


    const funcionarios =
      this.state.funcionarios;


    /*
      Mapa usando ID numérico.
    */

    const mapaFuncionarios =
      Object.fromEntries(

        funcionarios.map(
          funcionario => [

            String(
              funcionario.id
            ),

            funcionario

          ]
        )

      );


    /*
      Resumo
    */

    const funcionariosComFalta =
      new Set(

        faltas.map(
          falta =>
            String(
              falta.funcionarioId
            )
        )

      ).size;


    const faltasJustificadas =
      faltas.filter(

        falta => {

          const tipo =
            String(
              falta.tipo || ""
            ).toLowerCase();


          return (

            tipo.includes(
              "justificada"
            )

            ||

            tipo.includes(
              "atestado"
            )

          );

        }

      ).length;


    document.getElementById(
      "totalFaltas"
    ).textContent =
      faltas.length;


    document.getElementById(
      "funcionariosComFalta"
    ).textContent =
      funcionariosComFalta;


    document.getElementById(
      "faltasJustificadas"
    ).textContent =
      faltasJustificadas;


    document.getElementById(
      "badgeTotalFaltas"
    ).textContent =
      `${faltas.length} no total`;


    if (!faltas.length) {

      container.innerHTML = `

        <div
          class="empty"
        >

          <strong>
            Nenhuma falta registrada
          </strong>

          <p>
            Clique em "Registrar falta"
            para adicionar o primeiro registro.
          </p>

        </div>

      `;

      return;
    }


    const ordenadas =
      [...faltas].sort(
        (a, b) =>

          String(
            b.data || ""
          ).localeCompare(

            String(
              a.data || ""
            )

          )

      );


    container.innerHTML = `

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
                Data
              </th>

              <th>
                Motivo
              </th>

              <th>
                Justificativa / Observação
              </th>

              <th
                style="
                  text-align:right;
                "
              >
                Ações
              </th>

            </tr>

          </thead>


          <tbody>

            ${ordenadas.map(
              falta => {

                const funcionario =
                  mapaFuncionarios[
                    String(
                      falta.funcionarioId
                    )
                  ];


                return `

                  <tr>

                    <td>

                      <code
                        style="
                          background:#f3f4f6;
                          padding:2px 6px;
                          border-radius:4px;
                          font-size:12px;
                        "
                      >
                        #${falta.id}
                      </code>

                    </td>


                    <td>

                      <strong>

                        ${escaparFalta(

                          funcionario?.nome ||

                          funcionario?.nome_completo ||

                          "Funcionário removido"

                        )}

                      </strong>

                    </td>


                    <td>

                      ${formatarDataFalta(
                        falta.data
                      )}

                    </td>


                    <td>

                      <span
                        class="badge badge-days"
                      >

                        ${escaparFalta(
                          falta.tipo ||
                          "Falta"
                        )}

                      </span>

                    </td>


                    <td>

                      ${escaparFalta(

                        falta.justificativa ||

                        falta.observacoes ||

                        "—"

                      )}

                    </td>


                    <td
                      style="
                        text-align:right;
                      "
                    >

                      <button

                        class="
                          btn
                          btn-danger
                          btn-sm
                        "

                        onclick="
                          FaltasPage.excluir(
                            '${falta.id}'
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

    `;

  },


  /* ===================================================
     MODAL NOVA FALTA
  =================================================== */

  openModalFalta() {

    const funcionarios =
      this.state.funcionarios;


    App.openModal({

      title:
        "Registrar falta",


      body:

        `

        <form
          id="formFalta"
          class="custom-modal-form"
        >


          <div
            class="form-field"
          >

            <label
              for="faltaFuncionario"
            >

              Funcionário *

            </label>


            <select
              id="faltaFuncionario"
              required
            >

              <option value="">

                Selecione um funcionário...

              </option>


              ${funcionarios.map(
                funcionario => {

                  const id =
                    funcionario.id;

                  const nome =
                    funcionario.nome ||
                    funcionario.nome_completo ||
                    "Funcionário";


                  return `

                    <option
                      value="${id}"
                    >

                      ${escaparFalta(
                        nome
                      )}

                      ${
                        funcionario.matricula
                          ? ` — ${escaparFalta(
                              funcionario.matricula
                            )}`
                          : ""
                      }

                    </option>

                  `;

                }

              ).join("")}

            </select>

          </div>


          <div
            class="form-row"
          >


            <div
              class="form-field"
            >

              <label
                for="faltaData"
              >

                Data da falta *

              </label>


              <input
                type="date"
                id="faltaData"
                value="${
                  new Date()
                    .toISOString()
                    .slice(0,10)
                }"
                required
              >

            </div>


            <div
              class="form-field"
            >

              <label
                for="faltaMotivo"
              >

                Motivo *

              </label>


              <select
                id="faltaMotivo"
                required
              >

                <option
                  value="Falta Injustificada"
                >
                  Falta Injustificada
                </option>

                <option
                  value="Falta Justificada"
                >
                  Falta Justificada
                </option>

                <option
                  value="Atestado Médico"
                >
                  Atestado Médico
                </option>

                <option
                  value="Licença / Outros"
                >
                  Licença / Outros
                </option>

              </select>

            </div>


          </div>


          <div
            class="form-field"
          >

            <label
              for="faltaJustificativa"
            >

              Justificativa / Observação

            </label>


            <textarea
              id="faltaJustificativa"
              placeholder="
                Digite aqui os detalhes ou justificativa...
              "
            ></textarea>

          </div>


        </form>

        `,


      footer:

        `

        <button
          class="btn btn-secondary"
          data-close-modal
        >

          Cancelar

        </button>


        <button
          class="btn btn-primary"
          id="btnSalvarFalta"
        >

          Salvar Registro

        </button>

        `

    });


    document
      .getElementById(
        "btnSalvarFalta"
      )
      ?.addEventListener(
        "click",
        () =>
          this.salvar()
      );

  },


  /* ===================================================
     SALVAR FALTA
  =================================================== */

  async salvar() {

    const funcionarioId =
      document.getElementById(
        "faltaFuncionario"
      )?.value;


    const data =
      document.getElementById(
        "faltaData"
      )?.value;


    const tipo =
      document.getElementById(
        "faltaMotivo"
      )?.value;


    const justificativa =
      document.getElementById(
        "faltaJustificativa"
      )?.value || "";


    if (
      !funcionarioId ||
      !data
    ) {

      App.toast(

        "Preencha os campos obrigatórios.",

        "warning"

      );

      return;
    }


    const funcionarioIdNumerico =
      Number(
        funcionarioId
      );


    if (
      !Number.isInteger(
        funcionarioIdNumerico
      ) ||
      funcionarioIdNumerico <= 0
    ) {

      App.toast(

        "O funcionário selecionado não possui um ID válido.",

        "danger"

      );

      return;
    }


    const botao =
      document.getElementById(
        "btnSalvarFalta"
      );


    if (botao) {

      botao.disabled =
        true;

      botao.textContent =
        "Salvando...";

    }


    try {

      /*
        IMPORTANTE:
        App.add("faltas") espera:

        funcionarioId
        data
        tipo
        justificativa
        observacoes
      */

      await App.add(

        "faltas",

        {

          funcionarioId:
            funcionarioIdNumerico,

          data:
            data,

          tipo:
            tipo,

          justificativa:
            justificativa,

          observacoes:
            justificativa

        }

      );


      App.toast(

        "Falta registrada com sucesso!",

        "success"

      );


      App.closeModal();


      /*
        Recarrega os dados.
      */

      this.state.faltas =
        (
          await App.getAll(
            "faltas"
          )
        ).map(
          normalizarFalta
        );


      this.render();


    } catch (erro) {

      console.error(
        "Erro ao salvar falta:",
        erro
      );


      App.toast(

        "Erro ao salvar falta: " +
        (
          erro.message ||
          erro
        ),

        "danger"

      );


      if (botao) {

        botao.disabled =
          false;

        botao.textContent =
          "Salvar Registro";

      }

    }

  },


  /* ===================================================
     RELATÓRIO POR FUNCIONÁRIO
  =================================================== */

  openModalRelatorio() {

    const funcionarios =
      this.state.funcionarios;


    App.openModal({

      title:
        "Relatório de faltas por funcionário",


      body:

        `

        <div
          style="
            display:flex;
            flex-direction:column;
            gap:18px;
          "
        >


          <div>

            <label
              for="relatorioFaltaFuncionario"
              style="
                display:block;
                font-weight:600;
                margin-bottom:6px;
              "
            >

              Funcionário

            </label>


            <select
              id="relatorioFaltaFuncionario"
              class="input"
              style="
                width:100%;
                padding:10px;
              "
            >

              <option value="">

                Selecione um funcionário...

              </option>


              ${funcionarios.map(
                funcionario => {

                  const id =
                    funcionario.id;


                  return `

                    <option
                      value="${id}"
                    >

                      ${escaparFalta(
                        funcionario.nome ||
                        funcionario.nome_completo ||
                        "Funcionário"
                      )}

                      ${
                        funcionario.matricula
                          ? ` — ${escaparFalta(
                              funcionario.matricula
                            )}`
                          : ""
                      }

                    </option>

                  `;

                }

              ).join("")}

            </select>

          </div>


          <div
            id="resultadoRelatorioFaltas"
          >

            <div
              class="empty"
              style="
                padding:30px 10px;
              "
            >

              <strong>

                Selecione um funcionário

              </strong>


              <p>

                O relatório será exibido aqui.

              </p>

            </div>

          </div>

        </div>

        `,


      footer:

        `

        <button
          class="btn btn-secondary"
          data-close-modal
        >

          Fechar

        </button>


        <button
          class="btn btn-primary"
          id="btnImprimirRelatorioFaltas"
        >

          🖨️ Imprimir

        </button>

        `

    });


    document
      .getElementById(
        "relatorioFaltaFuncionario"
      )
      ?.addEventListener(
        "change",
        e =>
          this.gerarRelatorio(
            e.target.value
          )
      );


    document
      .getElementById(
        "btnImprimirRelatorioFaltas"
      )
      ?.addEventListener(
        "click",
        () =>
          this.imprimirRelatorio()
      );

  },


  /* ===================================================
     GERAR RELATÓRIO
  =================================================== */

  gerarRelatorio(
    funcionarioId
  ) {

    const container =
      document.getElementById(
        "resultadoRelatorioFaltas"
      );


    if (!container) {
      return;
    }


    if (!funcionarioId) {

      container.innerHTML = `

        <div
          class="empty"
          style="
            padding:30px 10px;
          "
        >

          <strong>
            Selecione um funcionário
          </strong>

          <p>
            O relatório será exibido aqui.
          </p>

        </div>

      `;

      return;
    }


    const funcionario =
      this.state.funcionarios.find(

        f =>
          String(
            f.id
          ) ===
          String(
            funcionarioId
          )

      );


    if (!funcionario) {

      container.innerHTML = `

        <div
          class="alert alert-danger"
        >

          Funcionário não encontrado.

        </div>

      `;

      return;
    }


    const faltas =
      this.state.faltas.filter(

        falta =>

          String(
            falta.funcionarioId
          ) ===
          String(
            funcionarioId
          )

      );


    const total =
      faltas.length;


    const injustificadas =
      faltas.filter(

        falta => {

          const tipo =
            String(
              falta.tipo || ""
            ).toLowerCase();


          return tipo.includes(
            "injustificada"
          );

        }

      ).length;


    const justificadas =
      faltas.filter(

        falta => {

          const tipo =
            String(
              falta.tipo || ""
            ).toLowerCase();


          return (

            tipo.includes(
              "justificada"
            )

            ||

            tipo.includes(
              "atestado"
            )

          );

        }

      ).length;


    const licencas =
      faltas.filter(

        falta => {

          const tipo =
            String(
              falta.tipo || ""
            ).toLowerCase();


          return tipo.includes(
            "licença"
          );

        }

      ).length;


    const nomeFuncionario =
      funcionario.nome ||
      funcionario.nome_completo ||
      "Funcionário";


    const matricula =
      funcionario.matricula ||
      "—";


    container.innerHTML = `

      <div
        id="relatorioImpressaoFaltas"
        class="relatorio-faltas"
      >


        <div
          class="relatorio-cabecalho"
        >

          <h2
            style="
              margin:0 0 5px;
              color:#111827;
            "
          >

            Relatório de Faltas

          </h2>


          <div
            style="
              font-size:14px;
              color:#6b7280;
            "
          >

            E.M. Profª Eunice Carneiro

          </div>

        </div>


        <div
          class="relatorio-funcionario"
        >

          <div
            style="
              font-size:20px;
              font-weight:700;
              margin-bottom:5px;
            "
          >

            ${escaparFalta(
              nomeFuncionario
            )}

          </div>


          <div
            style="
              color:#6b7280;
              font-size:14px;
            "
          >

            Matrícula:
            ${escaparFalta(
              matricula
            )}

          </div>


          <div
            style="
              margin-top:8px;
              color:#6b7280;
              font-size:12px;
            "
          >

            Relatório gerado em:
            ${new Date().toLocaleString(
              "pt-BR"
            )}

          </div>

        </div>


        <div
          class="relatorio-cards"
        >


          <div
            class="relatorio-card"
          >

            <div
              class="relatorio-card-label"
            >

              Total de faltas

            </div>


            <div
              class="relatorio-card-value"
            >

              ${total}

            </div>

          </div>


          <div
            class="relatorio-card"
          >

            <div
              class="relatorio-card-label"
            >

              Faltas injustificadas

            </div>


            <div
              class="relatorio-card-value"
            >

              ${injustificadas}

            </div>

          </div>


          <div
            class="relatorio-card"
          >

            <div
              class="relatorio-card-label"
            >

              Justificadas / Atestados

            </div>


            <div
              class="relatorio-card-value"
            >

              ${justificadas}

            </div>

          </div>

        </div>


        ${
          licencas > 0

            ?

            `

            <div
              class="alert alert-info"
              style="
                margin-bottom:18px;
              "
            >

              Registros de
              Licença / Outros:
              <strong>
                ${licencas}
              </strong>

            </div>

            `

            :

            ""
        }


        ${
          total === 0

            ?

            `

            <div
              class="empty"
              style="
                padding:30px 10px;
              "
            >

              <strong>

                Nenhuma falta registrada

              </strong>


              <p>

                Este funcionário não possui
                registros de faltas.

              </p>

            </div>

            `

            :

            `

            <div
              class="table-wrap"
            >

              <table>

                <thead>

                  <tr>

                    <th>
                      Data
                    </th>

                    <th>
                      Motivo
                    </th>

                    <th>
                      Justificativa / Observação
                    </th>

                  </tr>

                </thead>


                <tbody>

                  ${faltas.map(
                    falta => `

                      <tr>

                        <td>

                          ${formatarDataFalta(
                            falta.data
                          )}

                        </td>


                        <td>

                          <span
                            class="badge badge-days"
                          >

                            ${escaparFalta(
                              falta.tipo
                            )}

                          </span>

                        </td>


                        <td>

                          ${escaparFalta(

                            falta.justificativa ||

                            falta.observacoes ||

                            "—"

                          )}

                        </td>

                      </tr>

                    `
                  ).join("")}

                </tbody>

              </table>

            </div>

            `

        }


        <div
          style="
            margin-top:25px;
            padding-top:15px;
            border-top:1px solid #e5e7eb;
            font-size:13px;
            color:#6b7280;
          "
        >

          <strong>
            Total de registros: ${total}
          </strong>

        </div>

      </div>

    `;

  },


  /* ===================================================
     IMPRIMIR RELATÓRIO
  =================================================== */

  imprimirRelatorio() {

    const relatorio =
      document.getElementById(
        "relatorioImpressaoFaltas"
      );


    if (!relatorio) {

      App.toast(

        "Selecione um funcionário para gerar o relatório.",

        "warning"

      );

      return;

    }


    const janela =
      window.open(
        "",
        "_blank",
        "width=1000,height=800"
      );


    if (!janela) {

      App.toast(

        "O navegador bloqueou a janela de impressão.",

        "warning"

      );

      return;

    }


    janela.document.write(`

      <!DOCTYPE html>

      <html lang="pt-BR">

      <head>

        <meta charset="UTF-8">

        <title>
          Relatório de Faltas
        </title>


        <style>

          body {

            font-family:
              Arial,
              sans-serif;

            margin:30px;

            color:#111827;

          }


          h2 {

            margin-bottom:5px;

          }


          table {

            width:100%;

            border-collapse:collapse;

            margin-top:20px;

          }


          th,
          td {

            border:1px solid #d1d5db;

            padding:8px;

            text-align:left;

          }


          th {

            background:#f3f4f6;

          }


          .cabecalho {

            border-bottom:
              2px solid #1f4b8f;

            padding-bottom:10px;

            margin-bottom:20px;

          }


          .funcionario {

            background:#f8fafc;

            border:1px solid #ddd;

            padding:15px;

            margin-bottom:20px;

          }


          .cards {

            display:grid;

            grid-template-columns:
              repeat(3,1fr);

            gap:10px;

            margin-bottom:20px;

          }


          .card {

            border:1px solid #ddd;

            padding:15px;

            text-align:center;

          }


          .valor {

            font-size:24px;

            font-weight:bold;

            margin-top:5px;

          }


          @media print {

            body {

              margin:15px;

            }

          }

        </style>

      </head>


      <body>

        ${relatorio.innerHTML}

        <script>

          window.onload = function() {

            window.print();

          };

        <\/script>

      </body>

      </html>

    `);


    janela.document.close();

  },


  /* ===================================================
     EXCLUIR
  =================================================== */

  async excluir(id) {

    if (

      !confirm(

        "Tem certeza que deseja excluir esta falta?"

      )

    ) {

      return;

    }


    try {

      await App.remove(
        "faltas",
        id
      );


      App.toast(
        "Falta removida com sucesso!",
        "info"
      );


      this.state.faltas =

        (

          await App.getAll(
            "faltas"
          )

        ).map(
          normalizarFalta
        );


      this.render();

    } catch (erro) {

      console.error(
        "Erro ao excluir:",
        erro
      );


      App.toast(

        "Erro ao excluir registro: " +
        (
          erro.message ||
          erro
        ),

        "danger"

      );

    }

  }

};