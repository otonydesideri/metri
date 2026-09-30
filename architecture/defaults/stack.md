---
id: defaults/stack
description: "a stack e o idioma do código, lista única das ferramentas que as regras exigem, com a versão de referência de cada uma: monorepo pnpm workspaces + Turborepo e Biome; no backend, NestJS sobre Fastify com Prisma/Postgres, build pelo tsdown, Zod, log, rate limit, fila e e-mail, e a autenticação padrão (sessão no servidor, same-origin); no frontend, React + Vite, roteamento, dado do servidor, cliente HTTP, formulário, UI, tema e estado global; nos testes, Vitest, supertest, dados de teste, o ambiente de interface e o e2e com Playwright."
use_when:
  - "escolher ferramenta de backend, frontend, validação, lint/format ou testes"
  - "decidir o idioma do código, da documentação, dos comentários ou das mensagens de erro"
  - "implementar login, sessão ou logout"
examples: [starter/biome.json, starter/package.json, starter/apps/app-api/vitest.config.ts]
status: active
---
# Stack padrão

## Stack

- Monorepo pnpm workspaces + Turborepo; pacotes com escopo `@metri/*` (general/code-placement).
- Lint/format: Biome (aspas simples), nos exemplos de todas as regras.
- Idioma: código e comentários em inglês; documentação e mensagens de erro em português, em todas as regras.

Backend:

- NestJS sobre Fastify, Prisma/Postgres via `@metri/db` (backend/layers, backend/persistence, infrastructure/runtime).
- Build e dev do app-api: `tsdown` (`tsdown` no build; `tsdown --watch --on-success "node --env-file-if-exists=.env dist/main.mjs"` no dev), com `experimentalDecorators` e `emitDecoratorMetadata` no `tsconfig.json`. O tsx e o esbuild não emitem o metadata dos decorators, de que a injeção do NestJS e o `api:generate` dependem.
- Validação de formato HTTP e contrato de API: Zod via `nestjs-zod` (`createZodDto`, `@ZodResponse`), pipe e serializer globais; OpenAPI pelo `@nestjs/swagger`, com o `cleanupOpenApiDoc` do nestjs-zod (backend/http-api, backend/boundaries).
- Log: `nestjs-pino` (infrastructure/logging).
- Rate limit: `@nestjs/throttler`, guard global (infrastructure/runtime, backend/errors).
- Data e fuso: `date-fns` + `@date-fns/tz`, no domínio (general/date-time).
- Fila: pg-boss (backend/async-jobs).
- E-mail: Resend, com o template em React Email (`@react-email/render`) (infrastructure/mail, em aberto).
- Storage: Cloudflare R2 pelo `@aws-sdk/client-s3`, implementação de referência (infrastructure/storage).

Frontend (`app-web`):

- React + Vite (frontend/structure, frontend/testing).
- Roteamento: react-router (frontend/routing).
- Dado do servidor: React Query (frontend/data-fetching).
- Cliente HTTP: as funções geradas do OpenAPI pelo Orval (`client: 'fetch'`, schemas Zod), sobre o `fetch` (frontend/data-fetching).
- Formulários: React Hook Form + Zod; `react-phone-number-input` e `use-mask-input` (sobre o Inputmask) (frontend/forms).
- UI: consome `@metri/ui` (kit de componentes shadcn/ui com `tw-animate-css`, tokens e tema), com os tokens como CSS variables de tema (defaults/ui, frontend/components, frontend/theming).
- Tema: `next-themes`, o provider de tema do `@metri/ui` (frontend/theming, defaults/ui).
- Notificação: `sonner`, com o `Toaster` do `@metri/ui` e o `toast` da lib (defaults/ui, frontend/data-fetching).
- Estado global cliente: Zustand (frontend/state, em aberto).

Testes:

- Vitest (backend/testing, frontend/testing).
- E2e do backend: supertest (backend/testing).
- Dados de teste: `@faker-js/faker` (backend/testing, frontend/testing).
- Interface: jsdom, `@testing-library/react`, `@testing-library/jest-dom`, `user-event` e MSW (frontend/testing).
- E2e de interface e evidência dos critérios de UI: Playwright, com os projetos desktop e mobile (frontend/testing, frontend/experience).

## Autenticação

Quando o produto tem identidade autenticada, a delegação "Autenticação" (`node_modules/metri/skills/look-across/ACTIVATION.md`) escolhe o provedor, e o mecanismo padrão é a sessão no servidor, same-origin (`general/http-surface.md`):

- a sessão é uma linha no banco, com validade deslizante: cada uso válido renova o `expiresAt` da linha e o `Max-Age` do cookie juntos;
- o cookie é `HttpOnly`, `Secure`, `SameSite=Lax` e `Path=/`, e leva um token aleatório de 256 bits;
- o banco guarda o hash SHA-256 do token, nunca o token, e a sessão é achada pelo hash: quem lê o banco não assume uma sessão;
- sair apaga a linha e devolve o cookie com `Max-Age=0`;
- a fronteira de request valida a sessão e anexa o dono (`backend/access-scope.md`, "Declaração por controller"); sem sessão válida, 401 (`backend/errors.md`, "Erro inesperado: filtro global").

## Configuração de referência

O Biome da raiz lê o `.gitignore` (`vcs`) e as diretivas do Tailwind v4 no CSS (`tailwindDirectives`: `@theme`, `@source`, `@custom-variant`). O código gerado do contrato de API, que o `api:drift` confere, fica fora dele, com `!` (o scanner ainda lê os tipos). O código de fornecedor do kit, `packages/ui/src/components/ui/`, fica sem formatação e sem as regras do preset, para a CLI e o código continuarem iguais; só o `noRestrictedImports` vale nele, e em todo o repositório: barra o pacote npm `cn`, que a CLI do shadcn grava no lugar do `cn` do kit (`defaults/ui.md`, "Componente novo"). O override do NestJS: o `import type` apagaria o metadata que a injeção de dependência lê (`emitDecoratorMetadata`), o módulo dinâmico só com `static forRoot()` é classe só de estáticos, e decorator de parâmetro (`@Body()`, `@Inject()`) precisa da opção do parser.

Exemplo completo: `starter/biome.json`.

O `test` da raiz repassa o filtro ao Vitest de cada pacote pelo `--`: sem ele, o Turborepo lê o filtro (`pnpm test order-confirmation`) como nome de task.

Exemplo completo: `starter/package.json`.

O Vitest de cada app e pacote passa sem arquivo de teste (`passWithNoTests`), para o pacote recém-criado não derrubar o `verify`: no `vite.config.ts` do app-web, nos dois configs do app-api (`backend/testing.md`) e no de cada pacote do `starter/`.

O `turbo.json` desliga o `agentGuidance`: o Turborepo 2.11 grava um bloco próprio no `AGENTS.md` quando detecta um agente, e o `AGENTS.md` do projeto é do `metri init`.

## Versões de referência

A versão com que a regra foi escrita, conferida na documentação oficial em 27/09/2026; o projeto fixa a sua no `package.json`.

| Ferramenta | Versão | Fonte | Nota |
| --- | --- | --- | --- |
| NestJS | 11.2.6 | https://docs.nestjs.com | o nestjs-zod 5.5 declara o NestJS até o 11 |
| `nestjs-zod` | 5.5.0 | https://github.com/BenLorantfy/nestjs-zod | `cleanupOpenApiDoc`, `@ZodResponse` |
| `@nestjs/swagger` | 11.4.7 | https://docs.nestjs.com/openapi/introduction | `setOpenAPIVersion('3.1.0')` no `DocumentBuilder`, conferido em 29/09/2026 |
| Zod | 4.6.5 | https://zod.dev | uma versão no monorepo inteiro |
| Orval | 8.38.0 | https://orval.dev/docs/reference/configuration/output | `zod: { version: 4 }` |
| Playwright | 1.63.0 | https://playwright.dev/docs/test-projects | `devices['Desktop Chrome']` e `devices['Pixel 7']` (chromium) |
| Prisma | 7.10.0 | https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7 | fixar o 7: a tag `latest` do CLI aponta para o 8 em release candidate |
| pg-boss | 12.35.0 | https://pgboss.io | Node 22.12+ e Postgres 13+ |
| Biome | 2.5.14 | https://biomejs.dev/reference/configuration | `vcs`, `css.parser.tailwindDirectives`, `linter.rules.preset` no lugar do `recommended`, obsoleto desde a 2.5.15; conferido em 30/09/2026 |
| Vitest | 5.0.2 | https://vitest.dev/config/passwithnotests | |
| `date-fns` / `@date-fns/tz` | 4.4.0 / 1.5.0 | https://date-fns.org | `TZDate`; conferido em 29/09/2026 |
| `react-phone-number-input` | 3.4.18 | https://gitlab.com/catamphetamine/react-phone-number-input | `flags` embutidas; entradas `/react-hook-form`; conferido em 29/09/2026 |
| Vite | 8.3.1 | https://vite.dev/config/shared-options | `resolve.tsconfigPaths`, `server.strictPort`; conferido em 29/09/2026 |
| Turborepo | 2.11.5 | https://turborepo.com/docs/reference/run | `turbo run <task> -- <args>`; conferido em 29/09/2026 |
| tsdown | 0.23.0 | https://tsdown.dev/reference/cli | `--watch`, `--on-success`; o metadata de decorator vem do Rolldown/Oxc pelo `tsconfig.json`; conferido em 29/09/2026 |
| shadcn (CLI) | 4.21.0 | https://ui.shadcn.com/docs/monorepo | aliases no nome do pacote; conferido em 29/09/2026 |
| Tailwind CSS | 4.3.3 | https://tailwindcss.com/docs/detecting-classes-in-source-files | `@source` relativo ao CSS; conferido em 29/09/2026 |
