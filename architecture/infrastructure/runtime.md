---
id: infrastructure/runtime
description: "a montagem do app backend em runtime — o bootstrap de processo em `main.ts`, a composição no `AppModule`, o registro de providers globais (`APP_PIPE`, `APP_INTERCEPTOR`, `APP_FILTER`, `APP_GUARD`), a leitura de env e a montagem de client, o shutdown gracioso, as fronteiras de request do framework e o contexto que elas produzem, o registro global no grafo de módulos que mantém o app dos e2e igual ao real nesses providers, e o banco de desenvolvimento (o `.env` da raiz, o `compose.yaml`, `db:up` e `db:down`)."
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
keywords: [main.ts, app.module.ts, TRUST_PROXY, trustProxy, X-Forwarded-For, db:up, db:down, compose.yaml, docker compose, Docker, ".env", ".env.example", DATABASE_URL, "migrate dev", AppModule, APP_PIPE, APP_INTERCEPTOR, APP_FILTER, APP_GUARD, useGlobalPipes, useGlobalInterceptors, useGlobalFilters, useGlobalGuards, "@SkipThrottle()", HttpModule, EnvService, getOrThrow, ConfigService, process.env, useFactory, enableShutdownHooks, shutdown gracioso, bootstrap, FastifyAdapter, fronteira de request, hook de request, guard, interceptor, filter, ZodValidationPipe, UnexpectedErrorFilter, throttler, env.validation.ts]
not_covered:
  - "o que cada provider global faz — validação de formato e tradução de erro → backend/errors"
  - "o que cada provider global faz — log → infrastructure/logging"
  - "a regra dos níveis de service e o `ServicesModule` → infrastructure/services"
  - "fila, worker e o ciclo de vida do `PgBossService` → backend/async-jobs"
  - "a superfície HTTP sob `/api` → general/http-surface"
  - "o contrato de escopo do dono → backend/access-scope"
  - "o formato do e2e → backend/testing"
  - "a topologia de deploy de cada projeto (\"Delegações\") → project:ARCHITECTURE"
examples: [starter/apps/app-api/src/main.ts, starter/apps/app-api/src/app.module.ts, starter/apps/app-api/src/infra/common/env/env.service.ts, starter/apps/app-api/src/infra/persistence/prisma/prisma.service.ts, starter/compose.yaml]
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

**Obrigatório.** O `main.ts` fica só com o bootstrap que depende do processo.

**Obrigatório.** O Fastify confia em `TRUST_PROXY` saltos de proxy (`trustProxy`), e o rate limit conta o IP do cliente. O número é o de proxies na frente do app-api em cada ambiente, da delegação "Topologia de deploy" (`.metri/ARCHITECTURE.md`, "Delegações"), e é 0 em desenvolvimento.

> **Por quê.** Atrás de um proxy, com 0, toda request chega com o IP do proxy e os clientes dividem uma cota só; com saltos a mais, o cliente escreve o próprio `X-Forwarded-For` e escapa do limite.

### Composição no `AppModule`

Quando o endpoint é consumido por infra externa (probe, monitor), não por usuário: **Obrigatório.** Ele leva `@SkipThrottle()` e `@Public()`, e mora num `@Module` próprio importado direto no `AppModule`.

**Proibido.** Endpoint de infra externa dentro do `HttpModule`.

> **Por quê.** Ele não pertence a nenhum módulo de negócio e não deve herdar import nem provider deles.

Quando o endpoint é redirect de protocolo que roda antes da sessão (o início e o retorno do OAuth): **Obrigatório.** Ele mora num `@Module` próprio, em `infra/auth/`, importado direto no `AppModule`, com o throttle global ligado (`backend/http-api.md`, "Contrato de API: o backend é a fonte").

> **Por quê.** É a porta que cria a sessão: não é negócio nem infra externa, e é nela que alguém tentaria força bruta.

### Env e montagem de client

**Obrigatório.** Variável de ambiente é lida por `EnvService.getOrThrow(...)`.

**Proibido.** `ConfigService`.

**Obrigatório.** O client de uma capacidade nasce dentro do construtor ou de um `useFactory`, com `EnvService` injetado; `PrismaService` e a classe de infra de qualquer capacidade seguem essa forma.

**Proibido.** Ler `process.env` ou montar client no top-level do arquivo.

> **Por quê.** Um `import` executa o corpo do módulo importado antes de devolver controle a quem importou, e leitura de `process.env` no topo roda antes do `.env` estar carregado, não importa a ordem textual das linhas. O resultado falha de forma inconsistente, dependendo de quem carrega o módulo primeiro, um bug difícil de reproduzir.

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

**Obrigatório.** Um `DATABASE_URL` só, no `.env` da raiz, lido pelo app-api, pelo `@metri/db` e pelo e2e; o `metri init` cria o `.env` a partir do `.env.example`, e nenhum app tem `.env` próprio.

> **Por quê.** Com um `.env` por pacote, o app e as migrations acabam em bancos diferentes sem nenhum erro.

**Obrigatório.** O app-api confere o banco no boot e falha em segundos quando ele não responde, com a mensagem do que fazer: subir o Postgres, criar o banco pelas migrations (`prisma migrate dev` cria o banco que falta) ou corrigir o `DATABASE_URL`.

> **Por quê.** Sem a conferência no boot, o banco fora do ar só aparece na primeira request, pelo timeout do driver.

Com o Postgres que já roda: **Obrigatório.** O `.env` aponta para ele, e o ticket que resolve a delegação apaga o `compose.yaml` e os scripts `db:up` e `db:down`.

Com Docker: **Obrigatório.** O `compose.yaml` da raiz, com o nome do projeto (`name:`), que todos os worktrees usam: `pnpm db:up` (`docker compose up -d --wait`) sobe o Postgres e espera o healthcheck, e `pnpm db:down` (`docker compose down`) remove o container e guarda o volume.

**Obrigatório.** Worktree ou projeto encerrado não deixa nada rodando: os servidores que ele subiu são encerrados, e o container de um projeto encerrado sai pelo `db:down`.

> **Por quê.** Container por worktree e processo esquecido disputam porta e memória com o próximo trabalho, e um servidor velho na porta responde no lugar do novo.

O banco de cada e2e: `backend/testing.md`, "Convenção de nome e execução".

## Aplicação

- O bootstrap de processo que a Source descreve cria o app sobre o `FastifyAdapter` e troca o logger do Nest (`infrastructure/logging.md`, "Bootstrap"), aplica o prefixo `/api` (`general/http-surface.md`, "Superfície HTTP") e, com a fila, chama `enableShutdownHooks()`.
- No `AppModule`, `APP_PIPE` registra o `ZodValidationPipe` composto com `toInvalidRequestException` (`backend/errors.md`), `APP_FILTER` registra o `UnexpectedErrorFilter` (`backend/errors.md`), `APP_INTERCEPTOR` registra o `ZodSerializerInterceptor` (`backend/http-api.md`) e os interceptors de log na ordem que `infrastructure/logging.md` fixa, e `APP_GUARD` registra o throttler e, depois dele, o guard de acesso (`backend/access-scope.md`, "Declaração por controller"), que valida a identidade quando o projeto tem dono; o endpoint de infra externa sai do throttler com `@SkipThrottle()` e do guard de acesso com `@Public()`.
- O `PgBossService` (a fila padrão, `backend/async-jobs.md`) para no `onModuleDestroy` aguardando os jobs ativos; é o caso da Source em que o runtime depende do shutdown gracioso: sem os shutdown hooks, todo deploy abandonaria jobs no meio (`backend/async-jobs.md`, "Registro e ciclo de vida").
- A fronteira que resolve o escopo do dono é uma destas peças; o contrato do escopo está em `backend/access-scope.md`.
- Os e2e montam o app pela forma de `backend/testing.md`, sem `main.ts`, repetindo o que o teste precisa do bootstrap (o prefixo `/api`; o limite de corpo, no e2e de asset de `infrastructure/storage.md`).
- O schema de env mora em `src/infra/common/env/env.validation.ts` (`backend/layers.md`, "Onde cada arquivo mora"), um dos dois lugares de Zod de `backend/boundaries.md`.

## Verificação

- Pipe, interceptor, filtro e guard globais estão registrados com `APP_*` no `AppModule`, sem nenhum `useGlobal*` no `main.ts`?
- O `main.ts` guarda só bootstrap que depende do processo, com o `trustProxy` no `TRUST_PROXY` da topologia de deploy?
- Endpoint de infra externa leva `@SkipThrottle()` e `@Public()` e mora num `@Module` próprio importado no `AppModule`, fora do `HttpModule`?
- Env lida por `EnvService.getOrThrow(...)`, sem `ConfigService`?
- O client nasce só no construtor ou num `useFactory`, nunca no top-level do arquivo?
- Runtime que depende de hook de shutdown no encerramento do processo tem os shutdown hooks habilitados no bootstrap?
- Hook, guard, interceptor e filter ficaram fora do `ServicesModule`, em `infra/common/<fronteira>/`, com o contexto viajando na request?
- O `DATABASE_URL` está só no `.env` da raiz, criado do `.env.example`?
- Com o banco fora do ar, o app-api falha no boot em segundos, dizendo o que fazer?
- Com Docker, há um `compose.yaml` só, com o nome do projeto, e o `pnpm db:down` remove o container? Com o Postgres que já roda, o `compose.yaml` e os scripts `db:up` e `db:down` saíram?

## Em aberto

- **CI e deploy.** A Source não tem regra de pipeline de CI nem de deploy. A topologia de deploy é delegação de projeto (`.metri/ARCHITECTURE.md`, "Delegações"), e a entrega em produção segue a regra de release do projeto (`.metri/rules/infrastructure/release.md`).

## Referências

- `backend/errors.md`: o pipe de validação e o filtro de erro inesperado.
- `infrastructure/logging.md`: o bootstrap do logger e os interceptors de log.
- `infrastructure/services.md`: a regra dos níveis e o `ServicesModule`.
- `backend/async-jobs.md`: o `PgBossService` e o ciclo de vida dos workers.
- `general/http-surface.md`: a superfície HTTP.
- `backend/layers.md`, "O caminho de uma request": o caminho de uma request.
- `backend/boundaries.md`: Zod na fronteira de env.
- `backend/testing.md`: a montagem do app nos e2e.
- `backend/access-scope.md`: o escopo que a fronteira de request resolve.
