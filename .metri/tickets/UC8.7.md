---
id: UC8.7
title: Construir um ticket de padrão ou com passo humano
feature: F8
slice: S16
actor: humano
status: open
mode: afk
blocked_by: [UC9.2]
areas: [backend/application, domain/model, frontend/components]
touches: [gates, tickets]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/gates`", "`pnpm --filter app-web test:e2e e2e/gates/`"]
---

# UC8.7 · Construir um ticket de padrão ou com passo humano

Como humano, quero que um ticket de padrão ou com passo humano espere a minha aprovação antes de seguir, para escolher o padrão e confirmar o que só eu posso fazer.

## Regras de negócio

- BR107: Um ticket `pattern` com o Goal atingido espera o portão dele com o Run vivo e o ticket `in_progress`. Um ticket `hitl` termina o Run com o roteiro dos passos humanos e fica `blocked` com o motivo `external`, apontando para o portão (ADR-0003).

## Critérios

- [ ] Num ticket `pattern` com o Goal atingido, o Run espera o portão, com o ticket `in_progress`; aprovado o portão, o Run faz o que ele pede e só então conclui, e o ticket segue para a fila.
- [ ] Num ticket `pattern` de tela verificado com 3 variantes, aprovar escolhendo uma registra a escolha nas notas, e o Run apaga as outras variantes e registra a tela escolhida no documento de design antes de concluir; os tickets que ele bloqueava entram na frontier depois do merge.
- [ ] Recusar com motivo o portão de padrão devolve o ticket a `open`, com o motivo nas notas, e o Run seguinte começa só com o id do ticket.
- [ ] Num ticket `hitl`, o Run termina com o roteiro dos passos humanos, e o ticket fica `blocked` com o motivo `external`, apontando para o portão.
- [ ] No portão de um ticket `hitl`, confirmar que os passos humanos foram feitos fecha o ticket, passando pela fila quando ele tem diff; recusar o devolve a `open`, com o motivo.

## Notas
