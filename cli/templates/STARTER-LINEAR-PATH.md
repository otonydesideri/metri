1. `apps/app-api/src/main.ts:bootstrap` sobe o Fastify com um UUID por request, os saltos de proxy do `TRUST_PROXY`, o log do nestjs-pino, o prefixo `/api` e, fora de produção, a documentação em `/api/docs`.
2. `apps/app-api/src/app.module.ts:AppModule` compõe env, log, rate limit e módulos, e registra o pipe, o filtro, o serializer, o throttler e o guard de acesso.
3. `apps/app-api/src/infra/common/access/access.guard.ts:AccessGuard` deixa passar só o controller `@Public()`; o resto sai 401.
4. `apps/app-api/src/infra/common/errors/unexpected-error.filter.ts:UnexpectedErrorFilter` põe todo erro no envelope único.
5. `apps/app-api/src/infra/health/health.controller.ts:HealthController` responde `GET /api/health`, com o estado do banco.
6. `apps/app-web/src/app/index.tsx:App` monta o tema, o React Query, o router e o `Toaster`.
7. `apps/app-web/src/app/router/routes.tsx:AppRoutes` carrega cada página por `lazy`, dentro do `AppLayout`.
8. `apps/app-web/src/lib/http/client.ts:httpClient` faz toda chamada gerada do OpenAPI na origem da página, sob `/api`.
