---
id: backend/testing
description: "a pirâmide de teste do backend — spec de entidade e value object, spec de caso de uso com repositório em memória, spec de subscriber, e2e por controller contra banco Postgres isolado; a convenção de nome e execução; as factories de teste e os repositórios em memória compartilhados entre os níveis."
use_when:
  - "escrever spec de entidade, value object, caso de uso ou subscriber do backend"
  - "escrever e2e de controller, que prova o fluxo HTTP completo com tradução de erro e persistência real"
  - "criar factory de teste ou repositório em memória de um agregado"
  - "decidir se um comportamento do backend precisa de dublê novo ou reusa um existente"
applies_to:
  - "apps/app-api/src/**/*.spec.ts"
  - "apps/app-api/src/**/*.e2e-spec.ts"
  - "apps/app-api/test/**"
keywords: [spec, e2e, e2e-spec, pirâmide, factory de teste, "make<Agregado>", makePrisma, repositório em memória, InMemoryRepositoryImpl, makeInMemoryRepositories, dublê, Vitest, setup-e2e.ts, "@faker-js/faker", instanceof, waitFor, supertest, overrideProvider, setGlobalPrefix]
not_covered:
  - "o teste do frontend, com pirâmide própria → frontend/testing"
examples: [backend/testing.examples.md, starter/apps/app-api/test/setup-e2e.ts, starter/apps/app-api/vitest.config.e2e.ts, starter/apps/app-api/src/infra/common/errors/error-envelope.e2e-spec.ts]
status: active
---
# Testes

Como o backend do produto prova comportamento: os três níveis da pirâmide, o que cada um prova e onde mora, as factories e dublês compartilhados entre eles.

Os exemplos usam o domínio didático de pedidos (`order`, `customer`) de `skills/writing-for-agents/RULE-FORMAT.md`, "Domínio didático". Regra de teste que já tem casa num documento de área (query em `backend/reading.md`, worker em `backend/async-jobs.md`, dublê de infra em `infrastructure/services.md`) é referenciada aqui, nunca duplicada: este documento cobre a regra transversal, o documento de área cobre a específica.

## A pirâmide

Três níveis, do mais barato ao mais caro:

1. **Spec de entidade e value object**: puro, sem I/O, sem Nest. Prova invariante de criação e transição de estado direto na classe de domínio.
2. **Spec de caso de uso**: injeta os repositórios em memória de `test/repositories/`, sem Nest e sem banco. Prova a orquestração (leitura, regra, gravação) com dublês.
3. **E2e por controller**: app Nest inteiro, banco Postgres isolado por arquivo. Prova o fluxo HTTP completo, incluindo tradução de erro e persistência real.

Cada nível prova uma camada diferente da mesma operação; o mesmo caso de uso tem spec unitário cobrindo a regra de negócio e pode aparecer num e2e cobrindo o fluxo HTTP em volta dela, sem repetir a mesma variação de regra nos dois lugares.

| Artefato | Caminho |
| --- | --- |
| Spec de entidade | `src/domain/enterprise/<entidade>.entity.spec.ts` |
| Spec de value object | `src/domain/enterprise/value-objects/<nome>.spec.ts` |
| Spec de caso de uso | `src/domain/application/use-cases/<módulo>/<ação>.use-case.spec.ts` |
| Spec de subscriber | `src/infra/events/on-<evento>.subscriber.spec.ts` |
| Spec de função ou filtro de infra transversal | `src/infra/<caminho>/<nome>.spec.ts`, ao lado do arquivo que prova |
| E2e de controller | `src/infra/http/controllers/<módulo>/<ação>.e2e-spec.ts` |
| E2e de provider global | `src/infra/common/<fronteira>/<nome>.e2e-spec.ts`, ao lado do provider |
| Factory de teste | `test/factories/make-<agregado>.factory.ts` |
| Repositório em memória | `test/repositories/<agregado>.in-memory-repository.impl.ts` |
| Dublê da unidade de trabalho | `test/transactions/in-memory-unit-of-work.ts` |
| Registro de repositórios em memória | `test/factories/make-in-memory-repositories.factory.ts` |
| Dublê de contrato de service ou fila | `test/services/<capacidade>/fake-<contrato>.impl.ts`, `test/queues/<fluxo>.in-memory-queue.impl.ts` |
| Setup do banco isolado de e2e | `test/setup-e2e.ts` |

Paths de `src/` e `test/` são relativos ao app backend (`apps/app-api/`).

## Convenção de nome e execução

O nome do arquivo declara o nível: `*.spec.ts` para spec unitário (entidade, value object, caso de uso ou subscriber), `*.e2e-spec.ts` para e2e. Dois configs do Vitest fazem a separação: um roda `src/**/*.spec.ts` sem nenhum setup, o outro roda `src/**/*.e2e-spec.ts` com um setup que cria um banco Postgres novo por arquivo (nunca um schema novo dentro do mesmo banco: o client tipado do Prisma sempre assume o schema `public` na SQL gerada, então isolamento por schema daria falsa sensação de isolamento) e roda as migrations nele antes da suíte, dropando o banco no fim.

Os bancos do e2e ficam no Postgres de desenvolvimento (`infrastructure/runtime.md`, "Banco de desenvolvimento"), com um prefixo do projeto no nome. O `DROP DATABASE ... WITH (FORCE)` (Postgres 13+) derruba a conexão que ficou aberta, para nenhum banco de teste sobrar. O e2e usa o servidor do `DATABASE_URL` do `.env` da raiz (uma variável do ambiente vence, no CI), nunca o banco dele, e o `hookTimeout` do config de e2e cabe o `CREATE` e as migrations.

## Como criar uma factory de teste (`test/factories/make-<agregado>.factory.ts`)

Duas partes no mesmo arquivo:

- Uma função pura `make<Agregado>(override, id?)`, devolvendo a entidade em memória via `reconstitute()`, nunca `create()` (`domain/model.md`): a factory parte de estado já válido, sem repetir a validação de nascimento que o spec de entidade (seção seguinte) já prova. Valores default vêm de `@faker-js/faker`, `id` é o segundo parâmetro (com fallback para um id novo quando ausente, já que `reconstitute()` exige um), e `...override` sempre por último no objeto de props.
- Quando o agregado também precisa existir num banco real para e2e, o mesmo arquivo ganha uma classe `@Injectable() <Agregado>Factory` com `makePrisma<Agregado>()`, que chama a função pura e grava via `PrismaService` + `<Agregado>PrismaMapper.toPrisma()`.

Agregado de tabela externa não muda essa forma: a entidade dele existe, só com `reconstitute()` (`domain/model.md`, "Propriedade do agregado: quem escreve a tabela"), e a factory a devolve como a de qualquer outro. Tabela sem representação no modelo de domínio não é agregado (`domain/model.md`), e esta forma não se aplica a ela.

Exemplo completo: testing.examples.md#make-orderfactoryts

## Como criar um repositório em memória de teste (`test/repositories/<agregado>.in-memory-repository.impl.ts`)

- `<Agregado>InMemoryRepositoryImpl implements <Agregado>Repository` — nomenclatura com o agregado como prefixo, espelhando o repositório Prisma real (`backend/persistence.md`), mesmo sendo dublê de teste. Um `items: <Agregado>[] = []` público e mutável, mais qualquer array auxiliar que o contrato precise; spec arruma estado direto com `.push()`, sem passar por um método de escrita.
- Implementa só o que `<Agregado>Repository` já declara, mesma regra de método especulativo do contrato real (`backend/application.md`), nunca mais que isso.
- Todo método de escrita despacha eventos no fim, como o real (`DomainEvents.dispatchEventsForAggregate(...)`, `backend/events.md`).
- Registrado em `test/factories/make-in-memory-repositories.factory.ts` (`makeInMemoryRepositories()`), que devolve todos de uma vez para o spec desestruturar em `inMemory`.

Exemplo completo: testing.examples.md#orderinmemoryrepositoryimpl

## Como escrever spec de entidade e value object (`enterprise/<entidade>.entity.spec.ts`, `enterprise/value-objects/<nome>.spec.ts`)

- Sem repositório, sem Nest, sem I/O: instancia a classe direto e chama os métodos de domínio.
- A entidade sob prova nasce por `create()`, nunca pela factory de teste (seção "Como criar uma factory de teste"): a factory reconstitui de propósito para não pagar validação duas vezes, e é exatamente a validação de nascimento que este spec existe para provar. O que é só insumo do arranjo (a entidade filha que preenche a raiz, e que tem spec próprio) vem da factory normalmente. Mesmo princípio de "o que está sob prova não usa atalho" que separa, no e2e, a pré-condição montada por factory do fluxo HTTP real.
- Prova invariante de criação (entrada inválida vira `failure` com a classe certa) e transição de estado por método de domínio (mudança de prop, `touch()` quando a entidade tem `updatedAt`, evento registrado quando o método emite um).
- Asserção de falha é `instanceof`, nunca comparando `message` (`backend/errors.md`).

Exemplo completo: testing.examples.md#order

## Como escrever spec de caso de uso (`application/use-cases/<módulo>/<ação>.use-case.spec.ts`)

- Arrange direto no repositório em memória (`inMemory.<Agregado>Repository.items.push(...)`), sem passar por método de escrita.
- Asserção de falha por `instanceof`, nunca comparando `message` (`backend/errors.md`).

Exemplo completo: testing.examples.md#confirmorderusecase

## Como escrever spec de subscriber (`infra/events/on-<evento>.subscriber.spec.ts`)

Prova a cadeia inteira com os dublês: escrita no repositório em memória despacha, subscriber reage, caso de uso executa.

```ts
let inMemory: InMemoryRepositoriesProps;
let sendOrderConfirmation: SendOrderConfirmationUseCase;
let executeSpy: MockInstance;

beforeEach(() => {
  DomainEvents.clearHandlers();
  DomainEvents.clearMarkedAggregates();

  inMemory = makeInMemoryRepositories();
  sendOrderConfirmation = new SendOrderConfirmationUseCase(/* test doubles */);
  executeSpy = vi.spyOn(sendOrderConfirmation, 'execute');

  new OnOrderConfirmedSubscriber(sendOrderConfirmation);
});

it('envia a confirmação quando o pedido é confirmado', async () => {
  const order = makeOrder();
  order.confirm();

  await inMemory.OrderRepository.save(order);

  await waitFor(() => {
    expect(executeSpy).toHaveBeenCalled();
  });
});
```

- `clearHandlers()` e `clearMarkedAggregates()` no `beforeEach` impedem que o subscriber do teste anterior continue assinado; sem isso, cada teste dispara os handlers acumulados de todos os anteriores.
- `waitFor` (`test/utils/wait-for.ts`) reexecuta as asserções até passarem ou estourar o tempo, porque o handler é assíncrono e o despacho não espera por ele.
- A factory reconstitui e por isso não registra evento de nascimento (seção "Como criar uma factory de teste"); o teste provoca o fato que quer provar (`order.confirm()`).

## Como escrever um e2e-spec de controller (`http/controllers/<módulo>/<ação>.e2e-spec.ts`)

- Um arquivo por ação de controller, ao lado dele. `beforeAll` monta o app Nest inteiro do zero (`Test.createTestingModule`, `FastifyAdapter`, `app.setGlobalPrefix('api')`, `app.init()`, `.getHttpAdapter().getInstance().ready()`), mesmo sendo idêntico entre arquivos — nunca vira um `createTestApp()` compartilhado em `test/`. O e2e não executa `main.ts`, por isso repete o prefixo antes de `app.init()`. Toda rota, inclusive health, é chamada sob `/api`. `afterAll` fecha (`app.close()`).
- Pré-condição que o teste precisa só para chegar ao requisito real é montada por factory registrada em `providers`, sem round-trip HTTP. O fluxo HTTP completo fica reservado para o teste cuja própria mecânica é o requisito sob prova, ou que depende de um efeito colateral que a factory não reproduz. Montar a pré-condição pela API encadeia o teste ao comportamento de outra rota: quando aquela rota quebra, este teste falha por um motivo que não é o dele.
- Sem função utilitária escondendo um passo de Arrange/Act/Assert (`createOrder()`, `confirmOrder()`) — o passo fica inline no corpo do `it()`, mesmo que repita as mesmas linhas em vários arquivos, sempre que essa mecânica for o requisito sob prova. Uma factory de teste registrada em `providers` (`OrderFactory`) não é esse tipo de utilitário: grava de verdade contra a infraestrutura real, em vez de só empacotar uma sequência de chamadas HTTP que o próprio teste deveria estar exercitando. Utilitário puro sem semântica de fluxo, que só transforma um dado (`extractLink()` parseando `href` de um HTML, por exemplo), continua permitido, local ao arquivo.
- `.overrideProvider(<Contrato>).useClass(Fake<Contrato>Impl)` no `Test.createTestingModule` só entra quando o teste precisa inspecionar o que o dublê capturou; teste que só passa pelo fluxo sem checar aquele efeito não precisa do override.
- Estado que a API não alcança sozinha, ou só alcançaria com passos demais, é montado com mutação direta via Prisma, inline no `it()`, com comentário explicando o motivo quando não for óbvio.

Exemplo completo: testing.examples.md#confirm-ordere2e-spects

## E2e de provider global (`infra/common/<fronteira>/<nome>.e2e-spec.ts`)

Pipe, filtro e serializer globais são provados por um controller de prova declarado no próprio arquivo e registrado ao lado do `AppModule` (`Test.createTestingModule({ imports: [AppModule], controllers: [ProbeController] })`), com o menor DTO que exercita o provider. A montagem do app é a de "Como escrever um e2e-spec de controller".

- Nenhum controller de negócio serve de cobaia: a prova do provider não quebra quando uma rota real muda, e a rota real não ganha caso que não é dela.
- O caso afirma o envelope inteiro da resposta (`backend/errors.md`, "O formato de resposta de erro"), inclusive a recusa nativa do framework (rota inexistente).

## O que não tem spec próprio

- **Tabela declarativa de tradução de erro** (`toHttpException`): sem spec unitário; a exaustividade é garantida pela anotação `Record<DomainErrorType, ...>` no compilador e o status resultante aparece nos e2e de erro (`backend/errors.md`). O critério que separa: função ou filtro de infra com ramificação própria (`UnexpectedErrorFilter`) ganha spec unitário ao lado do arquivo; tabela pura não, porque não tem branch que um teste possa errar.
- **Contrato e implementação de query de leitura de exibição**: sem spec unitário nem dublê em memória; a prova é o e2e do controller (`backend/reading.md`, "Testes").
- **Worker de job**: sem spec unitário próprio; o formato do e2e com fila real é delegado ao projeto (`backend/async-jobs.md`, "Testes" e "Delegado ao projeto").
- **Classe de infra que fala com o vendor** (`PrismaService`, o client da fila, o client do storage): nunca tem dublê em `test/`; dublê é sempre por contrato de fluxo, e a única substituição é o stub local ao spec da impl que compõe (`infrastructure/services.md`).
- **Unidade de trabalho**: um dublê só, que roda o trabalho direto e despacha os eventos no `success`, sem regra de domínio; o estado fica nos repositórios em memória de sempre (`backend/transactions.md`).

## Verificação rápida

- O teste está no nível certo da pirâmide (entidade/VO puro, caso de uso com repositório em memória, ou e2e com banco real)?
- O nome do arquivo declara o nível (`.spec.ts` contra `.e2e-spec.ts`)?
- Spec de entidade ou value object usa `create()`, nunca a factory de teste?
- Factory de teste usa `reconstitute()`, nunca `create()`?
- Repositório em memória implementa só o que o contrato declara, despachando eventos no fim de cada escrita?
- Asserção de falha é `instanceof`, nunca comparando `message`?
- E2e: Arrange inline, sem função utilitária escondendo um passo que está sob prova?
- E2e: pré-condição montada por factory; fluxo HTTP completo só quando a mecânica dele é o requisito sob prova?
- E2e: repetiu `setGlobalPrefix('api')` antes de `app.init()` e chamou a rota sob `/api`?
- Provider global provado por um controller de prova local ao arquivo, sem cobaia de negócio?
- O que não tem spec próprio (query, worker, classe de infra) segue o documento da área certa, sem dublê inventado aqui?
