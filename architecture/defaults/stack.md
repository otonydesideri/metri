---
id: defaults/stack
description: "a stack e o idioma do código, lista única das ferramentas que as regras exigem, com a versão de referência de cada uma: monorepo pnpm workspaces + Turborepo e Biome; no backend, NestJS sobre Fastify com Prisma/Postgres, Zod, log, rate limit, fila e e-mail; no frontend, React + Vite, roteamento, dado do servidor, cliente HTTP, formulário, UI, tema e estado global; nos testes, Vitest, supertest, dados de teste, o ambiente de interface e o e2e com Playwright."
use_when:
  - "escolher ferramenta de backend, frontend, validação, lint/format ou testes"
  - "decidir o idioma do código, da documentação, dos comentários ou das mensagens de erro"
status: active
---
# Stack padrão

## Stack

- Monorepo pnpm workspaces + Turborepo; pacotes com escopo `@metri/*` (general/code-placement).
- Lint/format: Biome (aspas simples), nos exemplos de todas as regras.
- Idioma: código em inglês; documentação, comentários e mensagens de erro em português, em todas as regras.

Backend:

- NestJS sobre Fastify, Prisma/Postgres via `@metri/db` (backend/layers, backend/persistence, infrastructure/runtime).
- Validação de formato HTTP e contrato de API: Zod via `nestjs-zod` (`createZodDto`, `@ZodResponse`), pipe e serializer globais; OpenAPI pelo `@nestjs/swagger`, com o `cleanupOpenApiDoc` do nestjs-zod (backend/http-api, backend/boundaries).
- Log: `nestjs-pino` (infrastructure/logging).
- Rate limit: `@nestjs/throttler`, guard global (infrastructure/runtime, backend/errors).
- Fila: pg-boss (backend/async-jobs).
- E-mail: Resend, com o template em React Email (`@react-email/render`) (infrastructure/mail, em aberto).
- Storage: Cloudflare R2 pelo `@aws-sdk/client-s3`, implementação de referência (infrastructure/storage).

Frontend (`app-web`):

- React + Vite (frontend/structure, frontend/testing).
- Roteamento: react-router (frontend/routing).
- Dado do servidor: React Query (frontend/data-fetching).
- Cliente HTTP: as funções geradas do OpenAPI pelo Orval (`client: 'fetch'`, schemas Zod), sobre o `fetch` (frontend/data-fetching).
- Formulários: React Hook Form + Zod; `react-phone-number-input` e `use-mask-input` (sobre o Inputmask) (frontend/forms).
- UI: consome `@metri/ui` (kit de componentes shadcn/ui, tokens e tema), com os tokens como CSS variables de tema (defaults/ui, frontend/components, frontend/theming).
- Tema: `next-themes`, o provider de tema do `@metri/ui` (frontend/theming, defaults/ui).
- Estado global cliente: Zustand (frontend/state, em aberto).

Testes:

- Vitest (backend/testing, frontend/testing).
- E2e do backend: supertest (backend/testing).
- Dados de teste: `@faker-js/faker` (backend/testing, frontend/testing).
- Interface: jsdom, `@testing-library/react`, `@testing-library/jest-dom`, `user-event` e MSW (frontend/testing).
- E2e de interface e evidência dos critérios de UI: Playwright, com os projetos desktop e mobile (frontend/testing, frontend/experience).

## Configuração de referência

O Biome da raiz, com o override do NestJS: o `import type` apagaria o metadata que a injeção de dependência lê (`emitDecoratorMetadata`), o módulo dinâmico só com `static forRoot()` é classe só de estáticos, e decorator de parâmetro (`@Body()`, `@Inject()`) precisa da opção do parser.

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.14/schema.json",
  "javascript": { "formatter": { "quoteStyle": "single" } },
  "linter": { "rules": { "recommended": true } },
  "overrides": [
    {
      "includes": ["apps/app-api/**"],
      "javascript": { "parser": { "unsafeParameterDecoratorsEnabled": true } },
      "linter": {
        "rules": {
          "style": { "useImportType": "off" },
          "complexity": { "noStaticOnlyClass": "off" }
        }
      }
    }
  ]
}
```

O Vitest de cada app e pacote passa sem arquivo de teste, para o pacote recém-criado não derrubar o `verify`:

```ts
// no bloco test do vite.config.ts (app-web) ou no vitest.config.ts (app-api e pacotes)
test: { passWithNoTests: true },
```

## Versões de referência

A versão com que a regra foi escrita, conferida na documentação oficial em 27/09/2026; o projeto fixa a sua no `package.json`.

| Ferramenta | Versão | Fonte | Nota |
| --- | --- | --- | --- |
| NestJS | 11.2.6 | https://docs.nestjs.com | o nestjs-zod 5.5 declara o NestJS até o 11 |
| `nestjs-zod` | 5.5.0 | https://github.com/BenLorantfy/nestjs-zod | `cleanupOpenApiDoc`, `@ZodResponse` |
| `@nestjs/swagger` | 11.4.7 | https://docs.nestjs.com/openapi/introduction | |
| Zod | 4.6.5 | https://zod.dev | uma versão no monorepo inteiro |
| Orval | 8.38.0 | https://orval.dev/docs/reference/configuration/output | `zod: { version: 4 }` |
| Playwright | 1.63.0 | https://playwright.dev/docs/test-projects | `devices['Desktop Chrome']` e `devices['Pixel 7']` (chromium) |
| Prisma | 7.10.0 | https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7 | fixar o 7: a tag `latest` do CLI aponta para o 8 em release candidate |
| pg-boss | 12.35.0 | https://pgboss.io | Node 22.12+ e Postgres 13+ |
| Biome | 2.5.14 | https://biomejs.dev/reference/configuration | |
| Vitest | 5.0.2 | https://vitest.dev/config/passwithnotests | |
| shadcn (CLI) | 4.21.0 | https://ui.shadcn.com/docs/monorepo | |
