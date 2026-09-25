/* =========================================================
   FUNCIONÁRIOS
   CADASTRO COMPLETO
   PESQUISA
   FILTROS
   ATIVO / INATIVO
   EXPORTAÇÃO DE PLANILHA
   ========================================================= */


const FuncionariosPage = {

  state: {

    funcionarios: [],

    busca: "",

    status: "todos",

    setor: "todos",

    vinculo: "todos",

    categoria: "todos"

  },


  async init() {

    try {

      this.state.funcionarios =
        await App.getAll("funcionarios") || [];


      this.ordenar();


      App.layout(

        "Funcionários",

        "Cadastro, pesquisa e controle dos servidores da escola",

        this.layout()

      );


      this.bind();

      this.render();


    } catch (err) {

      console.error(err);

      App.toast(

        "Erro ao carregar funcionários: " +
        (err.message || err),

        "danger"

      );

    }

  },


  layout() {

    return `

      <style>

        .fx-filtros {

          display:grid;

          grid-template-columns:
            minmax(280px, 2fr)
            repeat(4, minmax(150px, 1fr));

          gap:10px;

          align-items:end;

        }


        .fx-filtros .field {

          margin:0;

        }


        .fx-acoes {

          display:flex;

          gap:8px;

          flex-wrap:wrap;

        }


        .fx-cards {

          display:grid;

          grid-template-columns:
            repeat(7, minmax(105px, 1fr));

          gap:10px;

          margin:16px 0;

        }


        .fx-card {

          background:#fff;

          border:1px solid #e5e7eb;

          border-radius:12px;

          padding:13px;

        }


        .fx-label {

          font-size:12px;

          color:#667085;

        }


        .fx-num {

          font-size:23px;

          font-weight:800;

          margin-top:3px;

        }


        .fx-ativo {

          background:#ecfdf3 !important;

          color:#027a48;

        }


        .fx-inativo {

          background:#fef3f2 !important;

          color:#b42318;

        }


        .fx-info {

          font-size:13px;

          color:#667085;

          margin-top:5px;

        }


        .fx-section {

          font-weight:800;

          font-size:16px;

          margin:4px 0 12px;

          color:#101828;

        }


        .fx-grid {

          display:grid;

          grid-template-columns:
            repeat(3, minmax(220px, 1fr));

          gap:14px;

        }


        .fx-full {

          grid-column:1 / -1;

        }


        .fx-table-actions {

          display:flex;

          gap:6px;

          flex-wrap:wrap;

        }


        @media(max-width:1200px) {

          .fx-filtros {

            grid-template-columns:
              1fr 1fr;

          }


          .fx-cards {

            grid-template-columns:
              repeat(4,1fr);

          }

        }


        @media(max-width:700px) {

          .fx-filtros,
          .fx-grid {

            grid-template-columns:
              1fr;

          }


          .fx-cards {

            grid-template-columns:
              repeat(2,1fr);

          }


          .fx-full {

            grid-column:auto;

          }

        }


        @media print {

          .no-print {

            display:none !important;

          }


          .fx-filtros {

            display:none;

          }


          .fx-cards {

            grid-template-columns:
              repeat(4,1fr);

          }

        }

      </style>


      <div class="page-header">

        <div>

          <h2>
            Lista de Funcionários
          </h2>

          <p>
            Pesquise pelo nome e filtre os servidores por situação,
            setor, vínculo e categoria do cargo.
          </p>

        </div>


        <div
          class="fx-acoes no-print"
        >

          <a
            href="novo-funcionario.html"
            class="btn btn-primary"
          >
            ＋ Novo Funcionário
          </a>


          <button
            id="fxExportar"
            class="btn btn-secondary"
            type="button"
          >
            📊 Exportar Planilha
          </button>


          <button
            id="fxImprimir"
            class="btn btn-secondary"
            type="button"
          >
            🖨️ Imprimir
          </button>

        </div>

      </div>


      <div
        class="card panel no-print"
      >

        <div
          class="panel-header"
        >

          <div>

            <h3>
              Pesquisar e filtrar
            </h3>

            <div
              class="fx-info"
              id="fxResultados"
            ></div>

          </div>


          <button
            id="fxLimpar"
            class="btn btn-secondary btn-sm"
            type="button"
          >
            Limpar filtros
          </button>

        </div>


        <div class="fx-filtros">

          <div class="field">

            <label
              for="fxBusca"
            >
              Pesquisar por nome
            </label>

            <input
              id="fxBusca"
              class="input"
              type="text"
              placeholder="Digite o nome do servidor..."
              autocomplete="off"
            >

          </div>


          <div class="field">

            <label
              for="fxStatus"
            >
              Situação
            </label>

            <select
              id="fxStatus"
              class="input"
            >

              <option
                value="todos"
              >
                Todos
              </option>

              <option
                value="Ativo"
              >
                Ativos
              </option>

              <option
                value="Inativo"
              >
                Inativos
              </option>

            </select>

          </div>


          <div class="field">

            <label
              for="fxSetor"
            >
              Setor
            </label>

            <select
              id="fxSetor"
              class="input"
            >

              <option value="todos">
                Todos
              </option>

              <option value="Administrativo">
                Administrativo
              </option>

              <option value="Pedagógico">
                Pedagógico
              </option>

              <option value="Outro">
                Outro
              </option>

            </select>

          </div>


          <div class="field">

            <label
              for="fxVinculo"
            >
              Vínculo
            </label>

            <select
              id="fxVinculo"
              class="input"
            >

              <option value="todos">
                Todos
              </option>

              <option value="Efetivo">
                Efetivo
              </option>

              <option value="Contratado">
                Contratado
              </option>

            </select>

          </div>


          <div class="field">

            <label
              for="fxCategoria"
            >
              Categoria do cargo
            </label>

            <select
              id="fxCategoria"
              class="input"
            >

              <option value="todos">
                Todos
              </option>

              <option value="Pedagógico">
                Pedagógico
              </option>

              <option value="Administrativo">
                Administrativo
              </option>

              <option value="Gestão">
                Gestão
              </option>

              <option value="Apoio">
                Apoio
              </option>

              <option value="Especialista">
                Especialista
              </option>

              <option value="Outro">
                Outro
              </option>

            </select>

          </div>

        </div>

      </div>


      <div
        id="fxCards"
      ></div>


      <div class="card panel">

        <div
          class="panel-header"
        >

          <h3>
            Servidores cadastrados
          </h3>

          <span
            class="badge badge-hours"
            id="fxBadge"
          >
            0 encontrados
          </span>

        </div>


        <div
          id="fxTabela"
        ></div>

      </div>

    `;

  },


  bind() {

    document
      .getElementById("fxBusca")
      ?.addEventListener(
        "input",
        e => {

          this.state.busca =
            e.target.value;

          this.render();

        }

      );


    document
      .getElementById("fxStatus")
      ?.addEventListener(
        "change",
        e => {

          this.state.status =
            e.target.value;

          this.render();

        }

      );


    document
      .getElementById("fxSetor")
      ?.addEventListener(
        "change",
        e => {

          this.state.setor =
            e.target.value;

          this.render();

        }

      );


    document
      .getElementById("fxVinculo")
      ?.addEventListener(
        "change",
        e => {

          this.state.vinculo =
            e.target.value;

          this.render();

        }

      );


    document
      .getElementById("fxCategoria")
      ?.addEventListener(
        "change",
        e => {

          this.state.categoria =
            e.target.value;

          this.render();

        }

      );


    document
      .getElementById("fxLimpar")
      ?.addEventListener(
        "click",
        () => this.limpar()
      );


    document
      .getElementById("fxExportar")
      ?.addEventListener(
        "click",
        () => this.exportar()
      );


    document
      .getElementById("fxImprimir")
      ?.addEventListener(
        "click",
        () => window.print()
      );

  },


  limpar() {

    Object.assign(
      this.state,
      {
        busca:"",
        status:"todos",
        setor:"todos",
        vinculo:"todos",
        categoria:"todos"
      }
    );


    const campos = [

      "fxBusca",
      "fxStatus",
      "fxSetor",
      "fxVinculo",
      "fxCategoria"

    ];


    campos.forEach(
      id => {

        const el =
          document.getElementById(id);

        if (!el) return;

        el.value =
          id === "fxBusca"
            ? ""
            : "todos";

      }
    );


    this.render();

  },


  ordenar() {

    this.state.funcionarios.sort(

      (a,b) =>

        String(a.nome || "")
          .trim()
          .localeCompare(

            String(b.nome || "")
              .trim(),

            "pt-BR",

            {
              sensitivity:
                "base"
            }

          )

    );

  },


  status(f) {

    return (
      String(
        f?.status ||
        "Ativo"
      ).trim()
      || "Ativo"
    );

  },


  setor(f) {

    const s =
      String(
        f?.setor ||
        ""
      ).trim();


    if (!s) {
      return "Outro";
    }


    const texto =
      s.toLowerCase();


    if (
      texto.includes(
        "administr"
      )
    ) {

      return "Administrativo";

    }


    if (
      texto.includes(
        "pedag"
      )
    ) {

      return "Pedagógico";

    }


    return s;

  },


  categoria(f) {

    const c =
      String(
        f?.categoriaCargo ||
        ""
      ).trim();


    if (c) {
      return c;
    }


    const cargo =
      String(
        f?.cargo ||
        ""
      ).toLowerCase();


    if (
      /(diretor|vice|gestor)/
        .test(cargo)
    ) {

      return "Gestão";

    }


    if (
      /(peb|professor|regente|supervisor)/
        .test(cargo)
    ) {

      return "Pedagógico";

    }


    if (
      /(aseb|read|secret|servente|cantine|inspetor|aux|administr)/
        .test(cargo)
    ) {

      return "Administrativo";

    }


    return "Outro";

  },


  filtrados() {

    const busca =
      String(
        this.state.busca ||
        ""
      )
      .trim()
      .toLocaleLowerCase(
        "pt-BR"
      );


    return (

      this.state.funcionarios

        .filter(
          f => {

            const nome =
              String(
                f.nome ||
                ""
              )
              .toLocaleLowerCase(
                "pt-BR"
              );


            return (

              (
                !busca ||
                nome.includes(
                  busca
                )
              )

              &&

              (
                this.state.status === "todos"
                ||
                this.status(f) ===
                this.state.status
              )

              &&

              (
                this.state.setor === "todos"
                ||
                this.setor(f) ===
                this.state.setor
              )

              &&

              (
                this.state.vinculo === "todos"
                ||
                String(
                  f.vinculo ||
                  ""
                ) ===
                this.state.vinculo
              )

              &&

              (
                this.state.categoria === "todos"
                ||
                this.categoria(f) ===
                this.state.categoria
              )

            );

          }
        )


        .sort(

          (a,b) =>

            String(
              a.nome || ""
            )
            .localeCompare(

              String(
                b.nome || ""
              ),

              "pt-BR",

              {
                sensitivity:
                  "base"
              }

            )

        )

    );

  },


  render() {

    const list =
      this.filtrados();


    const all =
      this.state.funcionarios;


    const count =
      key =>
        all.filter(
          key
        ).length;


    const badge =
      document.getElementById(
        "fxBadge"
      );


    if (badge) {

      badge.textContent =
        `${list.length} encontrado(s)`;

    }


    const resultados =
      document.getElementById(
        "fxResultados"
      );


    if (resultados) {

      resultados.textContent =
        `Exibindo ${list.length} de ${all.length} servidor(es).`;

    }


    const cards =
      document.getElementById(
        "fxCards"
      );


    if (cards) {

      cards.innerHTML = `

        <div class="fx-cards">

          ${this.card(
            "Total",
            all.length
          )}

          ${this.card(
            "Ativos",
            count(
              f =>
                this.status(f) ===
                "Ativo"
            )
          )}

          ${this.card(
            "Inativos",
            count(
              f =>
                this.status(f) ===
                "Inativo"
            )
          )}

          ${this.card(
            "Efetivos",
            count(
              f =>
                String(
                  f.vinculo || ""
                ) === "Efetivo"
            )
          )}

          ${this.card(
            "Contratados",
            count(
              f =>
                String(
                  f.vinculo || ""
                ) ===
                "Contratado"
            )
          )}

          ${this.card(
            "Administrativo",
            count(
              f =>
                this.setor(f) ===
                "Administrativo"
            )
          )}

          ${this.card(
            "Pedagógico",
            count(
              f =>
                this.setor(f) ===
                "Pedagógico"
            )
          )}

        </div>

      `;

    }


    const tabela =
      document.getElementById(
        "fxTabela"
      );


    if (tabela) {

      tabela.innerHTML =
        this.tabela(list);

    }

  },


  card(
    label,
    value
  ) {

    return `

      <div class="fx-card">

        <div class="fx-label">
          ${label}
        </div>

        <div class="fx-num">
          ${value}
        </div>

      </div>

    `;

  },


  tabela(list) {

    if (!list.length) {

      return `

        <div
          class="empty"
        >

          <strong>
            Nenhum funcionário encontrado
          </strong>

          <p>
            Pesquise outro nome
            ou altere os filtros.
          </p>

        </div>

      `;

    }


    return `

      <div class="table-wrap">

        <table>

          <thead>

            <tr>

              <th>
                Nome
              </th>

              <th>
                Matrícula
              </th>

              <th>
                Cargo / Função
              </th>

              <th>
                Categoria
              </th>

              <th>
                Setor
              </th>

              <th>
                Vínculo
              </th>

              <th>
                Situação
              </th>

              <th class="no-print">
                Ações
              </th>

            </tr>

          </thead>


          <tbody>

            ${list.map(
              f => {

                const st =
                  this.status(f);

                const id =
                  String(
                    f.id
                  ).replace(
                    /'/g,
                    "\\'"
                  );


                return `

                  <tr>

                    <td>

                      <strong>
                        ${App.escapeHTML(
                          f.nome ||
                          "Sem nome"
                        )}
                      </strong>

                    </td>


                    <td>

                      <code>
                        ${App.escapeHTML(
                          f.matricula ||
                          "—"
                        )}
                      </code>

                    </td>


                    <td>

                      ${App.escapeHTML(
                        f.cargo ||
                        "—"
                      )}

                    </td>


                    <td>

                      ${App.escapeHTML(
                        this.categoria(f)
                      )}

                    </td>


                    <td>

                      ${App.escapeHTML(
                        this.setor(f)
                      )}

                    </td>


                    <td>

                      <span
                        class="badge badge-days"
                      >

                        ${App.escapeHTML(
                          f.vinculo ||
                          "Servidor"
                        )}

                      </span>

                    </td>


                    <td>

                      <span
                        class="badge ${
                          st === "Inativo"
                            ? "fx-inativo"
                            : "fx-ativo"
                        }"
                      >

                        ${App.escapeHTML(
                          st
                        )}

                      </span>

                    </td>


                    <td
                      class="no-print"
                    >

                      <div
                        class="fx-table-actions"
                      >

                        <a
                          class="btn btn-secondary btn-sm"
                          href="funcionario.html?id=${encodeURIComponent(f.id)}"
                        >
                          Ver / Editar
                        </a>


                        <button
                          class="btn ${
                            st === "Inativo"
                              ? "btn-secondary"
                              : "btn-danger"
                          } btn-sm"
                          type="button"
                          onclick="FuncionariosPage.alternarStatus('${id}')"
                        >

                          ${
                            st === "Inativo"
                              ? "Ativar"
                              : "Inativar"
                          }

                        </button>


                        <button
                          class="btn btn-danger btn-sm"
                          type="button"
                          onclick="FuncionariosPage.deleteItem('${id}')"
                        >
                          Excluir
                        </button>

                      </div>

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


  async alternarStatus(id) {

    try {

      const f =
        await App.get(
          "funcionarios",
          id
        );


      if (!f) {

        App.toast(
          "Funcionário não encontrado.",
          "danger"
        );

        return;

      }


      const novo =
        this.status(f) ===
        "Inativo"
          ? "Ativo"
          : "Inativo";


      const confirmar =
        confirm(

          `Deseja ${
            novo === "Inativo"
              ? "inativar"
              : "ativar"
          } o servidor "${
            f.nome
          }"?`

        );


      if (!confirmar) {
        return;
      }


      await App.put(
        "funcionarios",
        {
          ...f,
          status: novo
        }
      );


      App.toast(

        `Servidor ${
          novo === "Inativo"
            ? "inativado"
            : "ativado"
        } com sucesso!`

      );


      await this.init();

    } catch (err) {

      console.error(err);

      App.toast(

        "Erro ao alterar situação: " +
        (err.message || err),

        "danger"

      );

    }

  },


  async deleteItem(id) {

    if (

      !confirm(
        "Tem certeza que deseja excluir este funcionário? Esta ação não poderá ser desfeita."
      )

    ) {

      return;

    }


    try {

      await App.remove(
        "funcionarios",
        id
      );


      App.toast(
        "Funcionário excluído com sucesso!"
      );


      await this.init();

    } catch (err) {

      console.error(err);

      App.toast(

        "Erro ao excluir: " +
        (err.message || err),

        "danger"

      );

    }

  },


  csv(v) {

    return `"${String(
      v ?? ""
    ).replace(
      /"/g,
      '""'
    )}"`;

  },


  exportar() {

    const list =
      this.filtrados();


    if (!list.length) {

      App.toast(
        "Não há funcionários para exportar.",
        "warning"
      );

      return;

    }


    const header = [

      "Nome completo",

      "Matrícula",

      "Cargo/Função",

      "Categoria do cargo",

      "Setor",

      "Vínculo",

      "Situação",

      "Turno",

      "Carga horária",

      "CPF",

      "Telefone",

      "E-mail",

      "Endereço",

      "Formação",

      "Especialização",

      "Naturalidade",

      "Data de nascimento",

      "Data de admissão",

      "Data de entrada na escola",

      "Observações"

    ];


    const rows =
      list.map(
        f => [

          f.nome,

          f.matricula,

          f.cargo,

          this.categoria(f),

          this.setor(f),

          f.vinculo,

          this.status(f),

          f.turno,

          f.cargaHoraria,

          f.cpf,

          f.telefone,

          f.email,

          f.endereco,

          f.formacao,

          f.especializacao,

          f.naturalidade,

          f.dataNascimento,

          f.dataAdmissao,

          f.dataEntradaEscola,

          f.observacoes

        ]
      );


    const csv = [

      header,

      ...rows

    ]

      .map(
        row =>
          row
            .map(
              value =>
                this.csv(value)
            )
            .join(";")
      )

      .join("\r\n");


    const blob =
      new Blob(

        [
          "\ufeff" +
          csv
        ],

        {
          type:
            "text/csv;charset=utf-8;"
        }

      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      "funcionarios-eunice-carneiro.csv";


    document.body.appendChild(
      link
    );


    link.click();

    link.remove();


    URL.revokeObjectURL(
      url
    );


    App.toast(
      "Planilha exportada com sucesso!"
    );

  }

};


/* =========================================================
   DETALHES / EDIÇÃO DO FUNCIONÁRIO
   ========================================================= */


const FuncionarioPage = {

  async init() {

    const id =
      new URLSearchParams(
        location.search
      ).get("id");


    if (!id) {

      location.href =
        "funcionarios.html";

      return;

    }


    try {

      const f =
        await App.get(
          "funcionarios",
          id
        );


      if (!f) {

        App.toast(
          "Funcionário não encontrado",
          "danger"
        );


        setTimeout(
          () =>
            location.href =
              "funcionarios.html",
          1200
        );


        return;

      }


      const cat =
        f.categoriaCargo ||
        this.inferirCategoria(
          f.cargo
        );


      const setor =
        f.setor ||
        "Outro";


      App.layout(

        "Detalhes do Funcionário",

        "Ficha cadastral completa e edição dos dados",

        this.form(
          f,
          cat,
          setor
        )

      );


      document
        .getElementById(
          "fxEdit"
        )
        ?.addEventListener(
          "submit",
          e =>
            this.save(
              e,
              id
            )
        );

    } catch (err) {

      console.error(err);

      App.toast(

        "Erro ao carregar dados do funcionário: " +
        (err.message || err),

        "danger"

      );

    }

  },


  esc(v = "") {

    return App.escapeHTML(v);

  },


  op(
    value,
    current
  ) {

    const selected =
      String(
        current ||
        ""
      ) === value
        ? " selected"
        : "";


    return `

      <option
        value="${this.esc(value)}"
        ${selected}
      >
        ${this.esc(value)}
      </option>

    `;

  },


  inferirCategoria(
    cargo
  ) {

    const c =
      String(
        cargo ||
        ""
      ).toLowerCase();


    if (
      /(diretor|vice|gestor)/
        .test(c)
    ) {

      return "Gestão";

    }


    if (
      /(peb|professor|regente|supervisor)/
        .test(c)
    ) {

      return "Pedagógico";

    }


    if (
      /(aseb|read|secret|servente|cantine|inspetor|aux|administr)/
        .test(c)
    ) {

      return "Administrativo";

    }


    return "Outro";

  },


  form(
    f,
    cat,
    setor
  ) {

    return `

      <style>

        .fxe-grid {

          display:grid;

          grid-template-columns:
            repeat(3, minmax(220px,1fr));

          gap:14px;

        }


        .fxe-full {

          grid-column:
            1 / -1;

        }


        .fxe-section {

          font-weight:800;

          font-size:16px;

          margin:4px 0 12px;

          color:#101828;

        }


        @media(max-width:900px) {

          .fxe-grid {

            grid-template-columns:
              1fr 1fr;

          }

        }


        @media(max-width:620px) {

          .fxe-grid {

            grid-template-columns:
              1fr;

          }


          .fxe-full {

            grid-column:auto;

          }

        }

      </style>


      <div
        class="card panel"
      >

        <form
          id="fxEdit"
          class="form"
        >


          <div
            class="fxe-section"
          >
            Dados principais
          </div>


          <div
            class="fxe-grid"
          >


            <div class="field">

              <label
                for="nome"
              >
                Nome Completo *
              </label>

              <input
                id="nome"
                class="input"
                required
                value="${this.esc(
                  f.nome
                )}"
              >

            </div>


            <div class="field">

              <label
                for="matricula"
              >
                Matrícula
              </label>

              <input
                id="matricula"
                class="input"
                value="${this.esc(
                  f.matricula
                )}"
              >

            </div>


            <div class="field">

              <label
                for="cpf"
              >
                CPF
              </label>

              <input
                id="cpf"
                class="input"
                value="${this.esc(
                  f.cpf
                )}"
              >

            </div>


            <div class="field">

              <label
                for="dataNascimento"
              >
                Data de nascimento
              </label>

              <input
                id="dataNascimento"
                class="input"
                type="date"
                value="${this.esc(
                  f.dataNascimento
                )}"
              >

            </div>


            <div class="field">

              <label
                for="naturalidade"
              >
                Naturalidade
              </label>

              <input
                id="naturalidade"
                class="input"
                value="${this.esc(
                  f.naturalidade
                )}"
              >

            </div>


            <div class="field">

              <label
                for="telefone"
              >
                Telefone
              </label>

              <input
                id="telefone"
                class="input"
                value="${this.esc(
                  f.telefone
                )}"
              >

            </div>


            <div class="field">

              <label
                for="email"
              >
                E-mail
              </label>

              <input
                id="email"
                class="input"
                type="email"
                value="${this.esc(
                  f.email
                )}"
              >

            </div>


            <div
              class="field fxe-full"
            >

              <label
                for="endereco"
              >
                Endereço
              </label>

              <input
                id="endereco"
                class="input"
                value="${this.esc(
                  f.endereco
                )}"
              >

            </div>


          </div>


          <div
            class="fxe-section"
            style="margin-top:20px"
          >
            Dados funcionais
          </div>


          <div
            class="fxe-grid"
          >


            <div class="field">

              <label
                for="cargo"
              >
                Cargo / Função
              </label>

              <input
                id="cargo"
                class="input"
                value="${this.esc(
                  f.cargo
                )}"
                placeholder="Ex.: PEB I REGENTE"
              >

            </div>


            <div class="field">

              <label
                for="categoriaCargo"
              >
                Categoria do cargo
              </label>

              <select
                id="categoriaCargo"
                class="input"
              >

                <option
                  value=""
                >
                  Selecione
                </option>

                ${
                  [
                    "Pedagógico",
                    "Administrativo",
                    "Gestão",
                    "Apoio",
                    "Especialista",
                    "Outro"
                  ]

                    .map(
                      v =>
                        this.op(
                          v,
                          cat
                        )
                    )

                    .join("")
                }

              </select>

            </div>


            <div class="field">

              <label
                for="setor"
              >
                Setor
              </label>

              <select
                id="setor"
                class="input"
              >

                <option
                  value=""
                >
                  Selecione
                </option>

                ${
                  [
                    "Administrativo",
                    "Pedagógico",
                    "Outro"
                  ]

                    .map(
                      v =>
                        this.op(
                          v,
                          setor
                        )
                    )

                    .join("")
                }

              </select>

            </div>


            <div class="field">

              <label
                for="vinculo"
              >
                Vínculo *
              </label>

              <select
                id="vinculo"
                class="input"
                required
              >

                <option
                  value="Efetivo"
                  ${
                    f.vinculo === "Efetivo"
                      ? "selected"
                      : ""
                  }
                >
                  Efetivo
                </option>

                <option
                  value="Contratado"
                  ${
                    f.vinculo ===
                    "Contratado"
                      ? "selected"
                      : ""
                  }
                >
                  Contratado
                </option>

              </select>

            </div>


            <div class="field">

              <label
                for="status"
              >
                Situação do servidor *
              </label>

              <select
                id="status"
                class="input"
                required
              >

                <option
                  value="Ativo"
                  ${
                    (
                      f.status ||
                      "Ativo"
                    ) === "Ativo"
                      ? "selected"
                      : ""
                  }
                >
                  Ativo
                </option>

                <option
                  value="Inativo"
                  ${
                    f.status ===
                    "Inativo"
                      ? "selected"
                      : ""
                  }
                >
                  Inativo
                </option>

              </select>

            </div>


            <div class="field">

              <label
                for="turno"
              >
                Turno
              </label>

              <select
                id="turno"
                class="input"
              >

                <option
                  value=""
                >
                  Selecione
                </option>

                ${
                  [
                    "Matutino",
                    "Vespertino",
                    "Integral",
                    "Noturno",
                    "Outro"
                  ]

                    .map(
                      v =>
                        this.op(
                          v,
                          f.turno
                        )
                    )

                    .join("")
                }

              </select>

            </div>


            <div class="field">

              <label
                for="cargaHoraria"
              >
                Carga horária
              </label>

              <input
                id="cargaHoraria"
                class="input"
                value="${this.esc(
                  f.cargaHoraria
                )}"
                placeholder="Ex.: 24h, 30h, 40h"
              >

            </div>


            <div class="field">

              <label
                for="dataAdmissao"
              >
                Data de admissão
              </label>

              <input
                id="dataAdmissao"
                class="input"
                type="date"
                value="${this.esc(
                  f.dataAdmissao
                )}"
              >

            </div>


            <div class="field">

              <label
                for="dataEntradaEscola"
              >
                Data de entrada na escola
              </label>

              <input
                id="dataEntradaEscola"
                class="input"
                type="date"
                value="${this.esc(
                  f.dataEntradaEscola
                )}"
              >

            </div>


          </div>


          <div
            class="fxe-section"
            style="margin-top:20px"
          >
            Formação
          </div>


          <div
            class="fxe-grid"
          >


            <div class="field">

              <label
                for="formacao"
              >
                Formação
              </label>

              <input
                id="formacao"
                class="input"
                value="${this.esc(
                  f.formacao
                )}"
              >

            </div>


            <div class="field">

              <label
                for="especializacao"
              >
                Especialização
              </label>

              <input
                id="especializacao"
                class="input"
                value="${this.esc(
                  f.especializacao
                )}"
              >

            </div>


            <div
              class="field fxe-full"
            >

              <label
                for="observacoes"
              >
                Observações
              </label>

              <textarea
                id="observacoes"
                class="input"
                rows="4"
              >${this.esc(
                f.observacoes
              )}</textarea>

            </div>


          </div>


          <div class="form-actions">

            <a
              href="funcionarios.html"
              class="btn btn-secondary"
            >
              Voltar
            </a>


            <button
              type="submit"
              class="btn btn-primary"
            >
              Salvar Alterações
            </button>

          </div>


        </form>

      </div>

    `;

  },


  async save(
    e,
    id
  ) {

    e.preventDefault();


    const btn =
      e.target.querySelector(
        'button[type="submit"]'
      );


    if (btn) {
      btn.disabled = true;
    }


    try {

      const val =
        campo =>
          document
            .getElementById(
              campo
            )
            .value;


      await App.put(

        "funcionarios",

        {

          id,

          nome:
            val("nome")
              .trim(),

          matricula:
            val("matricula")
              .trim(),

          cpf:
            val("cpf")
              .trim(),

          dataNascimento:
            val(
              "dataNascimento"
            ) || null,

          naturalidade:
            val(
              "naturalidade"
            ).trim(),

          telefone:
            val("telefone")
              .trim(),

          email:
            val("email")
              .trim(),

          endereco:
            val("endereco")
              .trim(),


          cargo:
            val("cargo")
              .trim(),

          categoriaCargo:
            val(
              "categoriaCargo"
            ),

          setor:
            val("setor"),

          vinculo:
            val("vinculo"),

          status:
            val("status"),

          turno:
            val("turno"),

          cargaHoraria:
            val(
              "cargaHoraria"
            ).trim(),

          dataAdmissao:
            val(
              "dataAdmissao"
            ) || null,

          dataEntradaEscola:
            val(
              "dataEntradaEscola"
            ) || null,


          formacao:
            val("formacao")
              .trim(),

          especializacao:
            val(
              "especializacao"
            ).trim(),

          observacoes:
            val(
              "observacoes"
            ).trim()

        }

      );


      App.toast(
        "Dados atualizados com sucesso!"
      );


      setTimeout(
        () =>
          location.href =
            "funcionarios.html",
        800
      );


    } catch (err) {

      console.error(err);


      App.toast(

        "Erro ao atualizar: " +
        (err.message || err),

        "danger"

      );


      if (btn) {
        btn.disabled =
          false;
      }

    }

  }

};


/* =========================================================
   NOVO FUNCIONÁRIO
   ========================================================= */


const NovoFuncionarioPage = {

  async init() {

    App.layout(

      "Novo Funcionário",

      "Cadastro completo de servidor da escola",

      this.form()

    );


    document
      .getElementById(
        "fxNovo"
      )
      ?.addEventListener(
        "submit",
        e =>
          this.save(e)
      );

  },


  form() {

    return `

      <style>

        .fxn-grid {

          display:grid;

          grid-template-columns:
            repeat(3, minmax(220px,1fr));

          gap:14px;

        }


        .fxn-full {

          grid-column:
            1 / -1;

        }


        .fxn-section {

          font-weight:800;

          font-size:16px;

          margin:4px 0 12px;

          color:#101828;

        }


        @media(max-width:900px) {

          .fxn-grid {

            grid-template-columns:
              1fr 1fr;

          }

        }


        @media(max-width:620px) {

          .fxn-grid {

            grid-template-columns:
              1fr;

          }


          .fxn-full {

            grid-column:auto;

          }

        }

      </style>


      <div
        class="card panel"
      >

        <form
          id="fxNovo"
          class="form"
        >


          <div
            class="fxn-section"
          >
            Dados principais
          </div>


          <div
            class="fxn-grid"
          >


            <div class="field">

              <label
                for="nome"
              >
                Nome Completo *
              </label>

              <input
                id="nome"
                class="input"
                required
                placeholder="Digite o nome completo"
              >

            </div>


            <div class="field">

              <label
                for="matricula"
              >
                Matrícula
              </label>

              <input
                id="matricula"
                class="input"
                placeholder="Ex.: 9801782"
              >

            </div>


            <div class="field">

              <label
                for="cpf"
              >
                CPF
              </label>

              <input
                id="cpf"
                class="input"
                placeholder="000.000.000-00"
              >

            </div>


            <div class="field">

              <label
                for="dataNascimento"
              >
                Data de nascimento
              </label>

              <input
                id="dataNascimento"
                class="input"
                type="date"
              >

            </div>


            <div class="field">

              <label
                for="naturalidade"
              >
                Naturalidade
              </label>

              <input
                id="naturalidade"
                class="input"
                placeholder="Ex.: Montes Claros - MG"
              >

            </div>


            <div class="field">

              <label
                for="telefone"
              >
                Telefone
              </label>

              <input
                id="telefone"
                class="input"
              >

            </div>


            <div class="field">

              <label
                for="email"
              >
                E-mail
              </label>

              <input
                id="email"
                class="input"
                type="email"
              >

            </div>


            <div
              class="field fxn-full"
            >

              <label
                for="endereco"
              >
                Endereço
              </label>

              <input
                id="endereco"
                class="input"
                placeholder="Rua, número, bairro..."
              >

            </div>


          </div>


          <div
            class="fxn-section"
            style="margin-top:20px"
          >
            Dados funcionais
          </div>


          <div
            class="fxn-grid"
          >


            <div class="field">

              <label
                for="cargo"
              >
                Cargo / Função
              </label>

              <input
                id="cargo"
                class="input"
                placeholder="Ex.: PEB I REGENTE"
              >

            </div>


            <div class="field">

              <label
                for="categoriaCargo"
              >
                Categoria do cargo
              </label>

              <select
                id="categoriaCargo"
                class="input"
              >

                <option value="Pedagógico">
                  Pedagógico
                </option>

                <option value="Administrativo">
                  Administrativo
                </option>

                <option value="Gestão">
                  Gestão
                </option>

                <option value="Apoio">
                  Apoio
                </option>

                <option value="Especialista">
                  Especialista
                </option>

                <option value="Outro">
                  Outro
                </option>

              </select>

            </div>


            <div class="field">

              <label
                for="setor"
              >
                Setor
              </label>

              <select
                id="setor"
                class="input"
              >

                <option value="Administrativo">
                  Administrativo
                </option>

                <option value="Pedagógico">
                  Pedagógico
                </option>

                <option value="Outro">
                  Outro
                </option>

              </select>

            </div>


            <div class="field">

              <label
                for="vinculo"
              >
                Vínculo *
              </label>

              <select
                id="vinculo"
                class="input"
                required
              >

                <option value="Efetivo">
                  Efetivo
                </option>

                <option value="Contratado">
                  Contratado
                </option>

              </select>

            </div>


            <div class="field">

              <label
                for="status"
              >
                Situação do servidor *
              </label>

              <select
                id="status"
                class="input"
                required
              >

                <option
                  value="Ativo"
                  selected
                >
                  Ativo
                </option>

                <option value="Inativo">
                  Inativo
                </option>

              </select>

            </div>


            <div class="field">

              <label
                for="turno"
              >
                Turno
              </label>

              <select
                id="turno"
                class="input"
              >

                <option value="">
                  Selecione
                </option>

                <option>
                  Matutino
                </option>

                <option>
                  Vespertino
                </option>

                <option>
                  Integral
                </option>

                <option>
                  Noturno
                </option>

                <option>
                  Outro
                </option>

              </select>

            </div>


            <div class="field">

              <label
                for="cargaHoraria"
              >
                Carga horária
              </label>

              <input
                id="cargaHoraria"
                class="input"
                placeholder="Ex.: 24h, 30h, 40h"
              >

            </div>


            <div class="field">

              <label
                for="dataAdmissao"
              >
                Data de admissão
              </label>

              <input
                id="dataAdmissao"
                class="input"
                type="date"
              >

            </div>


            <div class="field">

              <label
                for="dataEntradaEscola"
              >
                Data de entrada na escola
              </label>

              <input
                id="dataEntradaEscola"
                class="input"
                type="date"
              >

            </div>


          </div>


          <div
            class="fxn-section"
            style="margin-top:20px"
          >
            Formação
          </div>


          <div
            class="fxn-grid"
          >


            <div class="field">

              <label
                for="formacao"
              >
                Formação
              </label>

              <input
                id="formacao"
                class="input"
                placeholder="Ex.: Ensino Médio, Licenciatura..."
              >

            </div>


            <div class="field">

              <label
                for="especializacao"
              >
                Especialização
              </label>

              <input
                id="especializacao"
                class="input"
              >

            </div>


            <div
              class="field fxn-full"
            >

              <label
                for="observacoes"
              >
                Observações
              </label>

              <textarea
                id="observacoes"
                class="input"
                rows="4"
                placeholder="Informações adicionais..."
              ></textarea>

            </div>


          </div>


          <div
            class="form-actions"
          >

            <a
              href="funcionarios.html"
              class="btn btn-secondary"
            >
              Cancelar
            </a>


            <button
              type="submit"
              class="btn btn-primary"
            >
              Salvar Funcionário
            </button>

          </div>


        </form>

      </div>

    `;

  },


  async save(e) {

    e.preventDefault();


    const btn =
      e.target.querySelector(
        'button[type="submit"]'
      );


    if (btn) {
      btn.disabled = true;
    }


    try {

      const val =
        campo =>
          document
            .getElementById(
              campo
            )
            .value;


      const payload = {

        nome:
          val("nome")
            .trim(),

        matricula:
          val("matricula")
            .trim(),

        cpf:
          val("cpf")
            .trim(),

        dataNascimento:
          val(
            "dataNascimento"
          ) || null,

        naturalidade:
          val(
            "naturalidade"
          ).trim(),

        telefone:
          val("telefone")
            .trim(),

        email:
          val("email")
            .trim(),

        endereco:
          val("endereco")
            .trim(),


        cargo:
          val("cargo")
            .trim(),

        categoriaCargo:
          val(
            "categoriaCargo"
          ),

        setor:
          val("setor"),

        vinculo:
          val("vinculo"),

        status:
          val("status"),

        turno:
          val("turno"),

        cargaHoraria:
          val(
            "cargaHoraria"
          ).trim(),

        dataAdmissao:
          val(
            "dataAdmissao"
          ) || null,

        dataEntradaEscola:
          val(
            "dataEntradaEscola"
          ) || null,


        formacao:
          val("formacao")
            .trim(),

        especializacao:
          val(
            "especializacao"
          ).trim(),

        observacoes:
          val(
            "observacoes"
          ).trim()

      };


      await App.add(
        "funcionarios",
        payload
      );


      App.toast(
        "Funcionário cadastrado com sucesso!"
      );


      setTimeout(
        () =>
          location.href =
            "funcionarios.html",
        800
      );


    } catch (err) {

      console.error(err);


      App.toast(

        "Erro ao cadastrar funcionário: " +
        (err.message || err),

        "danger"

      );


      if (btn) {
        btn.disabled =
          false;
      }

    }

  }

};