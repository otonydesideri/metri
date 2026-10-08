---
id: UC4.2
title: Resolver o portão de direção
feature: F4
slice: S10
actor: humano
status: open
mode: afk
blocked_by: [UC4.1]
areas: [backend/application, frontend/components]
touches: [gates, runs]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/initiatives`", "`pnpm --filter app-web test:e2e e2e/initiatives/`"]
---

# UC4.2 · Resolver o portão de direção

Como humano, quero aprovar, pedir ajuste ou recusar a direção de uma iniciativa vendo os três blocos e o diff dos documentos, para que só vire plano a direção que eu aprovei.

## Regras de negócio

## Critérios

- [ ] Tela: o portão de direção mostra os três blocos, os achados do crítico e o diff dos documentos do `plan/<n>`.
- [ ] Aprovar o portão de direção põe a iniciativa em planejando e abre o Run de Look across no mesmo `plan/<n>`.
- [ ] Pedir ajuste vira uma mensagem, com o motivo, ao Run de Moldar, que segue na mesma sessão; recusar encerra a iniciativa, com o motivo registrado, e os UCs em rascunho dela ficam cancelados.
- [ ] Com o Run de Moldar encerrado e o portão aberto, resolver o portão abre um Run novo no mesmo `plan/<n>`, com o resumo do anterior.

## Notas
