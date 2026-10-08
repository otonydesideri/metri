---
id: UC1.2
title: Ver a visão geral do projeto
feature: F1
slice: S18
actor: humano
status: open
mode: afk
blocked_by: [T18.2]
areas: [backend/reading, frontend/components, frontend/data-fetching]
touches: [app-web:pages/overview]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test queries/projects`", "`pnpm --filter app-web test:e2e e2e/overview/`"]
---

# UC1.2 · Ver a visão geral do projeto

Como humano, quero abrir o projeto e ver o próximo passo e onde o trabalho está, para saber o que fazer sem procurar.

## Regras de negócio

- BR78: A Visão geral mostra um próximo passo só, nesta ordem de prioridade: um item da Inbox deste projeto, tickets da frontier para despachar ou, sem nada disso, fazer um pedido ao Coordinator.

## Critérios

- [ ] Tela: a Visão geral mostra um próximo passo só, pela prioridade da BR78, com a ação dele.
- [ ] Tela: mostra as features `now` com a barra de entrega, as slices em construção, a frontier com o motivo do scheduler para cada ticket que não pode rodar, as lacunas e as propostas de padrão abertas, a Fog e a versão do método.
- [ ] "Ver o app" abre o Preview da branch padrão.
- [ ] Tela: num projeto sem pedido, a Visão geral diz para fazer o primeiro pedido ao Coordinator.

## Notas
