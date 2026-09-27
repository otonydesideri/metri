---
id: catalog/async-jobs
description: "fila e jobs como capacidade: operação executada fora da request, por job ou tarefa agendada, com contrato de fila, worker, idempotência e dead letter."
use_when:
  - "uma operação vai para job ou tarefa agendada"
---
# Fila e jobs

## Entrega

- Contrato de fila, worker fino, idempotência e dead letter; pg-boss é ilustração; worker em app próprio ainda sem desenho.

## Regras

- `backend/async-jobs`
- `backend/operation-routing`

## Ativação

Pergunta: `backend/operation-routing.md` leva alguma operação do projeto a job ou tarefa agendada?

## O que fica para o projeto

- Decide: a ferramenta de fila; o processo em que os workers rodam.
- Registro: Project Architecture.
- ADR quando: na escolha da ferramenta, que decide entre enfileiramento transacional e outbox.
