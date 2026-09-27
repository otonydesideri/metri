# MATRIX.md Format

`.metri/MATRIX.md` is the project's single plan: features, slices and their contracts, Fog, Gaps and Pattern
proposals. Each ticket, a UC or a T, lives in its own file, `.metri/tickets/<id>.md` ("Ticket files", below); the
MATRIX is not the source of the ticket's content, only of the plan around it. A board of our own, in the future, is
a view that reads and writes the MATRIX and the ticket files through their strict format. Keys, values and section
titles are fixed, in English, as `node_modules/metri/VOCABULARY.md` defines them; the prose is in Portuguese. `pnpm docs-lint`
checks the format.

## Skeleton

````markdown
# MATRIX

## Features

### F<n> · <feature>

horizon: now | planned | fog | out · slices: [S<n>]
outcome: <resultado de valor para o usuário>
ucs: [UC<f>.<n>]

## Slices

### S<n> · <slice>

horizon: now · blocked_by: [S<n>]
contract:
  responsibility: <o que a slice garante, numa frase>
  interface: <o que os consumidores chamam>
  invariants: <o que vale sempre>
  consumers: [<F<n>, S<n> ou agente>]
  planned: <o que o contrato já acomoda, mas não está construído>

### S<n> · <slice concluída>

status: done · entry: <arquivo de entrada, com o contrato no cabeçalho>

## Fog

- <feature pressentida, ainda não especificável>

## Gaps

- GAP-<n> · <o que ficou de fora> → <UC<f>.<n> ou T<s>.<n>>

## Pattern proposals

- PP-<n> · de <UC<f>.<n> ou T<s>.<n>> · <o que a regra não cobre> → próximo look across
````

Ids are numbered across the whole plan (MATRIX.md and the ticket files), except that a UC carries its feature's
number and a T its slice's (`UC<f>.<n>`, `T<s>.<n>`): the next BR, GAP or PP takes the highest number in the plan
plus one. An id (F, UC, BR, S, T, GAP, PP) is never renumbered or reused; a split UC keeps its id on one part and
the others take the next free numbers. A key without a value is not written. The reserved field `milestone` is
optional on a feature and appears only with a value; a value never holds ` · `, the field separator. The MATRIX and
the ticket files cite only ids (F, UC, S, T, ADR-NNNN, rule id), never a `.md` path.

- `ucs`: the ids of the feature's UCs, draft included; every UC outside `draft` appears here.
- `sensitive: true` when the ticket touches authentication, data scope, payments, a destructive migration or a
  sensitive BR; its diff gets the human's review in /accept.
- Gaps: the arrow points to the ticket (UC or T) that closes the gap; while none is planned, to the ticket that
  left it. Pattern proposals: `de <id>` is the ticket that raised it, and the arrow its destination.

## Ticket files

Every ticket, a UC (the tracer) or a T, is its own file at `.metri/tickets/<id>.md` (`UC1.1`, `T2.0`): the
filename, without the extension, is the ticket's id, and must match the `id` key of its frontmatter. A ticket's
`checks` and `metrics` are the only reserved field this file carries; `notes` is a body section, not a frontmatter
key. The frontmatter is YAML, in the format of a rule's frontmatter (`VOCABULARY.md`): required keys always error
when missing or empty, the rest are written only with a value.

- `id` and `title`: the ticket's id and its name, in Portuguese.
- `feature` (UC only, always): the feature it belongs to; its number after the letter matches the UC's own
  (`UC1.1` → `feature: F1`).
- `slice` (T always; UC required outside `draft`): the slice it belongs to. A T's number after the letter matches
  its own (`T2.0` → `slice: S2`); a UC's slice is free, its main slice (the other slices it crosses go in `areas`
  and `touches`).
- `actor` (UC only): who runs the use case.
- `type` (T only): `pattern`, `task` or `release`; the tracer is the UC and never takes `type`.
- `status`: `draft` (UC only, written by /shape until /look-across plans it) `| open | in_progress | blocked |
  done`. A UC in `draft` is never built.
- `mode` and `checks` (T always; UC required outside `draft`), and `blocked_by`, `areas`, `touches`, `sensitive`,
  `subtasks` and `metrics`.
- `checks`: besides `pnpm verify`, at least one command that runs the test or test pattern proving the criteria
  (`` `pnpm test order-confirmation` ``); a command with a backtick, space or `·` is written as a quoted YAML
  string (`` "`pnpm test order-confirmation`" ``).
- `metrics`: only the numbers the tool reports, as `metrics: <tokens> tokens, <n> regras`.

A ticket file is never pruned or collapsed: done, it keeps its title, its frontmatter and its body, with
`status: done`, in its own file (the "Pruning" rule of "Matrix rules" below applies to the MATRIX, not to ticket
files).

### UC block

The UC is the tracer ticket: its title, BRs and criteria are its what and its done. Its id is the ticket's id:
branch `ticket/UC1.1`, commit `UC1.1 …`.

```markdown
---
id: UC<f>.<n>
title: <caso de uso>
feature: F<f>
slice: S<n>
actor: <ator>
status: draft | open | in_progress | blocked | done
mode: afk | hitl
blocked_by: [UC<f>.<n>, T<s>.<n>, S<n>]
areas: [<área>/<tema>]
touches: [<ponto central>]
sensitive: true | false
checks: ["`<comando>`"]
subtasks: [<subtarefa>]
metrics: <tokens> tokens, <n> regras
---

# UC<f>.<n> · <caso de uso>

## Regras de negócio

- BR<n> (sensitive): <regra de negócio>

## Critérios

- [ ] <critério verificável>

## Notas

<achados do /build ou do /accept, quando houver>
```

- A UC that doesn't fit a clean session with about 5 rules (`pnpm rules-for --ticket <id>`) is split into smaller
  UCs, each visible to the user and verifiable. A UC never has a partial ticket.
- Its BRs (`- BR<n>: ...`, with `(sensitive)` after the id when it is) go under "Regras de negócio", and its
  criteria (`- [ ] ...`) under "Critérios". "Notas" is written only when there's something to say.

### T block

A `T<s>.<n>` exists only for work without a UC, and belongs to the slice it sits under.

```markdown
---
id: T<s>.<n>
title: <ticket sem UC>
slice: S<n>
type: pattern | task | release
status: open | in_progress | blocked | done
mode: afk | hitl
blocked_by: [UC<f>.<n>, T<s>.<n>, S<n>]
areas: [<área>/<tema>]
touches: [<ponto central>]
sensitive: true | false
checks: ["`<comando>`"]
subtasks: [<subtarefa>]
metrics: <tokens> tokens, <n> regras
---

# T<s>.<n> · <ticket sem UC>

## O que entrega

<o que o ticket entrega, em 1 a 3 linhas>

## Critérios

- [ ] <critério de pronto>

## Notas

<achados do /build ou do /accept, quando houver>
```

- "O que entrega": 1 to 3 lines. "Critérios": at least one `- [ ] ...` item. "Notas" is written only when there's
  something to say.

## Example

```markdown
# MATRIX

## Features

### F1 · Formulários no site

horizon: now · milestone: v1 · slices: [S2, S3]
outcome: O editor publica formulários em páginas do site e recebe respostas.
ucs: [UC1.1, UC1.2]

### F2 · Enquetes no site

horizon: planned · milestone: v2
ucs: [UC2.1]

## Slices

### S2 · Montagem de componentes

horizon: now · blocked_by: [S0]
contract:
  responsibility: Monta numa página os componentes registrados no registry.
  interface: `mountComponent(page, key, props)`; registry `components`.
  invariants: Só componente registrado é montado; as props passam pelo schema do registro.
  consumers: [F1, F2]
  planned: Enquetes (F2) montadas pelo mesmo registry.

## Fog

- Como relatórios agregam respostas de formulários e enquetes.

## Gaps

- GAP-3 · validação de tamanho de arquivo → UC1.1

## Pattern proposals

- PP-1 · de UC1.1 · o endpoint de upload precisa de streaming; backend/http-api não cobre → próximo look across
```

`.metri/tickets/UC1.1.md`:

```markdown
---
id: UC1.1
title: Publicar formulário numa página
feature: F1
slice: S2
actor: editor
status: open
mode: afk
blocked_by: [T2.0]
areas: [frontend/components, backend/http-api]
touches: [registry:components]
sensitive: true
checks: ["`pnpm verify`", "`pnpm test mounter`"]
subtasks: [registro no mounter, renderização no site]
---

# UC1.1 · Publicar formulário numa página

## Regras de negócio

- BR1 (sensitive): Um formulário só é exibido se estiver publicado.

## Critérios

- [ ] Ao publicar, o formulário aparece na página em até uma recarga.
- [ ] Formulário despublicado não é exibido nem aceita envio.

## Notas
```

`.metri/tickets/UC1.2.md`, done and pruned only in the sense that it stays in its own file:

```markdown
---
id: UC1.2
title: Receber resposta
feature: F1
slice: S2
status: done
mode: afk
checks: ["`pnpm verify`", "`pnpm test forms-submit`"]
---

# UC1.2 · Receber resposta

## Regras de negócio

## Critérios

- [ ] tests/forms/submit.spec.ts prova os critérios.

## Notas
```

`.metri/tickets/T2.0.md`:

```markdown
---
id: T2.0
title: Padrão de montagem de componentes
slice: S2
type: pattern
mode: afk
status: open
sensitive: true
areas: [frontend/components]
touches: [registry:components]
checks: ["`pnpm verify`"]
---

# T2.0 · Padrão de montagem de componentes

## O que entrega

A regra de montagem pelo registry, com o exemplo canônico e o check que barra componente montado fora do registry.

## Critérios

- [ ] A regra frontend/component-mounting existe, com o exemplo em `examples` e o check em `enforced_by`.
- [ ] Montar um componente que não está no registry faz o check falhar.

## Notas
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
| `pattern` | The first instance of a new pattern, or an update of the Source version | The only case where the builder writes in `.metri/rules/`. **Mandatory human review** before the tickets it blocks are released |
| `task` | Work that delivers no UC but unblocks others (create an account, a credential, a third-party panel, prepare data), and each batch of an expand–contract | With `mode: afk`, the agent does it alone. With `mode: hitl`, the agent prepares a step-by-step script and the ticket closes on the human's confirmation |
| `release` | Take deliveries to production | Follows `.metri/rules/infrastructure/release.md` |

## Matrix rules

1. **Nothing orphan:** every UC outside `draft` has a `slice` and appears in its feature's `ucs`; every T has a
   `slice`.
2. **Every `now` slice serves at least one `now` feature:** the feature lists it in `slices`, or one of its
   tickets has it in `slice`.
3. **`blocked_by` points to a UC, a T or a slice;** a ticket is unblocked when each of them is done.
4. **Every ticket serves the now.** The slice grows on demand; nothing is built for a `planned` feature, whose UCs
   stay in `draft`.
5. **New pattern first:** when a slice needs a rule that doesn't exist, its first ticket is a T of `type: pattern`.
6. **Checks are immutable for /build.** It may add tests, never remove or loosen a check. Changing a check means
   going back to look across.
7. **Same `touches`, no parallelism.** Schema changes follow expand–contract or stay in a foundation ticket.
8. **Criteria written once, in the ticket file.** A UC's `checks` prove its "Critérios"; a T's "Critérios" are its
   own, since it has no UC.
9. **Pruning, on the MATRIX only:** the contract leaves the MATRIX for the header of the `entry` when the slice's
   first ticket is built ("Contrato de slice", below); a done slice collapses, all its tickets included, into one
   line with its `entry` (`status: done · entry: <path>`). A done slice that takes a new or reopened UC, or a new
   T, goes back to `horizon: now` with its `entry`, until it collapses again. A ticket file is never collapsed: it
   stays `status: done` in its own file, and its id stays in its feature's `ucs`. Git keeps the history. The
   MATRIX stays small.

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

After the slice's first ticket is built, the contract moves to the header of the entry file, and the slice swaps
the block for `entry: <path>` on its `horizon` line:

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

The labels follow the language of the code comments (`node_modules/metri/architecture/defaults/stack.md`, "Stack"); the ones
above are the default's. `pnpm docs-lint` checks that the `entry` exists and has every label.
