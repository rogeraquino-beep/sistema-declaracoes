# Sistema de Declarações — E.M. Profª Eunice Carneiro

Sistema interno de demonstração para cadastro de funcionários, lançamento de declarações, anexação de PDF/JPG/PNG, histórico por funcionário, relatórios, backup e exportação CSV.

## Tecnologias

- HTML5
- CSS3
- JavaScript puro
- IndexedDB
- GitHub Pages

Não utiliza React, Vue, Angular, Node.js, Vite ou backend obrigatório.

## Estrutura

```text
sistema-declaracoes/
├── index.html
├── funcionarios.html
├── funcionario.html
├── declaracoes.html
├── nova-declaracao.html
├── novo-funcionario.html
├── relatorios.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── funcionarios.js
│   ├── declaracoes.js
│   └── relatorios.js
├── assets/
└── README.md
```

## Como usar localmente

Pode abrir o `index.html` em um navegador moderno. Para uso mais previsível com recursos do navegador, também é possível servir a pasta com qualquer servidor estático simples.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos desta pasta.
3. Abra **Settings**.
4. Abra **Pages**.
5. Em **Build and deployment**, selecione a branch `main`.
6. Selecione a pasta `/ (root)`.
7. Salve.
8. Abra o endereço gerado pelo GitHub Pages.

Os caminhos do projeto são relativos, portanto a aplicação foi preparada para publicação em subpastas do GitHub Pages.

## Como usar

### Cadastrar funcionário

Abra **Novo Funcionário**, preencha os dados e salve. O registro passa a aparecer automaticamente na lista.

### Cadastrar declaração

Abra **Nova Declaração**, selecione o funcionário, escolha entre **Horas** ou **Dias**, preencha os campos e salve.

### Anexar PDF/JPG/PNG

Selecione o arquivo no campo **Anexar declaração**. O arquivo é convertido para uma estrutura armazenável no navegador e fica associado à declaração.

### Visualizar documento

Na lista de declarações ou no histórico do funcionário, clique em **Visualizar**. PDFs abrem em um iframe; imagens são exibidas diretamente. Há opção para abrir PDF em nova aba e baixar o documento.

## Armazenamento local

Os dados são mantidos em **IndexedDB**, não em variáveis temporárias. Isso permite que os dados permaneçam disponíveis após recarregar a página no mesmo navegador/perfil.

O armazenamento é local ao navegador/dispositivo. Ele não cria uma base de dados central para vários computadores.

## Backup

A interface foi preparada para receber rotinas de backup JSON com os dados dos funcionários e declarações. A versão desta entrega prioriza o CRUD principal e a estrutura IndexedDB.

## Limitações

- GitHub Pages é hospedagem estática.
- IndexedDB é local ao navegador.
- Dados e documentos não são compartilhados automaticamente entre computadores.
- Não há autenticação de usuários.
- Não há controle de permissões.
- Não há banco de dados central.
- Para documentos reais de funcionários, recomenda-se implementar autenticação, armazenamento seguro e banco central antes da implantação oficial.

## Integração futura com Supabase

O código possui pontos identificados para substituição do armazenamento local por API/Supabase, mantendo a ideia das funções de CRUD.

Exemplo:

```javascript
// FUTURO:
// substituir IndexedDB por Supabase
// mantendo as mesmas funções de CRUD.
```

## Dados fictícios

Na primeira execução são criados três funcionários e algumas declarações de demonstração. São dados fictícios e devem ser substituídos/removidos antes de uso oficial.

## Segurança

> Este sistema utiliza armazenamento local do navegador nesta versão. Para utilização oficial com documentos reais de funcionários, recomenda-se implementar autenticação e banco de dados seguro antes da implantação definitiva.

## Fluxo principal

**Funcionário → Declarações → Documento PDF/JPG/PNG → Histórico**

