---
id: UC3.2
title: Conversar com o Coordinator
feature: F3
slice: S11
actor: humano
status: open
mode: afk
blocked_by: [T11.1]
areas: [backend/application, infrastructure/services, frontend/components]
touches: [runs, requests]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/requests`", "`pnpm --filter app-web test:e2e e2e/conversation/`"]
---

# UC3.2 · Conversar com o Coordinator

Como humano, quero uma conversa contínua com o projeto, para pedir, perguntar e acompanhar num lugar só.

## Regras de negócio

- BR43: Há um Run de Coordinator contínuo por projeto. Se ele cai, o Metri o retoma pela mesma sessão do harness; se a retomada falha, abre um Run novo, com sessão nova e o resumo da conversa.
- BR44: O Coordinator julga e conversa; não aprova uso de ferramenta, não resolve portão e não escreve código.

## Critérios

- [ ] Tela: a conversa é montada dos eventos, com mensagens, chamadas de ferramenta resumidas e o pensamento recolhido, e mostra harness, modelo e custo.
- [ ] Com o servidor reiniciado, a conversa é retomada pela mesma sessão do harness; se a retomada falha, um Run novo abre, com sessão nova e o resumo da conversa.
- [ ] Uma pergunta do Coordinator aparece na própria conversa e também na Inbox.
- [ ] Sem harness pronto, a tela leva à tela de Harnesses.

## Notas

- O `interrupt()` e o `maxBudgetUsd` existem no SDK 0.3.289. Como o harness compacta uma conversa longa e se o pensamento chega para ser recolhido na tela não estão confirmados; este ticket confere.
