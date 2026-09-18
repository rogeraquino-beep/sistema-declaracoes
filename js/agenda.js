/* =====================================================
   AGENDA DA ESCOLA
   E.M. Profª Eunice Carneiro
===================================================== */


/* =====================================================
   UTILITÁRIOS
===================================================== */

function agendaEscapar(valor = "") {

  return String(valor)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


function agendaFormatarData(data) {

  if (!data) {
    return "—";
  }

  const partes =
    String(data)
      .substring(0, 10)
      .split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


function agendaHojeISO() {

  const agora =
    new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      agora.getDate()
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;

}


function agendaMesNome(data) {

  return data.toLocaleDateString(
    "pt-BR",
    {
      month: "long",
      year: "numeric"
    }
  );

}


function agendaCapitalizar(texto) {

  if (!texto) {
    return "";
  }

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  );

}


/* =====================================================
   CATEGORIAS
===================================================== */

const AGENDA_CATEGORIAS = [

  "Reunião",

  "Evento",

  "Prazo",

  "Visita",

  "Monitoramento",

  "Atendimento",

  "Formação",

  "Outro"

];


/* =====================================================
   AGENDA
===================================================== */

const AgendaPage = {

  state: {

    eventos: [],

    mesAtual:
      new Date(),

    categoria:
      "todos"

  },


  /* ===================================================
     INICIAR
  =================================================== */

  async init() {

    try {

      this.state.eventos =
        await App.getAll(
          "agenda"
        );


      this.ordenarEventos();


      this.renderLayout();


      this.bindEvents();


      this.render();


    } catch (erro) {

      console.error(
        "Erro ao carregar agenda:",
        erro
      );


      App.layout(

        "Agenda",

        "Agenda administrativa da escola",

        `

        <div
          class="alert alert-danger"
        >

          Não foi possível carregar a agenda.

          <br><br>

          ${agendaEscapar(
            erro.message || erro
          )}

        </div>

        `

      );

    }

  },


  /* ===================================================
     ORDENAR EVENTOS
  =================================================== */

  ordenarEventos() {

    this.state.eventos.sort(

      (a, b) => {

        const valorA =
          `${a.data || ""} ${
            a.hora_inicio || ""
          }`;

        const valorB =
          `${b.data || ""} ${
            b.hora_inicio || ""
          }`;

        return valorA.localeCompare(
          valorB
        );

      }

    );

  },


  /* ===================================================
     LAYOUT
  =================================================== */

  renderLayout() {

    App.layout(

      "Agenda",

      "Agenda administrativa da escola",

      `

      <style>

        .agenda-topo {

          display:flex;

          justify-content:space-between;

          align-items:center;

          gap:16px;

          margin-bottom:20px;

          flex-wrap:wrap;

        }


        .agenda-navegacao {

          display:flex;

          align-items:center;

          gap:8px;

          flex-wrap:wrap;

        }


        .agenda-mes-titulo {

          font-size:22px;

          font-weight:700;

          color:#111827;

          min-width:220px;

          text-align:center;

        }


        .agenda-filtros {

          display:flex;

          gap:8px;

          align-items:center;

          flex-wrap:wrap;

        }


        .agenda-select {

          min-height:40px;

          border:1px solid #d1d5db;

          border-radius:8px;

          padding:8px 12px;

          background:#fff;

          font-size:14px;

        }


        .agenda-calendario {

          background:#fff;

          border:1px solid #e5e7eb;

          border-radius:12px;

          overflow:hidden;

          box-shadow:
            0 1px 3px rgba(0,0,0,.05);

        }


        .agenda-semana {

          display:grid;

          grid-template-columns:
            repeat(7, 1fr);

          background:#f8fafc;

          border-bottom:
            1px solid #e5e7eb;

        }


        .agenda-dia-semana {

          padding:12px 8px;

          text-align:center;

          font-size:12px;

          font-weight:700;

          color:#6b7280;

          text-transform:uppercase;

        }


        .agenda-grid {

          display:grid;

          grid-template-columns:
            repeat(7, 1fr);

        }


        .agenda-dia {

          min-height:145px;

          border-right:
            1px solid #e5e7eb;

          border-bottom:
            1px solid #e5e7eb;

          padding:8px;

          background:#fff;

          position:relative;

          cursor:default;

        }


        .agenda-dia.outro-mes {

          background:#f8fafc;

          opacity:.6;

        }


        .agenda-dia.hoje {

          background:#eff6ff;

        }


        .agenda-numero {

          display:flex;

          align-items:center;

          justify-content:space-between;

          margin-bottom:6px;

        }


        .agenda-numero-dia {

          width:28px;

          height:28px;

          display:flex;

          align-items:center;

          justify-content:center;

          border-radius:50%;

          font-size:13px;

          font-weight:700;

          color:#374151;

        }


        .agenda-dia.hoje
        .agenda-numero-dia {

          background:#2563eb;

          color:#fff;

        }


        .agenda-evento {

          display:block;

          width:100%;

          box-sizing:border-box;

          border:0;

          border-radius:7px;

          padding:6px 7px;

          margin-bottom:5px;

          text-align:left;

          cursor:pointer;

          background:#eff6ff;

          color:#1d4ed8;

          font-size:12px;

        }


        .agenda-evento:hover {

          background:#dbeafe;

        }


        .agenda-evento-hora {

          font-weight:700;

        }


        .agenda-evento-titulo {

          white-space:nowrap;

          overflow:hidden;

          text-overflow:ellipsis;

        }


        .agenda-evento-categoria {

          font-size:10px;

          opacity:.8;

          margin-top:2px;

        }


        .agenda-mais {

          font-size:11px;

          color:#6b7280;

          padding:3px;

        }


        .agenda-paineis {

          display:grid;

          grid-template-columns:
            1.4fr 1fr;

          gap:20px;

          margin-top:20px;

        }


        .agenda-lista {

          display:flex;

          flex-direction:column;

          gap:10px;

        }


        .agenda-item {

          border:1px solid #e5e7eb;

          border-radius:10px;

          padding:13px;

          background:#fff;

        }


        .agenda-item-topo {

          display:flex;

          justify-content:space-between;

          gap:10px;

        }


        .agenda-item-titulo {

          font-weight:700;

          color:#111827;

        }


        .agenda-item-meta {

          margin-top:5px;

          font-size:13px;

          color:#6b7280;

        }


        .agenda-item-descricao {

          margin-top:8px;

          font-size:13px;

          color:#374151;

        }


        .agenda-vazio {

          padding:30px;

          text-align:center;

          color:#6b7280;

        }


        .agenda-modal-form {

          display:flex;

          flex-direction:column;

          gap:15px;

        }


        .agenda-campo {

          display:flex;

          flex-direction:column;

          gap:6px;

        }


        .agenda-campo label {

          font-size:13px;

          font-weight:600;

          color:#374151;

        }


        .agenda-campo input,

        .agenda-campo select,

        .agenda-campo textarea {

          width:100%;

          box-sizing:border-box;

          border:1px solid #d1d5db;

          border-radius:8px;

          padding:10px 12px;

          font-size:14px;

          background:#fff;

        }


        .agenda-campo textarea {

          resize:vertical;

          min-height:90px;

        }


        .agenda-linha {

          display:grid;

          grid-template-columns:
            1fr 1fr;

          gap:12px;

        }


        @media (max-width:1000px) {

          .agenda-paineis {

            grid-template-columns:1fr;

          }

        }


        @media (max-width:700px) {

          .agenda-grid,
          .agenda-semana {

            min-width:700px;

          }


          .agenda-calendario {

            overflow-x:auto;

          }

        }


        @media (max-width:600px) {

          .agenda-linha {

            grid-template-columns:1fr;

          }

        }


        @media print {

          .no-print,

          .agenda-paineis {

            display:none !important;

          }


          .agenda-calendario {

            box-shadow:none;

            border:1px solid #999;

          }


          .agenda-dia {

            min-height:110px;

          }

        }

      </style>


      <div class="page-header">

        <div>

          <h2>
            Agenda da Escola
          </h2>

          <p>
            Organize reuniões, eventos, prazos,
            visitas e compromissos da escola.
          </p>

        </div>


        <div
          class="actions no-print"
        >

          <button
            class="btn btn-primary"
            id="btnNovoEvento"
          >

            ＋ Novo compromisso

          </button>

        </div>

      </div>


      <div
        class="agenda-topo no-print"
      >

        <div
          class="agenda-navegacao"
        >

          <button
            class="btn btn-secondary btn-sm"
            id="btnMesAnterior"
          >
            ←
          </button>


          <button
            class="btn btn-secondary btn-sm"
            id="btnHoje"
          >
            Hoje
          </button>


          <div
            class="agenda-mes-titulo"
            id="agendaMesTitulo"
          ></div>


          <button
            class="btn btn-secondary btn-sm"
            id="btnMesProximo"
          >
            →
          </button>

        </div>


        <div
          class="agenda-filtros"
        >

          <label
            style="
              font-size:13px;
              font-weight:600;
              color:#374151;
            "
          >
            Categoria:
          </label>


          <select
            id="agendaFiltroCategoria"
            class="agenda-select"
          >

            <option value="todos">
              Todas
            </option>


            ${AGENDA_CATEGORIAS.map(
              categoria => `

                <option
                  value="${agendaEscapar(
                    categoria
                  )}"
                >

                  ${agendaEscapar(
                    categoria
                  )}

                </option>

              `
            ).join("")}

          </select>


          <button
            class="btn btn-secondary btn-sm"
            id="btnImprimirAgenda"
          >

            🖨 Imprimir

          </button>

        </div>

      </div>


      <div
        class="agenda-calendario"
      >

        <div
          class="agenda-semana"
        >

          <div class="agenda-dia-semana">
            Seg
          </div>

          <div class="agenda-dia-semana">
            Ter
          </div>

          <div class="agenda-dia-semana">
            Qua
          </div>

          <div class="agenda-dia-semana">
            Qui
          </div>

          <div class="agenda-dia-semana">
            Sex
          </div>

          <div class="agenda-dia-semana">
            Sáb
          </div>

          <div class="agenda-dia-semana">
            Dom
          </div>

        </div>


        <div
          id="agendaGrid"
          class="agenda-grid"
        ></div>

      </div>


      <div
        class="agenda-paineis"
      >

        <section
          class="card panel"
        >

          <div
            class="panel-header"
          >

            <h3 style="margin:0;">
              Próximos compromissos
            </h3>

          </div>


          <div
            id="agendaProximos"
            class="agenda-lista"
          ></div>

        </section>


        <section
          class="card panel"
        >

          <div
            class="panel-header"
          >

            <h3 style="margin:0;">
              Resumo
            </h3>

          </div>


          <div
            id="agendaResumo"
          ></div>

        </section>

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
        "btnNovoEvento"
      )
      ?.addEventListener(
        "click",
        () =>
          this.abrirFormulario()
      );


    document
      .getElementById(
        "btnMesAnterior"
      )
      ?.addEventListener(
        "click",
        () => {

          this.state.mesAtual =
            new Date(

              this.state.mesAtual.getFullYear(),

              this.state.mesAtual.getMonth() - 1,

              1

            );

          this.render();

        }
      );


    document
      .getElementById(
        "btnMesProximo"
      )
      ?.addEventListener(
        "click",
        () => {

          this.state.mesAtual =
            new Date(

              this.state.mesAtual.getFullYear(),

              this.state.mesAtual.getMonth() + 1,

              1

            );

          this.render();

        }
      );


    document
      .getElementById(
        "btnHoje"
      )
      ?.addEventListener(
        "click",
        () => {

          const hoje =
            new Date();

          this.state.mesAtual =
            new Date(

              hoje.getFullYear(),

              hoje.getMonth(),

              1

            );

          this.render();

        }
      );


    document
      .getElementById(
        "agendaFiltroCategoria"
      )
      ?.addEventListener(
        "change",
        e => {

          this.state.categoria =
            e.target.value;

          this.render();

        }
      );


    document
      .getElementById(
        "btnImprimirAgenda"
      )
      ?.addEventListener(
        "click",
        () =>
          window.print()
      );

  },


  /* ===================================================
     FILTRAR
  =================================================== */

  eventosFiltrados() {

    if (
      this.state.categoria ===
      "todos"
    ) {

      return this.state.eventos;

    }


    return this.state.eventos.filter(

      evento =>

        (
          evento.categoria ||
          "Outro"
        ) ===
        this.state.categoria

    );

  },


  /* ===================================================
     RENDER
  =================================================== */

  render() {

    const tituloElemento =
      document.getElementById(
        "agendaMesTitulo"
      );


    if (
      tituloElemento
    ) {

      tituloElemento.textContent =
        agendaCapitalizar(
          agendaMesNome(
            this.state.mesAtual
          )
        );

    }


    this.renderCalendario();

    this.renderProximos();

    this.renderResumo();

  },


  /* ===================================================
     CALENDÁRIO
  =================================================== */

  renderCalendario() {

    const grid =
      document.getElementById(
        "agendaGrid"
      );


    if (!grid) {
      return;
    }


    const ano =
      this.state.mesAtual.getFullYear();


    const mes =
      this.state.mesAtual.getMonth();


    const primeiroDia =
      new Date(
        ano,
        mes,
        1
      );


    const ultimoDia =
      new Date(
        ano,
        mes + 1,
        0
      );


    const deslocamento =

      (
        primeiroDia.getDay() +
        6
      ) % 7;


    const totalDias =
      ultimoDia.getDate();


    const diasAnterior =
      new Date(
        ano,
        mes,
        0
      ).getDate();


    const eventos =
      this.eventosFiltrados();


    let html = "";


    /* Dias anteriores */

    for (
      let i = deslocamento - 1;
      i >= 0;
      i--
    ) {

      const dia =
        diasAnterior - i;


      const data =
        new Date(
          ano,
          mes - 1,
          dia
        );


      html +=
        this.renderDia(
          data,
          true,
          eventos
        );

    }


    /* Dias atuais */

    for (
      let dia = 1;
      dia <= totalDias;
      dia++
    ) {

      const data =
        new Date(
          ano,
          mes,
          dia
        );


      html +=
        this.renderDia(
          data,
          false,
          eventos
        );

    }


    /* Dias seguintes */

    const totalCelulas =
      deslocamento +
      totalDias;


    const restante =
      totalCelulas % 7 === 0
        ? 0
        : 7 -
          (
            totalCelulas % 7
          );


    for (
      let dia = 1;
      dia <= restante;
      dia++
    ) {

      const data =
        new Date(
          ano,
          mes + 1,
          dia
        );


      html +=
        this.renderDia(
          data,
          true,
          eventos
        );

    }


    grid.innerHTML =
      html;


    grid
      .querySelectorAll(
        "[data-evento-id]"
      )
      .forEach(
        elemento => {

          elemento.addEventListener(
            "click",
            () => {

              this.abrirFormulario(
                elemento.dataset.eventoId
              );

            }
          );

        }
      );


    grid
      .querySelectorAll(
        "[data-novo-dia]"
      )
      .forEach(
        elemento => {

          elemento.addEventListener(
            "dblclick",
            () => {

              this.abrirFormulario(
                null,
                elemento.dataset.novoDia
              );

            }
          );

        }
      );

  },


  /* ===================================================
     DIA DO CALENDÁRIO
  =================================================== */

  renderDia(
    data,
    outroMes,
    eventos
  ) {

    const iso =
      this.dataParaISO(
        data
      );


    const hoje =
      iso ===
      agendaHojeISO();


    const eventosDoDia =

      eventos

        .filter(

          evento =>
            evento.data ===
            iso

        )

        .sort(

          (a, b) =>

            String(
              a.hora_inicio ||
              ""
            ).localeCompare(

              String(
                b.hora_inicio ||
                ""
              )

            )

        );


    const exibidos =
      eventosDoDia.slice(
        0,
        4
      );


    const restantes =
      eventosDoDia.length -
      exibidos.length;


    return `

      <div

        class="
          agenda-dia
          ${outroMes ? "outro-mes" : ""}
          ${hoje ? "hoje" : ""}
        "

        data-novo-dia="${iso}"

        title="
          Duplo clique para criar compromisso
        "

      >


        <div
          class="agenda-numero"
        >

          <span
            class="agenda-numero-dia"
          >

            ${data.getDate()}

          </span>


          ${
            eventosDoDia.length

              ?

              `<span
                style="
                  font-size:10px;
                  color:#6b7280;
                "
              >
                ${eventosDoDia.length}
              </span>`

              :

              ""
          }

        </div>


        ${exibidos.map(
          evento => `

            <button

              type="button"

              class="agenda-evento"

              data-evento-id="${agendaEscapar(
                evento.id
              )}"

              title="${agendaEscapar(
                evento.titulo
              )}"

            >

              <div
                class="agenda-evento-hora"
              >

                ${
                  evento.hora_inicio
                    ? evento.hora_inicio.substring(
                        0,
                        5
                      )
                    : ""
                }

              </div>


              <div
                class="agenda-evento-titulo"
              >

                ${agendaEscapar(
                  evento.titulo
                )}

              </div>


              <div
                class="agenda-evento-categoria"
              >

                ${agendaEscapar(
                  evento.categoria ||
                  "Outro"
                )}

              </div>

            </button>

          `
        ).join("")}


        ${
          restantes > 0

            ?

            `

            <div
              class="agenda-mais"
            >

              + ${restantes}
              outro(s)

            </div>

            `

            :

            ""

        }

      </div>

    `;

  },


  /* ===================================================
     DATA PARA ISO
  =================================================== */

  dataParaISO(data) {

    const ano =
      data.getFullYear();


    const mes =
      String(
        data.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const dia =
      String(
        data.getDate()
      ).padStart(
        2,
        "0"
      );


    return `${ano}-${mes}-${dia}`;

  },


  /* ===================================================
     PRÓXIMOS COMPROMISSOS
  =================================================== */

  renderProximos() {

    const container =
      document.getElementById(
        "agendaProximos"
      );


    if (!container) {
      return;
    }


    const hoje =
      agendaHojeISO();


    const eventos =

      this.state.eventos

        .filter(
          evento =>
            evento.data >= hoje
        )

        .sort(
          (a, b) => {

            const valorA =
              `${a.data || ""} ${
                a.hora_inicio || ""
              }`;


            const valorB =
              `${b.data || ""} ${
                b.hora_inicio || ""
              }`;


            return valorA.localeCompare(
              valorB
            );

          }
        )

        .slice(
          0,
          8
        );


    if (
      !eventos.length
    ) {

      container.innerHTML = `

        <div
          class="agenda-vazio"
        >

          Nenhum compromisso futuro.

        </div>

      `;

      return;

    }


    container.innerHTML =

      eventos.map(
        evento => `

          <div
            class="agenda-item"
          >

            <div
              class="agenda-item-topo"
            >

              <div>

                <div
                  class="
                    agenda-item-titulo
                  "
                >

                  ${agendaEscapar(
                    evento.titulo
                  )}

                </div>


                <div
                  class="
                    agenda-item-meta
                  "
                >

                  📅
                  ${agendaFormatarData(
                    evento.data
                  )}

                  ${
                    evento.hora_inicio
                      ? ` • ⏰ ${
                          evento.hora_inicio.substring(
                            0,
                            5
                          )
                        }`
                      : ""
                  }

                </div>

              </div>


              <span
                class="
                  badge
                  badge-hours
                "
              >

                ${agendaEscapar(
                  evento.categoria ||
                  "Outro"
                )}

              </span>

            </div>


            <div
              class="
                agenda-item-meta
              "
            >

              ${
                evento.local
                  ? `📍 ${agendaEscapar(
                      evento.local
                    )}`
                  : ""
              }


              ${
                evento.responsavel
                  ? ` • 👤 ${agendaEscapar(
                      evento.responsavel
                    )}`
                  : ""
              }

            </div>


            ${
              evento.descricao

                ?

                `

                <div
                  class="
                    agenda-item-descricao
                  "
                >

                  ${agendaEscapar(
                    evento.descricao
                  )}

                </div>

                `

                :

                ""

            }

          </div>

        `
      ).join("");

  },


  /* ===================================================
     RESUMO
  =================================================== */

  renderResumo() {

    const container =
      document.getElementById(
        "agendaResumo"
      );


    if (!container) {
      return;
    }


    const ano =
      this.state.mesAtual.getFullYear();


    const mes =
      this.state.mesAtual.getMonth();


    const eventosMes =

      this.state.eventos.filter(
        evento => {

          if (!evento.data) {
            return false;
          }


          const partes =
            String(
              evento.data
            )
              .substring(
                0,
                10
              )
              .split("-");


          if (
            partes.length !== 3
          ) {

            return false;

          }


          const anoEvento =
            Number(
              partes[0]
            );


          const mesEvento =
            Number(
              partes[1]
            ) - 1;


          return (

            anoEvento ===
            ano

            &&

            mesEvento ===
            mes

          );

        }
      );


    const categorias =
      {};


    eventosMes.forEach(
      evento => {

        const categoria =
          evento.categoria ||
          "Outro";


        categorias[categoria] =

          (
            categorias[categoria] ||
            0
          ) + 1;

      }
    );


    const proximos =
      this.state.eventos.filter(
        evento =>
          evento.data >=
          agendaHojeISO()
      ).length;


    container.innerHTML = `

      <div
        style="
          display:grid;
          gap:10px;
        "
      >


        <div
          class="agenda-item"
        >

          <div
            class="agenda-item-meta"
          >

            Compromissos neste mês

          </div>


          <div
            style="
              font-size:26px;
              font-weight:700;
              color:#111827;
            "
          >

            ${eventosMes.length}

          </div>

        </div>


        <div
          class="agenda-item"
        >

          <div
            class="agenda-item-meta"
          >

            Próximos compromissos

          </div>


          <div
            style="
              font-size:26px;
              font-weight:700;
              color:#111827;
            "
          >

            ${proximos}

          </div>

        </div>


        <div
          class="agenda-item"
        >

          <div
            class="agenda-item-meta"
            style="margin-bottom:8px;"
          >

            Categorias no mês

          </div>


          ${
            Object.keys(
              categorias
            ).length

              ?

              Object.entries(
                categorias
              ).map(
                ([categoria, total]) => `

                  <div
                    style="
                      display:flex;
                      justify-content:space-between;
                      padding:5px 0;
                      border-bottom:
                        1px solid #f0f0f0;
                      font-size:13px;
                    "
                  >

                    <span>

                      ${agendaEscapar(
                        categoria
                      )}

                    </span>


                    <strong>

                      ${total}

                    </strong>

                  </div>

                `
              ).join("")

              :

              `

              <div
                style="
                  font-size:13px;
                  color:#6b7280;
                "
              >

                Nenhum compromisso neste mês.

              </div>

              `

          }

        </div>

      </div>

    `;

  },


  /* ===================================================
     FORMULÁRIO
  =================================================== */

  abrirFormulario(
    id = null,
    dataInicial = null
  ) {

    let evento =
      null;


    if (id) {

      evento =
        this.state.eventos.find(

          item =>
            String(
              item.id
            ) ===
            String(
              id
            )

        );

    }


    const editando =
      !!evento;


    const dataPadrao =
      evento?.data ||
      dataInicial ||
      agendaHojeISO();


    const categoriasHtml =

      AGENDA_CATEGORIAS.map(
        categoria => `

          <option
            value="${agendaEscapar(
              categoria
            )}"

            ${
              (
                evento?.categoria ||
                "Outro"
              ) === categoria
                ? "selected"
                : ""
            }
          >

            ${agendaEscapar(
              categoria
            )}

          </option>

        `
      ).join("");


    App.openModal({

      title:

        editando
          ? "Editar compromisso"
          : "Novo compromisso",


      body:

        `

        <form
          id="agendaForm"
          class="agenda-modal-form"
        >


          <div
            class="agenda-campo"
          >

            <label
              for="agendaTitulo"
            >

              Título *

            </label>


            <input

              type="text"

              id="agendaTitulo"

              required

              maxlength="200"

              value="${agendaEscapar(
                evento?.titulo ||
                ""
              )}"

              placeholder="
                Ex.: Reunião da secretaria
              "

            >

          </div>


          <div
            class="agenda-linha"
          >


            <div
              class="agenda-campo"
            >

              <label
                for="agendaData"
              >

                Data *

              </label>


              <input

                type="date"

                id="agendaData"

                required

                value="${dataPadrao}"

              >

            </div>


            <div
              class="agenda-campo"
            >

              <label
                for="agendaCategoria"
              >

                Categoria

              </label>


              <select
                id="agendaCategoria"
              >

                ${categoriasHtml}

              </select>

            </div>


          </div>


          <div
            class="agenda-linha"
          >


            <div
              class="agenda-campo"
            >

              <label
                for="agendaHoraInicio"
              >

                Horário inicial

              </label>


              <input

                type="time"

                id="agendaHoraInicio"

                value="${
                  evento?.hora_inicio ||
                  ""
                }"

              >

            </div>


            <div
              class="agenda-campo"
            >

              <label
                for="agendaHoraFim"
              >

                Horário final

              </label>


              <input

                type="time"

                id="agendaHoraFim"

                value="${
                  evento?.hora_fim ||
                  ""
                }"

              >

            </div>


          </div>


          <div
            class="agenda-linha"
          >


            <div
              class="agenda-campo"
            >

              <label
                for="agendaLocal"
              >

                Local

              </label>


              <input

                type="text"

                id="agendaLocal"

                maxlength="150"

                value="${agendaEscapar(
                  evento?.local ||
                  ""
                )}"

                placeholder="
                  Ex.: Sala da Direção
                "

              >

            </div>


            <div
              class="agenda-campo"
            >

              <label
                for="agendaResponsavel"
              >

                Responsável

              </label>


              <input

                type="text"

                id="agendaResponsavel"

                maxlength="150"

                value="${agendaEscapar(
                  evento?.responsavel ||
                  ""
                )}"

                placeholder="
                  Ex.: Secretaria
                "

              >

            </div>


          </div>


          <div
            class="agenda-campo"
          >

            <label
              for="agendaDescricao"
            >

              Descrição / Observações

            </label>


            <textarea

              id="agendaDescricao"

              maxlength="2000"

              placeholder="
                Informações adicionais...
              "

            >${agendaEscapar(
              evento?.descricao ||
              ""
            )}</textarea>

          </div>


        </form>

        `,


      footer:

        `

        ${
          editando

            ?

            `

            <button
              class="btn btn-danger"
              id="btnExcluirEvento"
            >

              Excluir

            </button>

            `

            :

            ""
        }


        <div
          style="
            margin-left:auto;
            display:flex;
            gap:8px;
          "
        >

          <button
            class="btn btn-secondary"
            data-close-modal
          >

            Cancelar

          </button>


          <button
            class="btn btn-primary"
            id="btnSalvarEvento"
          >

            ${
              editando
                ? "Salvar alterações"
                : "Salvar compromisso"
            }

          </button>

        </div>

        `

    });


    document
      .getElementById(
        "btnSalvarEvento"
      )
      ?.addEventListener(
        "click",
        () =>
          this.salvarEvento(
            evento
          )
      );


    document
      .getElementById(
        "btnExcluirEvento"
      )
      ?.addEventListener(
        "click",
        () =>
          this.excluirEvento(
            evento
          )
      );

  },


  /* ===================================================
     SALVAR
  =================================================== */

  async salvarEvento(
    eventoAntigo
  ) {

    const titulo =
      document.getElementById(
        "agendaTitulo"
      )?.value.trim();


    const data =
      document.getElementById(
        "agendaData"
      )?.value;


    const horaInicio =
      document.getElementById(
        "agendaHoraInicio"
      )?.value ||
      "";


    const horaFim =
      document.getElementById(
        "agendaHoraFim"
      )?.value ||
      "";


    const local =
      document.getElementById(
        "agendaLocal"
      )?.value.trim();


    const responsavel =
      document.getElementById(
        "agendaResponsavel"
      )?.value.trim();


    const categoria =
      document.getElementById(
        "agendaCategoria"
      )?.value ||
      "Outro";


    const descricao =
      document.getElementById(
        "agendaDescricao"
      )?.value.trim();


    if (
      !titulo ||
      !data
    ) {

      App.toast(
        "Preencha o título e a data.",
        "warning"
      );

      return;

    }


    if (
      horaInicio &&
      horaFim &&
      horaFim < horaInicio
    ) {

      App.toast(
        "O horário final não pode ser menor que o horário inicial.",
        "warning"
      );

      return;

    }


    const botao =
      document.getElementById(
        "btnSalvarEvento"
      );


    if (botao) {

      botao.disabled =
        true;

      botao.textContent =
        "Salvando...";

    }


    try {

      const dados = {

        titulo:
          titulo,

        data:
          data,

        hora_inicio:
          horaInicio ||
          null,

        hora_fim:
          horaFim ||
          null,

        local:
          local ||
          null,

        responsavel:
          responsavel ||
          null,

        categoria:
          categoria,

        descricao:
          descricao ||
          null

      };


      if (
        eventoAntigo
      ) {

        dados.id =
          eventoAntigo.id;


        await App.put(
          "agenda",
          dados
        );


        App.toast(
          "Compromisso atualizado com sucesso!"
        );

      } else {

        await App.add(
          "agenda",
          dados
        );


        App.toast(
          "Compromisso criado com sucesso!"
        );

      }


      App.closeModal();


      this.state.eventos =
        await App.getAll(
          "agenda"
        );


      this.ordenarEventos();


      this.render();


    } catch (erro) {

      console.error(
        "Erro ao salvar compromisso:",
        erro
      );


      App.toast(

        "Erro ao salvar compromisso: " +
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
          eventoAntigo
            ? "Salvar alterações"
            : "Salvar compromisso";

      }

    }

  },


  /* ===================================================
     EXCLUIR
  =================================================== */

  async excluirEvento(
    evento
  ) {

    if (!evento) {
      return;
    }


    if (

      !confirm(

        `Deseja excluir o compromisso "${evento.titulo}"?`

      )

    ) {

      return;

    }


    try {

      await App.remove(
        "agenda",
        evento.id
      );


      App.closeModal();


      App.toast(
        "Compromisso excluído com sucesso!",
        "info"
      );


      this.state.eventos =
        await App.getAll(
          "agenda"
        );


      this.ordenarEventos();


      this.render();


    } catch (erro) {

      console.error(
        "Erro ao excluir:",
        erro
      );


      App.toast(

        "Erro ao excluir compromisso: " +
        (
          erro.message ||
          erro
        ),

        "danger"

      );

    }

  }

};