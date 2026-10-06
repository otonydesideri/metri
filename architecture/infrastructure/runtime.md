---
id: infrastructure/runtime
description: "a montagem do app backend em runtime — o bootstrap de processo em `main.ts`, a composição no `AppModule`, o registro de providers globais (`APP_PIPE`, `APP_INTERCEPTOR`, `APP_FILTER`, `APP_GUARD`), o endpoint de infra externa, a leitura de env e a montagem de client, o shutdown gracioso, as fronteiras de request do framework e o contexto que elas produzem, o registro global no grafo de módulos que mantém o app dos e2e igual ao real nesses providers, e o banco de desenvolvimento (o `.env` de cada app e pacote, o `compose.yaml`, `db:up` e `db:down`)."
use_when:
  - "editar `main.ts` ou `app.module.ts`"
  - "registrar pipe, interceptor, filtro ou guard global"
  - "ler variável de ambiente ou montar o client de uma capacidade"
  - "criar hook de request, guard, interceptor ou filter"
  - "depender de hook de shutdown no encerramento do processo"
  - "subir, trocar ou derrubar o banco de desenvolvimento (`compose.yaml`, `db:up`, `db:down`)"
applies_to:
  - "apps/app-api/src/main.ts"
  - "apps/app-api/src/app.module.ts"
  - "apps/app-api/src/infra/common/**"
keywords: [main.ts, app.module.ts, db:up, db:down, compose.yaml, docker compose, Docker, ".env", ".env.example", DATABASE_URL, "migrate dev", AppModule, APP_PIPE, APP_INTERCEPTOR, APP_FILTER, APP_GUARD, useGlobalPipes, useGlobalInterceptors, useGlobalFilters, useGlobalGuards, HttpModule, EnvService, EnvModule, getOrThrow, ConfigModule, ConfigService, validate, "@nestjs/config", dotenv, process.env, useFactory, enableShutdownHooks, shutdown gracioso, bootstrap, fronteira de request, hook de request, guard, interceptor, filter, ZodValidationPipe, UnexpectedErrorFilter, env.validation.ts, health]
not_covered:
  - "o que cada provider global faz — validação de formato e tradução de erro → backend/errors"
  - "a regra dos níveis de service e o `ServicesModule` → infrastructure/services"
  - "fila, worker e o ciclo de vida do `PgBossService` → backend/async-jobs"
  - "a superfície HTTP sob `/api` → general/http-surface"
  - "o formato do e2e → backend/testing"
  - "a topologia de deploy de cada projeto (\"Delegações\") → project:ARCHITECTURE"
examples: [infrastructure/runtime.examples.md]
status: active
---
# Runtime da aplicação

O mesmo `AppModule` sobe em dois lugares: no processo real, pelo `main.ts`, e nos e2e, por `Test.createTestingModule`, sem `main.ts` nenhum. O que o grafo de módulos registra vale nos dois; o que só o `main.ts` configura, o e2e repete na própria montagem quando depende dele (`backend/testing.md`).

## Regras

### Providers globais no grafo de módulos

**Obrigatório.** Pipe, interceptor, filtro e guard globais são registrados no grafo de módulos, com `APP_PIPE`, `APP_INTERCEPTOR`, `APP_FILTER` e `APP_GUARD` nos providers do `AppModule`.

**Proibido.** Registrar provider global pelo `main.ts` (`useGlobalPipes`, `useGlobalInterceptors`, `useGlobalFilters`, `useGlobalGuards`).

> **Por quê.** Os e2e montam o app direto do `AppModule`, sem passar pelo `main.ts`; provider global registrado no bootstrap some dos testes sem nenhum aviso, e o teste passa a provar outro app.

### O bootstrap do processo

**Obrigatório.** O `main.ts` fica só com o bootstrap que depende do processo: o prefixo `/api`, a documentação fora de produção e o `listen` na `PORT` do env.

### Composição no `AppModule`

Quando o endpoint é consumido por infra externa (probe, monitor), não por usuário: **Obrigatório.** Ele mora num `@Module` próprio importado direto no `AppModule`, como o `HealthModule`.

**Proibido.** Endpoint de infra externa dentro do `HttpModule`.

> **Por quê.** Ele não pertence a nenhum módulo de negócio e não deve herdar import nem provider deles.

### Env e montagem de client

**Obrigatório.** O `EnvModule` importa `ConfigModule.forRoot({ validate })`: o `validate` roda o `envSchema.safeParse` uma vez no boot e lança com todos os erros juntos.

Exemplo completo: runtime.examples.md#envmodule, runtime.examples.md#validate e runtime.examples.md#envservice.

**Obrigatório.** No app-api, variável de ambiente é lida só por `EnvService.getOrThrow(...)`, que envolve o `ConfigService`, nunca por `process.env`.

**Obrigatório.** O client de uma capacidade nasce dentro do construtor ou de um `useFactory`, com `EnvService` injetado; `PrismaService` e a classe de infra de qualquer capacidade seguem essa forma.

**Proibido.** Montar client no top-level do arquivo.

> **Por quê.** Um `import` executa o corpo do módulo importado antes de devolver controle a quem importou, e client montado no topo lê o env antes de o `ConfigModule` carregar o `.env`, não importa a ordem textual das linhas. O resultado falha de forma inconsistente, dependendo de quem carrega o módulo primeiro, um bug difícil de reproduzir.

### Shutdown gracioso

Quando o funcionamento correto do runtime depende de os hooks de shutdown rodarem em resposta ao encerramento do processo (o sinal de término de um deploy): **Obrigatório.** O bootstrap habilita os shutdown hooks (`app.enableShutdownHooks()`).

> **Por quê.** Sem essa habilitação, o Nest não roda os hooks de shutdown quando o processo recebe o sinal de término, e o que depende desse encerramento fica pela metade.

### Fronteiras de request

**Obrigatório.** Hook de request, guard, interceptor e filter são fronteiras do framework: ficam perto da entrada que controlam e são registrados pelo módulo dono ou pelo módulo raiz.

**Proibido.** Fronteira de request no `ServicesModule`, ou com contrato de aplicação só para seguir a forma de um sender ou storage.

**Obrigatório.** A casa dessas peças é `infra/common/<fronteira>/`: a extração do dado cru da request, o contexto que ele produz e o hook que roda antes dos controllers ficam juntos, na mesma pasta.

**Obrigatório.** A parte que é regra — normalizar, validar, decidir — vira value object no domínio ou caso de uso, que a fronteira injeta e chama.

**Obrigatório.** O contexto resultante viaja na própria request.

**Proibido.** Contexto de request guardado em singleton.

> **Por quê.** Sob concorrência, o singleton serviria o valor de uma request para outra.

### Banco de desenvolvimento

O Postgres de desenvolvimento é delegação do projeto, decidida no planejamento da fundação: o que já roda na máquina ou o do `compose.yaml` do projeto (`node_modules/metri/skills/look-across/ACTIVATION.md`, "Delegation matrix").

**Obrigatório.** Cada app ou pacote que lê env tem o próprio `.env` na sua raiz, criado do `.env.example` ao lado (`apps/app-api/.env`, `packages/db/.env`); a raiz do monorepo não tem `.env`.

**Obrigatório.** O `DATABASE_URL` do `apps/app-api/.env` e o do `packages/db/.env` apontam para o mesmo banco.

> **Por quê.** Com URLs diferentes, o app e as migrations acabam em bancos diferentes sem nenhum erro.

Com o Postgres que já roda: **Obrigatório.** Os `.env` apontam para ele, e o ticket que resolve a delegação apaga o `compose.yaml` e os scripts `db:up` e `db:down`.

Com Docker: **Obrigatório.** O `compose.yaml` da raiz, com o nome do projeto (`name:`), que todos os worktrees usam: `pnpm db:up` sobe o Postgres e espera o healthcheck, e `pnpm db:down` remove o container e guarda o volume.

**Obrigatório.** Worktree ou projeto encerrado não deixa nada rodando: os servidores que ele subiu são encerrados, e o container de um projeto encerrado sai pelo `db:down`.

> **Por quê.** Container por worktree e processo esquecido disputam porta e memória com o próximo trabalho, e um servidor velho na porta responde no lugar do novo.

O banco de cada e2e: `backend/testing.md`, "Convenção de nome e execução".

## Aplicação

- O bootstrap de processo que a Source descreve cria o app, aplica o prefixo `/api` (`general/http-surface.md`, "Superfície HTTP") e, com a fila, chama `enableShutdownHooks()`.
- No `AppModule`, `APP_PIPE` registra o `ZodValidationPipe` composto com `toInvalidRequestException` (`backend/errors.md`), `APP_FILTER` registra o `UnexpectedErrorFilter` (`backend/errors.md`) e `APP_INTERCEPTOR` registra o `ZodSerializerInterceptor` (`backend/http-api.md`).
- O `PgBossService` (a fila padrão, `backend/async-jobs.md`) para no `onModuleDestroy` aguardando os jobs ativos; é o caso da Source em que o runtime depende do shutdown gracioso: sem os shutdown hooks, todo deploy abandonaria jobs no meio (`backend/async-jobs.md`, "Registro e ciclo de vida").
- O que o e2e repete do bootstrap: o prefixo `/api` e, no e2e de asset de `infrastructure/storage.md`, o limite de corpo.
- O schema de env e o `validate` moram em `src/infra/common/env/env.validation.ts` (`backend/layers.md`, "Onde cada arquivo mora"), um dos dois lugares de Zod de `backend/boundaries.md`.
- O `@metri/db` lê o `.env` dele no `src/postgres/app/prisma.config.ts` (`import 'dotenv/config'` e `env('DATABASE_URL')` de `prisma/config`); o e2e carrega o `.env` do app-api por `dotenv/config` no `test/setup-e2e.ts` (`backend/testing.md`).
- O `compose.yaml` publica o Postgres na porta `POSTGRES_PORT`, 5432 por padrão.

## Verificação

- Pipe, interceptor, filtro e guard globais estão registrados com `APP_*` no `AppModule`, sem nenhum `useGlobal*` no `main.ts`?
- O `main.ts` guarda só bootstrap que depende do processo?
- Endpoint de infra externa mora num `@Module` próprio importado no `AppModule`, fora do `HttpModule`?
- Env validada pelo `validate` do `ConfigModule` e lida só por `EnvService.getOrThrow(...)`, sem `process.env` direto?
- O client nasce só no construtor ou num `useFactory`, nunca no top-level do arquivo?
- Runtime que depende de hook de shutdown no encerramento do processo tem os shutdown hooks habilitados no bootstrap?
- Hook, guard, interceptor e filter ficaram fora do `ServicesModule`, em `infra/common/<fronteira>/`, com o contexto viajando na request?
- Cada app e pacote tem o próprio `.env`, criado do `.env.example` ao lado, sem `.env` na raiz, e os `DATABASE_URL` apontam para o mesmo banco?
- Com Docker, há um `compose.yaml` só, com o nome do projeto, e o `pnpm db:down` remove o container? Com o Postgres que já roda, o `compose.yaml` e os scripts `db:up` e `db:down` saíram?

## Delegado ao projeto

- **CI e deploy.** O projeto decide o pipeline de CI e o deploy: a topologia de deploy em `.metri/ARCHITECTURE.md`, "Delegações", e a entrega em produção pela regra de release do projeto (`.metri/rules/infrastructure/release.md`).
