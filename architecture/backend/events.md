---
id: backend/events
description: "o domain event depois que a reação vira evento — a classe de evento e a granularidade dele; o registro do fato na entidade e o despacho pelo repositório depois de persistir; o subscriber no que tem de específico e a falha no handler; o bus in-process."
use_when:
  - "criar evento ou subscriber novo"
  - "registrar na entidade um fato para outro módulo reagir"
  - "tratar a falha de um handler de evento"
applies_to:
  - "apps/app-api/src/domain/enterprise/events/**"
  - "apps/app-api/src/infra/events/**"
keywords: [domain event, evento, subscriber, DomainEvent, DomainEvents, EventHandler, AggregateRoot, addDomainEvent, dispatchEventsForAggregate, setupSubscriptions, events.module.ts, bus, in-process, "@metri/core/events", clearHandlers, waitFor, particípio]
not_covered:
  - "a escolha entre evento, chamada direta, transação e job → backend/operation-routing"
examples: [backend/events.examples.md]
status: active
---
# Eventos de domínio

Como um módulo reage a um fato acontecido em outro sem acoplamento direto: o que é um domain event, como declarar, emitir, assinar e testar, e o que acontece quando um handler falha.

Os exemplos usam o domínio didático de pedidos (`order`, `notification`) de `skills/writing-for-agents/RULE-FORMAT.md`, "Domínio didático".

## O que é um domain event

Um domain event é um fato que já aconteceu no domínio e interessa a outras partes do sistema: `OrderConfirmedEvent`, `CustomerRegisteredEvent`, `PaymentReceivedEvent`. Duas propriedades definem o conceito:

- É passado e imutável. Descreve o que ocorreu, nunca o que se quer fazer.
- Não prescreve reação. Pode haver zero, um ou vários subscribers, e o emissor não conhece nenhum deles.

A diferença para uma chamada direta de contrato: na chamada direta, o caso de uso sabe quem chama, a operação acontece em linha e a falha se propaga para o fluxo principal. No evento, a entidade registra o fato e o fluxo principal segue; cada subscriber processa de forma independente, e a falha de um não afeta o emissor nem os outros.

O mecanismo é o `DomainEvents` de `@metri/core/events`, um registry estático in-process: o agregado acumula eventos, o repositório despacha depois de persistir, e cada subscriber registrado recebe o evento.

## Quando usar evento

A escolha entre evento, chamada direta, service dedicado, transação e job é de `backend/operation-routing.md`, pela árvore de decisão única de lá.

## Evento não é comando

Evento descreve o que aconteceu, no particípio: `OrderConfirmedEvent`. Comando descreve uma intenção: confirmar pedido, enviar e-mail. Comando viaja por chamada de caso de uso ou por job (`backend/async-jobs.md`), nunca pelo bus de eventos.

O erro clássico é emitir "SendOrderConfirmation" como evento. Isso é um comando com fantasia de evento: o emissor está prescrevendo a reação, o que recria o acoplamento que o evento existe para evitar. O nome certo é `OrderConfirmedEvent`, e decidir se um e-mail sai é problema do subscriber.

## Granularidade

Emitir o evento de nível mais alto que descreve o fato, não cada subpasso. Pedido que sempre nasce com itens emite `OrderCreatedEvent`; um `OrderItemAddedEvent` por item de criação não descreve fato nenhum que alguém queira assinar. O evento por item só passa a existir se o domínio ganhar um fluxo em que itens entram depois, como fato próprio.

## A classe de evento

Evento mora em `src/domain/enterprise/events/<evento>.event.ts` e implementa o contrato `DomainEvent` do core. Classe `<Agregado><FatoNoParticípio>Event`.

Exemplo completo: events.examples.md#orderconfirmedevent

Pontos-chave:

- O payload é enxuto e serializável: ids e dados resumidos que os subscribers precisam, todos `readonly`. Nunca a entidade inteira. `UniqueEntityID` e `Date` são os únicos não primitivos aceitos, porque ambos têm serialização direta. A razão é a seção "O bus é in-process, preparado para deixar de ser".
- A identidade do evento é o nome da classe: o despacho do core usa `event.constructor.name` e o registro usa `<Evento>.name`.
- Subscriber de outro módulo importa a classe direto do caminho dela: a camada `enterprise` é única e do app (`backend/modules.md`).

## A entidade registra, o repositório despacha

A emissão tem dois tempos, e a separação é o que garante que nenhum subscriber reaja a uma escrita que ainda pode falhar.

**1. A entidade registra o fato no momento em que ele acontece**, via `addDomainEvent()` (protegido, de `AggregateRoot`). Em `create()`, para o fato de nascimento; em método de domínio, para transição de estado:

```ts
public static create(
  props: Optional<OrderProps, 'status' | 'createdAt'>,
): Either<EmptyOrderError, Order> {
  // ...validation and construction from domain/model.md...
  order.addDomainEvent(new OrderCreatedEvent(order.id, order.customerId));

  return success(order);
}

public confirm(): Either<InvalidOrderStatusTransitionError, void> {
  // ...transition rule from domain/model.md...
  this.addDomainEvent(new OrderConfirmedEvent(this.id, this.props.customerId));

  return success(undefined);
}
```

`reconstitute()` nunca registra evento: a volta do banco não é um fato do domínio, é releitura de um fato antigo. Como criação e reconstituição são caminhos separados (`domain/model.md`), o evento de nascimento entra em `create()` sem nenhuma detecção de "é novo?".

**2. O repositório despacha depois de persistir, nunca antes.** Todo método de escrita termina com o despacho, fora de qualquer transação:

```ts
async save(order: Order): Promise<void> {
  // ...root and items written in one transaction (backend/persistence.md)...

  DomainEvents.dispatchEventsForAggregate(order.id);
}
```

Pontos-chave:

- Registrar não é despachar. Entre `addDomainEvent()` e o despacho, o evento só existe dentro do agregado; se o caso de uso retornar `failure(...)` antes de gravar, nenhum subscriber fica sabendo de nada.
- Dentro de um escopo de `UnitOfWork` (`backend/transactions.md`), o repositório registra o agregado no contexto em vez de despachar, e a unidade de trabalho despacha os eventos de cada agregado gravado depois do commit; num escopo desfeito, descarta-os. Cada agregado carrega os próprios eventos e cada um pode interessar a subscribers diferentes.
- O dublê em memória espelha o real também nisso: cada método de escrita de `test/repositories/` termina com o mesmo `dispatchEventsForAggregate(...)`. Sem isso, o spec unitário de subscriber não tem como provar a reação.

## Subscriber

Subscriber é adaptador de entrada (`backend/application.md`), da mesma natureza do controller: escuta o bus interno e dispara um caso de uso. Mora em `src/infra/events/on-<evento>.subscriber.ts`, classe `On<Evento>Subscriber`, implementando o contrato `EventHandler` do core.

Exemplo completo: events.examples.md#onorderconfirmedsubscriber

Pontos-chave:

- O subscriber extrai do evento o input do caso de uso e chama `execute()`; a regra da reação mora num caso de uso comum do módulo reagente.
- Vários módulos podem reagir ao mesmo evento, cada um com o próprio subscriber disparando o próprio caso de uso; nenhum sabe dos outros.
- `setupSubscriptions()` roda no construtor: instanciou, assinou. O Nest instancia ao subir o app.
- O registro no Nest é o `events.module.ts` central, na mesma lógica das listas de `http.module.ts` e `persistence.module.ts`: subscribers e os casos de uso que eles disparam entram como providers, agrupados por comentário de área. Módulo de negócio nunca ganha módulo Nest próprio (`backend/modules.md`).

## Falha no handler

O despacho do core é síncrono: `dispatchEventsForAggregate` percorre os handlers e os chama em sequência, dentro da chamada do repositório. Isso cria dois modos de falha que o subscriber precisa neutralizar:

- Handler que lança de forma síncrona propaga a exceção para dentro do método de escrita do repositório. A falha do efeito secundário derrubaria a operação principal já persistida, exatamente o que evento existe para não fazer.
- Handler `async` rejeitado sem tratamento vira unhandled rejection, invisível.

A regra: **handler nunca deixa erro escapar**. O `handle()` do subscriber envolve tudo em `try/catch`, loga e engole, como no exemplo acima. `failure` esperado do caso de uso e exceção técnica recebem o mesmo destino: log e fim. Assim a falha de um subscriber não afeta o emissor nem os outros subscribers, por construção.

Engolir com log é a estratégia para efeito em que a perda é tolerável e visível. O destino do efeito que não tolera essa perda (o job enfileirado pelo subscriber) e a compensação do efeito pós-commit que falha são decisão de `backend/operation-routing.md`, "Efeito pós-commit que falha".

## O bus é in-process, preparado para deixar de ser

Emissor e subscribers vivem no mesmo processo Node. Um bus distribuído só entra com processos separados; o payload serializável é o que deixa a classe de evento e o subscriber intactos nessa troca, e nenhum outro código a antecipa.

## Testes

O formato do spec de subscriber (dublês, `waitFor`, limpeza de handlers no `beforeEach`) está em `backend/testing.md`.

**E2e**: o spec que prova uma reação de evento usa o mesmo `waitFor` sobre o efeito observável.

## Verificação rápida

- O nome está no particípio e descreve o que aconteceu, não a reação desejada?
- A classe está em `enterprise/events/`, com payload enxuto, serializável e `readonly`?
- O registro acontece na entidade (`create()` ou método de domínio), nunca em caso de uso ou controller?
- Todo método de escrita do repositório (Prisma e dublê) termina com `dispatchEventsForAggregate(...)`, fora da transação?
- O subscriber é fino, registrado em `events.module.ts`, e o `handle()` não deixa erro escapar?
- O spec de subscriber limpa os handlers no `beforeEach` e usa `waitFor`?
