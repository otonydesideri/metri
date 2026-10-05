---
id: UC5.1
title: Planejar por capacidade
feature: F5
actor: humano
status: draft
---

# UC5.1 · Planejar por capacidade

Como humano, quero que o plano saia de um Look across que o Metri confere, para aprovar só planos que seguem as regras do método.

## Regras de negócio

- BR47: Uma proposta de plano só é aceita se passa nas regras exatas do plano: todo UC de feature `now` está numa slice; todo ticket tem slice e checks, e todo T tem tipo; toda slice `now` tem ao menos um ticket; e o `rules-for` de cada ticket lista até 5 regras ou diz que o excesso é esperado. Se cada slice tem as regras de que precisa, quem confere é o Look across e o crítico.
- BR48: O crítico sem contexto roda antes de todo portão de plano.

## Critérios

- [ ] Com a direção aprovada, quando o Look across termina, a proposta de plano passa nas regras do Metri, e a Inbox tem o portão de plano.
- [ ] Uma proposta com um UC `now` sem slice é recusada, com o UC apontado no erro.
- [ ] Tela: o portão de plano mostra o plano proposto contra o vigente (novo, mudou, removido) e os achados do crítico.
- [ ] Com o plano aprovado, os tickets do escopo ficam `open`, cada um com o seu Goal, e o `plan/<n>` entra na fila para a branch padrão.

## Notas
