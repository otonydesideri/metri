---
id: defaults/stack
description: "a stack e o idioma do código, lista única das ferramentas que as regras exigem: monorepo pnpm workspaces + Turborepo e Biome; no backend, NestJS sobre Fastify com Prisma/Postgres, Zod, log, rate limit, fila e e-mail; no frontend, React + Vite, roteamento, dado do servidor, cliente HTTP, formulário, UI, tema e estado global; nos testes, Vitest, supertest, dados de teste e o ambiente de interface."
use_when:
  - "escolher ferramenta de backend, frontend, validação, lint/format ou testes"
  - "decidir o idioma do código, da documentação, dos comentários ou das mensagens de erro"
adr: [ADR-0001, ADR-0012, ADR-0017]
status: active
---
# Stack padrão

## Stack

- Monorepo pnpm workspaces + Turborepo; pacotes com escopo `@metri/*` (general/code-placement).
- Lint/format: Biome (aspas simples), nos exemplos de todas as regras.
- Idioma: código em inglês; documentação, comentários e mensagens de erro em português, em todas as regras.

Backend:

- NestJS sobre Fastify, Prisma/Postgres via `@metri/db` (backend/layers, backend/persistence, infrastructure/runtime).
- Validação de formato HTTP: Zod via `nestjs-zod` (`createZodDto`), pipe global (backend/http-api, backend/boundaries).
- Log: `nestjs-pino` (infrastructure/logging).
- Rate limit: `@nestjs/throttler`, guard global (infrastructure/runtime, backend/errors).
- Fila: pg-boss (backend/async-jobs, ADR-0001).
- E-mail: Resend, com o template em React Email (`@react-email/render`) (infrastructure/mail, ADR-0017).
- Storage: Cloudflare R2 pelo `@aws-sdk/client-s3`, implementação de referência (infrastructure/storage).

Frontend (`app-web`):

- React + Vite (frontend/structure, frontend/testing).
- Roteamento: react-router (frontend/routing).
- Dado do servidor: React Query (frontend/data-fetching).
- Cliente HTTP: `@better-fetch/fetch` (frontend/data-fetching).
- Formulários: React Hook Form + Zod; `react-phone-number-input` e `use-mask-input` (sobre o Inputmask) (frontend/forms).
- UI: consome `@metri/ui` (kit de componentes, tokens e tema), com os tokens na config do Tailwind (frontend/components, frontend/theming).
- Tema em app Next: `next-themes` (frontend/theming).
- Estado global cliente: Zustand (frontend/state, ADR-0012).

Testes:

- Vitest (backend/testing, frontend/testing).
- E2e do backend: supertest (backend/testing).
- Dados de teste: `@faker-js/faker` (backend/testing, frontend/testing).
- Interface: jsdom, `@testing-library/react`, `@testing-library/jest-dom`, `user-event` e MSW (frontend/testing).
