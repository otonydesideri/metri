---
id: UC6.4
title: Ver uma slice na Matriz
feature: F6
slice: S18
actor: humano
status: open
mode: afk
blocked_by: [UC6.1]
areas: [frontend/components, backend/reading, frontend/state]
touches: [app-web:pages/matrix]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-web test:e2e e2e/matrix/`"]
---

# UC6.4 · Ver uma slice na Matriz

Como humano, quero selecionar uma slice na Matriz e ver de que ela depende, o que entrega e quem depende dela, para entender o lugar dela no plano sem abrir arquivos.

## Regras de negócio

## Critérios

- [ ] Tela: selecionar uma slice mostra as setas de dependência só dela, cheias para o que vem antes e tracejadas para o que ela destrava.
- [ ] Tela: selecionar uma slice abre o painel com o que vem antes, o que ela entrega, o que depende dela, os tickets com os checks, o contrato e, na aba de execução, os Runs com estado, custo e motivo de espera.
- [ ] A slice selecionada fica na URL, e abrir o link mostra a Matriz com o painel dela aberto.

## Notas
