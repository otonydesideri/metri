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
- BR56: Na tela de Harnesses, a pessoa escolhe o modo, conta Claude ou API, e o Metri mostra a origem da credencial que o SDK informa (`apiKeySource` e `accountInfo`) para ela conferir.
- BR103 (sensitive): Antes de gravar um evento, um log ou a saída de um check, o Metri mascara os padrões conhecidos de chave e de token da Anthropic, sem ler o ambiente.
- BR92 (sensitive): O modo escolhido decide a chave de API no ambiente do Run: em conta Claude, o Metri não repassa o `ANTHROPIC_API_KEY` nem o `ANTHROPIC_AUTH_TOKEN` ao processo do Run; em API, repassa os dois. Com um deles no ambiente e nenhum modo escolhido, o Metri pergunta antes do primeiro Run.

## Critérios

- [ ] Com o `ANTHROPIC_API_KEY` ou o `ANTHROPIC_AUTH_TOKEN` no ambiente e o modo conta Claude, o Run abre sem eles, e a origem que o SDK informa não é a chave do ambiente.
- [ ] Com o modo API, o Run abre com a chave do ambiente, e a tela mostra essa origem.
- [ ] Com a chave no ambiente e nenhum modo escolhido, o primeiro despacho pede a escolha, e nenhum Run começa antes dela.
- [ ] Trocar o modo vale a partir do Run seguinte.
- [ ] Com o Claude Code logado com uma conta do Console, com ou sem chave, o teste abre uma sessão curta do harness e mostra a origem da credencial.
- [ ] Tela: a tela explica como entrar com chave de API no próprio Claude Code e não tem campo para digitar a chave.
- [ ] Nenhum evento, log ou linha do banco contém a chave.
- [ ] Chaves de exemplo da Anthropic, uma chave de API e um token de autenticação, passando por evento, log e saída de check, não aparecem gravadas.

## Notas

- No SDK 0.3.293, a opção `env` substitui o ambiente inteiro do processo (`sdk.d.ts:1645-1663`). Se uma chave no bloco `env` das configurações pessoais entra no Run no modo conta Claude não está confirmado; este ticket confere e, se entrar, a decisão volta ao humano (ADR-0009).
- Como `apiKeySource`, `subscriptionType` e `tokenSource` se traduzem em conta Claude, chave, Console sem chave e provedor de nuvem não está documentado (não confirmado); este ticket confirma na prática.
