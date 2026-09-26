# Runtime da aplicação

Dono de: a montagem do app backend em runtime — o bootstrap de processo em `main.ts`, a composição no `AppModule`, o registro de providers globais (`APP_PIPE`, `APP_INTERCEPTOR`, `APP_FILTER`, `APP_GUARD`), a leitura de env e a montagem de client, o shutdown gracioso, as fronteiras de request do framework e o contexto que elas produzem, e o registro global no grafo de módulos que mantém o app dos e2e igual ao real nesses providers.

Consultar antes de: editar `main.ts` ou `app.module.ts`; registrar pipe, interceptor, filtro ou guard global; ler variável de ambiente ou montar o client de uma capacidade; criar hook de request, guard, interceptor ou filter; depender de hook de shutdown no encerramento do processo.

Não cobre: o que cada provider global faz — validação de formato e tradução de erro em `backend/errors.md`, log em `infrastructure/logging.md`; a regra dos níveis de service e o `ServicesModule` (`infrastructure/services.md`); fila, worker e o ciclo de vida do `PgBossService` (`backend/async-jobs.md`); a superfície HTTP sob `/api` (`overview.md`); o contrato de escopo do dono (`backend/access-scope.md`); o formato do e2e (`backend/testing.md`); a topologia de deploy de cada projeto (`activation.md`).

O mesmo `AppModule` sobe em dois lugares: no processo real, pelo `main.ts`, e nos e2e, por `Test.createTestingModule`, sem `main.ts` nenhum. O que o grafo de módulos registra vale nos dois; o que só o `main.ts` configura, o e2e repete na própria montagem quando depende dele (`backend/testing.md`).

## Regras

### Providers globais no grafo de módulos

**Obrigatório.** Pipe, interceptor, filtro e guard globais são registrados no grafo de módulos, com `APP_PIPE`, `APP_INTERCEPTOR`, `APP_FILTER` e `APP_GUARD` nos providers do `AppModule`.

**Proibido.** Registrar provider global pelo `main.ts` (`useGlobalPipes`, `useGlobalInterceptors`, `useGlobalFilters`, `useGlobalGuards`).

> **Por quê.** Os e2e montam o app direto do `AppModule`, sem passar pelo `main.ts`; provider global registrado no bootstrap some dos testes sem nenhum aviso, e o teste passa a provar outro app.

### O bootstrap do processo

**Obrigatório.** O `main.ts` fica só com o bootstrap que depende do processo.

### Composição no `AppModule`

Quando o endpoint é consumido por infra externa (probe, monitor), não por usuário: **Obrigatório.** Ele leva `@SkipThrottle()` e mora num `@Module` próprio importado direto no `AppModule`.

**Proibido.** Endpoint de infra externa dentro do `HttpModule`.

> **Por quê.** Ele não pertence a nenhum módulo de negócio e não deve herdar import nem provider deles.

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

## Aplicação

- O bootstrap de processo que a Source descreve cria o app sobre o `FastifyAdapter` e troca o logger do Nest (`infrastructure/logging.md`, "Bootstrap"), aplica o prefixo `/api` (`overview.md`, "Superfície HTTP") e, com a fila, chama `enableShutdownHooks()`.
- No `AppModule`, `APP_PIPE` registra o `ZodValidationPipe` composto com `toInvalidRequestException` (`backend/errors.md`), `APP_FILTER` registra o `UnexpectedErrorFilter` (`backend/errors.md`), `APP_INTERCEPTOR` registra os interceptors de log na ordem que `infrastructure/logging.md` fixa, e `APP_GUARD` registra o throttler, de que os endpoints de infra externa saem com `@SkipThrottle()`.
- O `PgBossService` (ferramenta ilustrativa, `backend/async-jobs.md`) para no `onModuleDestroy` aguardando os jobs ativos; é o caso da Source em que o runtime depende do shutdown gracioso: sem os shutdown hooks, todo deploy abandonaria jobs no meio (`backend/async-jobs.md`, "Registro e ciclo de vida").
- A fronteira que resolve o escopo do dono é uma destas peças; o contrato do escopo está em `backend/access-scope.md`.
- Os e2e montam o app pela forma de `backend/testing.md`, sem `main.ts`, repetindo o que o teste precisa do bootstrap (o prefixo `/api`; o limite de corpo, no e2e de asset de `infrastructure/storage.md`).
- O schema de env mora em `src/infra/common/env/env.validation.ts` (`overview.md`, "Onde cada arquivo mora"), um dos dois lugares de Zod de `backend/boundaries.md`.

## Verificação

- Pipe, interceptor, filtro e guard globais estão registrados com `APP_*` no `AppModule`, sem nenhum `useGlobal*` no `main.ts`?
- O `main.ts` guarda só bootstrap que depende do processo?
- Endpoint de infra externa leva `@SkipThrottle()` e mora num `@Module` próprio importado no `AppModule`, fora do `HttpModule`?
- Env lida por `EnvService.getOrThrow(...)`, sem `ConfigService`?
- O client nasce só no construtor ou num `useFactory`, nunca no top-level do arquivo?
- Runtime que depende de hook de shutdown no encerramento do processo tem os shutdown hooks habilitados no bootstrap?
- Hook, guard, interceptor e filter ficaram fora do `ServicesModule`, em `infra/common/<fronteira>/`, com o contexto viajando na request?

## Referências

- `backend/errors.md`: o pipe de validação e o filtro de erro inesperado.
- `infrastructure/logging.md`: o bootstrap do logger e os interceptors de log.
- `infrastructure/services.md`: a regra dos níveis e o `ServicesModule`.
- `backend/async-jobs.md`: o `PgBossService` e o ciclo de vida dos workers.
- `overview.md`: a superfície HTTP e o caminho de uma request.
- `backend/boundaries.md`: Zod na fronteira de env.
- `backend/testing.md`: a montagem do app nos e2e.
- `backend/access-scope.md`: o escopo que a fronteira de request resolve.
