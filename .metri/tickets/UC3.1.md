---
id: UC3.1
title: Rotear um pedido
feature: F3
slice: S11
actor: humano
status: open
mode: afk
blocked_by: [UC3.2]
areas: [domain/domain-services, backend/application, domain/model, frontend/components]
touches: [requests, schema:requests]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test domain-services/routing`", "`pnpm --filter app-api test use-cases/requests`", "`pnpm --filter app-web test:e2e e2e/conversation/`"]
---

# UC3.1 · Rotear um pedido

Como humano, quero escrever o que preciso e ver para onde o pedido foi, para não ter de escolher a etapa do método à mão.

## Regras de negócio

- BR41: A rota direta só vale com as condições que o Metri confere: a slice existe e é `now`, o ticket não é sensível e não é `pattern`. Caber num ticket só é julgamento do Coordinator. Sem as condições, o pedido segue como iniciativa.
- BR77: O Coordinator escreve o ticket da rota direta no formato do método, com história, critérios, checks e o Goal, e o Metri o recusa quando falta algo.
- BR42: O orçamento do Coordinator conta por pedido, não pela conversa inteira; cada Run que um pedido abre tem o próprio orçamento por Run.

## Critérios

- [ ] Com um pedido que cabe numa slice existente, o Coordinator propõe a rota direta, e o ticket nasce `open` na slice, com história, critérios e checks, e entra na frontier.
- [ ] Com um pedido que caberia na rota direta mas é sensível, nenhum ticket nasce: o pedido segue como iniciativa, um Run de Moldar abre, e o cartão diz por quê.
- [ ] Com a rota direta numa slice feita, a slice volta a ser construída.
- [ ] Com um relato de bug, o Coordinator o classifica como bug, e um Run de diagnóstico abre.
- [ ] Com uma iniciativa, um Run de Moldar abre, e o cartão leva a ele.
- [ ] O humano confirma ou muda a rota proposta antes de ela seguir; a rota direta só aceita o pedido que passa nas condições da BR41.
- [ ] Tela: cada pedido aparece como um cartão com o texto, a rota proposta, a conferência do Metri e o destino.
- [ ] Quando um pedido esgota o orçamento, o turno do Coordinator é interrompido, e a conversa diz por quê; o próximo pedido começa com o orçamento inteiro.

## Notas
