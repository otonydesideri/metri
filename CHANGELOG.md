# Changelog

## v1.7.0 (2026-10-02)

O source deixa de ter ADR e de contar a própria história: a decisão mora na regra dona, o porquê para humano numa
tabela do README, e todo texto diz a regra no presente.

### O que muda

- **Sem ADR global.** Saem a pasta `adr/` do pacote, o prefixo `metri:ADR-NNNN` (docs-lint, VOCABULARY, formatos e
  skills) e a chave `adr:` das regras globais. A decisão de cada ADR já estava na regra ou no default dono dela; o
  porquê para humano e a alternativa descartada vão para "Decisões do método", no README, com a evidência do teste
  de transações numa linha. A regra mantém só o porquê que muda o comportamento do agente: o gerador do contrato
  roda do build e não pelo `tsx`, e o client gerado não valida a resposta em runtime.
- **`adr:` só na regra do projeto.** O projeto continua com `docs/adr/`, o ADR-FORMAT e a chave `adr:` nas regras
  dele. No docs-lint, `adr:` em regra global é erro, e `adr: [metri:ADR-NNNN]` em regra do projeto também.
- **Texto no presente.** `architecture/`, `skills/`, `agents/`, `starter/`, `cli/templates/` e o README deixam de
  contar história: saem as menções a piloto, os números de versão, `PP-<n>` e `GAP-<n>` com número, ids de ticket de
  projeto, "antes era", "passou a", "desde <data>" e "decisão deste ticket". Os exemplos usam `UC<f>.<n>`,
  `T<s>.<n>` e `<id>`. A seção "Validação e melhoria (piloto)" do README sai, e "Evolução futura" fica em uma tabela
  curta (item, ponto de extensão, evolução).
- **"Em aberto" vira "Delegado ao projeto".** A seção só fica quando o ponto muda o que o agente faz, e então é uma
  linha por ponto, `- **<título>.** O projeto decide <o quê>.`; o ponto que é trabalho futuro sai. A "Regra de
  transição" do RULE-FORMAT vira "Forma escrita sem instância", e "Ponto em aberto" vira "Delegado ao projeto"
  (`skills/writing-for-agents/RULE-FORMAT.md`). "Refinar uma regra existente" vira "Escrita da regra", sem o roteiro
  de migração.
- **`verify` do source: `transient-text`.** Barra, nessas pastas, `pilot` e `piloto`, número de versão (`v1.2`),
  `PP-3` e `GAP-3` com número e id de ticket (`UC1.1`, `T2.0`). Só roda no source, nunca no projeto; o projeto de
  amostra de `MATRIX-FORMAT.md` e de `SPEC-FORMAT.md` fica fora dos três últimos.
- **Humanizer.** A atribuição fica com autor, URL e licença, sem a tag da versão adaptada.
- **Feature descartada não ganha spec.** Ela vira uma linha em "Fora de escopo" do `docs/PRODUCT.md`, e `horizon:
  out` sai da spec (docs-lint: erro). A slice continua com `out`.
- **A spec não guarda estado.** `status` (draft, planned, done) sai do frontmatter da spec (docs-lint: erro): o
  estado da feature se deduz do `status` dos UCs. O /shape, o /look-across e a SPEC-FORMAT deixam de marcá-lo; o
  `horizon` fica, porque é a decisão do portão de direção, e não se deduz dos UCs.

### Migrar de v1.6.3

1. `pnpm add -D github:otonydesideri/metri#v1.7.0`.
2. Troque cada `metri:ADR-NNNN` pelo id da regra dona da decisão (`grep -rn "metri:ADR-" docs .metri AGENTS.md`):

   | Antes | Depois |
   | --- | --- |
   | `metri:ADR-0001` (biblioteca de UI padrão, superado pelo 0003) | `defaults/ui` |
   | `metri:ADR-0002` (o backend é a fonte do contrato de API) | `backend/http-api` |
   | `metri:ADR-0003` (biblioteca de UI padrão no layout do shadcn) | `defaults/ui` |

   No texto (ADR, regra, `.metri/ARCHITECTURE.md`, `docs/DESIGN.md`), escreva o id da regra no lugar do ADR. Em
   `adr:` de regra do projeto, tire o item: o campo guarda só ADR do projeto; se a regra precisa que a dona seja
   lida antes, ponha o id dela em `read_first`.
3. Regra do projeto com seção "Em aberto": o ponto que muda o que o agente faz vira uma linha em "Delegado ao
   projeto"; o que é trabalho futuro sai.
4. Em cada `.metri/specs/F<n>.md`, apague a linha `status:`. Spec com `horizon: out`: apague a spec e os arquivos
   dos UCs `draft` dela em `.metri/tickets/`, e registre a feature numa linha de "Fora de escopo" do
   `docs/PRODUCT.md`.
5. `pnpm docs-lint` verde.

## v1.6.3 (2026-10-02)

Validação da árvore de documentos: cada artefato no seu nível, com quem o escreve e quem o lê, citado pelo id e sem
repetir o vizinho.

### O que muda

- **AGENTS.md aponta para a spec.** O template ganha a linha de `.metri/specs/<F-id>.md`, e a linha da MATRIX
  deixa de citar features. A rota direta diz quem escreve o ticket: o formato de "Ticket files", e o UC entra nos
  Casos de uso da spec.
- **História em todo UC que nasce ou reabre.** O /look-across escreve a história de todo UC que cria, pela
  humanizer; quem reabre um UC sem história (/diagnose, /accept, /build) a escreve. `actor` passa a ser
  obrigatório fora de `done`, com o nome em português de um termo do CONTEXT, em minúscula. O /build e o revisor
  de contrato leem a história, e o revisor recebe também o Fora de escopo da spec.
- **Contrato migra para o cabeçalho.** O dono de uma slice leva o contrato no cabeçalho `SOURCE OF TRUTH`
  (`interface` na primeira linha, `responsibility` em WHAT, quem chama em WHERE, uma linha por invariante), e o
  /accept só poda a slice quando os cabeçalhos o carregam. Na última slice de uma feature, as Decisões de
  implementação da spec passam pelo portão de conhecimento.
- **Exceção nomeia a regra.** A linha de "Exceções e defaults trocados" nomeia o id da regra e termina no ADR (só
  assim o `rules-for` a entrega como `exceção:`); o ADR de `exception` ou `default-change` abre a Decisão com a
  regra ou o default que troca. A capacidade e a delegação entram no ARCHITECTURE.md quando o plano as ativa, e o
  /look-across escreve essa linha. Capacidade sem valor do projeto: `- <id>: —`.
- **Sem repetição entre níveis.** A spec cita o contrato pelo id, sem listar as slices; o critério de ADR mora só
  no ADR-FORMAT, e as outras skills apontam para ele; o template do DESIGN deixa de repetir valores do
  frontmatter; o DESIGN-FORMAT diz o que o `design-tokens` confere; o protótipo do /shape vai para as Notas da
  spec, e o /look-across o transforma em ticket de padrão.
- **Quem escreve.** O ticket de padrão é o único que escreve em `.metri/rules/`, `docs/adr/`, `docs/CONTEXT.md`
  e `docs/DESIGN.md`, fora do portão de conhecimento; a regra de release vem de um ticket de padrão antes do
  primeiro `release`.
- **Id com nome.** Num portão, o id vem com o nome; a tela canônica cita o princípio pelo nome; o PP-n que o
  /build relata vem com o que a regra não cobre.
- **docs-lint.** T com história é erro; UC fora de `done` sem `actor` é erro.

### Migrar de v1.6.2

1. `pnpm add -D github:otonydesideri/metri#v1.6.3`.
2. No `AGENTS.md`, troque a linha da MATRIX pelas duas do template novo (spec e plano) e acrescente à rota direta
   o trecho de quem escreve o ticket.
3. Todo UC fora de `done` tem `actor`, o nome em português de um termo do `docs/CONTEXT.md`, em minúscula.
4. Em `.metri/ARCHITECTURE.md`, "Exceções e defaults trocados": cada linha nomeia o id da regra e termina no ADR.
   Toda capacidade que um ticket aberto usa em `areas` está em "Capacidades ativas".
5. Todo ADR de `exception` ou `default-change` abre a Decisão com a regra (e a seção) ou o default que troca, e o
   escopo em que vale.
6. `pnpm docs-lint` verde.

## v1.6.2 (2026-10-02)

UC abre com uma história, e critério deixa de carregar frase de escopo.

### O que muda

- **História no UC.** Todo UC abre com uma linha logo abaixo do título, `Como <ator>, quero <ação>, para
  <benefício>.`, com o ator igual à chave `actor`; exigida só fora de `done` (UC done é histórico). T (pattern,
  task, release) nunca tem história. O /shape escreve a história ao rascunhar o UC, humanizer revisada; um UC
  nascido de split no /look-across, sem draft para herdar, ganha a sua.
- **Critério diz o que acontece.** Uma frase de escopo (`não depende de X na v1`) sai do critério e vai para a
  spec da feature, Fora de escopo; o /build passa a ler essa seção também. O crítico sem contexto do /look-across
  passa a procurar também critério repetido dentro do mesmo UC.
- **UC sem critério é erro.** `docs-lint` exige ao menos um item em Critérios em todo UC fora de `draft`, como
  já exigia no T.
- **Domain service pode ser classe.** Quando a regra tem mais de uma operação que só faz sentido junta (duas faces
  da mesma decisão, como calcular e reverter), é permitida uma classe sem estado com um método por operação, no
  lugar da função única; `abstract class`, token de injeção e registro no container continuam proibidos
  (`domain/domain-services.md`).
- **`Either` na regra que recusa.** Domain service que pode recusar devolve `Either` com a classe de erro do
  módulo, como entidade e value object (`domain/domain-services.md`, `backend/errors.md`).

### Migrar de v1.6.0

1. `pnpm add -D github:otonydesideri/metri#v1.6.2`.
2. Todo UC fora de `done`, o `draft` inclusive, ganha a história, logo abaixo do título: `Como <ator>, quero
   <ação>, para <benefício>.`, com o ator igual à chave `actor` do ticket.
3. Releia os critérios dos UCs abertos: uma frase de escopo que estiver lá migra para a spec da feature, Fora de
   escopo. Todo UC fora de `draft` tem ao menos um critério.
4. Domain service existente como função pura continua válido; a classe é só uma segunda forma.
5. `pnpm docs-lint` verde, incluindo a história dos UCs.

## v1.6.0 (2026-10-01)

Spec por feature, adaptada do `to-spec` de mattpocock/skills: a seção de uma feature na MATRIX vira o arquivo
`.metri/specs/<F-id>.md`, com o problema e a solução do ponto de vista de quem usa, os casos de uso, as decisões
de implementação e de teste, e o que fica fora de escopo.

### O que muda

- **`.metri/specs/<F-id>.md`.** Uma spec por feature (formato: `shape/SPEC-FORMAT.md`): Problema e Solução (prosa
  humanizada), Casos de uso (só ids e títulos; o ticket continua a fonte única das BRs e dos critérios), Decisões
  de implementação (módulos, interfaces, schema, contrato de API; cita o contrato de slice e o ADR pelo id, sem
  caminho de arquivo nem código, exceto um trecho de protótipo marcado como tal), Decisões de teste (o seam, o
  mais alto possível), Fora de escopo e Notas.
- **A feature sai do fluxo em três passos.** O /shape escreve a spec em `draft`, com Problema, Solução, Casos de
  uso (UCs em draft) e Fora de escopo. O /look-across preenche as Decisões de implementação e de teste de cada
  feature `now`, com o seam confirmado no portão do plano (blocos Definido/Inferido/Perguntas), e marca `planned`.
  O /accept marca `done` quando a última slice da feature é aceita; uma spec `done` é histórico, fora da cadeia
  de contexto do /build.
- **A seção Features sai do MATRIX-FORMAT.** A MATRIX fica só com slices, contratos, Fog, Gaps e Pattern
  proposals; a feature é citada pelo id, e as chaves `outcome` e `ucs` saem do VOCABULARY.
- **TDD no seam da spec.** `/build` lê, na cadeia de contexto do ticket, as Decisões de implementação e de teste
  da spec da feature do UC; a TDD testa no seam que ela nomeia.
- **`docs-lint` valida a spec.** Frontmatter e seções fixas; toda `feature:` de ticket aponta para uma spec que
  existe; todo UC listado em Casos de uso existe, e todo UC fora de draft da feature está listado; caminho de
  arquivo citado na spec é aviso, não erro.

### Migrar de v1.5.0

1. `pnpm add -D github:otonydesideri/metri#v1.6.0`.
2. Para cada feature da seção `## Features` do `.metri/MATRIX.md`, crie `.metri/specs/<F-id>.md`
   (`shape/SPEC-FORMAT.md`): `title`, `horizon` e `milestone` do bloco; `status: planned` se a feature já tem UC
   fora de `draft`, senão `draft`; Problema e Solução reescritos do `outcome`, do ponto de vista de quem usa
   (passe pela humanizer); Casos de uso com os ids e títulos de `ucs`; Decisões de implementação e de teste
   quando a feature já estiver planejada; Fora de escopo e Notas, se houver.
3. Apague a seção `## Features` do `.metri/MATRIX.md`: os blocos de `Slices` continuam como estão, com
   `consumers` citando a feature pelo id, sem o bloco dela.
4. `pnpm docs-lint` verde, incluindo o formato das specs novas.

## v1.5.0 (2026-10-01)

Transação no escopo do caso de uso: o contrato de transação vira `UnitOfWork`, `version` passa a ser o padrão de proteção de concorrência, e "policy" vira "domain service" em toda a Source.

### O que muda

- **`UnitOfWork`.** O contrato de transação, antes um por fluxo e invisível ao caso de uso, vira uma porta genérica (`run(work)`) que o caso de uso abre para ler, decidir e gravar no mesmo escopo. A infra publica o `tx` por contexto assíncrono (`backend/transactions`, "Unidade de trabalho"). O starter traz a implementação de referência — contrato, `TransactionContext`, `PrismaUnitOfWork` — sem domínio nela; o caso de uso com agregado versionado continua exemplo didático, em `backend/transactions.examples.md`.
- **`version` é o padrão.** `AggregateRoot` carrega `version` por padrão; o `save()` do repositório confere a esperada no `where`, grava a incrementada e devolve `'saved' | 'conflict'`. A condição é mecânica — nenhum critério de negócio entra no `where` junto com ela (`backend/persistence`, "Repositório").
- **Repositório recusa escrita fora do `UnitOfWork`.** A implementação lança exceção técnica quando chamada sem escopo aberto; leitura continua livre fora dele.
- **"Pai que fecha" volta.** Entrada de filho confere o pai aberto com `FOR SHARE`; o fechamento trava para escrita com `FOR UPDATE` antes de ler os filhos (`backend/transactions`, "Pai que fecha").
- **"Policy" sai; "domain service" entra.** Mesmo artefato (regra de domínio sem estado e sem IO), um nome só. `enterprise/policies/` vira `enterprise/domain-services/`, e `<regra>.policy.ts` vira `<regra>.ts`.
- **Entrada externa que não pode se perder.** Webhook e consumo de fila gravam o payload bruto numa tabela de entrada antes de chamar qualquer caso de uso, e o processamento sai por job comum (`backend/async-jobs`, "Entrada externa: grava antes de processar").
- **Teste de concorrência real.** Toda regra de negócio sobre agregado com `version` ganha um `*.concurrency.e2e-spec.ts`: N requisições simultâneas, 5 rodadas, invariante conferida no estado final do banco, com contagem de deadlock (`backend/testing`, "Teste de concorrência real"; check: `concurrency`).
- **`metri check boundaries`.** Duas fronteiras novas: `infra/` não importa `domain/enterprise/domain-services/`, e entidade não importa `domain-services/`.

### Migrar de v1.4.2

1. `pnpm add -D github:otonydesideri/metri#v1.5.0`.
2. `enterprise/policies/` vira `enterprise/domain-services/`; `<regra>.policy.ts` e `<regra>.policy.spec.ts` perdem o `.policy`; ajuste os imports. Nenhuma regra de domínio muda de comportamento, só o nome e o caminho.
3. Cada contrato de transação por fluxo (`<fluxo>.transaction.contract.ts` ou equivalente) vira uma chamada ao `UnitOfWork` único do starter: mova para dentro do `work` a leitura, a decisão e a gravação que antes aconteciam antes da chamada à transação; o repositório usado dentro do escopo passa a usar `context.client()` (leitura) ou `context.requireTx()` (escrita) no lugar do client recebido por parâmetro.
4. Agregado com escrita concorrente ganha coluna `version` (`Int @default(1)`) no schema, se ainda não tiver, e o `save()` do repositório passa a conferir e incrementar, devolvendo `'saved' | 'conflict'`, como em `backend/persistence`, "Repositório".
5. Se `AggregateRoot` do projeto não vier de `@metri/core/entities`, ou tiver sido copiado antes desta versão: adicione `version` ao construtor, como no `starter/packages/core/src/entities/aggregate-root.ts`.
6. Revise todo lugar que grava um agregado fora de um `UnitOfWork`: ou passa a abrir o escopo, ou o repositório vai lançar em produção.
7. Turno, pedido ou qualquer "pai que fecha" que hoje revalida com uma condição solta em SQL: revise contra `backend/transactions`, "Pai que fecha".
8. Webhook ou consumo de fila existente: revise contra `backend/async-jobs`, "Entrada externa: grava antes de processar", se uma entrada ainda puder se perder entre o recebimento e o processamento.
9. Para cada agregado com `version` que já tem fluxo de escrita disputada: um `*.concurrency.e2e-spec.ts` novo, como em `backend/testing`, "Teste de concorrência real".
10. `pnpm verify` verde, incluindo `metri check boundaries`.

## v1.4.2 (2026-10-01)

Os ajustes da revisão da v1.4.1 e o ambiente do projeto novo.

### O que muda

- **Proxy.** O app-api lê o `TRUST_PROXY`, os saltos de proxy confiáveis, e o rate limit conta o IP do cliente. O
  número vem da delegação "Topologia de deploy", com 0 em desenvolvimento (`infrastructure/runtime`, "O bootstrap do
  processo").
- **Erro 5xx.** Todo status 500 ou mais sai como `INTERNAL_ERROR`, com o corpo genérico; a resposta fora do DTO é 500
  (`backend/errors`, "Erro inesperado: filtro global").
- **`metri design-tokens`.** Acusa a dependência npm `cn` no `package.json` do `@metri/ui`, mesmo sem `DESIGN.md`, e
  confere o `fontFamily` de cada nível de `typography` contra o `--font-sans` ou o `--font-mono` do `@theme`.
- **`metri check`.** Os checks de fronteiras, acesso e datas saem de `scripts/` e viram `metri check <nome>`, e o
  `lint` do starter chama `metri check`. Parâmetro de check fica na chave `metri` do `package.json`
  (`checks.access-boundaries.ownerMarkers`, `checks.boundaries.domainPackages`). O script `api:drift` da raiz sai,
  porque o `metri verify` já o roda, e o starter fica sem `scripts/`.
- **Env.** O starter traz só o `.env.example`, na raiz, e o `metri init` cria o `.env` a partir dele, sem
  sobrescrever um que exista. O `.env.test` sai: o e2e tira a conexão do `.env` e cria e apaga o próprio banco.
- **Banco.** Saem o `db-up.sh` e o `db-docker.sh`, e entra o `compose.yaml`: `db:up` é `docker compose up -d
  --wait` e `db:down`, `docker compose down`. No Postgres que já roda, não há o que rodar: o `prisma migrate dev`
  cria o banco que falta, e o ticket da delegação apaga o `compose.yaml` e os dois scripts. O app-api confere o banco
  no boot e falha em segundos dizendo o que fazer, e o `/api/health` informa o banco (`database: up | down`).
- **Tela inicial.** A página `/` do app-web mostra o nome do projeto, os próximos passos (`/shape`, `/look-across` e
  `/build`), o estado real da API e do banco com os estados de leitura, o link para a documentação da API e a versão
  do metri no rodapé, com tema claro e escuro; a página não encontrada segue a mesma linha. Fora de produção, o
  app-api serve a documentação OpenAPI em `/api/docs`, do mesmo documento do `api:generate` (`backend/http-api`).
- **Fonte.** A Geist e a Geist Mono variáveis, servidas pelo projeto pelos pacotes `@fontsource-variable`, sem CDN,
  entram como token na base neutra do `DESIGN-TEMPLATE` (`Geist Variable`, `Geist Mono Variable`) e no `globals.css`
  (`defaults/ui`, "Tipografia e espaçamento").

### Migrar de v1.4.1

1. `pnpm add -D github:otonydesideri/metri#v1.4.2`.
2. `TRUST_PROXY` no `env.validation.ts`, no `.env.example` (0) e no `FastifyAdapter` do `main.ts`, como em
   `node_modules/metri/starter/`; o valor de cada ambiente entra na "Topologia de deploy" do `.metri/ARCHITECTURE.md`.
3. O `UnexpectedErrorFilter` trata todo status 500 ou mais como erro inesperado, como o do starter.
4. Sem o pacote `cn` no `packages/ui/package.json`.
5. `scripts/` vira `metri check`: `"lint": "turbo run lint && metri check"`, e saem os scripts `boundaries`,
   `access-boundaries`, `date-time` e `api:drift` e os `scripts/check-*.sh`. O marcador do dono passa a
   `"metri": { "checks": { "access-boundaries": { "ownerMarkers": ["<Dono>Owned"] } } }` no `package.json`, e o pacote
   que um ADR libera no domínio, a `checks.boundaries.domainPackages`. Uma fronteira que o projeto tinha somado ao
   `check-boundaries.sh` vira check próprio (`node_modules/metri/skills/guardrail/KNOWLEDGE-GATE.md`, "Destination").
6. O `.env.test` sai: o `vitest.config.e2e.ts` e o `test/setup-e2e.ts` como os do starter, e o `!.env.test` sai do
   `.gitignore`. O que o `.env.test` tinha de diferente no `DATABASE_URL` vai para o `.env`.
7. Banco pelo Docker: entra o `compose.yaml` do starter, com o nome do projeto no `name:` e no `POSTGRES_DB`, e o
   `POSTGRES_PORT` no `.env`; `db:up` e `db:down` como os do starter, e saem `db:docker:up`, `db:docker:down` e os
   `scripts/db-*.sh`. O container antigo sai com `docker rm -f -v <projeto>-postgres`, com os dados dele. Banco no
   Postgres que já roda: saem os scripts `db:*` e os `scripts/db-*.sh`.
8. `PrismaService`, `DatabaseHealth`, `HealthModule`, `HealthController` e o DTO do health como os do starter, e
   `pnpm api:generate`.
9. Opcional, para a tela inicial e a fonte do starter: `apps/app-web/src/pages/home/start/`,
   `apps/app-api/src/infra/http/openapi-document.ts` e o `main.ts`, com o `@fastify/static` no app-api; os
   `@fontsource-variable/geist` e `geist-mono` no `@metri/ui`, importados no `globals.css`, e o `fontFamily` do
   `docs/DESIGN.md` igual ao `--font-sans` e ao `--font-mono`, que o `design-tokens` passa a conferir.
10. `pnpm verify` verde.

## v1.4.1 (2026-09-30)

Revisão da v1.4.0 com foco no starter, por revisores isolados em cinco eixos: regras, segurança e operação, ponteiros
das regras, uso real num projeto novo e skills.

### O que muda

- **Um `DATABASE_URL`.** O `.env` e o `.env.test` ficam na raiz, lidos pelo app-api e pelo `@metri/db`
  (`prisma.config.ts`, sem o `dotenv`). Saem os `.env.example` e `.env.test` por pacote e o aviso de divergência do
  `db:up` (`infrastructure/runtime`, "Banco de desenvolvimento").
- **Domínio.** O `WatchedList` copia a lista inicial: antes, readicionar um item novo que tinha sido removido o
  deixava fora de `getNewItems()`, e o array de quem chamou mudava. O spec da entidade separa `create()` de
  `reconstitute()`.
- **Acesso.** O `AccessGuard` lê só a declaração da classe, e `@Public()` é decorator de classe. O check
  `access-boundaries` exige o marcador na linha da classe e acha o controller pelo `@Controller(`, fora dos specs:
  um `@Public()` em comentário ou um arquivo fora do padrão de nome não passam mais.
- **Fronteiras.** O check `boundaries` pega o `enterprise` importando NestJS e o domínio importando `src/infra` por
  caminho relativo.
- **Banco.** O `db:docker:up` espera o Postgres por TCP. Os scripts leem o `.env` como o Node (aspas e CR) e passam o
  nome do banco ao SQL por variável do psql.
- **app-web.** O proxy de dev segue o `PORT` do `.env` da raiz. A página inicial mostra loading e erro com o
  `Skeleton` e o `Empty`, que entram no `@metri/ui`. O `AppSplash` vira arquivo solto em `shared/components/`, a
  página não encontrada passa a `ErrorsNotFoundPage`, e o app-web depende do `sonner` na versão do `@metri/ui`.
- **Testes.** O e2e de serialização passa a `infra/common/response-serialization/`, e o guard de Arrange do e2e de
  rate limit segue `backend/testing`. O `pnpm api:drift` compara antes e depois de gerar, como o `metri verify`.
- **`metri init`.** Com o starter, um `.gitignore` que já existe ganha as linhas que faltam (o `!.env.test` e o
  client gerado), e o "Caminho linear" do `.metri/ARCHITECTURE.md` nasce com os donos do starter.
- **Regras e skills.** O ticket de design system abre a Slice 0 e bloqueia os outros, porque o `design-tokens` falha
  desde que o `/shape` escreve o `DESIGN.md`. No ACTIVATION, a sonda do banco não roda mais o `db:up`, o `.env.test`
  recebe host e porta do Postgres escolhido, e o marcador do dono vai para a "Identidade do dono". `backend/layers`,
  `backend/boundaries`, `frontend/testing`, `infrastructure/runtime`, `infrastructure/logging` e `RULE-FORMAT` deixam
  de citar o que a v1.4.0 tirou ou mudou.

### Migrar de v1.4.0

1. `pnpm add -D github:otonydesideri/metri#v1.4.1`.
2. Junte o `apps/app-api/.env` e o `packages/db/.env` num `.env` na raiz, com o `.env.example` e o `.env.test` ao
   lado. O `dev` e o `start` do app-api passam a `--env-file-if-exists=../../.env`, o `vitest.config.e2e.ts` lê
   `../../.env.test`, e o `prisma.config.ts`, o `db-up.sh` e o `db-docker.sh` seguem os de
   `node_modules/metri/starter/`.
3. No construtor do `WatchedList`, copie `initialItems` para a lista corrente e para a inicial.
4. Guard e checks de acesso e de fronteiras como no starter: `reflector.get(IS_PUBLIC_ROUTE, context.getClass())`,
   `Public(): ClassDecorator`, `scripts/check-access-boundaries.sh` e `scripts/check-boundaries.sh`.
5. Com o "Caminho linear" vazio, os passos de `node_modules/metri/cli/templates/STARTER-LINEAR-PATH.md` que o
   projeto ainda tem, com o cabeçalho `SOURCE OF TRUTH` do `bootstrap` no `main.ts`.
6. `pnpm verify` verde.

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
