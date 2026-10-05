---
id: UC3.2
title: Conversar com o Coordinator
feature: F3
actor: humano
status: draft
---

# UC3.2 · Conversar com o Coordinator

Como humano, quero uma conversa contínua com o projeto, para pedir, perguntar e acompanhar num lugar só.

## Regras de negócio

- BR43: Há um Run de Coordinator contínuo por projeto. Se ele não existe ou terminou, o Metri abre outro, retomando pela sessão do harness quando dá.
- BR44: O Coordinator julga e conversa; não aprova uso de ferramenta, não resolve portão e não escreve código.

## Critérios

- [ ] Tela: a conversa é montada dos eventos, com mensagens, chamadas de ferramenta resumidas e o pensamento recolhido, e mostra harness, modelo e custo.
- [ ] Com o servidor reiniciado, a conversa é retomada pela mesma sessão do harness.
- [ ] Uma pergunta do Coordinator aparece na própria conversa e também na Inbox.
- [ ] Quando um pedido esgota o orçamento, o turno do Coordinator é interrompido, e a conversa diz por quê; o próximo pedido começa com o orçamento inteiro.
- [ ] Sem harness pronto, a tela leva à tela de Harnesses.

## Notas

- O `interrupt()` e o `maxBudgetUsd` existem no SDK 0.3.289. Como o harness compacta uma conversa longa e se o pensamento chega para ser recolhido na tela não estão confirmados; este ticket confere.
