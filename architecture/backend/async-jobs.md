---
id: backend/async-jobs
description: "a construção de um job depois que a operação vira job — o contrato de fila e a implementação dele; o worker no que tem de específico, com o registro e o ciclo de vida dele; quem enfileira, o enfileiramento transacional e as tarefas agendadas; a idempotência e o destino de um job que falha (retry e dead letter)."
use_when:
  - "criar job, worker ou cron novo"
  - "tirar uma operação do fluxo de quem pediu para executar depois, com garantia"
  - "enfileirar um job a partir de caso de uso ou subscriber"
  - "tornar um job idempotente ou decidir o retry e a dead letter dele"
  - "escolher a ferramenta de fila"
applies_to:
  - "apps/app-api/src/domain/application/queues/**"
  - "apps/app-api/src/infra/jobs/**"
  - "apps/app-api/test/queues/**"
keywords: [job, worker, cron, fila, contrato de fila, enqueue, pg-boss, PgBossService, QueueDefinition, singletonKey, sendInTransaction, enfileiramento transacional, outbox, tarefa agendada, "@nestjs/schedule", idempotência, at-least-once, retry, retryBackoff, dead letter, dlq, redrive, expireInSeconds, onModuleInit, jobs.module.ts, BullMQ]
not_covered:
  - "a escolha entre job, evento, chamada direta e transação → backend/operation-routing"
examples: [backend/async-jobs.examples.md]
adr: [ADR-0001, ADR-0002, ADR-0003, ADR-0004]
status: active
---
# Jobs assíncronos

Como um comando sai do fluxo de quem pediu e executa depois, com garantia: o contrato de fila, o worker, o enfileiramento transacional, tarefas agendadas, idempotência e o destino de um job que falha.

Os exemplos usam o domínio didático de pedidos (`order`, `notification`) de `methodology/authoring.md`, "Domínio didático".

**A ferramenta de fila não está decidida.** Os exemplos usam pg-boss (fila no Postgres) como referência concreta, porque padrão de construção sem implementação real não fica específico; pg-boss aqui é ilustração, não decisão nem favorito. A escolha é delegação de projeto (`docs/architecture/INDEX.md`, "Matriz de delegações"), feita com o primeiro job ou cron, contra o cenário concreto: volume medido, tolerância a perda do efeito, infra disponível no momento, candidatos da seção "A referência dos exemplos: fila no Postgres (pg-boss)". O que já vale independente de ferramenta: a escolha de job pela árvore de `backend/operation-routing.md`, o contrato de fila, o worker fino, a regra de falha e a idempotência. Quando a ferramenta escolhida pede forma que este documento não tem, a forma entra aqui antes do código.

## Worker é adaptador de entrada

Worker é adaptador de entrada fino, da mesma natureza do controller e do subscriber, pela regra de `backend/application.md`: escuta a fila e dispara um caso de uso, sem regra de negócio. O mesmo `SendOrderConfirmationUseCase` pode ser chamado por um controller (admin reenviando manualmente), por um worker (job enfileirado) ou por um teste.

## Job é comando

Job é um comando: descreve uma intenção no imperativo (`generate-order-report`), o oposto simétrico do evento, que descreve um fato no particípio (`OrderConfirmedEvent`, ver "Evento não é comando" em `backend/events.md`). Quando uma operação vira job é decisão de `backend/operation-routing.md`; este documento define o job depois que a árvore de lá chega nele.

## A referência dos exemplos: fila no Postgres (pg-boss)

A referência é o [pg-boss](https://github.com/timgit/pg-boss): jobs são linhas em tabelas do próprio Postgres do produto, reivindicadas com `SELECT ... FOR UPDATE SKIP LOCKED`, e os workers rodam dentro do processo do app. Três razões fazem dela a referência:

- Zero infra nova: nenhum broker para operar, configurar persistência ou monitorar separado.
- Enfileirar pode participar da `$transaction` do Prisma. Isso dissolve o problema clássico das duas escritas (job enfileirado antes do commit roda sem os dados; crash depois do commit perde o trabalho em silêncio) sem precisar de tabela de outbox com drenador próprio.
- Retry com backoff, dead letter com redrive, cron e deduplicação são nativos, e um job é uma linha: inspecionável com SQL, sem dashboard obrigatório.

O custo dessa família é o teto de throughput: a fila compete com o banco por WAL e vacuum, e a conta muda na casa de milhares de jobs por minuto sustentados.

**A entrega é at-least-once.** O pg-boss garante que dois workers nunca pegam o mesmo job ao mesmo tempo, mas o ciclo completo continua at-least-once: retry, expiração de job ativo e restart reexecutam o handler. Isso não é particularidade da referência; vale para qualquer fila. Todo handler é idempotente por contrato (seção "Idempotência").

**O que a decisão final não muda.** O contrato de fila e o worker fino permanecem com qualquer ferramenta; muda o transporte por trás do `PgBossService`, ou do serviço equivalente que o substituir. Os demais candidatos e o cenário de cada um: BullMQ com milhares de jobs por minuto sustentados ou Redis já na infra por outro motivo (fila fora do banco exige outbox próprio para o enfileiramento com garantia); durable execution (Inngest, Trigger.dev, Temporal) quando o problema for workflow longo multi-etapas, com espera de dias e compensação entre passos; broker (Kafka, RabbitMQ) é transporte de eventos entre processos e pertence à decisão de bus distribuído de `backend/events.md`, não a esta.

## O contrato de fila

O caso de uso (ou subscriber) que enfileira não conhece pg-boss; conhece um contrato de fila do fluxo, em `src/domain/application/queues/<fluxo>-queue.contract.ts`. É uma família de contrato da camada application, como `repositories/` e `services/`: service é "faça agora, em linha"; fila é "garanta que isso acontece depois".

```ts
export type OrderReportQueueInput = {
  orderId: string;
  customerId: string;
};

export abstract class OrderReportQueue {
  abstract enqueue(input: OrderReportQueueInput): Promise<void>;
}
```

Pontos-chave:

- O payload é enxuto e serializável: ids e dados mínimos, primitivos. Nunca a entidade. O worker recarrega o estado atual na execução; estado serializado no job envelhece na fila. Mesma razão do payload de evento em `backend/events.md`.
- O `Input` do contrato é o tipo do payload nas duas pontas: a implementação envia e o worker recebe o mesmo tipo, sem interface duplicada.

## A implementação do contrato

Mora em `src/infra/jobs/<fluxo>.pg-boss-queue.impl.ts`, espelhando o `<agregado>.prisma-repository.impl.ts` da persistência. É fina: repassa o input para a fila do job.

Exemplo completo: async-jobs.examples.md#orderreportpgbossqueueimpl

`singletonKey` deduplica na origem: enquanto existir job pendente com a mesma chave, enfileirar de novo não cria segundo job. É a primeira linha de defesa contra duplicação; a segunda é a idempotência do handler.

## O worker

Mora em `src/infra/jobs/<job>.worker.ts`, classe `<Job>Worker`. O nome da fila é o nome do comando em kebab-case, igual ao arquivo. A definição da fila (retry, dead letter) vive como constante exportada no arquivo do worker, que é quem conhece o custo de reexecutar.

Exemplo completo: async-jobs.examples.md#generateorderreportworker

Pontos-chave:

- O worker é o adaptador fino de `backend/application.md`: extrai do payload o input do caso de uso e chama `execute()`. É o espelho do subscriber de `backend/events.md`, com a fila no lugar do bus.
- A regra de falha é o inverso da regra do subscriber, e o motivo é a linhagem de `backend/errors.md`: `failure(...)` esperado é erro permanente, retry não transforma "pedido não existe mais" em sucesso, então o worker loga e conclui o job. Exceção técnica é falha transitória: o worker não a captura, o throw marca o job como failed e o pg-boss retenta com backoff até a dead letter.
- `work()` do pg-boss entrega um lote de jobs; o `PgBossService` fixa lote de 1 e desembrulha, então o handler do worker recebe um input por vez.

## Quem enfileira

Três produtores, em ordem de frequência esperada:

**Subscriber, para efeito de evento que não pode se perder.** É o desenho que `backend/operation-routing.md` escolhe para esse efeito: o `handle()` do subscriber apenas chama `enqueue()` do contrato, e o worker processa com as garantias da fila. O subscriber continua engolindo erro com log; a diferença é que a janela de perda encolhe para o instante entre o commit e o enqueue.

**Caso de uso, para comando pesado ou adiável nascido no próprio fluxo.** O contrato de fila entra pelo construtor, como qualquer contrato de application, e o caso de uso decide enfileirar como parte da regra de negócio.

**Repositório, quando nem a janela entre commit e enqueue é aceitável.** Enfileirar dentro da `$transaction` faz o job e a escrita de domínio existirem ou desaparecerem juntos:

```ts
await this.prisma.client.$transaction(async (tx) => {
  // ...upserts do fluxo, como em backend/persistence.examples.md#orderprismarepositoryimpl...
  await this.pgBoss.sendInTransaction(tx, GENERATE_ORDER_REPORT_QUEUE.name, input);
});
```

`sendInTransaction` repassa o `tx` ao pg-boss pela opção `db` (um adapter `executeSql` sobre `tx.$queryRawUnsafe(text, ...values)`). É a exceção sancionada da política de SQL cru de `backend/persistence.md`: o SQL vem da biblioteca, parametrizado, sem identificador interpolado nosso. Job inserido na transação só fica visível para workers depois do commit, e some junto no rollback. Este é o caminho de exceção: a maioria dos efeitos tolera a janela mínima do subscriber, e o custo aqui é acoplar o repositório ao enfileiramento. Usar só quando a perda for inaceitável mesmo entre o commit e o enqueue. O mecanismo mostrado supõe a fila no próprio Postgres; ferramenta de outra família troca este caminho por uma tabela de outbox com processo drenador, desenhada junto com a decisão.

## Tarefas agendadas

Cron é a própria fila com um agendamento: o pg-boss grava o cronograma no banco e garante um único disparo por horário entre N instâncias do app, comparando os relógios com o do banco. Não existe scheduler como artefato separado; a tarefa agendada é um worker comum cuja fila recebe jobs por tempo, registrado no mesmo `onModuleInit`:

```ts
async onModuleInit(): Promise<void> {
  await this.pgBoss.work(CLEANUP_ABANDONED_ORDERS_QUEUE, () => this.handle());
  await this.pgBoss.schedule(CLEANUP_ABANDONED_ORDERS_QUEUE.name, '0 3 * * *', {
    tz: 'America/Sao_Paulo',
  });
}
```

Pontos-chave:

- `@nestjs/schedule` não entra: cron por decorator dispara em cada instância do app (exigiria lock distribuído para deduplicar) e não tem persistência nem retry. A fila dá as três coisas sem mecanismo extra.
- O disparo depende de haver ao menos uma instância de pé no horário; um tick pode se perder num deploy ou numa queda. Por isso tarefa agendada computa por estado, não por instante: "processa tudo o que está pendente desde a última execução", nunca "processa o que aconteceu às 3h". Um tick perdido é compensado pelo seguinte.
- O handler de cron segue as mesmas regras de qualquer worker: fino, idempotente, dispara caso de uso.

## Idempotência

Reexecutar qualquer handler é cenário normal de operação, não edge case. As técnicas, em ordem de preferência:

1. Operação naturalmente idempotente: upsert, valor absoluto em vez de incremento, deleção por critério. A segunda execução produz o mesmo estado.
2. Verificação de estado antes do efeito: o caso de uso recarrega o agregado e sai cedo se o fato já foi tratado (relatório já gerado, pedido cancelado). É a forma que o retorno `failure(...)` esperado já induz.
3. Unique constraint no banco do efeito, quando o efeito é uma escrita nossa: a segunda execução viola a constraint, a implementação da escrita reconhece a violação e devolve o outcome que declara para ela, e o caso de uso trata esse outcome como sucesso (`backend/persistence.md`, "Outcome de persistência"). A violação não escapa como exceção técnica, que pela regra de falha do worker iria para retry e dead letter por um efeito que já aconteceu.
4. `singletonKey` na origem, contra duplicação de enfileiramento (seção "A implementação do contrato"). Reduz duplicatas, não substitui as técnicas acima: dedup na origem não protege contra reexecução por retry.

Efeito externo sem idempotência natural (e-mail, cobrança) combina 2 com o registro do efeito no nosso banco na mesma operação que o executa.

## Falha, retry e dead letter

O ciclo de vida da falha, com os papéis de cada peça:

- **Erro permanente** (`failure` esperado do caso de uso): sem retry. O worker loga e conclui (seção "O worker"). Queimar cinco tentativas num "pedido não encontrado" só atrasa a fila.
- **Erro transitório** (exceção técnica): o throw marca o job como failed e o pg-boss retenta com backoff exponencial (`retryDelay: 5` com `retryBackoff: true` espera 5s, 10s, 20s, 40s, 80s). O backoff espalha a nova carga no tempo; falha transitória costuma chegar em rajada, e retry em onda sincronizada amplifica o problema que o causou.
- **Tentativas esgotadas**: o job vai para a dead letter da fila (`<fila>-dlq`), carregando a origem e o erro. Dead letter é instrumento de diagnóstico com dono, não lixeira: profundidade maior que zero é incidente a investigar, e o `redrive` do pg-boss devolve o job à fila de origem depois da causa corrigida. O alerta de profundidade segue `infrastructure/observability.md`, com janela, severidade e destino decididos pelo projeto (`docs/architecture/INDEX.md`).
- **Job ativo que trava**: `expireInSeconds` (default de 15 minutos) devolve à fila o job cujo worker morreu sem concluir. Handler que legitimamente demora mais que isso declara o próprio limite na definição da fila.

Parâmetros de retry são por fila, na constante do worker, decididos pelo custo de reexecutar aquele comando; os valores do exemplo são ponto de partida, não regra.

## Registro e ciclo de vida

O `PgBossService`, em `src/infra/jobs/pg-boss.service.ts`, é o único arquivo que conhece a biblioteca, no mesmo papel que o `PrismaService` tem para o Prisma: workers e impls o recebem por injeção direta, sem contrato próprio (infra falando com infra, mesma lógica de `infrastructure/services.md`, "A regra dos níveis para um serviço de infraestrutura compartilhado").

```ts
@Injectable()
export class PgBossService implements OnModuleInit, OnModuleDestroy {
  // onModuleInit: start() da instância única do PgBoss.
  // onModuleDestroy: stop() aguardando os jobs ativos terminarem.
  // send / sendInTransaction / schedule: repasses finos.
  // work(definition, handler): createQueue da fila e da dead letter
  //   (idempotente no boot), depois registra o handler com lote de 1.
}
```

O registro no Nest é o `jobs.module.ts` central, na mesma lógica de `events.module.ts` e `persistence.module.ts`: `PgBossService`, impls de fila, workers e os casos de uso que eles disparam entram como providers, agrupados por comentário de área. O `stop()` do `onModuleDestroy` depende do shutdown gracioso habilitado no bootstrap (`infrastructure/runtime.md`, "Shutdown gracioso"); sem ele, todo deploy abandona jobs no meio.

## Testes

**Dublê do contrato de fila** em `test/queues/<fluxo>.in-memory-queue.impl.ts`, espelhando os repositórios em memória: `enqueue()` acumula os inputs numa lista pública `items`.

**Spec de quem enfileira** prova que o comando entrou na fila, não que ele executou. Para o subscriber, é o mesmo formato do spec de subscriber de `backend/testing.md`, com a asserção no dublê:

```ts
it('enfileira o relatório quando o pedido é confirmado', async () => {
  const order = makeOrder();
  order.confirm();

  await inMemory.OrderRepository.save(order);

  await waitFor(() => {
    expect(orderReportQueue.items).toHaveLength(1);
  });
});
```

Para caso de uso que enfileira, a asserção nos `items` entra no spec unitário comum, sem `waitFor`.

**O worker não tem spec unitário próprio**: é passthrough, como o controller, e a regra que ele dispara já está coberta pelos specs do caso de uso. O ciclo completo com fila real é assunto de e2e, e o formato (pg-boss no banco de teste, polling, `waitFor` sobre o efeito) fecha com o primeiro job real do produto.

## Verificação rápida

- O nome da fila é o comando no imperativo, em kebab-case, igual ao arquivo do worker?
- O contrato está em `application/queues/`, com payload de ids serializável, e as duas pontas usam o mesmo `Input`?
- O worker é fino, conclui com log no `failure` esperado e deixa exceção técnica estourar para o retry?
- A definição da fila declara `deadLetter`, e os parâmetros de retry foram pensados para aquele comando?
- O handler sobrevive a reexecução (idempotência por construção, verificação de estado ou constraint)?
- Tarefa agendada computa por estado, tolerando tick perdido?
- Quem enfileira tem spec assertando o dublê da fila?

**Pontos em aberto:**

- Em aberto: Ferramenta de fila e formato do e2e com fila real (ADR-0001)
- Em aberto: `failure` esperado que exige intervenção humana (ADR-0002)
- Em aberto: Forma do enfileiramento transacional (ADR-0003)
- Em aberto: App de worker dedicado (ADR-0004)
