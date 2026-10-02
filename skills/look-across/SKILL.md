---
name: look-across
description: Plan by looking across every feature. Turns the draft UCs into tracer tickets, with capabilities, slices with contracts, architectural coverage and the tickets without a UC, in .metri/MATRIX.md and .metri/tickets/.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Before writing a UC's story, call the Skill tool with "humanizer" on it.

# Look Across

Look across every feature, `now` and `planned`, to find the **slices** they share: the capabilities they connect to. Then make each `now` UC a **tracer bullet** ticket, a thin end-to-end path through its slice that declares what **blocks** it (`blocked_by`); a ticket `T` exists only for work without a UC. The plan goes to `.metri/MATRIX.md` and each ticket to its own file in `.metri/tickets/`, in the format of [MATRIX-FORMAT.md](MATRIX-FORMAT.md).

## Process

### 0. Mapping

When `.metri/ARCHITECTURE.md` has the line `mapeamento: pendente` (an existing project, marked by `metri init`), start here. A survey of the code, run in a sub-agent, proposes the Slices section (each built slice as `status: done · sot: [...]`), the linear path, the project rules and the other lines of `.metri/ARCHITECTURE.md`; the human reviews them. The first ticket of the plan is a `pattern` T that writes the headers of the owners (call the Skill tool with "guardrail") and takes the line `mapeamento: pendente` out, which turns `pnpm sot` on.

### 1. Gather context

Read `docs/PRODUCT.md`, `docs/CONTEXT.md`, `.metri/ARCHITECTURE.md`, all of `.metri/MATRIX.md` (Slices, Fog, Gaps and Pattern proposals), every feature's spec in `.metri/specs/`, every draft UC's ticket file in `.metri/tickets/`, the "Capacidades condicionais" table of `node_modules/metri/architecture/INDEX.md` and the area indexes (`node_modules/metri/architecture/<área>/INDEX.md`, `.metri/rules/<área>/INDEX.md`). Grep the code for what already exists.

Titles and descriptions use the vocabulary of `docs/CONTEXT.md`. Call the Skill tool with "domain-language" when a term is new or fuzzy, and with "grilling" when a decision branch is open.

### 2. Features → use cases

Keep the `horizon` and the `milestone` the direction gate confirmed for each feature, in its spec. Give each `now` feature its UCs: its id and title in the spec's Casos de uso, and its own file, `.metri/tickets/UC<f>.<n>.md`, with its `actor`, its story, verifiable criteria and BRs, marking the sensitive BRs; the UCs /shape wrote come in `draft`. A UC with UI has criteria for its main action, what is seen first, its states and the next step after the action; each criterion judged on the screen starts with `Tela:` ([MATRIX-FORMAT.md](MATRIX-FORMAT.md), "Ticket files").

### 3. Look across

For each UC, name the capabilities it needs and ask, in this order:

1. Does it exist in the project? Reuse its slice.
2. Is it a conditional capability of the Source, in the "Capacidades condicionais" table? Infer its activation from the UCs and BRs by steps 3 to 6 of "Order" in [ACTIVATION.md](ACTIVATION.md), then instantiate it in a slice. A PROJECT_SPECIFIC value a UC needs (the delegation matrix there) is an open question of the plan gate.
3. Otherwise it is new: create a slice.

### 4. Contracts

Give each new or changed slice its `contract` block, designed to accommodate what is `planned`; the foundation slice, `S0`, has none. A built slice that changes what it guarantees gets back a `contract` block, and /build writes the change in the headers of the owners it touches ([MATRIX-FORMAT.md](MATRIX-FORMAT.md), "Contrato de slice").

### 5. Architectural coverage

For each slice, name the areas and rules it needs (the area indexes, `pnpm rules-for <paths>`). A missing rule is a `type: pattern` ticket, the first of its slice; so is a behaviour a /shape prototype settled in a spec's Notas, and its line leaves the Notas. A screen of a new type, with no canonical screen in `docs/DESIGN.md`, gets before its UC a `pattern` T, "Padrão de tela: <tipo>" (`node_modules/metri/skills/build/TICKET-TYPES.md`, "pattern"). Each `PP-n` bound for the next look across becomes a `pattern` ticket or a change to the plan, or is dropped with the user; its line leaves Pattern proposals. Each `GAP-n` whose arrow points to a done ticket gets the ticket (UC or T) that closes it, and its arrow points there.

### 6. Draft tickets

Each `now` UC is a **tracer bullet** ticket.

<tracer-bullet-rules>

- Each UC cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal cut of one layer
- A completed UC is demoable or verifiable on its own
- Each UC is sized to fit in a single fresh context window, with about 5 rules (`pnpm rules-for --ticket <id>`), or more when rules-for says the excess is expected
- Any prefactoring should be done first

</tracer-bullet-rules>

A UC that doesn't fit is split into smaller UCs, each visible to the user and verifiable; a UC never has a partial ticket. Fill each UC's ticket file and set it `open`: its main `slice` (the other slices it crosses go in `areas` and `touches`), `mode`, `areas`, `touches`, `sensitive` (by the criterion in MATRIX-FORMAT.md), the executable `checks` that prove its criteria, and its **blocking edges** in `blocked_by`: the UCs, T tickets or slices that must complete before it can start. A ticket with no blockers can start immediately. Split a ticket into `subtasks` when its parts can run in parallel.

A ticket `T` only for work without a UC, its own file (`.metri/tickets/T<s>.<n>.md`) with its `type`, "O que entrega" and "Critérios": `pattern`; `task` for the work a UC needs but doesn't deliver; `release` per feature, `milestone` or batch of deliveries, never per ticket, except the urgent fix of /diagnose.

**Wide refactors are the exception to tracer bullets.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no tracer bullet can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**, in `task` tickets. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

### 7. Spec decisions

For each `now` feature, fill its spec's Decisões de implementação (the modules, interfaces, schema changes, API contract and interactions its slices' `contract` and the UCs' BRs settle, citing them by id, never a file path) and Decisões de teste (the seam, as high as possible and ideally one, preferring the slice contract's `interface` or a UC's `checks` over a new one; `node_modules/metri/skills/tdd/SKILL.md`, "Seams: where tests go").

### 8. Slice 0

- **New project**: `metri init` delivered the starter, the monorepo of `general/code-placement` with `pnpm verify` green. The foundation slice, `S0`, is what is left after it:
  - with a database, the development database: the delegation "Banco de desenvolvimento" of [ACTIVATION.md](ACTIVATION.md), an open question of the plan gate, done when `pnpm dev` boots app-api and `/api/health` answers `database: up`;
  - with an interface, the design-system ticket, the first of `S0`, blocking the others: from the moment `docs/DESIGN.md` exists, `pnpm design-tokens` fails until this ticket brings its tokens to `packages/ui/src/styles/globals.css` (with the `cn` list and the `index.html` background it checks) and adjusts the app shell of `apps/app-web/src/app/layouts/`; it closes on the human's visual approval;
  - what each active capability asks for before its first UC.
- **New project without the starter** (`metri init --no-starter`): `S0` also builds the monorepo, by the rules the starter follows.
- **Existing project**: the mapping of step 0.

### 9. Quiz the user

For a large initiative, first run a context-free critic in a sub-agent: it reads only `docs/PRODUCT.md`, the specs and the draft tickets, and reports features without a slice, forgotten consumers, UCs without a criterion and UCs that repeat a criterion of their own.

Present the proposed plan as a numbered list: each slice with its contract, then each UC and each T:

- **Id and title**: the UC or T id and its name
- **Blocked by**: which UCs, T tickets or slices (if any) must complete first
- **What it delivers**: the end-to-end behaviour the UC makes work, or the T's `what`

Then call the Skill tool with "grilling" and show the plan gate in its three blocks. Inferred: the capabilities activated from the UCs and BRs, the contracts, the seams of each spec's Decisões de teste, the order, the granularity, the blocking edges, and each ticket's `sensitive` and `mode`, each with its reason. Open questions: the PROJECT_SPECIFIC values a UC needs, and any merge or split you can't settle.

Iterate until the user approves the plan.

### 10. Write the matrix

Write the approved plan to `.metri/MATRIX.md` (slices, Fog, Gaps and Pattern proposals), each `now` feature's spec (Decisões de implementação and Decisões de teste) and each ticket to its own file in `.metri/tickets/`, keeping every id already there; new terms go to `docs/CONTEXT.md`, hard decisions to ADRs (domain-language), and the activated capabilities and resolved delegations to `.metri/ARCHITECTURE.md` ([ACTIVATION.md](ACTIVATION.md), "Record"). The human commits the result: the agent never commits on main.

Done when:

- every `now` UC is `open`, with `slice`, `mode` and `checks`, and its id listed in its feature's spec, Casos de uso;
- every `now` feature's spec has its Decisões de implementação and Decisões de teste;
- every T has `type`, "O que entrega" and "Critérios";
- every `now` slice has the rules it needs, or a `pattern` T that writes them;
- nothing is orphan;
- `pnpm rules-for --ticket <id>` lists about 5 rules or fewer for every UC and T id, or says the excess is expected (the first ticket after a new pattern);
- `pnpm docs-lint` is green.

Tell the user the plan is ready: /build takes a UC or T id, or the next ticket of the **frontier** (the unblocked ones, T first).
