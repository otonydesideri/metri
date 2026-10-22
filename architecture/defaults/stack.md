---
id: defaults/stack
description: "a stack e o idioma do código, lista única das ferramentas que as regras exigem, com a versão de referência de cada uma: monorepo pnpm workspaces + Turborepo e Biome; no backend, NestJS com Prisma/Postgres, build pelo tsdown, env, Zod e log; no frontend, React + Vite, roteamento, dado do servidor, cliente HTTP, formulário, UI, tema e estado global; nos testes, Vitest, supertest, dados de teste, o ambiente de interface e o e2e com Playwright; a escolha para o que só entra quando o projeto precisa (fila, e-mail, storage, log estruturado, rate limit, telefone, máscara); e a autenticação padrão (sessão no servidor, same-origin)."
use_when:
  - "escolher ferramenta de backend, frontend, validação, lint/format ou testes"
  - "decidir o idioma do código, da documentação, dos comentários ou das mensagens de erro"
  - "implementar login, sessão ou logout"
examples: [defaults/stack.examples.md]
status: active
---
# Stack padrão

## Stack

- Monorepo pnpm workspaces + Turborepo; pacotes com escopo `@metri/*` (general/code-placement).
- Lint/format: Biome (aspas simples), nos exemplos de todas as regras.
- Idioma: código e comentários em inglês; documentação e mensagens de erro em português, em todas as regras.

Backend:

- NestJS, Prisma/Postgres via `@metri/db` (backend/layers, backend/persistence, infrastructure/runtime).
- Build e dev do app-api: `tsdown` (`tsdown` no build; `tsdown --watch --on-success "node dist/main.mjs"` no dev), com `experimentalDecorators` e `emitDecoratorMetadata` no `tsconfig.json`. O tsx e o esbuild não emitem o metadata dos decorators, de que a injeção do NestJS e o `api:generate` dependem.
- Env: `@nestjs/config` (`ConfigModule` com `validate` Zod, lido pelo `EnvService`) no app-api, e `dotenv` no `prisma.config.ts` do `@metri/db` e no setup do e2e; um `.env` por app e por banco (infrastructure/runtime).
- Validação de formato HTTP e contrato de API: Zod via `nestjs-zod` (`createZodDto`, `@ZodResponse`), pipe e serializer globais; OpenAPI pelo `@nestjs/swagger`, com o `cleanupOpenApiDoc` do nestjs-zod (backend/http-api, backend/boundaries).
- Log: o `Logger` nativo do NestJS (infrastructure/logging).
- Data e fuso: `date-fns` + `@date-fns/tz`, no domínio (general/date-time).

Frontend (`app-web`):

- React + Vite (frontend/structure, frontend/testing).
- Roteamento: react-router (frontend/routing).
- Dado do servidor: React Query (frontend/data-fetching).
- Cliente HTTP: as funções geradas do OpenAPI pelo Orval (`client: 'fetch'`, schemas Zod), sobre o `fetch` (frontend/data-fetching).
- Formulários: React Hook Form + Zod (frontend/forms).
- UI: consome `@metri/ui` (kit de componentes shadcn/ui com `tw-animate-css`, tokens e tema), com os tokens como CSS variables de tema (defaults/ui, frontend/components, frontend/theming).
- Tema: `next-themes`, o provider de tema do `@metri/ui` (frontend/theming, defaults/ui).
- Notificação: `sonner`, com o `Toaster` do `@metri/ui` e o `toast` da lib (defaults/ui, frontend/data-fetching).
- Estado global cliente: Zustand (frontend/state).

Testes:

- Vitest (backend/testing, frontend/testing).
- E2e do backend: supertest (backend/testing).
- Dados de teste: `@faker-js/faker` (backend/testing, frontend/testing).
- Interface: jsdom, `@testing-library/react`, `@testing-library/jest-dom`, `user-event` e MSW (frontend/testing).
- E2e de interface e evidência dos critérios de UI: Playwright, com o projeto desktop e o mobile só para o teste `@mobile` (frontend/testing, frontend/experience).

## Quando precisar

Entra com a necessidade, não no starter; a forma, quando há, está na regra entre parênteses.

- Fila e job: pg-boss (backend/async-jobs).
- E-mail: Resend, com o template em React Email (`@react-email/render`); o vendor é delegado ao projeto.
- Storage: Cloudflare R2 pelo `@aws-sdk/client-s3`, implementação de referência (infrastructure/storage).
- Log estruturado: `nestjs-pino`, no lugar do `Logger` nativo, com `redact` dos headers de credencial (infrastructure/logging).
- Rate limit: `@nestjs/throttler`, guard global.
- Telefone: `react-phone-number-input`, com as bandeiras embutidas e a entrada `/react-hook-form`.
- Máscara de campo: `use-mask-input`, sobre o Inputmask.

## Autenticação

Quando o produto tem identidade autenticada, a delegação "Autenticação" (`node_modules/metri/skills/look-across/ACTIVATION.md`) escolhe o provedor, e o mecanismo padrão é a sessão no servidor, same-origin (`general/http-surface.md`):

- a sessão é uma linha no banco, com validade deslizante: cada uso válido renova o `expiresAt` da linha e o `Max-Age` do cookie juntos;
- o cookie é `HttpOnly`, `Secure`, `SameSite=Lax` e `Path=/`, e leva um token aleatório de 256 bits;
- o banco guarda o hash SHA-256 do token, nunca o token, e a sessão é achada pelo hash: quem lê o banco não assume uma sessão;
- sair apaga a linha e devolve o cookie com `Max-Age=0`;
- um guard global valida a sessão e anexa a identidade à request; sem sessão válida, 401 (`backend/errors.md`, "Erro inesperado: filtro global").

## Configuração de referência

O Biome da raiz lê o `.gitignore` (`vcs`) e as diretivas do Tailwind v4 no CSS (`tailwindDirectives`). O código gerado do contrato de API, que o `api:drift` confere, fica fora dele, com `!` (o scanner ainda lê os tipos). O código de fornecedor do kit, `packages/ui/src/components/ui/`, fica sem formatação e sem as regras do preset, para a CLI e o código continuarem iguais; as regras ligadas fora do preset valem em todo o repositório: o `noRestrictedImports` barra o pacote npm `cn` (`defaults/ui.md`, "Componente novo"), e o `noFocusedTests` e o `noSkippedTests`, em erro, barram o `.only` e o `.skip` esquecidos, que tiram teste da suíte em silêncio (o preset os deixa passar). O override do NestJS: o `import type` apagaria o metadata que a injeção de dependência lê (`emitDecoratorMetadata`), o módulo dinâmico só com `static forRoot()` é classe só de estáticos, e decorator de parâmetro (`@Body()`, `@Inject()`) precisa da opção do parser.

Exemplo completo: stack.examples.md#biomejson.

O `typecheck`, o `lint` e o `test` da raiz rodam o Turborepo com `--continue`, para o `verify` mostrar todo pacote vermelho. Só o `test` da raiz passa `--passWithNoTests`, para o pacote sem spec não derrubar o `verify`; fora dele, o filtro que não acha arquivo falha, e por isso o check do ticket filtra no pacote (`pnpm --filter app-api test order-confirmation`).

Exemplo completo: stack.examples.md#packagejson-da-raiz.

O `turbo.json` desliga o `agentGuidance`: o Turborepo gravaria um bloco próprio no `AGENTS.md`, que é do `metri init`.

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
