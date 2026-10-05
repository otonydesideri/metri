---
id: UC1.2
title: Ver a visão geral do projeto
feature: F1
actor: humano
status: draft
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
