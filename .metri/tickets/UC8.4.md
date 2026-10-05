---
id: UC8.4
title: Configurar a Policy e os orçamentos do projeto
feature: F8
actor: humano
status: draft
---

# UC8.4 · Configurar a Policy e os orçamentos do projeto

Como humano, quero ajustar numa tela a allowlist, a rede e os orçamentos do projeto, para que pedidos de aprovação repetidos e limites de custo mudem sem um ticket.

## Regras de negócio

- BR85 (sensitive): A allowlist, os domínios de rede e os orçamentos do projeto só mudam pelo humano, na tela de configuração; nenhum Run os altera.
- BR86: Um projeto começa com a allowlist cobrindo os scripts do projeto, o `metri verify` e os checks, sem domínio de rede liberado, e com orçamentos padrão por Run e por pedido. O orçamento que o Goal de um ticket traz vale no lugar do padrão por Run.
- BR87: Uma mudança na configuração vale para os Runs abertos depois dela; o Run em andamento segue com a Policy com que começou.

## Critérios

- [ ] Num projeto recém-aberto, a configuração mostra a allowlist com os scripts do projeto, o `metri verify` e os checks, nenhum domínio de rede e os orçamentos padrão por Run e por pedido.
- [ ] Com um comando acrescentado à allowlist, o próximo Run roda esse comando sem pedir aprovação.
- [ ] Com um domínio acrescentado, o próximo Run acessa esse domínio, e um domínio fora da lista continua pedindo aprovação.
- [ ] Com o orçamento por Run reduzido, um Run aberto depois, de um ticket sem orçamento no Goal, termina sem orçamento ao atingir o novo valor, e o Run em andamento segue com o valor antigo.
- [ ] A allowlist e os domínios valem para os Runs dos dois presets, e o somente leitura continua sem escrita.
- [ ] Cada mudança grava um evento com o valor anterior, o novo e quem mudou.
- [ ] Tela: a configuração do projeto mostra allowlist, domínios de rede e orçamentos, e cada campo alterado mostra o valor padrão ao lado.

## Notas

- Os valores padrão dos orçamentos saem do Look across e se ajustam com o uso.
- No Claude, a rede tem dois mecanismos: o sandbox, para comandos (`allowedDomains`), e as regras `WebFetch(domain:…)`. O pedido de um host fora da lista chega ao `canUseTool` como `SandboxNetworkAccess`, o que só se vê no código do binário 2.1.289 e não é documentado (não confirmado); este ticket confirma.
