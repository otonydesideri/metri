# MATRIX

## Features

### F<n> · <feature>

horizon: now | planned | fog | out · milestone: <versão> · slices: [S<n>] · tech_design: none
outcome: <resultado de valor para o usuário>

#### UC<f>.<n> · <caso de uso>

actor: <ator> · status: open

- BR<n>: <regra de negócio>
- [ ] <critério verificável>

## Slices

### S<n> · <slice>

horizon: now · contract: docs/architecture/slices/<slice>.md · blocked_by: [S<n>]

#### T<s>.<n> · <ticket>

uc: UC<f>.<n> · type: pattern | tracer | task | release · mode: afk | hitl · status: open · blocked_by: [T<s>.<n>] · sensitive: false
areas: [<área>/<tema>] · touches: [<ponto central>]
checks: [`<comando>`]
subtasks: [<subtarefa>]

## Fog

- <feature pressentida, ainda não especificável>

## Gaps

- GAP-<n> · <o que ficou de fora> → T<s>.<n>

## Pattern proposals

- PP-<n> · de T<s>.<n> · <o que a regra não cobre> → próximo look across
