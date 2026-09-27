---
id: catalog/mail
description: "e-mail como capacidade: envio de e-mail do produto por um vendor, com a classe de infra única e um sender por fluxo."
use_when:
  - "o projeto envia e-mail"
---
# E-mail

## Entrega

- Classe de infra única com o nome do vendor; contrato por fluxo; Resend é ilustração.

## Regras

- `infrastructure/mail`
- `infrastructure/services`

## Ativação

Pergunta: O projeto envia e-mail?

## O que fica para o projeto

- Decide: o vendor; a configuração; o domínio e o remetente.
- Registro: Project Architecture.
- ADR quando: o vendor não comporta a forma de `infrastructure/mail.md`.
