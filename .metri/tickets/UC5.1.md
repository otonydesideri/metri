---
id: UC5.1
title: Planejar por capacidade
feature: F5
slice: S10
actor: humano
status: open
mode: afk
blocked_by: [UC4.2]
areas: [domain/domain-services, backend/application, frontend/components]
touches: [plan, gates]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test domain-services/plan-rules`", "`pnpm --filter app-api test use-cases/initiatives`", "`pnpm --filter app-web test:e2e e2e/initiatives/`"]
---

# UC5.1 · Planejar por capacidade

Como humano, quero que o plano saia de um Look across que o Metri confere, para aprovar só planos que seguem as regras do método.

## Regras de negócio

- BR47: Uma proposta de plano só é aceita se passa nas regras exatas do plano: todo UC de feature `now` está numa slice; todo ticket tem slice e checks, e todo T tem tipo; toda slice `now` tem ao menos um ticket; e o `rules-for` de cada ticket lista até 5 regras ou diz que o excesso é esperado. Se cada slice tem as regras de que precisa, quem confere é o Look across e o crítico.
- BR48: O crítico sem contexto roda antes de todo portão de plano. Se ele falhar, o portão diz que a crítica não foi feita, e o humano decide se ela roda de novo.

## Critérios

- [ ] Com a direção aprovada, quando o Look across termina, a proposta de plano passa nas regras do Metri, e a Inbox tem o portão de plano.
- [ ] Uma proposta com um UC `now` sem slice é recusada, com o UC apontado no erro.
- [ ] Tela: o portão de plano mostra o plano proposto contra o vigente (novo, mudou, removido) e os achados do crítico.
- [ ] Pedir ajuste no portão de plano vira uma mensagem, com o motivo, ao Run de Look across; recusar encerra a iniciativa, com o motivo registrado.
- [ ] Com o plano aprovado, o `plan/<n>` entra na fila para a branch padrão, e, depois do merge, os tickets do escopo ficam `open`, cada um com o seu Goal.

## Notas
