---
id: UC5.2
title: Mudar um plano aprovado
feature: F5
slice: S10
actor: humano
status: open
mode: afk
blocked_by: [UC5.1]
areas: [domain/model, backend/application, frontend/components]
touches: [plan]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/plan`", "`pnpm --filter app-web test:e2e e2e/matrix/`"]
---

# UC5.2 · Mudar um plano aprovado

Como humano, quero que uma mudança no que eu já aprovei espere um novo portão de plano, para nenhum builder ver o contrato mudar no meio do ticket.

## Regras de negócio

- BR49: Uma mudança em feature, UC ou contrato já aprovados fica pendente até um novo portão de plano; até lá, vale o que foi aprovado.

## Critérios

- [ ] Quando o Run de Look across propõe mudar o contrato de uma slice aprovada, a mudança aparece pendente, o Metri abre um novo portão de plano, e o contrato em vigor só muda depois dele.
- [ ] Um builder em andamento continua recebendo o contrato aprovado enquanto a mudança está pendente.
- [ ] O novo portão de plano lista os tickets em andamento que a mudança atinge, e o humano escolhe, para cada um, terminar com o contrato aprovado ou devolver o ticket.
- [ ] Tela: com mudanças pendentes, a Matriz mostra a faixa "N mudanças aguardam o portão de plano".

## Notas
