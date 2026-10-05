---
id: UC8.1
title: Construir um ticket
feature: F8
actor: humano
status: draft
---

# UC8.1 · Construir um ticket

Como humano, quero despachar um ticket e receber o trabalho só quando os checks provarem que ele está pronto, para não depender da palavra do agente.

## Regras de negócio

- BR8: Só o verificador declara o Goal atingido.
- BR9: O builder não altera checks, não remove testes, só escreve regras num ticket `pattern` e não escreve no plano. O verificador roda o `metri scope`, que acusa o que sair disso.
- BR10: Cada Run começa com contexto limpo: só as configurações, as skills e o arquivo de instruções do Claude do projeto, sem os pessoais do Claude Code e sem a memória automática. O login, o ambiente e a política gerenciada da máquina continuam valendo.
- BR11: O ticket fica bloqueado, com o motivo `human` (ADR-0003), depois de três correções no mesmo check vermelho ou quando o orçamento do Run acaba.
- BR12: Cada Workspace recebe uma porta de testes livre, diferente das portas do Metri, e os testes do repositório usam essa porta.

## Critérios

- [ ] O Run abre com `settingSources: ['project']`, a memória automática desligada (`autoMemoryEnabled: false`) e só os servidores MCP que o Metri passa (`strictMcpConfig`), e a raiz dos Workspaces fica fora de qualquer pasta com arquivo de instruções pessoal do Claude.
- [ ] Ao despachar, o Workspace existe em `ticket/<id>`, o `metri:setup` rodou, as skills do papel estão na pasta do harness, o ticket está `in_progress` e o evento de contexto guarda a lista do que entrou no contexto (arquivos, regras e o commit de base).
- [ ] Com o `metri:setup` falhando, o ticket volta a `open`, e a Inbox tem o aviso com a saída do setup.
- [ ] Quando o builder entrega com um check vermelho, a saída volta para ele na mesma sessão do harness, e o Run continua.
- [ ] Depois de três correções no mesmo check vermelho, o Run termina, o ticket fica `blocked` com o motivo `human`, e a Inbox tem o resumo do que foi tentado.
- [ ] Com os checks, o `metri verify` e o `metri scope` verdes e a evidência completa, o Run fica concluído, e o ticket entra na fila de integração; um ticket `pattern`, sensível ou `hitl` passa antes pelo portão dele e fica `in_progress` enquanto espera.
- [ ] Depois do merge na branch da slice, o Workspace do ticket é arquivado.
- [ ] Com um critério de tela sem o screenshot mobile, o Goal não é atingido, e a falta aparece na saída da verificação.
- [ ] Enquanto o builder roda os testes do repositório do Metri, o servidor do Metri que conduz continua respondendo.

## Notas

- O SDK carrega o arquivo de instruções do Claude do diretório do Workspace e dos diretórios acima dele; a política gerenciada e o `~/.claude.json` valem qualquer que seja o `settingSources` (https://code.claude.com/docs/en/agent-sdk/claude-code-features).
- Com o sandbox do Claude Code no Linux e no WSL2, o `localhost` de cada comando é privado: um teste que depende de servidor ou banco já rodando fora do comando não o alcança e precisa de `excludedCommands`, que roda sem sandbox (https://code.claude.com/docs/en/sandboxing). A Policy da fundação decide quais comandos.
