---
id: UC8.5
title: Usar as configurações do Claude Code no Run
feature: F8
slice: S8
actor: humano
status: open
mode: afk
blocked_by: [UC8.1, UC9.1]
areas: [infrastructure/services, backend/application, frontend/components]
touches: [packages/harness, run-context]
sensitive: true
checks: ["`pnpm verify`", "`pnpm --filter @metri/harness test claude`", "`pnpm --filter app-web test:e2e e2e/runs/`"]
---

# UC8.5 · Usar as configurações do Claude Code no Run

Como humano, quero que o builder use as minhas configurações do Claude Code, mas só rode o que o Metri aprova, para manter minhas instruções sem liberar nada às cegas.

## Regras de negócio

- BR10 (sensitive): Cada Run carrega as configurações, as instruções e as skills do projeto e as pessoais do Claude Code, como o harness faz por padrão, menos o que o interruptor do projeto excluir (BR91). As regras de permissão do projeto e as pessoais não valem: só as aprovações do Metri decidem o que roda.

## Critérios

- [ ] O Run abre com as fontes de configuração pessoais, do projeto e locais, e com as regras de permissão de todas elas anuladas (`allowManagedPermissionRulesOnly`, ou o equivalente no SDK).
- [ ] Com uma regra pessoal que libera um comando fora da allowlist do Metri, o Run ainda pede a aprovação desse comando.
- [ ] No modo conta Claude, uma chave no bloco `env` das configurações pessoais não chega ao processo do Run (BR92).
- [ ] O evento de contexto lista também o que veio das configurações pessoais (arquivo de instruções, hooks e servidores MCP), e a aba Contexto do Run mostra essa lista.

## Notas

- No SDK 0.3.293, a opção `env` substitui o ambiente inteiro do processo (`sdk.d.ts:1645-1663`). Se uma chave no bloco `env` das configurações pessoais entra no Run no modo conta Claude não está confirmado; este ticket confere e, se entrar, a decisão volta ao humano (ADR-0009).
- O SDK carrega o arquivo de instruções do Claude do diretório do Workspace e dos diretórios acima dele; a política gerenciada e o `~/.claude.json` valem qualquer que seja o `settingSources` (https://code.claude.com/docs/en/agent-sdk/claude-code-features).
- Se a anulação das regras de permissão pessoais não funcionar, a decisão volta ao humano (ADR-0009). Como o SDK informa o que veio das configurações pessoais não está confirmado; este ticket confirma.
