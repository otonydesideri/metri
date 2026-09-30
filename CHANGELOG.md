# Changelog

## v1.4.0 (2026-09-30)

O starter: a fundação do piloto 2 vira o código que o `metri init` entrega a um projeto novo, e as regras apontam para
ele no lugar dos trechos que repetiam o mesmo código. Junto, os ajustes da revisão da v1.3.1.

### O que muda

- **Starter.** Num projeto novo (sem código em `apps/`, `packages/` ou `src/`), o `metri init` copia `starter/`, o
  código da fundação extraído do piloto 2: a raiz do monorepo, com o Biome de referência, os checks de fronteiras,
  de acesso e de data e o `db:up`; o app-api (NestJS sobre Fastify, env, erros, rate limit, request id, log, guard de
  acesso fail-closed, OpenAPI 3.1, Prisma e e2e com banco por arquivo); o app-web (Vite, React, router, React Query,
  Orval, Playwright e o shell do app); e `packages/core`, `db` e `ui`. `__PROJECT__` vira o nome do projeto, o
  `pnpm install` roda e o `verify` fecha verde. Arquivo que já existe fica como está; o `package.json` e o
  `pnpm-workspace.yaml` ganham só as chaves que faltam. `--no-starter` pula a cópia. O `turbo.json` desliga o
  `agentGuidance`, que faz o Turborepo 2.11 gravar um bloco próprio no `AGENTS.md`.
- **Regras e starter.** Onde um arquivo do starter é o exemplo canônico de uma regra, o `examples:` aponta para
  ele e o trecho equivalente saiu do texto: o Biome, o `test` da raiz e o Vitest (`defaults/stack`), o `AppModule`, o
  `main.ts` e o env (`infrastructure/runtime`, `infrastructure/logging`), o filtro de erro, o `toHttpException` e o
  `DomainError` (`backend/errors`), o Prisma (`backend/persistence`), o `components.json`, o `globals.css` e o `cn`
  (`defaults/ui`), o tema (`frontend/theming`), as rotas (`frontend/routing`), o cliente HTTP, o Orval e o `App`
  (`frontend/data-fetching`) e o MSW, o Playwright e a evidência (`frontend/testing`). Um exemplo em `starter/` é o
  arquivo do mesmo caminho no projeto. Os comandos de verificação de `backend/boundaries`, `general/date-time` e
  `backend/access-scope` viram os checks `boundaries`, `date-time` e `access-boundaries` do starter.
- **Slice 0.** Num projeto novo, a fundação é o que falta depois do `init`: o banco de desenvolvimento (a delegação e o
  `db:up`), o ticket de design system (os tokens do `DESIGN.md` no tema e o shell) e o que as capacidades ativas
  pedirem. O caminho Docker do banco passa a `db:docker:up` e `db:docker:down`, no lugar do `db:down`.
- **Kit de UI.** Só `packages/ui/src/components/ui/` é código de fornecedor, sem cabeçalho e sem a formatação e o
  preset do Biome. O hook ou bloco que a CLI do shadcn grava fora dali é código do projeto: o `metri sot` pede o
  cabeçalho dele. O Biome de referência barra o pacote npm `cn` com o `noRestrictedImports`, também em
  `components/ui/`, e usa o `preset` no lugar do `recommended`, obsoleto desde o Biome 2.5.15.
- **`metri sot`.** Cada símbolo do `sot:` de uma slice done aparece no caminho linear do `.metri/ARCHITECTURE.md`, e
  um cabeçalho antigo `// SOT:` é erro.
- **Skills.** A `humanizer` ganha o padrão da ênfase vazia ("exatamente", "é quem", o gerúndio pendurado), e o jargão
  interno passa a cobrir a linguagem de construção na interface ("layout público", "(S4)", "mock").
- **CLI.** Os comentários do código da CLI passam a inglês.

### Migrar de v1.3.1

1. `pnpm add -D github:otonydesideri/metri#v1.4.0`.
2. Projeto existente não recebe o starter: o `metri init` só copia `starter/` num repositório sem código em `apps/`,
   `packages/` ou `src/`. Uma peça que o projeto queira trazer está em `node_modules/metri/starter/`.
3. Um cabeçalho `// SOT:` que restou vira `/** SOURCE OF TRUTH: ... */`, e cada símbolo do `sot:` das slices done
   entra num passo do "Caminho linear" do `.metri/ARCHITECTURE.md`: o `metri sot` passa a acusar os dois.
4. `biome.json`: `"preset": "recommended"` no lugar de `"recommended": true`, o `noRestrictedImports` do pacote `cn` e
   o override de `packages/ui/src/components/ui/**`, como em `node_modules/metri/starter/biome.json`. Hook ou bloco
   da CLI do shadcn fora dessa pasta ganha o cabeçalho.
5. Com o banco pelo Docker, o script `db:down` passa a `db:docker:down`, e o que sobe o container, a `db:docker:up`
   (`node_modules/metri/starter/scripts/db-docker.sh`).
6. Com o Turborepo 2.11: `"agentGuidance": false` no `turbo.json` e, se ele já gravou, o bloco
   `turborepo-agent-rules` sai do `AGENTS.md`.
7. `pnpm verify` verde.

## v1.3.1 (2026-09-30)

Revisão pós-release da v1.3.0: o cabeçalho e os comentários de código em inglês, o `@metri/ui` pelo caminho manual
com o `cn` do kit, quatro correções no `metri sot`, as regras de F e G sem contradição entre si, e o guia de migração
completo para a agenda do piloto 2.

### O que muda

- **Idioma.** O cabeçalho `SOURCE OF TRUTH` é todo em inglês, rótulos e texto, e os comentários de código passam a
  inglês (`defaults/stack`, "Stack"; README, "Política de idioma"), inclusive nos exemplos das regras.
- **`@metri/ui`.** O kit entra sempre pelo caminho manual de monorepo: o `shadcn init --monorepo` cria outro pacote,
  com estilo de preset e os arquivos da CLI direto em `src/components/`. O layout de metri:ADR-0003 é o do shadcn
  com a pasta `components/ui/` a mais. Desde 03/09/2026 o registry do shadcn importa o `cn` do pacote npm `cn`, com
  qualquer alias `utils`; no mesmo `add`, o import passa ao `cn` do kit. Isso corrige a v1.3.0, que dava o alias
  como solução do PP-3. O `globals.css` importa o `tw-animate-css`, e a verificação de `defaults/ui` separa as fontes,
  que o `design-tokens` não confere, dos níveis de texto, que ele confere.
- **`metri sot`.** Arquivo sem export (o `main.ts`, um script) não pede cabeçalho; quando o caminho linear o nomeia,
  o cabeçalho fica acima da declaração do topo. "generated" ou "gerado por" no meio de um comentário não isenta mais
  o arquivo; um `/**` dentro de string ou comentário (o glob `src/**/*.ts`) não engole o cabeçalho seguinte; arquivo
  com CRLF passa.
- **`metri docs-lint`.** Ticket com YAML inválido sai como erro no ticket, sem derrubar o comando.
- **Backend e domínio.** O `APP_GUARD` registra o throttler e, com dono, o guard de sessão depois dele; o endpoint de
  infra externa leva `@Public()` (`infrastructure/runtime`). O dev do app-api carrega o `.env`
  (`node --env-file-if-exists=.env`). O e2e de exemplo entra com a sessão da factory no cookie. `backend/layers`
  conhece `infra/auth/` e as bibliotecas de cálculo puro do domínio, e `backend/boundaries` ganha o grep delas. O
  `.nullable()` sai com `null` no `type` ou no `anyOf`. A WatchedList de identidade estrutural entra no critério e na
  verificação, e o VO de endereço público devolve uma sugestão no formato válido: a disponibilidade é do caso de uso.
  `backend/access-scope` aponta o mecanismo padrão de autenticação para `defaults/stack`.
- **Frontend.** O endereço público `/<slug>` é exceção ao "id, não slug" de `frontend/routing`. O formato do controle
  nativo de data e hora vem do `LANG` do processo do browser, nos dois Chromium do Playwright, e não muda com o canal
  (corrige a v1.3.0). `FieldError` no lugar de `Field.Error`. No `DESIGN.md`, "só claro" pede ADR.
- **Skills e agentes.** O revisor de experiência e o teste do consumidor no navegador dependem do critério `Tela:`
  também na abertura do /accept e na descrição dos agentes. O /build pode editar `areas`, o /diagnose grava `metrics`
  no `done`, e o portão de conhecimento aceita o cabeçalho `SOURCE OF TRUTH` como destino. A `humanizer` não
  acrescenta fato nos exemplos, mantém o contraste cujas duas metades informam, tira o embrulho de chat e o jargão
  interno num só aparecimento e trata como prosa o texto de interface dentro do código. A SOT keyword volta a incluir
  as palavras do tema. As skills e regras da v1.3 foram podadas.

### Migrar de v1.3.0

1. `pnpm add -D github:otonydesideri/metri#v1.3.1`.
2. Comentários de código em inglês, a começar pelo cabeçalho `SOURCE OF TRUTH` (rótulos e texto).
3. `@metri/ui`: nos arquivos de `src/components/ui/`, `import { cn } from "cn"` passa a
   `import { cn } from '@metri/ui/lib/utils'`; o `globals.css` ganha `@import "tw-animate-css"` depois do
   `@import "tailwindcss"`, com o `tw-animate-css` nas dependências do `@metri/ui`.
4. app-api: o `dev` passa a `tsdown --watch --on-success "node --env-file-if-exists=.env dist/main.mjs"`; com guard de
   sessão, ele vem no `APP_GUARD` depois do throttler, e o endpoint de health ganha `@Public()`.
5. Controle nativo de data ou hora julgado num critério `Tela:`: o `playwright.config.ts` passa o `LANG` em
   `use.launchOptions.env`, no lugar do `channel: 'chromium'`.
6. `pnpm verify` verde e `pnpm docs-lint` sem aviso.

### Migrar de v1.2.1

Os passos de "Migrar de v1.2.1" da v1.3.0, com `#v1.3.1` no passo 1 e as correções abaixo; depois, os passos 2 a 5 de
"Migrar de v1.3.0".

- Passo 1: o `metri init` só acrescenta a seção que falta no `AGENTS.md`. As linhas "Find before you create" e a do
  caminho linear passam ao texto de `node_modules/metri/cli/templates/AGENTS.md`. Regra do projeto com o id de uma
  regra global nova (`general/date-time`) sai de `.metri/rules/`: com ela, o `rules-for` falha. O que ela tinha de
  próprio vai para o `.metri/ARCHITECTURE.md` ou para um ADR, e depois roda `pnpm rules-index`.
- Passo 2: o cabeçalho antigo é também o comentário do topo com a linha `SOT:`. Ele sai de todo arquivo que
  `grep -rlE '^\s*(//|/?\*+|#)\s*SOT( keywords)?:' apps packages scripts` lista, inclusive spec, barrel e apoio de
  teste, que ficam sem cabeçalho.
- Passo 4: o `playwright.config.ts` tira a porta de `E2E_PORT` e sobe cada `webServer` com
  `reuseExistingServer: false` (`node_modules/metri/architecture/frontend/testing.md`, "E2e de critério de UI").
- Passo 5: os imports `#` dentro dos arquivos movidos passam ao nome do pacote (`#shadcn/button` →
  `@metri/ui/components/ui/button`).
- Passo 7: `test-results/` e `playwright-report/` entram no `.gitignore` de todo projeto com e2e, com ou sem banco.
- Passo 8: além do `pnpm verify` verde, `pnpm docs-lint` sem aviso (id de ticket em regra do projeto, `PP-n` e
  `GAP-n` fechado no código): o `verify` não mostra os avisos.

## v1.3.0 (2026-09-29)

Consolidação do piloto 2: a slice construída fica registrada pelos donos no código e pelo caminho linear, só o
critério de tela pede evidência, a execução em paralelo não disputa porta nem banco, o `@metri/ui` segue o layout
padrão do shadcn, entra a skill `humanizer`, e as regras ganham os achados de backend, domínio, frontend e testes.

### O que muda

- **Cabeçalho SOURCE OF TRUTH.** O cabeçalho do código segue o formato do Flute: `/** SOURCE OF TRUTH: <símbolos>.`,
  com `WHAT:`, `WHY:` e `WHERE:`, logo acima do export que o arquivo possui, um por dono canônico (skill
  `guardrail`, passo 5). A primeira linha é a SOT keyword do grep, e a lista "SOT keywords" sai.
- **Slice construída.** Saem o campo `entry` e o passo 4 do /build. O contrato fica no bloco `contract` da MATRIX até
  a poda do /accept; construída, a slice vira `status: done · sot: [<símbolo>]`, e os donos entram no caminho linear
  do `.metri/ARCHITECTURE.md`, um `arquivo:símbolo` por passo.
- **`metri sot`**, dentro do `verify`: cabeçalho bem formado, arquivo-fonte sem cabeçalho, símbolos de `sot:`,
  caminho linear e slice done sem `contract`.
- **Evidência por critério `Tela:`.** Só o critério julgado na tela (`- [ ] Tela: ...`) pede screenshot, e o
  `docs-lint` deixa de olhar `areas`. O helper grava só com `METRI_EVIDENCE=<id do ticket>`, então a suíte cheia não
  regrava nada. `metri prune <slice>` tira a evidência na poda do /accept, e PNG de slice done é erro.
- **Notas, `areas` e `metrics`.** As Notas guardam só o que não é derivável, em até 10 linhas, e a decisão sai delas
  no portão de conhecimento. O /build reconcilia `areas` com o diff antes do `done`. O `metrics` tem um formato só:
  `{ rules: <n>, tokens: <n> }`.
- **Execução isolada.** Cada app tem porta própria com `strictPort`; o e2e usa `E2E_PORT` e
  `reuseExistingServer: false`, e o coordenador dá uma porta a cada worker. O /accept roda os checks e o e2e uma vez,
  antes dos revisores, que só leem o resultado. O /build faz `git add` por caminho e commit WIP a cada passo verde,
  roda o e2e com `--workers=1` sob carga, e o check de e2e filtra pela pasta `e2e/<módulo>/`.
- **Banco de desenvolvimento.** Delegação nova, decidida no planejamento da fundação: o Postgres que já roda na
  máquina ou um container Docker do projeto. O `db:up` falha rápido e cria o `.env`, o `db:down` remove o container,
  e o e2e cria e apaga os próprios bancos (`infrastructure/runtime`, `backend/testing`).
- **shadcn no layout padrão** (metri:ADR-0003, que supera o metri:ADR-0001). O `@metri/ui` passa a
  `src/components/{ui,blocks,providers}`, `src/hooks`, `src/lib/utils.ts` e `src/styles/globals.css`, com os aliases
  no nome do pacote (`@metri/ui/components/ui`, `@metri/ui/lib/utils`), o `paths` e os `exports`. Saem o `imports`,
  os aliases `#`, a pasta `src/shadcn/` e o re-export em compound: o primitivo entra por import nomeado, e o `toast`
  vem do `sonner`. O arquivo da CLI importa o `cn` do kit (PP-3). O `globals.css` ganha o segundo `@source`, o Biome
  deixa `components/ui/` de fora, e o `metri design-tokens` confere o `theme.text` do `cn` e o `<style>` do
  `index.html`.
- **Skill `humanizer`**, adaptada de blader/humanizer v3.1.0 (MIT), em português: tira os sinais de texto gerado do
  que um humano lê. `shape`, `domain-language`, `grilling`, `accept`, `diagnose`, `research` e a
  `frontend/experience` a chamam.
- **Backend e domínio.** Guard global fail-closed, com cada controller declarando `@Public()` ou `@<Dono>Owned()` e o
  dono lido por `@Current<Dono>Id()` (`backend/access-scope`). Sem sessão, 401 pela `UnauthorizedException` nativa
  (`backend/errors`). A autenticação padrão é a sessão no servidor, com o hash do token no banco (`defaults/stack`,
  fecha o PP-4), e o redirect do OAuth sai sem `@ZodResponse` e com throttle. O Nest compila pelo `tsdown`, e o
  OpenAPI sai em 3.1. O e2e de provider global usa um controller de prova, e o de rota protegida, a credencial da
  factory (`backend/testing`). O id opaco do dono fica no contexto de log, e a redação vale para credencial e dado
  pessoal (`infrastructure/logging`, `/diagnose`). A WatchedList aceita identidade estrutural, o domínio pode
  importar biblioteca de cálculo puro por lista nomeada (`backend/boundaries`), entra a regra `general/date-time`,
  e o VO de endereço recusa as palavras reservadas.
- **Frontend, testes e infra.** O drill-down por estado é a terceira forma de `frontend/routing`, e o `Suspense`
  também fica no guard de grupo e na rota `*`. Formulário reusado leva `key`, e componente de terceiro traz os assets
  embutidos (`frontend/forms`). O dia local sai dos componentes da data, sem `toISOString` (`frontend/helpers`). O
  spec de `Intl` compara com NBSP, o Vite 8 usa `resolve.tsconfigPaths`, a sessão do e2e entra por `addCookies`, e o
  limite de locale do `chromium-headless-shell` fica registrado (`frontend/testing`). O mock se ancora no dia real.
  O Overview do `DESIGN.md` ganha aparelhos, densidade, tema e o que evitar; a tela canônica é uma linha com a
  variante descartada e o princípio que decidiu; e, em produto de celular, a ação principal fica ao alcance do
  polegar. Os greps de `backend/boundaries` devolvem vazio, o `KNOWLEDGE-GATE` diz como ligar um check de projeto, o
  `test` da raiz é `turbo run test --`, e o `.gitignore` do `metri init` ganha `!.env.test`, o `generated/` do Prisma
  e os relatórios do Playwright.
- **Processo e lint.** O `docs-lint` avisa quando uma regra do projeto cita id de ticket e quando o código cita
  `PP-n`, um `GAP-n` fechado ou um id transitório no cabeçalho SOURCE OF TRUTH. A regra de projeto guarda o como e
  aponta o ADR (`RULE-FORMAT`). O `.metri/ARCHITECTURE.md` descreve o que existe e o que está decidido, e "Caminhos
  do projeto" sai do template até a primeira linha.

### Migrar de v1.2.1

Ticket `pattern`, na raiz do projeto:

1. `pnpm add -D github:otonydesideri/metri#v1.3.0` e `pnpm exec metri init`, que liga a skill `humanizer` e o script
   `sot`.
2. Cabeçalhos: cada dono canônico troca o cabeçalho antigo ("O quê:", "Por quê:", "SOT keywords:") pelo
   `SOURCE OF TRUTH`, logo acima do export, e todo arquivo-fonte escrito à mão ganha o seu; `pnpm sot` lista o que
   falta.
3. MATRIX: slice done com `entry` vira `status: done · sot: [<símbolos>]`; slice em andamento com `entry` devolve o
   contrato do cabeçalho ao bloco `contract` e ganha o `sot:` dos donos que já existem. Em "Caminho linear" do
   `.metri/ARCHITECTURE.md`, os passos numerados com `arquivo:símbolo` das slices construídas, com o ADR no passo que
   desvia; "Caminhos do projeto" vazio sai.
4. Tickets: o critério julgado na tela ganha `Tela:`; o e2e grava a evidência pelo `METRI_EVIDENCE` e filtra pela
   pasta; o `metrics` passa a `{ rules: <n>, tokens: <n> }`; Notas com mais de 10 linhas levam a decisão para ADR,
   regra ou cabeçalho. Para cada slice done, `pnpm exec metri prune <slice>`.
5. `@metri/ui`: os arquivos de `src/shadcn/` vão para `src/components/ui/` no lugar dos re-exports; `components.json`,
   `tsconfig.json` (`paths`) e `exports` como em `node_modules/metri/architecture/defaults/ui.md`, sem o `imports`; o
   segundo `@source` no `globals.css`; o `cn` do kit nos arquivos da CLI. No app-web, `import * as X` de primitivo
   vira import nomeado, e o `toast` vem do `sonner`, dependência do app na mesma versão do `@metri/ui`. No Biome,
   `!packages/ui/src/components/ui` em `files.includes`, com `vcs` e `css.parser.tailwindDirectives`.
6. Citação a `metri:ADR-0001` passa a `metri:ADR-0003`.
7. Com banco: a linha "Banco de desenvolvimento" em "Delegações" do `.metri/ARCHITECTURE.md`, o `db:down` quando o
   banco é container do projeto, e no `.gitignore` `!.env.test`, o `generated/` do Prisma, `test-results/` e
   `playwright-report/`. O id opaco do dono sai do `redact` do log; com sessão, o token passa a ser guardado com hash
   (as sessões abertas caem).
8. `pnpm verify` até ficar verde; o `docs-lint` e o `sot` apontam o que faltar.

## v1.2.1 (2026-09-27)

- **Revisão pós-release.** Correções no CLI (`init`, `design-tokens`, `docs-lint`, `rules-for`, `api:drift`), no
  contrato de API (DTOs de resposta com `{ codec: true }`, `<Operation>Params`), no `/accept` e em textos defasados.
- **Id de ADR global.** O ADR do pacote se cita `metri:ADR-NNNN`; `ADR-NNNN` é do projeto, em `docs/adr/`, com
  numeração própria desde 0001. O `docs-lint` procura cada id só na casa dele.
- **Migrar de v1.2.0.** No projeto, um ADR global passa a ser citado como `metri:ADR-NNNN`: `metri:ADR-0001`
  (biblioteca de UI) e `metri:ADR-0002` (contrato de API); os ADRs do projeto não mudam.

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
