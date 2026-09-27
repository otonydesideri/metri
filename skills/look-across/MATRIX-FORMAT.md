# MATRIX.md Format

`docs/plan/MATRIX.md` is the project's single plan: features, UCs, slices and their contracts, tickets and checks. It is the single source of the tickets: a board of our own, in the future, is a view that reads and writes the MATRIX through its strict format. Keys, values and section titles are fixed, in English, as `.metri/VOCABULARY.md` defines them; the prose is in Portuguese. `pnpm docs-lint` checks the format.

## Skeleton

````markdown
# MATRIX

## Features

### F<n> · <feature>

horizon: now | planned | fog | out · slices: [S<n>]
outcome: <resultado de valor para o usuário>

#### UC<f>.<n> · <caso de uso>

actor: <ator> · status: draft | open | in_progress | blocked | done · slice: S<n> · mode: afk | hitl · blocked_by: [UC<f>.<n>, T<s>.<n>, S<n>] · sensitive: false
areas: [<área>/<tema>] · touches: [<ponto central>]
checks: [`<comando>`]
subtasks: [<subtarefa>]

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

#### T<s>.<n> · <ticket sem UC>

type: pattern | task | release · mode: afk | hitl · status: open · blocked_by: [UC<f>.<n>, T<s>.<n>, S<n>] · sensitive: false
areas: [<área>/<tema>] · touches: [<ponto central>]
checks: [`<comando>`]
what: <o que o ticket entrega, em 1 a 3 linhas>
criteria:
- [ ] <critério de pronto>

### S<n> · <slice concluída>

status: done · entry: <arquivo de entrada, com o contrato no cabeçalho>

## Fog

- <feature pressentida, ainda não especificável>

## Gaps

- GAP-<n> · <o que ficou de fora> → <UC<f>.<n> ou T<s>.<n>>

## Pattern proposals

- PP-<n> · de <UC<f>.<n> ou T<s>.<n>> · <o que a regra não cobre> → próximo look across
````

Ids are numbered across the whole matrix, except that a UC carries its feature's number and a T its slice's (`UC<f>.<n>`, `T<s>.<n>`): the next BR, GAP or PP takes the highest number in the matrix plus one. An id in the matrix (F, UC, BR, S, T, GAP, PP) is never renumbered or reused; a split UC keeps its id on one part and the others take the next free numbers. A key without a value is not written. The reserved fields `milestone`, `tech_design`, `evidence`, `metrics` and `notes` are optional in any block and appear only with a value; a value never holds ` · `, the field separator.

- `sensitive: true` when the ticket touches authentication, data scope, payments, a destructive migration or a sensitive BR; its diff gets the human's review in /accept.
- `metrics`: only the numbers the tool reports, as `metrics: <tokens> tokens, <n> regras`.
- Gaps: the arrow points to the ticket (UC or T) that closes the gap; while none is planned, to the ticket that left it. Pattern proposals: `de <id>` is the ticket that raised it, and the arrow its destination.

## UC block

The UC is the tracer ticket: its title, BRs and criteria are its what and its done. Its id is the ticket's id: branch `ticket/UC1.1`, commit `UC1.1 …`.

- `actor` and `status`: `draft` when /shape writes it; `open` when /look-across plans it and fills its ticket keys; then `in_progress`, `blocked` and `done`. A UC in `draft` is never built.
- Ticket keys, outside `draft`: `slice` (required: its main slice; the other slices it crosses show in `areas` and `touches`), `mode` and `checks` (required), and `blocked_by`, `areas`, `touches`, `sensitive`, `subtasks`, `notes` and `metrics`.
- Its BRs (`- BR<n>: ...`, with `(sensitive)` after the id when it is) and its criteria (`- [ ] ...`) come after the keys.
- A UC that doesn't fit a clean session with about 5 rules (`pnpm rules-for --ticket <id>`) is split into smaller UCs, each visible to the user and verifiable. A UC never has a partial ticket.
- Done and pruned, the UC keeps its title and one line: `status: done → <test file>`.

## T block

A `T<s>.<n>` exists only for work without a UC, and belongs to the slice it sits under.

- `type`: `pattern`, `task` or `release`; the batches of an expand–contract are `task`.
- `what`: what it delivers, in 1 to 3 lines; the second and third lines are indented by two spaces.
- `criteria`: its done criteria, one `- [ ] ...` per line right below the key.
- The ticket keys of the UC block: `mode`, `status` and `checks` (required), and `blocked_by`, `areas`, `touches`, `sensitive`, `subtasks`, `notes` and `metrics`.

## Example

```markdown
# MATRIX

## Features

### F1 · Formulários no site

horizon: now · milestone: v1 · slices: [S2, S3] · tech_design: none
outcome: O editor publica formulários em páginas do site e recebe respostas.

#### UC1.1 · Publicar formulário numa página

actor: editor · status: open · slice: S2 · mode: afk · blocked_by: [T2.0] · sensitive: true
areas: [frontend/components, backend/http-api] · touches: [registry:components]
checks: [`pnpm verify`, `pnpm test mounter`]
subtasks: [registro no mounter, renderização no site]

- BR1 (sensitive): Um formulário só é exibido se estiver publicado.
- [ ] Ao publicar, o formulário aparece na página em até uma recarga.
- [ ] Formulário despublicado não é exibido nem aceita envio.

#### UC1.2 · Receber resposta

status: done → tests/forms/submit.spec.ts

### F2 · Enquetes no site

horizon: planned · milestone: v2

#### UC2.1 · Publicar enquete numa página

actor: editor · status: draft

- [ ] A enquete publicada aparece na página e aceita um voto por visitante.

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
what: A regra de montagem pelo registry, com o exemplo canônico
  e o check que barra componente montado fora do registry.
criteria:
- [ ] A regra está em `docs/architecture/frontend/`, com o exemplo em `examples` e o check em `enforced_by`.
- [ ] Montar um componente que não está no registry faz o check falhar.

## Fog

- Como relatórios agregam respostas de formulários e enquetes.

## Gaps

- GAP-3 · validação de tamanho de arquivo → UC1.1

## Pattern proposals

- PP-1 · de UC1.1 · o endpoint de upload precisa de streaming; backend/http-api não cobre → próximo look across
```

## Horizons

| `horizon` | Meaning |
| --- | --- |
| `now` | Will be built |
| `planned` | The architecture accommodates it (it is in a contract), but it isn't built |
| `fog` | Sensed, not yet specifiable |
| `out` | Out of scope; doesn't come back without a new decision |

## Ticket types

The tracer is the UC ("UC block"); `type` is written only on a T.

| `type` | When | Particularity |
| --- | --- | --- |
| `pattern` | The first instance of a new pattern, or an update of the Source version | The only case where the builder writes in `docs/architecture/`. **Mandatory human review** before the tickets it blocks are released |
| `task` | Work that delivers no UC but unblocks others (create an account, a credential, a third-party panel, prepare data), and each batch of an expand–contract | With `mode: afk`, the agent does it alone. With `mode: hitl`, the agent prepares a step-by-step script and the ticket closes on the human's confirmation |
| `release` | Take deliveries to production | Follows `docs/architecture/infrastructure/release.md` |

## Matrix rules

1. **Nothing orphan:** every UC outside `draft` has a `slice`, and every T belongs to a slice.
2. **Every `now` slice serves at least one `now` feature:** the feature lists it in `slices`, or one of its UCs has it in `slice`.
3. **`blocked_by` points to a UC, a T or a slice;** a ticket is unblocked when each of them is done.
4. **Every ticket serves the now.** The slice grows on demand; nothing is built for a `planned` feature, whose UCs stay in `draft`.
5. **New pattern first:** when a slice needs a rule that doesn't exist, its first ticket is a T of `type: pattern`.
6. **Checks are immutable for /build.** It may add tests, never remove or loosen a check. Changing a check means going back to look across.
7. **Same `touches`, no parallelism.** Schema changes follow expand–contract or stay in a foundation ticket.
8. **Criteria written once, in the UC.** Its `checks` prove them; a T, which has no UC, carries its own `criteria`.
9. **Pruning:** the contract leaves the matrix for the header of the `entry` when the slice's first ticket is built ("Contrato de slice", below); a done UC collapses into one line pointing to the tests its checks run (`status: done → <test file>`); a done slice collapses, its T included, into one line with its `entry` (`status: done · entry: <path>`). A done slice that takes a new or reopened UC, or a new T, goes back to `horizon: now` with its `entry`, until it collapses again. Git keeps the history. The matrix stays small.

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
