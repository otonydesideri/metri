---
id: general/principles
description: "os princípios não negociáveis gerais: abstração só onde paga o custo; default silencioso só onde a ausência é caso real; variação fechada como mapa total."
use_when:
  - "criar contrato ou abstração"
  - "escrever `?? valor`, `|| valor` ou parâmetro default"
  - "escolher comportamento por um valor de enum ou união"
status: active
---
# Princípios

## Princípios não negociáveis

1. Abstração só onde paga o custo. Contrato existe onde há fronteira real: módulo, teste, mais de uma implementação plausível. Para o resto, classe concreta basta.
2. Default silencioso só onde a ausência é caso real: `?? valor`, `|| valor` e parâmetro default só quando a ausência é caso real e esperado, nunca por reflexo defensivo que mascara ausência de dado.
3. Variação fechada é mapa total: comportamento escolhido por um valor de conjunto fechado (enum, união) é um `Record` desse valor para a função de cada ramo, sem ramo default, para o compilador acusar o valor novo esquecido. Padrão de catálogo (Strategy, Specification, Builder) só nasce com a segunda variação real.
