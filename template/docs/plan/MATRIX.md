# MATRIX

## Features

### F<n> · <feature>

horizon: now | planned | fog | out · slices: [S<n>]
outcome: <resultado de valor para o usuário>

#### UC<f>.<n> · <caso de uso>

actor: <ator> · status: open

- BR<n>: <regra de negócio>
- [ ] <critério verificável>

## Slices

### S<n> · <slice>

horizon: now · blocked_by: [S<n>]
contract:
  responsibility: <o que a slice garante, numa frase>
  interface: <o que os consumidores chamam>
  invariants: <o que vale sempre>
  consumers: [<F<n>, S<n> ou agente>]
  planned: <o que o contrato já acomoda, mas não está construído>

#### T<s>.<n> · <ticket>

uc: UC<f>.<n> · type: pattern | tracer | task | release · mode: afk | hitl · status: open · blocked_by: [T<s>.<n>] · sensitive: false
areas: [<área>/<tema>] · touches: [<ponto central>]
checks: [`<comando>`]
subtasks: [<subtarefa>]

### S<n> · <slice concluída>

status: done · entry: <arquivo de entrada, com o contrato no cabeçalho>

## Fog

- <feature pressentida, ainda não especificável>

## Gaps

- GAP-<n> · <o que ficou de fora> → T<s>.<n>

## Pattern proposals

- PP-<n> · de T<s>.<n> · <o que a regra não cobre> → próximo look across
