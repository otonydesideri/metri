---
id: UC8.6
title: Construir o Metri sem tocar no Metri que conduz
feature: F8
slice: S8
actor: humano
status: open
mode: afk
blocked_by: [UC8.1]
areas: [infrastructure/services, infrastructure/runtime, backend/testing]
touches: [workspaces, run-env]
sensitive: true
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/workspaces`", "`pnpm --filter app-api test:e2e infra/workspaces`"]
---

# UC8.6 · Construir o Metri sem tocar no Metri que conduz

Como humano, quero que os testes que o builder roda no repositório do Metri não toquem no Metri que conduz, para seguir usando o Metri enquanto ele se constrói.

## Regras de negócio

- BR12: Cada Workspace recebe uma porta de testes livre, diferente das portas do Metri, e os testes do repositório usam essa porta.

## Critérios

- [ ] O e2e do repositório do Metri, rodado num Workspace, usa a porta de testes do Workspace, e o check falha se a porta estiver ocupada, sem trocar de porta.
- [ ] Enquanto o builder roda os testes do repositório do Metri, o servidor do Metri que conduz continua respondendo, e os testes usam a pasta de dados do Workspace: o banco do Metri que conduz não muda.
- [ ] O ambiente do Run e o dos checks não apontam para a pasta de dados do Metri que conduz.

## Notas
