---
id: UC8.2
title: Registrar lacuna e proposta de padrão
feature: F8
actor: humano
status: draft
---

# UC8.2 · Registrar lacuna e proposta de padrão

Como humano, quero que o builder registre pelo Metri o que deixou de fora e a regra que não serviu, para eu ver cada caso com id e decidir o que fazer.

## Regras de negócio

- BR13: Os ids de lacuna (`GAP-n`) e de proposta de padrão (`PP-n`) são dados pelo Metri, nunca pelo agente.

## Critérios

- [ ] Quando o builder registra uma lacuna, existe um `GAP-n`, e o builder recebe o id para o comentário no código.
- [ ] Quando o builder registra uma proposta de padrão, existe uma `PP-n`, o Run termina, o ticket fica `blocked` com o motivo `human` apontando para ela, e a Inbox tem o portão da proposta.

## Notas
