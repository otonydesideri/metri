# MATRIX.md Format

`docs/plan/MATRIX.md` is the project's single plan: features, UCs, slices and their contracts, tickets and checks. Keys, values and section titles are fixed, in English, as `.metri/VOCABULARY.md` defines them; the prose is in Portuguese. `pnpm docs-lint` checks the format.

## Skeleton

````markdown
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
````

A key without a value is not written. The reserved fields `milestone`, `tech_design`, `evidence`, `metrics` and `notes` are optional in any block and appear only with a value.

## Example

```markdown
# MATRIX

## Features

### F1 · Formulários no site

horizon: now · milestone: v1 · slices: [S2, S3] · tech_design: none
outcome: O editor publica formulários em páginas do site e recebe respostas.

#### UC1.1 · Publicar formulário numa página

actor: editor · status: open

- BR1 (sensitive): Um formulário só é exibido se estiver publicado.
- [ ] Ao publicar, o formulário aparece na página em até uma recarga.
- [ ] Formulário despublicado não é exibido nem aceita envio.

#### UC1.2 · Receber resposta

status: done → tests/forms/submit.spec.ts

### F2 · Enquetes no site

horizon: planned · milestone: v2

## Slices

### S2 · Montagem de componentes

horizon: now · blocked_by: [S0]
contract:
  responsibility: Monta numa página os componentes registrados no registry.
  interface: `mountComponent(page, key, props)`; registry `components`.
  invariants: Só componente registrado é montado; as props passam pelo schema do registro.
  consumers: [F1, F2]
  planned: Enquetes (F2) montadas pelo mesmo registry.

#### T2.0 · Padrão de montagem de componentes

type: pattern · mode: afk · status: open · sensitive: true
areas: [frontend/components] · touches: [registry:components]
checks: [`pnpm verify`]

#### T2.1 · Montar componente registrado numa página

uc: UC1.1 · type: tracer · mode: afk · status: open · blocked_by: [T2.0] · sensitive: false
areas: [frontend/components, backend/http-api] · touches: [registry:components]
checks: [`pnpm verify`, `pnpm test mounter`]
subtasks: [registro no mounter, renderização no site]

## Fog

- Como relatórios agregam respostas de formulários e enquetes.

## Gaps

- GAP-3 · validação de tamanho de arquivo → T3.4

## Pattern proposals

- PP-1 · de T2.1 · o endpoint de upload precisa de streaming; backend/http-api não cobre → próximo look across
```

## Horizons

| `horizon` | Meaning |
| --- | --- |
| `now` | Will be built |
| `planned` | The architecture accommodates it (it is in a contract), but it isn't built |
| `fog` | Sensed, not yet specifiable |
| `out` | Out of scope; doesn't come back without a new decision |

## Ticket types

| `type` | When | Particularity |
| --- | --- | --- |
| `pattern` | The first instance of a new pattern, or an update of the Source version | The only case where the builder writes in `docs/architecture/`. **Mandatory human review** before the tickets it blocks are released |
| `tracer` | Delivers a UC or part of one | Serves a UC with `horizon: now` |
| `task` | Work that delivers no UC but unblocks others (create an account, a credential, a third-party panel, prepare data) | With `mode: afk`, the agent does it alone. With `mode: hitl`, the agent prepares a step-by-step script and the ticket closes on the human's confirmation |
| `release` | Take deliveries to production | Follows `docs/architecture/infrastructure/release.md` |

## Matrix rules

1. **Nothing orphan:** every ticket belongs to a slice and, when it is a tracer, to a UC; every `now` slice serves at least one `now` feature.
2. **Every ticket serves the now.** The slice grows on demand; nothing is built for a `planned` feature.
3. **New pattern first:** when a slice needs a rule that doesn't exist, its first ticket is `type: pattern`.
4. **Checks are immutable for /build.** It may add tests, never remove or loosen a check. Changing a check means going back to look across.
5. **Same `touches`, no parallelism.** Schema changes follow expand–contract or stay in a foundation ticket.
6. **Criteria written once, in the UC.** The ticket lists only the checks that prove them.
7. **Pruning:** the contract leaves the matrix for the header of the `entry` when the slice's first ticket is built ("Contrato de slice", below); a done UC collapses into one line pointing to its tests (`status: done → <test file>`); a done slice collapses into one line with its `entry` (`status: done · entry: <path>`). Git keeps the history. The matrix stays small.

## Contrato de slice

While the slice is a plan, its contract is the slice's `contract` block:

```markdown
horizon: now · blocked_by: [S<n>]
contract:
  responsibility: <o que a slice garante, numa frase>
  interface: <o que os consumidores chamam>
  invariants: <o que vale sempre>
  consumers: [<F<n>, S<n> ou agente>]
  planned: <o que o contrato já acomoda, mas não está construído>
```

After the slice's first ticket is built, the contract moves to the header of the entry file, and the slice swaps the block for `entry: <path>` on its `horizon` line:

```ts
/**
 * O quê: <responsibility>
 * Por quê: <por que a capacidade é compartilhada>
 * Onde: <onde se conecta: pacote, pontos centrais, consumidores>
 * Como usar: <interface, com o uso mínimo>
 * Invariantes: <invariants>
 * Consumidores: <consumers>
 * Previsto: <planned>
 * Checks: <comandos que provam o contrato>
 * SOT keywords: <keyword>, <keyword>
 */
```

The labels follow the language of the code comments (`.metri/architecture/defaults/stack.md`, "Stack"); the ones above are the default's. `pnpm docs-lint` checks that the `entry` exists and has every label.
