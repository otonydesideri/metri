---
id: UC6.5
title: Comparar o plano proposto na Matriz
feature: F6
slice: S10
actor: humano
status: open
mode: afk
blocked_by: [UC5.1]
areas: [frontend/components, backend/reading]
touches: [app-web:pages/matrix]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-web test:e2e e2e/matrix/`"]
---

# UC6.5 · Comparar o plano proposto na Matriz

Como humano, quero comparar na Matriz o plano proposto com o vigente, para aprovar o portão de plano sabendo o que muda.

## Regras de negócio

## Critérios

- [ ] Com um portão de plano aberto, o humano alterna entre o plano vigente e o proposto.
- [ ] Tela: no plano proposto, cada slice nova, mudada ou removida tem a marca em texto, e o painel dela mostra o que mudou no contrato.
- [ ] Sem portão de plano aberto, a alternância não aparece.

## Notas
