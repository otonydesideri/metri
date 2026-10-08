---
id: UC2.2
title: Escolher o modelo de cada papel e de cada ticket
feature: F2
slice: S15
actor: humano
status: open
mode: afk
blocked_by: [UC8.4]
areas: [backend/application, backend/http-api, frontend/forms]
touches: [project-settings]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/runs`", "`pnpm --filter app-web test:e2e e2e/settings/`"]
---

# UC2.2 · Escolher o modelo de cada papel e de cada ticket

Como humano, quero escolher o modelo de cada papel no projeto, para usar o modelo caro só onde ele faz diferença.

## Regras de negócio

- BR6: Sem escolha, todo papel usa o modelo padrão do harness.
- BR7: A troca vale para os Runs abertos depois dela, e cada Run grava o modelo que usou.
- BR24: Antes de despachar, o humano pode trocar o modelo de um ticket; essa troca vale só para aquele ticket e não muda o plano.

## Critérios

- [ ] Com dois papéis em modelos diferentes, cada Run abre no modelo do seu papel e o grava.
- [ ] Sem escolha, o Run usa o modelo padrão do harness.
- [ ] Trocar o modelo de um papel não muda um Run em andamento.
- [ ] Na tela do ticket, o humano troca o modelo antes de despachar, e o Run abre nesse modelo e o grava.

## Notas

- Sem escolha, vale o modelo padrão do harness: o `model` do SDK "Defaults to the CLI default" (`sdk.d.ts` 0.3.289).
