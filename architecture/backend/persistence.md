# Persistência

Dono de: o repositório (contrato e implementação Prisma), o mapper, a escrita canônica do agregado (`save()`, delta da coleção filha, escrita em lote), o nome do método de escrita, a leitura em lote contra N+1, a propriedade de tabela no schema, a política de SQL cru e o outcome de persistência: como uma condição que o driver só revela na gravação vira um resultado declarado da operação.

Consultar antes de: criar ou mudar repositório, mapper ou método de contrato de persistência; escrever SQL cru; tratar violação de unicidade, registro ausente ou `where` que não casa; criar model no schema.

Não cobre: atomicidade entre agregados, contrato de transação, unit of work, concorrência e a escada de locking (`backend/transactions.md`); o mecanismo de contrato `abstract class` e o caso de uso (`backend/application.md`); a propriedade do agregado e o formato do id (`domain/model.md`); quando a coleção usa `WatchedList` (`domain/watched-list.md`); o despacho de evento depois de persistir (`backend/events.md`); a query de exibição (`backend/reading.md`); quem importa `@metri/db` e `PrismaService` (`backend/boundaries.md`); o dublê em memória (`backend/testing.md`).

Persistência é a borda entre o agregado em memória e o banco: o repositório dá acesso do tipo coleção a uma raiz de agregado, o mapper converte nos dois sentidos, e nenhuma outra camada conhece Prisma. Os exemplos usam o domínio didático de pedidos (`order`, `invoice`), com o `Order` de `domain/model.md`.

## Regras

### Repositório

**Obrigatório.** O repositório é acesso do tipo coleção a uma raiz de agregado: o contrato em `domain/application/repositories/<agregado>-repository.contract.ts`, na forma de `backend/application.md`, e a implementação em `infra/persistence/prisma/repositories/<agregado>.prisma-repository.impl.ts` (`<Agregado>PrismaRepositoryImpl`).

**Obrigatório.** Leitura devolve entidade: `findById` devolve a entidade ou `null`, e toda linha vira entidade pelo mapper.

**Proibido.** Repositório devolver dado cru.

**Obrigatório.** O repositório injeta `PrismaService`, nunca `PrismaClient` direto.

**Proibido.** A implementação de um repositório injetar ou importar outro repositório; o que cruza arquivos entre persistências é o mapper.

**Obrigatório.** Escrita de estado recebe o agregado e grava o que o mapper produz.

**Proibido.** Método de escrita que recebe id e campo em vez do agregado (`confirmOrder(orderId)`, `updateOrderStatus(orderId, status)`).

> **Por quê.** A decisão sai da entidade e vai para o repositório, onde passa a existir em duas cópias, a real e a do dublê de teste.

**Proibido.** Escrita que não é o estado do agregado carregado no contrato do repositório: outra tabela, duas linhas na mesma transação ou condição que só o banco avalia na gravação são contrato de transação (`backend/transactions.md`, "Contrato de transação").

- **Exceção.** Enfileiramento transacional de `backend/async-jobs.md`, "Quem enfileira": quando nem a janela entre o commit e o enqueue é aceitável, o job é enfileirado dentro da mesma `$transaction` da escrita, pelo caminho de exceção que aquele documento descreve.

### Mapper

**Obrigatório.** A conversão mora em `infra/persistence/prisma/mappers/<agregado>.prisma-mapper.ts` (`<Agregado>PrismaMapper`), com o agregado como prefixo e a tecnologia como sufixo, no mapper e no repositório.

> **Por quê.** O nome continua semântico por conta própria, sem depender de abrir a pasta para saber qual tecnologia implementa o contrato.

**Obrigatório.** `toPrisma()` lê a entidade pelos getters, cobre os escalares da raiz e tem o retorno anotado como `Prisma.<Model>UncheckedCreateInput`.

> **Por quê.** É a anotação que faz o compilador recusar campo fora do schema e acusar o que o schema deixa opcional. O nome declara o destino de propósito: outro mecanismo de persistência teria o próprio mapper com o próprio verbo.

**Obrigatório.** Filho de agregado tem mapper próprio, nunca contrato próprio.

Quando um filho parece precisar de contrato de repositório: **Obrigatório.** Tratá-lo como candidato a agregado; a atomicidade com a raiz passa a ser assunto de `backend/transactions.md`.

### Escrita canônica do agregado

**Obrigatório.** O `save()` grava a raiz e o delta da coleção filha numa única transação: novos por `createMany`, removidos por `deleteMany`.

**Proibido.** Reescrever a coleção filha inteira a cada gravação.

**Obrigatório.** A tabela do filho é escrita direto no `tx` da escrita da raiz, pelo mapper do filho.

> **Por quê.** Delegar a outro repositório, por qualquer mecanismo, tiraria a escrita da transação.

**Obrigatório.** O nome do método de escrita descreve o efeito dele na linha, e um método atende todos os fluxos que produzem o mesmo efeito.

> **Por quê.** Nome que carrega a ação de negócio é decisão vazando para o repositório (`domain/model.md`, "Propriedade do agregado: quem escreve a tabela") ou peça na categoria errada (`backend/transactions.md`).

**Proibido.** Upsert em escrita que precisa recusar duplicata.

> **Por quê.** Absorver a segunda gravação apaga o erro que a unicidade existe para produzir. Upsert por chave de negócio também não grava o id no ramo de atualização, e o agregado em memória deixa de ser a fonte do id da linha.

### Leitura em lote

**Obrigatório.** Leitura de N registros relacionados é em lote: o contrato ganha um método que devolve a lista de uma vez, e o consumo monta um `Map`.

**Proibido.** `findById` dentro de um laço.

> **Por quê.** É N+1 sem nenhum erro acusando.

### Propriedade de tabela no schema

**Obrigatório.** O schema Prisma de `packages/db` é dividido por módulo, `models/<módulo>.prisma`, um arquivo por módulo dono.

**Obrigatório.** Model novo entra no arquivo do módulo dono da tabela, o mesmo dono registrado na propriedade de agregados do app.

**Obrigatório.** Tabela cujo schema vem de um sistema externo mora no arquivo do módulo a que o conceito pertence, não num arquivo separado por tecnologia.

### SQL cru

**Obrigatório.** SQL cru usa `$queryRaw` com template tag, que parametriza toda interpolação.

**Proibido.** `$queryRawUnsafe`.

- **Exceção.** O adapter de enfileiramento transacional da fila no Postgres (`backend/async-jobs.md`, "Quem enfileira"): executa pelo `$queryRawUnsafe` o SQL parametrizado da própria biblioteca, sem identificador interpolado nosso.

Quando um identificador precisa variar (a unidade do `DATE_TRUNC`, uma coluna de ordenação): **Obrigatório.** Ele chega como união fechada de literais validada pelo Zod na fronteira (`z.enum(['day', 'week', 'month'])`), nunca como string livre.

### Outcome de persistência

**Obrigatório.** Sem condição que só o banco avalia na gravação, o método de escrita devolve `Promise<void>`.

Quando a escrita tem condição esperada que só o banco avalia na gravação (violação de unicidade, registro ausente, `where` que não casa): **Obrigatório.** O método devolve o outcome da própria operação, um valor comum declarado ao lado do contrato só com os resultados que aquela escrita pode de fato ter.

Quando a condição é uma só: **Permitido.** `Promise<boolean>`, com `false` significando que nada foi gravado.

Quando há mais de um resultado esperado: **Obrigatório.** União fechada local, que nomeia cada resultado (`{ status: 'confirmed' } | { status: 'not-found' } | { status: 'conflict' }`, por exemplo).

**Obrigatório.** Todo outcome diferente do sucesso significa que nada foi gravado.

**Proibido.** Outcome como `Either`, como `DomainError` ou como tipo de resultado genérico compartilhado entre contratos (um `PersistenceResult`).

**Proibido.** Método de persistência criar, devolver ou lançar `DomainError`.

> **Por quê.** Erro de domínio nasce no domínio: a persistência só sabe se a condição casou, do mesmo jeito que `findById` devolve `null` e o caso de uso é quem o nomeia como não-encontrado.

**Obrigatório.** A implementação do contrato, dentro de `infra/persistence/prisma/`, é a única que lê código do driver: reconhece o código específico da condição declarada e devolve o outcome.

**Proibido.** Outra camada ler erro do Prisma.

**Obrigatório.** O caso de uso é quem traduz o outcome na classe de `DomainError` que o nomeia (`backend/errors.md`).

**Obrigatório.** Erro do driver que o contrato não declara continua exceção técnica: lança, reverte e vira 500 (`backend/errors.md`, "Erro inesperado: filtro global").

## Aplicação

O mapper e o repositório de referência:

```ts
import { UniqueEntityID } from '@metri/core/entities';
import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Prisma,
} from '@metri/db/postgres/example';
import { OrderItem } from '../../../../domain/enterprise/order-item.entity';
import { OrderItemList } from '../../../../domain/enterprise/order-item-list';
import { Order } from '../../../../domain/enterprise/order.entity';
import type { OrderStatus } from '../../../../domain/enterprise/enums/order-status.enum';

type RawOrder = PrismaOrder & { items: PrismaOrderItem[] };

export class OrderPrismaMapper {
  static toDomain(raw: RawOrder): Order {
    const items = raw.items.map((item) =>
      OrderItem.reconstitute(
        {
          productId: new UniqueEntityID(item.productId),
          quantity: item.quantity,
          unitPriceInCents: item.unitPriceInCents,
        },
        new UniqueEntityID(item.id),
      ),
    );

    const order = Order.reconstitute(
      {
        customerId: new UniqueEntityID(raw.customerId),
        items: new OrderItemList(items),
        status: raw.status as OrderStatus,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );

    return order;
  }

  static toPrisma(order: Order): Prisma.OrderUncheckedCreateInput {
    return {
      id: order.id.toValue(),
      customerId: order.customerId.toValue(),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
```

```ts
import { Injectable } from '@nestjs/common';
import { DomainEvents } from '@metri/core/events';
import { OrderRepository } from '../../../../domain/application/repositories/order-repository.contract';
import type { Order } from '../../../../domain/enterprise/order.entity';
import { OrderItemPrismaMapper } from '../mappers/order-item.prisma-mapper';
import { OrderPrismaMapper } from '../mappers/order.prisma-mapper';
import { PrismaService } from '../prisma.service';

@Injectable()
export class OrderPrismaRepositoryImpl implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const data = await this.prisma.client.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!data) {
      return null;
    }

    const order = OrderPrismaMapper.toDomain(data);

    return order;
  }

  async findManyByIds(ids: string[]): Promise<Order[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.prisma.client.order.findMany({
      where: { id: { in: ids } },
      include: { items: true },
    });

    const orders = rows.map(OrderPrismaMapper.toDomain);

    return orders;
  }

  async save(order: Order): Promise<void> {
    const data = OrderPrismaMapper.toPrisma(order);
    const newItems = order.items.getNewItems();
    const removedItems = order.items.getRemovedItems();

    await this.prisma.client.$transaction(async (tx) => {
      await tx.order.upsert({
        where: { id: data.id },
        create: data,
        update: { status: data.status, updatedAt: data.updatedAt },
      });

      if (newItems.length > 0) {
        await tx.orderItem.createMany({
          data: newItems.map((item) => OrderItemPrismaMapper.toPrisma(item, data.id)),
        });
      }

      if (removedItems.length > 0) {
        await tx.orderItem.deleteMany({
          where: { id: { in: removedItems.map((item) => item.id.toValue()) } },
        });
      }
    });

    DomainEvents.dispatchEventsForAggregate(order.id);
  }
}
```

- `toDomain()` chama `reconstitute()`, nunca `create()`, pela regra de `domain/model.md`: linha do banco não passa de novo pela validação de nascimento.
- O delta vem de `getNewItems()`/`getRemovedItems()` da `WatchedList` (`domain/watched-list.md`), que rastreia pertencimento, não conteúdo.
- O despacho depois da transação e fora dela aplica `backend/events.md`, "A entidade registra, o repositório despacha".
- `toPrisma()` também serve à factory de teste (`make<Agregado>.factory.ts`), para gravar estado que o fluxo real levaria passos demais para alcançar; em agregado de adapter externo é ele quem monta o `create` da factory, papel que em produção pertence ao adapter. O dublê do contrato segue `backend/testing.md`, "Como criar um repositório em memória de teste".
- A coluna `id` de todo model segue o formato do id de `domain/model.md`.

A leitura em lote, num caso de uso do módulo `invoice` que precisa dos pedidos correspondentes:

```ts
const invoices = await this.invoiceRepository.findManyByCustomerId(customerId);

const orderIds = invoices.map((invoice) => invoice.orderId.toValue());
const orders = await this.orderRepository.findManyByIds(orderIds);
const orderById = new Map(orders.map((order) => [order.id.toValue(), order]));
```

Daí em diante, cada acesso é `orderById.get(...)`, sem nova consulta.

O outcome de persistência chega ao caso de uso como valor comum. Dentro de uma transação, a escrita condicional aplica este outcome pela escada de `backend/transactions.md`, "Concorrência e locking"; na idempotência de job, a violação de unicidade reconhecida vira o outcome que o caso de uso trata como sucesso (`backend/async-jobs.md`, "Idempotência").

## Verificação

- Contrato e implementação do repositório estão nos caminhos e nomes canônicos, com a implementação injetando `PrismaService` e sem importar outro repositório?
- Toda leitura devolve entidade pelo mapper, e toda escrita de estado recebe o agregado?
- `toDomain()` chama `reconstitute()`, e `toPrisma()` tem o retorno anotado com o tipo de create do Prisma?
- O `save()` grava raiz e delta na mesma transação, com o filho escrito no `tx` pelo mapper dele?
- O nome da escrita descreve o efeito na linha, e escrita que recusa duplicata não é upsert?
- Leitura de N registros é em lote, com `Map`, sem `find` em loop?
- Model novo está no `models/<módulo>.prisma` do módulo dono?
- SQL cru usa template tag, sem `$queryRawUnsafe` fora do adapter da fila, e identificador variável é união fechada?
- Escrita com condição que só o banco avalia devolve o outcome declarado (`false` ou a união que nomeia cada resultado), com o código do driver lido só na implementação, sem `Either`, `DomainError` nem tipo genérico de resultado?

## Referências

- `backend/transactions.md`: contrato de transação, concorrência e locking.
- `backend/application.md`: o mecanismo de contrato e o caso de uso.
- `domain/model.md`: entidade, `reconstitute()`, propriedade do agregado e formato do id.
- `domain/watched-list.md`: o delta da coleção filha.
- `backend/events.md`: o despacho depois de persistir.
- `backend/errors.md`: o filtro de erro inesperado e as classes de `DomainError`.
- `backend/async-jobs.md`: a exceção do `$queryRawUnsafe` e a idempotência.
- `backend/boundaries.md`: quem importa `@metri/db`.
- `backend/testing.md`: o dublê em memória e a factory.
