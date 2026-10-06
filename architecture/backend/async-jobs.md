---
id: backend/async-jobs
description: "a construção de um job depois que a operação vira job — o contrato de fila e a implementação dele; o worker no que tem de específico, com o registro e o ciclo de vida dele; quem enfileira, o enfileiramento transacional, a entrada externa que grava antes de processar e as tarefas agendadas; a idempotência e o destino de um job que falha (retry e dead letter)."
use_when:
  - "criar job, worker ou cron novo"
  - "tirar uma operação do fluxo de quem pediu para executar depois, com garantia"
  - "enfileirar um job a partir de caso de uso ou subscriber"
  - "receber webhook ou consumir fila de um sistema externo"
  - "tornar um job idempotente ou decidir o retry e a dead letter dele"
  - "trocar a ferramenta de fila do default (por ADR)"
activation: "`backend/operation-routing.md` leva alguma operação do projeto a job ou tarefa agendada?"
applies_to:
  - "apps/app-api/src/domain/application/queues/**"
  - "apps/app-api/src/infra/jobs/**"
  - "apps/app-api/test/queues/**"
keywords: [job, worker, cron, fila, contrato de fila, enqueue, pg-boss, PgBossService, QueueDefinition, singletonKey, sendInTransaction, enfileiramento transacional, outbox, inbox, webhook, entrada externa, tarefa agendada, "@nestjs/schedule", idempotência, at-least-once, retry, retryBackoff, dead letter, dlq, redrive, expireInSeconds, onModuleInit, jobs.module.ts]
not_covered:
  - "a escolha entre job, evento, chamada direta e transação → backend/operation-routing"
  - "o processo em que os workers rodam, que é decisão de projeto (\"Capacidades ativas\") → project:ARCHITECTURE"
examples: [backend/async-jobs.examples.md]
status: active
---
# Jobs assíncronos

Como um comando sai do fluxo de quem pediu e executa depois, com garantia: o contrato de fila, o worker, o enfileiramento transacional, tarefas agendadas, idempotência e o destino de um job que falha.

**A fila é o pg-boss** (`defaults/stack.md`, "Quando precisar"): job é linha no próprio Postgres, e enfileirar pode participar da `$transaction` do Prisma. Outra ferramenta é troca de default, por ADR. O que vale com qualquer ferramenta: a escolha de job pela árvore de `backend/operation-routing.md`, o contrato de fila, o worker fino, a regra de falha e a idempotência.

**A entrega é at-least-once.** Retry, expiração de job ativo e restart reexecutam o handler, com qualquer fila: todo handler é idempotente por contrato (seção "Idempotência").

## Worker é adaptador de entrada

Worker é adaptador de entrada fino, da mesma natureza do controller e do subscriber, pela regra de `backend/application.md`: escuta a fila e dispara um caso de uso, sem regra de negócio. O mesmo `SendOrderConfirmationUseCase` pode ser chamado por um controller (admin reenviando manualmente), por um worker (job enfileirado) ou por um teste.

## Job é comando

Job é um comando: descreve uma intenção no imperativo (`generate-order-report`), o oposto simétrico do evento, que descreve um fato no particípio (`OrderConfirmedEvent`, ver "Evento não é comando" em `backend/events.md`). Quando uma operação vira job é decisão de `backend/operation-routing.md`.

## O contrato de fila

O caso de uso (ou subscriber) que enfileira não conhece pg-boss; conhece um contrato de fila do fluxo, em `src/domain/application/queues/<fluxo>-queue.contract.ts`. É uma família de contrato da camada application, como `repositories/` e `services/`: service é "faça agora, em linha"; fila é "garanta que isso acontece depois".

```ts
export type OrderReportQueueInput = {
  orderId: string;
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

- O worker extrai do payload o input do caso de uso e chama `execute()`, o espelho do subscriber de `backend/events.md` com a fila no lugar do bus.
- A regra de falha é o inverso da regra do subscriber, e o motivo é a linhagem de `backend/errors.md`: `failure(...)` esperado é erro permanente, retry não transforma "pedido não existe mais" em sucesso, então o worker loga e conclui o job. Exceção técnica é falha transitória: o worker não a captura, o throw marca o job como failed e o pg-boss retenta com backoff até a dead letter.
- `work()` do pg-boss entrega um lote de jobs; o `PgBossService` fixa lote de 1 e desembrulha, então o handler do worker recebe um input por vez.

## Quem enfileira

Três produtores, em ordem de frequência esperada:

**Subscriber, para efeito de evento que não pode se perder.** É o desenho que `backend/operation-routing.md` escolhe para esse efeito: o `handle()` do subscriber apenas chama `enqueue()` do contrato, e o worker processa com as garantias da fila. O subscriber continua engolindo erro com log; a diferença é que a janela de perda encolhe para o instante entre o commit e o enqueue.

**Caso de uso, para comando pesado ou adiável nascido no próprio fluxo.** O contrato de fila entra pelo construtor, como qualquer contrato de application, e o caso de uso decide enfileirar como parte da regra de negócio.

**Repositório, quando nem a janela entre commit e enqueue é aceitável.** Enfileirar dentro da `$transaction` faz o job e a escrita de domínio existirem ou desaparecerem juntos:

```ts
await this.prisma.$transaction(async (tx) => {
  // ...the flow's upserts, as in backend/persistence.examples.md#orderprismarepositoryimpl...
  await this.pgBoss.sendInTransaction(tx, GENERATE_ORDER_REPORT_QUEUE.name, input);
});
```

`sendInTransaction` repassa o `tx` ao pg-boss pela opção `db` (um adapter `executeSql` sobre `tx.$queryRawUnsafe(text, ...values)`). É a exceção sancionada da política de SQL cru de `backend/persistence.md`. Este é o caminho de exceção: a maioria dos efeitos tolera a janela mínima do subscriber, e o custo aqui é acoplar o repositório ao enfileiramento.

## Entrada externa: grava antes de processar

Webhook e consumo de fila externa (`backend/application.md`, "Adaptador de entrada fino") entregam um payload que não existe em mais nenhum lugar.

**Obrigatório.** O adapter de entrada grava o payload bruto numa tabela de entrada (`<origem>_inbox`) antes de chamar qualquer caso de uso, numa transação curta que só faz essa gravação, com o id de evento do remetente, quando existe, como constraint de unicidade.

**Obrigatório.** O processamento do payload gravado é um job comum, nunca em linha no handler que recebeu o request; tentativa esgotada vai para a dead letter como qualquer job.

> **Por quê.** Processar em linha faz o payload desaparecer com uma queda no meio do caminho; gravado, ele pode falhar e retentar sem o remetente reenviar.

## Tarefas agendadas

Cron é a própria fila com um agendamento: o pg-boss grava o cronograma no banco e garante um único disparo por horário entre N instâncias do app, comparando os relógios com o do banco. A tarefa agendada é um worker comum cuja fila recebe jobs por tempo, registrado no mesmo `onModuleInit`:

```ts
async onModuleInit(): Promise<void> {
  await this.pgBoss.work(CLEANUP_ABANDONED_ORDERS_QUEUE, () => this.handle());
  await this.pgBoss.schedule(CLEANUP_ABANDONED_ORDERS_QUEUE.name, '0 3 * * *');
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

- **Erro permanente** (`failure` esperado do caso de uso): sem retry. O worker loga e conclui (seção "O worker"). Retentar um "pedido não encontrado" só atrasa a fila.
- **Erro transitório** (exceção técnica): o throw marca o job como failed e o pg-boss retenta com backoff exponencial (`retryBackoff: true`). O backoff espalha a nova carga no tempo; falha transitória costuma chegar em rajada, e retry em onda sincronizada amplifica o problema que o causou.
- **Tentativas esgotadas**: o job vai para a dead letter da fila (`<fila>-dlq`), carregando a origem e o erro. Dead letter é instrumento de diagnóstico com dono, não lixeira: profundidade maior que zero é incidente a investigar, e o `redrive` do pg-boss devolve o job à fila de origem depois da causa corrigida. O alerta de profundidade segue `infrastructure/logging.md`, "Métrica, alerta e reconciliação", com janela, severidade e destino decididos pelo projeto (`.metri/ARCHITECTURE.md`).
- **Job ativo que trava**: `expireInSeconds` devolve à fila o job cujo worker morreu sem concluir. Handler que legitimamente demora mais que isso declara o próprio limite na definição da fila.

Os parâmetros de retry são decididos pelo custo de reexecutar aquele comando; os do exemplo são default.

## Registro e ciclo de vida

O `PgBossService`, em `src/infra/jobs/pg-boss.service.ts`, é o único arquivo que conhece a biblioteca, no mesmo papel que o `PrismaService` tem para o Prisma: workers e impls o recebem por injeção direta, sem contrato próprio (infra falando com infra, mesma lógica de `infrastructure/services.md`, "A regra dos níveis para um serviço de infraestrutura compartilhado").

```ts
@Injectable()
export class PgBossService implements OnModuleInit, OnModuleDestroy {
  // onModuleInit: start() on the single PgBoss instance.
  // onModuleDestroy: stop(), waiting for the active jobs to finish.
  // send / sendInTransaction / schedule: thin pass-throughs.
  // work(definition, handler): createQueue for the queue and the dead letter
  //   (idempotent at boot), then registers the handler with a batch of 1.
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

**O worker não tem spec unitário próprio**: é passthrough, como o controller, e a regra que ele dispara já está coberta pelos specs do caso de uso. O ciclo completo com fila real é assunto de e2e (pg-boss no banco de teste, polling, `waitFor` sobre o efeito), com o formato delegado ao projeto.

## Verificação rápida

- O nome da fila é o comando no imperativo, em kebab-case, igual ao arquivo do worker?
- O contrato está em `application/queues/`, com payload de ids serializável, e as duas pontas usam o mesmo `Input`?
- O worker é fino, conclui com log no `failure` esperado e deixa exceção técnica estourar para o retry?
- A definição da fila declara `deadLetter`, e os parâmetros de retry foram pensados para aquele comando?
- O handler sobrevive a reexecução (idempotência por construção, verificação de estado ou constraint)?
- Tarefa agendada computa por estado, tolerando tick perdido?
- Quem enfileira tem spec assertando o dublê da fila?
- Webhook ou consumo de fila externa grava o payload bruto antes de chamar um caso de uso, com o id de evento do remetente como constraint de unicidade quando ele existe?

## Delegado ao projeto

- **Formato do e2e com fila real.** O projeto decide o formato do e2e do ciclo completo com fila real.
