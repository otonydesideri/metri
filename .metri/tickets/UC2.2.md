---
id: UC2.2
title: Escolher o modelo de cada papel e de cada ticket
feature: F2
actor: humano
status: draft
---

# UC2.2 · Escolher o modelo de cada papel e de cada ticket

Como humano, quero escolher o modelo de cada papel no projeto, para usar o modelo caro só onde ele faz diferença.

## Regras de negócio

- BR6: Sem escolha, todo papel usa o modelo padrão do harness.
- BR7: A troca vale para os Runs abertos depois dela, e cada Run grava o modelo que usou.
- BR24: Antes de despachar, o humano pode trocar o modelo de um ticket; essa troca vale só para aquele ticket e não muda o plano.

## Critérios

- [ ] Com o builder num modelo e os revisores em outro, cada Run abre no modelo do seu papel e o grava.
- [ ] Sem escolha, o Run usa o modelo padrão do harness.
- [ ] Trocar o modelo de um papel não muda um Run em andamento.
- [ ] Na tela do ticket, o humano troca o modelo antes de despachar, e o Run abre nesse modelo e o grava.

## Notas

- Sem escolha, vale o modelo padrão do harness: o `model` do SDK "Defaults to the CLI default" (`sdk.d.ts` 0.3.289).
