---
id: backend/layers
description: "as camadas do backend (layer-first) — `domain/` e `infra/` como únicas pastas na raiz de `src/`, módulo como pasta dentro de cada camada, o que cada camada pode conhecer —, os princípios não negociáveis de camada e onde cada arquivo mora."
use_when:
  - "decidir em qual camada do backend uma regra entra"
  - "criar arquivo novo no app backend"
applies_to:
  - "apps/app-api/src/**"
  - "apps/app-api/test/**"
not_covered:
  - "fronteiras de import → backend/boundaries"
  - "estrutura de módulo e comunicação entre módulos → backend/modules"
status: active
---
# Camadas do backend

## As camadas do backend (layer-first)

Um app backend tem duas camadas de primeiro nível, e módulo é pasta dentro de cada camada:

```txt
src/
├── domain/
│   ├── enterprise/              # entidades e value objects: TypeScript puro
│   └── application/
│       ├── use-cases/<módulo>/  # casos de uso
│       ├── queries/<módulo>/    # contratos e DTOs de leitura de exibição
│       ├── repositories/        # contratos de repositório (abstract class)
│       ├── transactions/        # contratos de transação (abstract class)
│       ├── queues/              # contratos de fila (abstract class)
│       └── services/<capacidade>/  # contratos de service (abstract class)
├── infra/
│   ├── http/                    # controllers por ação, DTOs Zod, presenters
│   ├── persistence/             # Prisma: repositórios, mappers, implementações de query
│   ├── services/<capacidade>/   # implementações de integração externa (e-mail, storage, ...)
│   ├── health/                  # endpoints de infra, fora do throttler global
│   └── common/                  # env, constantes e fronteiras transversais de request
└── main.ts
```

`domain/` e `infra/` são as únicas pastas na raiz de `src/`; o resto é `main.ts` e `app.module.ts`. Módulo é pasta dentro de cada camada (`use-cases/<módulo>/`, `controllers/<módulo>/`, `dtos/<módulo>/`): um módulo novo não cria pasta própria na raiz de `src/` com camadas dentro, só ganha a sua pasta nas camadas que usa. As fronteiras que importam são as de camada (`backend/boundaries.md`); a pasta por módulo existe para navegação, não para enforcement. Nome de módulo é conceito do negócio, nunca subdivisão técnica (`backend/modules.md`).

Layer-first, e não module-first, porque a fronteira que o projeto quer proteger é a de camada: domínio que não conhece infraestrutura. Com as camadas no primeiro nível, essa fronteira é visível na árvore de pastas e verificável por um `grep` de caminho (`backend/boundaries.md`, "Verificação"); com módulos no primeiro nível, ela vira convenção interna repetida em cada módulo.

O que cada camada pode conhecer, em resumo (regras completas de import e exceções em `backend/boundaries.md`):

- `domain/enterprise`: só `@metri/core` e `@metri/utils`. Nada de NestJS, Prisma, Zod ou HTTP.
- `domain/application`: o mesmo, mais o decorator `@Injectable()` de `@nestjs/common`, e nada além dele.
- `infra/`: conhece `domain/` e as bibliotecas de infraestrutura. É o único lugar que toca Prisma e HTTP.

## Princípios não negociáveis

1. Regra de negócio mora na entidade ou no value object. O use case orquestra; o controller adapta HTTP. Invariante dentro de controller está no lugar errado. Detalhe em `domain/model.md` e `backend/application.md`.
2. Erro esperado é valor de retorno (`Either`), nunca exceção. `throw` fica reservado para bug de programação. Ver `backend/errors.md`.
3. Use case não importa Zod. Schema Zod é fronteira (`backend/boundaries.md`, "Zod é fronteira, não vocabulário interno"); o request/response do use case é tipo próprio, local ao arquivo, mesmo quando estruturalmente idêntico ao schema. Detalhe em `backend/application.md`.
4. Quem injeta pede o contrato (`abstract class`), nunca a implementação concreta. Detalhe em `backend/application.md`.
5. Toda escrita passa por use case e entidade de domínio, e leitura que alimenta decisão de negócio também. Leitura de exibição expõe contrato e DTO na aplicação, com implementação direta no banco pela infra; o critério e as regras estão em `backend/reading.md`.

## Onde cada arquivo mora

| Artefato | Caminho | Guia de construção |
| --- | --- | --- |
| Entidade | `src/domain/enterprise/<entidade>.entity.ts` | `domain/model.md` |
| Classes de erro do módulo | `src/domain/enterprise/errors/<módulo>.errors.ts` | `backend/errors.md` |
| Lista rastreada de coleção filha | `src/domain/enterprise/<coleção>-list.ts`, vínculo puro em `<referenciado>-ids.ts` | `domain/watched-list.md` |
| Família de regra com variação (Strategy) | `src/domain/enterprise/strategies/<regra>.strategy.ts` | `domain/strategy.md` |
| Regra com mais de um consumidor (Specification) | `src/domain/enterprise/specifications/<regra>.specification.ts` | `domain/specification.md` |
| Regra de domínio sem dono natural (Domain Service / Policy) | `src/domain/enterprise/policies/<regra>.policy.ts` | `domain/domain-services.md` |
| Value object | `src/domain/enterprise/value-objects/<nome>.vo.ts` | `domain/model.md` |
| Enum de domínio | `src/domain/enterprise/enums/<nome>.enum.ts` | `domain/model.md` |
| Domain event | `src/domain/enterprise/events/<evento>.event.ts` | `backend/events.md` |
| Caso de uso | `src/domain/application/use-cases/<módulo>/<ação>.use-case.ts` | `backend/application.md` |
| Contrato de repositório | `src/domain/application/repositories/<agregado>-repository.contract.ts` | `backend/persistence.md` |
| Contrato + service de integração | `src/domain/application/services/<capacidade>/` + `src/infra/services/<capacidade>/` | `infrastructure/services.md` |
| Controller | `src/infra/http/controllers/<módulo>/<ação>.controller.ts` | `backend/http-api.md` |
| DTO | `src/infra/http/dtos/<módulo>/<nome>.dto.ts` | `backend/http-api.md` |
| Presenter | `src/infra/http/presenters/<agregado>.presenter.ts` | `backend/http-api.md` |
| Repositório concreto | `src/infra/persistence/prisma/repositories/<agregado>.prisma-repository.impl.ts` | `backend/persistence.md` |
| Mapper | `src/infra/persistence/prisma/mappers/<agregado>.prisma-mapper.ts` | `backend/persistence.md` |
| Contrato + DTO de query de exibição | `src/domain/application/queries/<módulo>/<ação>.query.ts` | `backend/reading.md` |
| Implementação Prisma de query | `src/infra/persistence/prisma/queries/<módulo>/<ação>.prisma-query.impl.ts` | `backend/reading.md` |
| Contrato de transação | `src/domain/application/transactions/<fluxo>-transaction.contract.ts` | `backend/transactions.md` |
| Implementação Prisma de transação | `src/infra/persistence/prisma/transactions/<fluxo>.prisma-transaction.impl.ts` | `backend/transactions.md` |
| Subscriber de evento | `src/infra/events/on-<evento>.subscriber.ts` | `backend/events.md` |
| Contrato de fila | `src/domain/application/queues/<fluxo>-queue.contract.ts` | `backend/async-jobs.md` |
| Worker de job | `src/infra/jobs/<job>.worker.ts` | `backend/async-jobs.md` |
| Implementação de fila e client da fila | `src/infra/jobs/` | `backend/async-jobs.md` |
| Env var | `src/infra/common/env/env.validation.ts` | `infrastructure/runtime.md` |
| Factory de teste | `test/factories/make-<agregado>.factory.ts` | `backend/testing.md` |
| Repositório em memória | `test/repositories/<agregado>.in-memory-repository.impl.ts` | `backend/testing.md` |
| Fila em memória | `test/queues/<fluxo>.in-memory-queue.impl.ts` | `backend/async-jobs.md` |
| Dublê de transação | `test/transactions/<fluxo>.in-memory-transaction.impl.ts` | `backend/transactions.md` |
| Primitivo de domínio compartilhado | `packages/core/src/<área>/` | instruções de projeto de `packages/core` |
| Schema, migrations, client de banco | `packages/db/src/postgres/<banco>/` | instruções de projeto de `packages/db` |

Paths de `src/` e `test/` são relativos ao app backend (`apps/app-api/`).

## Verificação rápida

- A regra de negócio nova está em entidade ou value object, com o use case só orquestrando?
- O arquivo novo está no caminho da tabela acima?
- `domain/` continua sem import de infraestrutura (NestJS além de `@Injectable()`, Prisma, Zod)?
- O erro esperado é `Either`, sem `throw`?
