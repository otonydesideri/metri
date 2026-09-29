---
id: backend/boundaries
description: "o grafo de dependência permitido entre camadas e pacotes do backend — o que cada camada e pacote pode importar, com as exceções declaradas (`@Injectable()` no domínio, `@metri/db` só em `infra/persistence/prisma`, Zod só na fronteira, produção sem `test/`); os comandos que verificam o grafo."
use_when:
  - "adicionar um import que cruza camada ou pacote do backend"
  - "criar uma área nova em `src/`"
  - "adicionar dependência externa a `@metri/core` ou a `@metri/utils`"
  - "usar framework, Prisma ou Zod dentro de `domain/`"
applies_to:
  - "apps/app-api/**"
  - "packages/core/src/**"
  - "packages/utils/src/**"
keywords: [import, grafo de dependência, allowlist, biblioteca de cálculo puro, camada, domain/enterprise, domain/application, "@metri/core", "@metri/utils", "@metri/db", "@Injectable", "@nestjs/common", nestjs-pino, PinoLogger, PrismaService, Zod, nestjs-zod, test/, setup-e2e.ts, TS6059, tsconfig.build.json]
not_covered:
  - "as regras próprias do frontend → frontend/structure"
status: active
---
# Fronteiras de dependência

Quem pode importar o quê entre camadas e pacotes do backend.

Cobre o backend: `apps/app-api`, `@metri/core`, `@metri/utils` e `@metri/db`.

A violação típica destas regras compila sem erro e passa em type-check; o custo só aparece depois, como acoplamento que impede trocar uma implementação ou testar sem subir infraestrutura. Por isso cada regra termina em um comando de verificação, na seção "Verificação".

## O grafo permitido

A seta significa "pode importar":

```txt
main.ts / app.module.ts
        │
   src/infra ────────────► src/domain ────────► @metri/core
        │                        │
        │                        └────────────► @metri/utils
        │
        └── infra/persistence/prisma ─────────► @metri/db
```

| Código em | Pode importar | Nunca importa |
| --- | --- | --- |
| `packages/core/src` | builtins do Node (`node:*`) | Qualquer pacote externo: NestJS, Prisma, Zod |
| `packages/utils/src` | builtins do Node (`node:*`) | Qualquer pacote externo, mais `@metri/core` |
| `src/domain/enterprise` | `@metri/core`, `@metri/utils`, `node:*` e as bibliotecas de cálculo puro permitidas, abaixo | NestJS, `@metri/db`, Zod, `src/infra`, `test/` |
| `src/domain/application` | O de cima, mais `Injectable` de `@nestjs/common` | O resto de `@nestjs/common` e qualquer outro `@nestjs/*`, `nestjs-pino`, `@metri/db`, Zod, `src/infra`, `test/` |
| `src/infra` | `src/domain`, `@metri/core`, `@metri/utils`, bibliotecas de infraestrutura | `test/` |
| `test/` | Tudo | |

Paths de `src/` e `test/` são relativos a `apps/app-api/`.

Quando o domínio precisa de uma biblioteca de cálculo puro, sem I/O nem client de vendor (data e fuso, decimal): **Permitido.** `src/domain` a importa, quando uma regra da Source a nomeia (`date-fns` e `@date-fns/tz`, `general/date-time.md`) ou um ADR do projeto nomeia cada pacote; o check de fronteiras do projeto usa essa lista.

> **Por quê.** Refazer à mão o cálculo que a biblioteca resolve (horário de verão, arredondamento) é a classe de bug que ela existe para evitar, e um contrato de infra em volta dela seria abstração sem troca real.

- **Exceção.** `packages/core` e `packages/utils` ficam sem dependência externa mesmo assim: a permissão vale só para o domínio do app.

## `packages/core` não depende de nada externo

O core é o vocabulário de domínio compartilhado do monorepo; qualquer dependência externa dele vira dependência de todo consumidor. O único import não-relativo permitido é builtin do Node.

## `packages/utils` também não, nem do core

Mesma restrição de dependência externa do core, mais uma: `@metri/utils` não importa `@metri/core`. Uma função de uso geral vale em qualquer ponto do sistema, e depender do vocabulário de uma camada específica é o que a prenderia a uma delas. Na prática: função que precisa devolver `Either` ou `DomainError` está codificando uma regra, e a casa dela é o módulo dono dessa regra. Sem essa seta, o pacote deixa de ser consumível por quem não tem domínio nenhum, como os apps de frontend.

## A exceção de framework no domínio é `@Injectable()`, e só ela

`domain/enterprise` é TypeScript puro. `domain/application` importa `Injectable` de `@nestjs/common` porque use case participa da DI do Nest; o decorator só grava metadado, não acopla a HTTP nem a SQL. Qualquer outro símbolo de `@nestjs/common` (exceções HTTP, pipes, decorators de rota) já é vocabulário de infra e não entra no domínio. O mesmo vale para o mecanismo de log: `nestjs-pino` e `PinoLogger` não entram em `src/domain`, e o caso de uso loga por contrato (`backend/application.md`, "Log no caso de uso").

## Persistência: `@metri/db` é de `infra/persistence/prisma`; `PrismaService` circula dentro de infra

São duas superfícies diferentes:

- `@metri/db` (client e tipos gerados do Prisma): só `infra/persistence/prisma/` importa. Os mappers tipam contra os tipos gerados e `prisma.service.ts` monta o client. Tipo gerado usado fora dali é o schema do banco vazando para outra camada.
- `PrismaService` (o wrapper injetável): qualquer área de `infra/` pode injetar quando o acesso é técnico do adapter, como o health check. Escrita e leitura que alimenta decisão de negócio passam por contrato + repositório + mapper; leitura de exibição expõe contrato em `domain/application/queries/`, implementado por uma classe de `infra/persistence/prisma/queries/` que injeta `PrismaService` direto (`backend/reading.md`). Controller injeta o contrato da query; controller e use case nunca injetam `PrismaService`.

Exceções de teste: `test/setup-e2e.ts` importa `@metri/db` para criar o banco isolado por arquivo, e as factories de teste usam `PrismaService` + `toPrisma()` (ver `backend/testing.md`).

## Zod é fronteira, não vocabulário interno

Schema Zod vive em dois lugares: `infra/http/dtos/<módulo>/` (formato HTTP e contrato de API, `backend/http-api.md`, "Contrato de API: o backend é a fonte") e `infra/common/env/env.validation.ts` (env). O pipe global é registrado no grafo de módulos (`infrastructure/runtime.md`). `src/domain` nunca importa `zod` nem `nestjs-zod`; o request/response do use case é tipo próprio (`backend/application.md`, "Casos de uso").

## Produção nunca importa `test/`

Specs (`*.spec.ts`, `*.e2e-spec.ts`) dentro de `src/` importam factories e dublês de `test/` à vontade; arquivo de produção, nunca. Atenção ao modo como essa violação falha: `check-types` e a IDE usam o `tsconfig.json` largo (que cobre `src/` e `test/`) e aceitam o import sem reclamar; o erro (`TS6059`) só aparece no `build`, que usa `tsconfig.build.json` escopado a `src/`.

## Verificação

Rodar da raiz do repositório. Cada comando devolve vazio; o check de fronteiras do projeto os roda no `lint` (`node_modules/metri/skills/guardrail/KNOWLEDGE-GATE.md`, "Destination"), e saída não vazia é violação.

```bash
# domain importando db, Zod ou nestjs-pino
grep -rlP "from '(@metri/db|zod|nestjs-zod|nestjs-pino)" apps/app-api/src/domain --include="*.ts" --exclude="*.spec.ts"

# domain importando NestJS além de @nestjs/common
grep -rlP "from '@nestjs/(?!common')" apps/app-api/src/domain --include="*.ts" --exclude="*.spec.ts"

# domain usando algo de @nestjs/common além de Injectable
grep -rhoP "import \{[^}]*\} from '@nestjs/common'" apps/app-api/src/domain --include="*.ts" --exclude="*.spec.ts" | grep -v "^import { Injectable }"

# @metri/db fora de infra/persistence/prisma e do setup do e2e
grep -rlP "from '@metri/db" apps/app-api/src apps/app-api/test --include="*.ts" | grep -v "infra/persistence/prisma" | grep -vx "apps/app-api/test/setup-e2e.ts"

# core com dependência externa
grep -rhoP "from '[^'.][^']*'" packages/core/src --include="*.ts" --exclude="*.spec.ts" | grep -v "node:"

# utils com dependência externa, incluindo o próprio core
grep -rhoP "from '[^'.][^']*'" packages/utils/src --include="*.ts" --exclude="*.spec.ts" | grep -v "node:"

# produção importando test/
grep -rlP "from '[^']*/test/" apps/app-api/src --include="*.ts" --exclude="*.spec.ts" --exclude="*.e2e-spec.ts"
```

## Em aberto

- **Enforcement global das fronteiras de dependência.** Um check da Source para estas regras (regra de lint de imports restritos ou ferramenta dedicada de grafo de dependência) não tem desenho fechado; até ele existir, cada projeto roda os comandos acima no próprio check de fronteiras, e esta regra mantém o `applies_to`.
  - Regra de lint de imports restritos
  - Ferramenta dedicada de grafo de dependência
