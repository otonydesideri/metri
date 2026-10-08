---
id: UC6.1
title: Ver o plano na Matriz
feature: F6
slice: S18
actor: humano
status: open
mode: afk
blocked_by: [T18.1]
areas: [frontend/components, frontend/helpers, backend/reading]
touches: [app-web:pages/matrix]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-web test pages/matrix`", "`pnpm --filter app-web test:e2e e2e/matrix/`"]
---

# UC6.1 · Ver o plano na Matriz

Como humano, quero ver o plano como um quadro de features e slices em ordem de build, para saber de relance o que cada slice serve, o que vem antes e o que já foi entregue.

## Regras de negócio

- BR37: A coluna de uma slice é o nível dela na ordem de build, dado pela cadeia mais longa de `blocked_by` até ela.
- BR38: A barra de entrega é a conta de tickets feitos sobre o total, sem os cancelados: na feature, os UCs dela, em qualquer slice; na slice, todos os tickets dela. Ticket em andamento não conta.
- BR98: Uma slice está num destes estados: planejada, em construção, em aceite ou feita. Uma reabertura a devolve a em construção.
- BR39: A posição de cada slice é regra do plano: a coluna é o nível de build, e a caixa cobre as faixas das features que ela serve. Nada se arrasta, e nenhuma posição fica guardada.

## Critérios

- [ ] Tela: as features aparecem como faixas horizontais, e cada slice como uma caixa na coluna do seu nível de build, cobrindo as faixas das features que serve; a coluna do Look across fica à esquerda, com o nome da iniciativa, o número de features e de slices, a Fog e as propostas de padrão abertas.
- [ ] Tela: uma slice que ainda não começou, ou que está no portão de aceite, tem contorno tracejado, e o estado de cada slice aparece em texto na caixa, nunca só pela cor.
- [ ] Tentar arrastar uma caixa não a move.
- [ ] Duas slices do mesmo nível que servem a mesma feature aparecem lado a lado dentro da coluna.
- [ ] Quando existe uma ordem de faixas em que toda caixa fica contínua, a Matriz usa uma delas; entre ordens empatadas, fica a mais próxima da ordem de build, e a mesma ordem se repete a cada abertura.
- [ ] Tela: uma slice cujas features não podem ficar vizinhas aparece em partes na mesma coluna, ligadas por uma linha tracejada, com o nome na primeira parte e "parte i de n" em cada uma.
- [ ] A feature e a slice mostram a barra de entrega, com a conta da BR38.

## Notas
