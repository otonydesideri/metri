---
id: general/http-surface
description: "a superfície HTTP same-origin sob `/api`: SPA em `/` e a API em `/api/*`, sem CORS nem URL de API em variável de ambiente, e a decisão explícita antes de expor o backend num host próprio."
use_when:
  - "expor o backend fora de `/api` ou num host próprio"
  - "criar endpoint novo"
status: active
---
# Superfície HTTP same-origin

## Superfície HTTP

A aplicação é same-origin de ponta a ponta: SPA em `/` e a API em `/api/*`. `main.ts` aplica `setGlobalPrefix('api')`. Em desenvolvimento, o Vite encaminha `/api` para o backend; a configuração equivalente de edge e proxy faz parte do IaC de produção.

Same-origin é decisão, não acaso: sem origem cruzada não há CORS a configurar, cookie é `SameSite` por construção e o frontend nunca carrega uma URL de API em variável de ambiente. Endpoint novo entra sob `/api`; qualquer proposta de expor o backend num host próprio para o browser passa por decisão explícita antes.

## Verificação rápida

- O endpoint novo entrou sob `/api`, com DTO Zod na fronteira e tradução de erro pela tabela de `backend/errors.md`?

## Em aberto

- **Segurança HTTP.** A Source não tem regra de segurança HTTP além do same-origin desta regra e do throttler global (`infrastructure/runtime.md`): headers de segurança (CSP, HSTS) e proteção de CSRF além do `SameSite` seguem sem desenho.
