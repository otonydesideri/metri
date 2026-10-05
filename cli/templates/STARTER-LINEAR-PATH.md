1. `apps/app-api/src/main.ts:bootstrap` sobe o Fastify, aplica o prefixo `/api` e, fora de produção, serve a documentação em `/api/docs`.
2. `apps/app-api/src/app.module.ts:AppModule` compõe env e módulos, e registra o pipe de validação, o filtro de erro e o serializer.
3. `apps/app-api/src/infra/common/errors/unexpected-error.filter.ts:UnexpectedErrorFilter` põe todo erro no envelope único e loga o 5xx.
4. `apps/app-api/src/infra/health/health.controller.ts:HealthController` responde `GET /api/health`, com o estado do banco.
5. `apps/app-web/src/app/index.tsx:App` monta o tema, o React Query, o router e o `Toaster`.
6. `apps/app-web/src/app/router/routes.tsx:AppRoutes` carrega cada página por `lazy`, dentro do `AppLayout`.
7. `apps/app-web/src/lib/http/client.ts:httpClient` faz toda chamada gerada do OpenAPI na origem da página, sob `/api`.
