---
id: general/http-surface
description: "a superfície HTTP same-origin sob `/api`: SPA em `/` e a API em `/api/*`, sem CORS nem URL de API em variável de ambiente, e a decisão explícita antes de expor o backend num host próprio; as palavras reservadas de um endereço do usuário na raiz."
use_when:
  - "expor o backend fora de `/api` ou num host próprio"
  - "criar endpoint novo"
  - "criar um endereço público escolhido pelo usuário, na raiz da SPA"
status: active
---
# Superfície HTTP same-origin

## Superfície HTTP

A aplicação é same-origin de ponta a ponta: SPA em `/` e a API em `/api/*`. `main.ts` aplica `setGlobalPrefix('api')`. Em desenvolvimento, o Vite encaminha `/api` para o backend; a configuração equivalente de edge e proxy faz parte do IaC de produção.

Same-origin é decisão, não acaso: sem origem cruzada não há CORS a configurar, cookie é `SameSite` por construção e o frontend nunca carrega uma URL de API em variável de ambiente. Endpoint novo entra sob `/api`; qualquer proposta de expor o backend num host próprio para o browser passa por decisão explícita antes.

Quando um valor escolhido pelo usuário vira o primeiro segmento de uma URL na raiz (`/<slug>`): **Obrigatório.** O value object dele recusa `api` e o primeiro segmento de cada rota da SPA, e a lista cresce com a rota nova (`domain/model.md`, "Aplicação").

## Verificação rápida

- O endpoint novo entrou sob `/api`, com DTO Zod na fronteira e tradução de erro pela tabela de `backend/errors.md`?
- Endereço do usuário na raiz recusa `api` e o primeiro segmento de cada rota da SPA?

## Delegado ao projeto

- **Segurança HTTP.** O projeto decide os headers de segurança (CSP, HSTS) e a proteção de CSRF além do `SameSite`; o same-origin desta regra e o throttler global (`infrastructure/runtime.md`) são o que a Source fixa.
