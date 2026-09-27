---
id: general/principles
description: "os princípios não negociáveis gerais: abstração só onde paga o custo; default silencioso só onde a ausência é caso real."
use_when:
  - "criar contrato ou abstração"
  - "escrever `?? valor`, `|| valor` ou parâmetro default"
status: active
---
# Princípios

## Princípios não negociáveis

6. Abstração só onde paga o custo. Contrato existe onde há fronteira real: módulo, teste, mais de uma implementação plausível. Para o resto, classe concreta basta.
7. Default silencioso só onde a ausência é caso real: `?? valor`, `|| valor` e parâmetro default só quando a ausência é caso real e esperado, nunca por reflexo defensivo que mascara ausência de dado.
