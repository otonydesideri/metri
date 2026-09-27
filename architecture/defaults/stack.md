---
id: defaults/stack
description: "a stack e o idioma do código: monorepo pnpm workspaces + Turborepo, backend NestJS sobre Fastify com Prisma/Postgres, frontend React + Vite, validação de formato HTTP com Zod, lint/format com Biome e testes com Vitest + supertest."
use_when:
  - "escolher ferramenta de backend, frontend, validação, lint/format ou testes"
  - "decidir o idioma do código, da documentação, dos comentários ou das mensagens de erro"
status: active
---
# Stack padrão

## Stack

- Monorepo pnpm workspaces + Turborepo; pacotes com escopo `@metri/*`.
- Backend: NestJS sobre Fastify, Prisma/Postgres via `@metri/db`.
- Frontend (`app-web`): React + Vite, roteamento com react-router, React Query, formulários com React Hook Form + Zod; consome `@metri/ui` (kit de componentes, tokens e tema).
- Validação de formato HTTP: Zod via `nestjs-zod` (`createZodDto`), pipe global.
- Lint/format: Biome (aspas simples). Testes: Vitest + supertest.
- Idioma: código em inglês; documentação, comentários e mensagens de erro em português.
