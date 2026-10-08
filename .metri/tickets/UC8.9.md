---
id: UC8.9
title: Construir dentro da Policy padrão
feature: F8
slice: S8
actor: humano
status: open
mode: afk
blocked_by: [UC8.1]
areas: [backend/application, infrastructure/services, domain/model]
touches: [policy, packages/harness]
sensitive: true
checks: ["`pnpm verify`", "`pnpm --filter @metri/harness test claude`", "`pnpm --filter app-api test use-cases/policy`"]
---

# UC8.9 · Construir dentro da Policy padrão

Como humano, quero que o builder rode sozinho só o que o projeto já libera e nunca escreva fora do Workspace, para não aprovar à mão cada comando nem arriscar o resto da máquina.

## Regras de negócio

- BR86: Um projeto começa com a allowlist cobrindo os scripts do projeto, o `metri verify` e os checks, e sem domínio de rede liberado.
- BR95 (sensitive): No preset padrão, um Run escreve só no próprio Workspace; no somente leitura, só na pasta temporária dele.

## Critérios

- [ ] Num projeto sem configuração, o builder roda sem pedir aprovação os scripts do projeto, o `metri verify` e os checks do ticket, e qualquer outro comando pede aprovação.
- [ ] Um Run do preset padrão que tenta escrever fora do próprio Workspace é recusado, com o motivo devolvido ao agente; no somente leitura, só a pasta temporária do Run aceita escrita.
- [ ] Um comando de shell do builder que tenta escrever fora do Workspace ou acessar a rede falha dentro do sandbox, e o motivo volta ao agente (ADR-0015).
- [ ] Sem o sandbox disponível na máquina, o Run não abre, e a tela de Harnesses diz o que falta instalar.

## Notas

- Com o sandbox do Claude Code no Linux e no WSL2, o `localhost` de cada comando é privado: um teste que depende de servidor ou banco já rodando fora do comando não o alcança e precisa rodar fora do sandbox, pela lista da Policy (https://code.claude.com/docs/en/sandboxing).
