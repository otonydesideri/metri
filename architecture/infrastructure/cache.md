---
id: infrastructure/cache
description: "o cache do backend como capacidade condicional — quando introduzir, a fonte de verdade fora do cache, quem decide a semântica do que é cacheado, onde o cache mora, a forma da chave, o cache de leitura, invalidação e expiração, a falha do cache e o spec."
use_when:
  - "introduzir cache numa leitura, num cálculo ou numa chamada externa do backend"
  - "mudar a expiração (TTL) ou a invalidação de algo cacheado"
  - "escolher provider de cache"
activation: "O projeto tem necessidade medida de cache, pelo critério de `infrastructure/cache.md`?"
applies_to:
  - "apps/app-api/src/domain/application/services/cache/**"
  - "apps/app-api/src/infra/services/cache/**"
  - "apps/app-api/test/services/cache/**"
keywords: [cache, TTL, validade, invalidação, expiração, chave, namespace, versão da chave, escopo do dono, cache de leitura, cache local, provider de cache, CacheKey, CacheProviderService, OrderListCache, OrderListCacheImpl, fonte de verdade, dado velho]
not_covered:
  - "o cache de servidor do frontend, que é o do React Query → frontend/data-fetching"
  - "a query de exibição e o caminho de leitura → backend/reading"
  - "a regra dos níveis de service de infra → infrastructure/services"
  - "o mecanismo de uma invalidação que reage a outro fluxo → backend/operation-routing"
  - "o provider e os valores concretos de cada fluxo, que são delegação de projeto (\"Capacidades ativas\") → project:ARCHITECTURE"
status: active
---
# Cache

Cache é capacidade condicional: o padrão é não ter. Quando uma necessidade medida aparece, este documento já decide a forma, e o projeto escolhe o provider e os valores de cada fluxo. Nenhum provider é decidido aqui. Os exemplos usam o domínio didático de pedidos (`order`, `customer`).

## Regras

### Sem cache até a necessidade

**Padrão.** Sem cache.

Quando existe necessidade concreta e medida — custo de leitura relevante, latência mensurável, limite imposto pela origem, cálculo caro, alto volume de leitura, redução de chamadas exigida: **Permitido.** Cache, pelas regras deste documento.

**Obrigatório.** A necessidade medida que justifica cada cache é registrada na ativação dele (`.metri/ARCHITECTURE.md`).

**Proibido.** Cache preventivo, por analogia com aplicação grande, para esconder query ruim não investigada, para corrigir problema de modelagem, ou sem estratégia de invalidação ou expiração.

### Cache não é fonte de verdade

**Proibido.** Cache como fonte canônica de estado de negócio: a fonte de verdade continua na persistência (`backend/persistence.md`), e o cache pode sumir inteiro sem perda de estado.

**Proibido.** Leitura que carrega agregado para decidir e gravar passar por cache.

> **Por quê.** Decisão tomada sobre cópia velha grava o que a invariante recusaria.

### Semântica é de quem conhece o dado

**Obrigatório.** O módulo dono do dado decide o que pode ser cacheado, a chave lógica, a validade, a invalidação e a tolerância a dado velho.

**Obrigatório.** A infraestrutura implementa só o mecanismo: guardar, ler, expirar e apagar.

**Proibido.** O provider ou a classe de infra de cache decidir semântica, como uma validade padrão aplicada a tudo ou uma chave montada pelo mecanismo.

### Onde o cache mora

**Obrigatório.** O cache segue a regra dos níveis de `infrastructure/services.md`: a classe de infra do provider, sem contrato, é o único lugar que nomeia o provider, e cada uso é um contrato por fluxo em `domain/application/services/cache/<fluxo>-cache.contract.ts`, implementado em `infra/services/cache/<fluxo>-cache.impl.ts` sobre a classe de infra.

**Obrigatório.** A implementação do contrato do fluxo concentra a semântica que o módulo dono decidiu: a montagem da chave, a validade e o que apagar na invalidação.

### A chave

Forma canônica dos componentes da chave, nesta ordem:

```text
namespace + versão + escopo do dono + recurso + parâmetros
```

**Obrigatório.** A chave carrega só o que identifica o resultado, e é montada num lugar só, a implementação do contrato do fluxo.

Quando o resultado depende de quem pede: **Obrigatório.** O identificador validado de quem pede (o dono do dado) entra na chave.

> **Por quê.** Sem ele, o resultado de um dono responde ao pedido de outro.

Quando a forma do valor guardado muda: **Obrigatório.** A versão da chave sobe.

### Cache de leitura

Quando uma leitura de exibição usa cache: **Obrigatório.** O resultado é seguro para cache, o escopo do dono faz parte da chave quando o dado tem dono, a invalidação ou expiração está definida e dado velho dentro da validade é aceitável no contrato daquela leitura.

**Obrigatório.** O cache entra na implementação da query de `backend/reading.md`, que consulta o contrato de cache do fluxo antes do banco e grava nele o DTO que montou; o contrato da query e o controller não mudam.

**Obrigatório.** O contrato de cache devolve o valor no mesmo tipo que a fonte devolveria: a implementação desfaz a serialização do mecanismo, datas incluídas.

### Invalidação e expiração

**Obrigatório.** Todo cache tem estratégia explícita de invalidação ou expiração — validade (TTL), invalidação na escrita, versão da chave, ou uma combinação —, decidida pelo módulo dono.

Quando a invalidação é na escrita: **Obrigatório.** Ela acontece depois da escrita persistida, e a entrada tem também validade como teto.

> **Por quê.** Invalidar antes do commit deixa uma leitura concorrente regravar o valor velho; e uma invalidação que falha, sem teto, deixa dado velho sem prazo.

Quando o cache é local ao processo e o app roda em mais de uma instância: **Obrigatório.** A estratégia é validade ou versão, sem depender de invalidação na escrita.

> **Por quê.** A invalidação feita numa instância não alcança a memória das outras.

Quando a invalidação reage à escrita de outro fluxo: **Obrigatório.** O mecanismo sai da árvore de `backend/operation-routing.md`.

**Proibido.** Domain event criado só para invalidar cache.

### Falha do cache

**Padrão.** Falha do cache degrada para a fonte: a implementação do contrato do fluxo trata erro ou indisponibilidade do mecanismo como ausência na leitura e como operação não feita na escrita e na invalidação, loga a falha (`infrastructure/logging.md`), e o fluxo segue pela fonte.

Quando um caso exige o cache como dependência de disponibilidade: **Obrigatório.** A exceção é decisão explícita do projeto, em ADR (`skills/writing-for-agents/RULE-FORMAT.md`, "Decisões específicas de projeto").

### Spec

**Obrigatório.** A implementação do contrato do fluxo tem spec unitário ao lado do arquivo, com stub local da classe de infra, pelo critério de ramificação própria de `infrastructure/services.md`, provando que donos diferentes geram chaves diferentes, que a validade é a declarada e que a falha do mecanismo vira ausência.

**Obrigatório.** Quem invalida na escrita tem, no próprio spec, a invalidação afirmada no dublê do contrato do fluxo.

## Aplicação

O contrato de um fluxo cacheado, a listagem de pedidos:

```ts
// domain/application/services/cache/order-list-cache.contract.ts
import type { PaginatedResult } from '../../queries/pagination';
import type {
  FetchOrdersQueryInput,
  OrderListItem,
} from '../../queries/order/fetch-orders.query';

export abstract class OrderListCache {
  abstract get(
    input: FetchOrdersQueryInput,
  ): Promise<PaginatedResult<OrderListItem> | null>;

  abstract set(
    input: FetchOrdersQueryInput,
    result: PaginatedResult<OrderListItem>,
  ): Promise<void>;
}
```

A implementação concentra a semântica do fluxo, aqui só por validade:

```ts
// infra/services/cache/order-list-cache.impl.ts (excerpt)
const ORDER_LIST_CACHE_TTL_IN_SECONDS = 60;

@Injectable()
export class OrderListCacheImpl implements OrderListCache {
  private readonly logger = new Logger(OrderListCacheImpl.name);

  // infra class of the chosen provider; the real name carries the provider's
  constructor(private readonly cache: CacheProviderService) {}

  async get(input: FetchOrdersQueryInput): Promise<PaginatedResult<OrderListItem> | null> {
    try {
      const stored = await this.cache.get(this.keyOf(input));
      return stored ? reviveOrderList(stored) : null;
    } catch (error) {
      this.logger.warn(`Cache da listagem de pedidos indisponível: ${(error as Error).message}`);
      return null;
    }
  }

  // set: writes with ORDER_LIST_CACHE_TTL_IN_SECONDS and, on failure, logs and moves on

  private keyOf(input: FetchOrdersQueryInput): CacheKey {
    const key = {
      namespace: 'orders.list',
      version: 1,
      ownerScope: input.customerId,
      resource: 'orders',
      params: { status: input.status, page: input.page, pageSize: input.pageSize },
    };
    return key;
  }
}
```

A implementação da query consulta o cache antes do banco:

```ts
// infra/persistence/prisma/queries/order/fetch-orders.prisma-query.impl.ts (excerpt, with cache)
async execute(input: FetchOrdersQueryInput): Promise<PaginatedResult<OrderListItem>> {
  const cached = await this.orderListCache.get(input);
  if (cached) {
    return cached;
  }

  const result = await this.fetchFromDatabase(input);
  await this.orderListCache.set(input, result);
  return result;
}
```

- O contrato é por fluxo, nunca um `get`/`set` genérico de qualquer chave: é a regra de contrato por fluxo real de `infrastructure/services.md`.
- O escopo do dono (`customerId`) está na chave porque a listagem é de dado com dono.
- Com invalidação na escrita, o contrato ganharia o método que apaga, chamado pelo caso de uso depois do `save`, e a validade continuaria como teto.
- Contrato, implementação e registro no `ServicesModule` seguem `infrastructure/services.md`; o dublê do contrato vive em `test/services/cache/`.

## Verificação

- A necessidade medida está registrada, e nada foi cacheado por prevenção?
- A fonte de verdade continua na persistência, e nenhuma leitura que decide e grava passa pelo cache?
- A semântica (chave, validade, invalidação) está na implementação do contrato do fluxo, e o provider só aparece na classe de infra?
- A chave segue a forma canônica, com o escopo do dono quando o dado tem dono, montada num lugar só?
- Existe estratégia de invalidação ou expiração, com validade como teto quando a invalidação é na escrita, e só validade ou versão quando o cache é local ao processo com mais de uma instância?
- Nenhum domain event nasceu só para invalidar cache?
- Falha do cache degrada para a fonte, ou a dependência de disponibilidade tem ADR?
- O spec da implementação prova chaves distintas por dono, a validade e a degradação, e o spec de quem invalida afirma a invalidação no dublê?

## Referências

- `backend/reading.md`: a query de exibição que o cache envolve.
- `infrastructure/services.md`: a regra dos níveis, o registro e o dublê.
- `backend/persistence.md`: a fonte de verdade.
- `backend/operation-routing.md`: o mecanismo de uma invalidação que reage a outro fluxo.
- `infrastructure/logging.md`: o log da falha do cache.
- `skills/writing-for-agents/RULE-FORMAT.md`: casa do ADR de exceção.
- `.metri/ARCHITECTURE.md`: provider e valores concretos como decisão de projeto.
