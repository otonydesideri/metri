---
id: UC9.4
title: Responder à pergunta de um agente
feature: F9
slice: S16
actor: humano
status: open
mode: afk
blocked_by: [S14, S15]
areas: [backend/application, infrastructure/services, frontend/forms]
touches: [inbox, mcp:ask_human]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/inbox`", "`pnpm --filter app-web test:e2e e2e/inbox/`"]
---

# UC9.4 · Responder à pergunta de um agente

Como humano, quero responder na Inbox à pergunta de um agente, para que ele siga sem eu abrir a conversa dele.

## Regras de negócio

- BR106: A pergunta de um agente não prende a chamada: o Run fica esperando você, sem gastar tokens, e a resposta chega a ele como mensagem na mesma sessão do harness, mesmo depois de um reinício (ADR-0014).

## Critérios

- [ ] Quando um agente chama `ask_human`, a Inbox tem a pergunta com o Run e o papel, e o Run fica esperando você.
- [ ] A resposta dada no próprio item volta ao Run que perguntou, como mensagem na mesma sessão do harness, e o Run segue.
- [ ] Com o servidor reiniciado entre a pergunta e a resposta, a resposta ainda chega ao Run.
- [ ] A ferramenta de pergunta nativa do harness fica desligada no Run, e a do Metri aparece no lugar dela.

## Notas

- A pergunta nativa (`AskUserQuestion`) passa pelo `canUseTool` e prende a chamada sem prazo (`sdk.d.ts:205-211`, SDK 0.3.293; https://code.claude.com/docs/en/agent-sdk/user-input). Ela fica em `disallowedTools`, com `toolAliases` levando-a ao `ask_human`, para haver um caminho só. Se o alias funciona com essa ferramenta não está confirmado; este ticket confere, e, se não funcionar, ela fica só desligada.
