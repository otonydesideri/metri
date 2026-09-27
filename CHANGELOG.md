# Changelog

## Unreleased

### O que muda

- **Id de ADR global.** O ADR global do pacote se cita `metri:ADR-NNNN`; `ADR-NNNN` é do projeto, em `docs/adr/`, com
  numeração própria desde 0001. O `docs-lint` procura cada id só na casa dele.

### Migrar de v1.2.0

Nos arquivos do projeto, citação a ADR global passa a `metri:ADR-0001` (biblioteca de UI) e `metri:ADR-0002` (contrato
de API); os ADRs do projeto não mudam.

## v1.2.0 (2026-09-27)

Refinamento pós-piloto: o source vira o pacote `metri`, com CLI; o backend é a fonte do contrato de API; decisões e
portões em três blocos; a camada de UI/UX com evidência; agentes por função; e os achados do piloto 1.

### O que muda

- **Pacote e CLI.** O source é o pacote privado `metri` (bin `metri`, TypeScript pelo `tsx`, sem build), instalado por
  `pnpm add -D link:<caminho>` ou `github:otonydesideri/metri#<tag>`. `template/scripts/` vira `cli/`, com `init`,
  `verify`, `rules-for`, `rules-index [--check]`, `docs-lint` e `design-tokens`; as regras globais vêm da pasta do
  pacote. O `/setup` sai: o `metri init`, mecânico e idempotente, cria `AGENTS.md`, `CLAUDE.md`,
  `.metri/ARCHITECTURE.md`, os links de skills e agents, o `.gitignore` e os scripts, e marca "mapeamento: pendente"
  num projeto com código; ativação e delegações passam ao `/look-across`.
- **Árvore do projeto.** `docs/` guarda o conhecimento do produto (PRODUCT, CONTEXT, DESIGN, adr/); `.metri/` guarda o
  estado da metodologia (ARCHITECTURE.md, rules/, MATRIX.md, tickets/<id>.md e tickets/<id>/*.png). Saem o
  `matrix-view`, o `.evidence/`, o `docs/plan/tech/` e os campos `evidence` e `tech_design`. Ticket e MATRIX citam só
  ids. O destino `project:architecture/INDEX` passa a `project:ARCHITECTURE`.
- **Contrato de API** (metri:ADR-0002). Os DTOs Zod do app-api são a fonte; o OpenAPI é gerado deles, e o app-web gera o
  client e os schemas pelo Orval. O `verify` roda o `api:generate` do projeto e falha com diff (`api:drift`). Saem o
  pacote de contrato compartilhado e a delegação "Pacote do contrato de API".
- **Decisões e portões.** O `grilling` classifica cada decisão em definida, inferida ou perguntar, e todo portão mostra
  os três blocos. O `/shape` infere o horizonte de cada feature e reescreve a triagem de design em cinco passos
  (`DESIGN-FORMAT.md` novo). `domain/bounded-contexts` e `domain/domain-services` ganham `activation`. O `/accept`
  mostra a evidência por critério e os achados em três grupos, decididos pelo usuário. Ticket bloqueado por slice
  espera o aceite e o merge dela; `done` é verde na branch da slice.
- **UI/UX.** Os tokens do `DESIGN.md` são a fonte do tema (`metri design-tokens`). Regra global nova,
  `frontend/experience`. Ticket `pattern` "Padrão de tela" com variantes (`?variant=`) e telas canônicas no
  `DESIGN.md`; evidência Playwright desktop e mobile por critério de UI, conferida pelo `docs-lint`; teste do
  consumidor no navegador.
- **Agentes.** `agents/`: `builder`, `reviewer-contract`, `reviewer-patterns`, `reviewer-ux` e `consumer-tester`,
  ligados em `.claude/agents/`.
- **Piloto 1.** Regras citadas no `rules-for`; layout e nomes de apps e pacotes como padrão global; pg-boss como fila
  padrão; exemplos no Prisma 7; filtro de teste pelo caminho; caminho manual do shadcn; Biome e Vitest de
  referência; slice de fundação sem contrato; correção sensível urgente com aceite e release próprios; id do dono
  redigido; exceção esperada de orçamento no primeiro ticket depois de um pattern.

### Migrar de v1.1.0

Ticket `pattern`, na raiz do projeto:

1. Tirar o submódulo e instalar o pacote:

   ```bash
   git submodule deinit -f .metri && git rm -f .metri && rm -rf .git/modules/.metri
   printf 'allowBuilds:\n  esbuild: false\n' >> pnpm-workspace.yaml   # se ainda não tiver
   pnpm add -D github:otonydesideri/metri#v1.2.0
   ```

2. Mover para a árvore nova:

   ```bash
   mkdir -p .metri
   git mv docs/architecture/INDEX.md .metri/ARCHITECTURE.md
   git mv docs/architecture .metri/rules          # só com regra de projeto em docs/architecture/<área>/
   git mv docs/plan/MATRIX.md .metri/MATRIX.md
   git mv docs/plan/tickets .metri/tickets
   ```

3. Em `.metri/ARCHITECTURE.md`: tirar a linha `source:` e as linhas `<...>` do template antigo; em "Delegações", tirar
   "Apps e pacotes" e "Pacote do contrato de API", e passar "Bounded contexts" e "Domain Service / Policy", quando
   houver, para "Capacidades ativas" (`- domain/bounded-contexts: ...`, `- domain/domain-services: ...`).
4. Na MATRIX e nos tickets: tirar o bloco entre `<!-- matrix-view -->` e `<!-- /matrix-view -->`, a chave
   `tech_design` e a `evidence`, e trocar caminho de `.md` por id; nas regras do projeto, `project:architecture/INDEX`
   vira `project:ARCHITECTURE`. Nos arquivos do projeto, citação a arquivo do pacote passa de `.metri/<caminho>` a
   `node_modules/metri/<caminho>` (`grep -rnE '\.metri/(architecture|adr|skills|VOCABULARY)' AGENTS.md docs .metri`).
5. `rm -f .claude/skills/setup`; no `AGENTS.md`, apagar as seções "How to work here" e "Where things live"; no
   `package.json`, tirar `tsx`, `yaml` e `picomatch` quando só os scripts antigos os usavam; no `.gitignore`, a linha
   `.evidence/`.
6. `pnpm exec metri init` (troca os scripts, refaz os links e escreve as seções novas do `AGENTS.md`),
   `pnpm rules-index` e `pnpm verify` até ficar verde; o `docs-lint` aponta o que faltar.
7. Projeto com pacote de contrato: um ticket `pattern` leva o contrato para os DTOs do app-api e liga o
   `api:generate` (`node_modules/metri/architecture/backend/http-api.md`).

## v1.1.0 (2026-09-27)

Correções do piloto: idioma da conversa, um arquivo por ticket, a primeira visão do board próprio e limpeza de
nomes fictícios.

### O que muda

- **Idioma.** `AGENTS-TEMPLATE.md` fixa pt-BR como língua padrão da conversa (`skills/setup/AGENTS-TEMPLATE.md`);
  as skills que perguntam ou reportam ao usuário (`setup`, `shape`, `look-across`, `build`, `accept`, `diagnose`,
  `grilling`, `domain-language`) passam a dizer "Ask and report in the user's language set in AGENTS.md (pt-BR by
  default)". `/setup` usa pt-BR desde a primeira pergunta, antes de o `AGENTS.md` existir. `/setup` termina
  apontando para `/shape` (produto, termos e, com interface, `docs/DESIGN.md`); a pergunta de ativação de
  `defaults/ui` diz o mesmo.
- **Source somente leitura.** `AGENTS.md` do source abre avisando que, montado como `.metri/` num projeto, é
  referência somente leitura: o agente segue o `AGENTS.md` do projeto. README, "Evolução futura", ganha a linha
  de distribuição enxuta (só skills, regras e scripts, sem o resto do source).
- **Um arquivo por ticket.** Cada UC ou T agora é `docs/plan/tickets/<id>.md`, com frontmatter YAML (`id`,
  `title`, `feature`/`actor` no UC, `slice`, `type` no T, `status`, `mode`, `blocked_by`, `areas`, `touches`,
  `sensitive`, `checks`, `subtasks`, `metrics`) e corpo em português ("Regras de negócio" ou "O que entrega",
  "Critérios", "Notas"). `docs/plan/MATRIX.md` fica só com o plano: features (com a lista `ucs`), slices, Fog,
  Gaps e Pattern proposals. Um ticket concluído fica no arquivo dele, `status: done`; só a slice concluída
  colapsa na MATRIX. Formato: `skills/look-across/MATRIX-FORMAT.md`, "Ticket files". `shape`, `look-across`,
  `build`, `accept` e `diagnose` leem e escrevem o arquivo do ticket; `rules-for --ticket` lê o frontmatter dele;
  `docs-lint` valida a árvore, o nome do arquivo, o frontmatter e as referências cruzadas com a MATRIX.
- **Visão da matriz.** `matrix-view` gera, no topo da MATRIX, entre `<!-- matrix-view -->` e
  `<!-- /matrix-view -->`, a tabela features × slices (ids dos tickets e um marcador de status por célula) e um
  grafo Mermaid de `blocked_by`; `matrix-view:check` entra no `verify`. É a primeira versão do board próprio
  (README, "Evolução futura").
- **Nomes negados.** Removida toda menção ao pacote fictício `@metri/contracts`; onde fazia falta falar dele, o
  texto diz "o pacote do contrato de API, escolhido pelo projeto" (ou o equivalente em inglês nas skills). Outros
  nomes concretos inexistentes negados no texto ganharam a forma positiva.
- **`.gitignore`.** `/setup` cria um, quando o projeto ainda não tem: `node_modules/`, `.env*` (com
  `!.env.example`), `dist/`, `.turbo/` e `coverage/`.

### Migrar de v1.0.0

Ticket `pattern`: checkout de `v1.1.0` em `.metri/`, depois, em `docs/plan/MATRIX.md`:

1. Para cada bloco `#### UC<f>.<n>` ou `#### T<s>.<n>`, criar `docs/plan/tickets/<id>.md`: as chaves da linha
   viram frontmatter YAML (um comando com `` ` `` vira string entre aspas, ex.: `["`pnpm verify`"]`); o `what` do
   T vira a seção "O que entrega"; os itens `- BR<n>: ...` (UC) e `- [ ] ...` viram "Regras de negócio" e
   "Critérios"; `notes`, quando houver, vira "Notas". Um UC concluído e podado (`status: done → <arquivo>`) vira
   `status: done`, sem a seta.
2. Em cada feature, trocar o bloco de UCs pela chave `ucs: [<ids>]` com os ids de todos os UCs dela.
3. Rodar `pnpm matrix-view` para gerar a visão no topo da MATRIX, e `pnpm verify` até ficar verde.

## v1.0.0 (2026-09-27)

Primeira versão do Architecture Source da metodologia Slices com Guardrails.

### O que traz

- **Regras** (`architecture/`, 42 regras, cada uma com frontmatter e `INDEX.md` de área gerado): `general/` (3), `backend/` (14), `domain/` (7), `frontend/` (9) e `infrastructure/` (7). As capacidades condicionais (`backend/async-jobs`, `infrastructure/cache`, `infrastructure/mail`, `infrastructure/observability`, `infrastructure/storage` e `defaults/ui`) levam a pergunta de ativação na chave `activation`, listada em `architecture/INDEX.md`, "Capacidades condicionais".
- **Defaults** (`architecture/defaults/`): `stack.md`, a stack padrão, e `ui.md`, shadcn/ui dentro do `@metri/ui`.
- **ADR global**: `adr/0001-default-ui-library.md`, que sustenta o default de UI.
- **Skills** (`skills/`, 12): chamadas pelo usuário, `/setup`, `/shape`, `/look-across`, `/build`, `/accept` e `/diagnose`; chamadas pelo modelo, `grilling`, `domain-language`, `guardrail`, `tdd`, `research` e `writing-for-agents`. Cada skill leva o formato do que escreve; `VOCABULARY.md` fixa as chaves canônicas.
- **Scripts** (`template/scripts/`, TypeScript com `tsx`, sem build): `verify`, `rules-for`, `rules-index` (com `--check`) e `docs-lint`, no modo source e no modo projeto, com a árvore fechada de `docs/` e o formato da MATRIX. Cada script explica o que faz em `--help`.
- **Testes**: Vitest sobre uma fixture de projeto (`template/scripts/__fixtures__/project/`), com `pnpm test`; `pnpm verify` roda docs-lint, rules-index:check e os testes.

### Fixar a versão num projeto

O source entra como submódulo em `.metri/`, numa tag, somente leitura:

```bash
git submodule add <url-do-source> .metri
git -C .metri checkout v1.0.0
git add .metri
```

O `/setup` registra a tag em `docs/architecture/INDEX.md` (`source: .metri@v1.0.0`) e liga as skills e os scripts; os passos completos estão no `README.md`, "Começar um projeto". Trocar de versão é um ticket `pattern`: checkout da tag nova em `.metri/`, a partir das entradas deste arquivo entre as duas versões.

### Atribuição

Onze skills são adaptadas de [mattpocock/skills](https://github.com/mattpocock/skills), de Matt Pocock, no commit `c55ee46073ed923f86ce59a5eb3b6d895095d1b7`, sob licença MIT: `grilling`, `domain-language`, `tdd`, `research`, `writing-for-agents`, `setup`, `shape`, `look-across`, `build`, `accept` e `diagnose`. Cada uma abre com a linha "Adapted from mattpocock/skills@c55ee46… (MIT)"; a licença está em `skills/THIRD-PARTY-LICENSES.md`.
