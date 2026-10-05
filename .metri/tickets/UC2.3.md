---
id: UC2.3
title: Usar o Claude Code com chave de API
feature: F2
actor: humano
status: draft
---

# UC2.3 · Usar o Claude Code com chave de API

Como humano, quero usar o Claude Code com uma chave de API em vez do plano da conta Claude, para ter o caminho que os termos da Anthropic garantem.

## Regras de negócio

- BR55 (sensitive): O login por API fica no próprio Claude Code: pela conta do Console, com chave ou com o perfil sem chave, ou pela variável no ambiente da máquina, que o processo do harness herda. O Metri nunca guarda nem lê uma credencial.
- BR56: O Metri mostra a origem da credencial que o SDK informa (`apiKeySource` e `accountInfo`) como modo ativo (conta Claude, API ou provedor de nuvem) e avisa quando a cobrança vai para a API.

## Critérios

- [ ] Com o Claude Code logado com uma conta do Console, com ou sem chave, a tela de Harnesses mostra o modo API, e o teste abre uma sessão curta do harness.
- [ ] Com o Claude Code no login da conta Claude, a tela mostra o modo conta Claude.
- [ ] Depois de trocar de modo no próprio Claude Code, a tela mostra o modo novo no teste seguinte.
- [ ] Tela: a tela explica como entrar com chave de API no próprio Claude Code e não tem campo para digitar a chave.
- [ ] Nenhum evento, log ou linha do banco contém a chave.

## Notas

- Como `apiKeySource`, `subscriptionType` e `tokenSource` se traduzem em conta Claude, chave, Console sem chave e provedor de nuvem não está documentado (não confirmado); este ticket confirma na prática.
