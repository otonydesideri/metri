---
id: UC7.1
title: Acompanhar os tickets no Board
feature: F7
slice: S5
actor: humano
status: open
mode: afk
blocked_by: [T5.1, T5.3, S3]
areas: [backend/reading, frontend/state, frontend/components]
touches: [app-web:pages/board]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test queries/plan`", "`pnpm --filter app-web test:e2e e2e/board/`"]
---

# UC7.1 · Acompanhar os tickets no Board

Como humano, quero ver os tickets do projeto pelo status, para saber o que anda, o que travou e o que posso despachar.

## Regras de negócio

- BR14: Só as operações do Metri mudam o status de um ticket; o status nunca muda por arrastar.

## Critérios

- [ ] Tela: o Board mostra as colunas Rascunho, Aberto, Em andamento, Bloqueado e Feito, e os cancelados (`cancelled`, ADR-0003) aparecem só com o filtro ligado.
- [ ] Tela: o card mostra id, título, slice, tipo, modo, a marca de sensível e, quando bloqueado, o motivo com o link para o item que destrava.
- [ ] Com 50 slices e 500 tickets, o Board abre em até 1 s.
- [ ] Os filtros por slice, feature, tipo, modo e "só frontier" deixam no Board só os tickets que casam.
- [ ] Tela: uma coluna vazia diz por que está vazia e qual é o próximo passo.

## Notas
