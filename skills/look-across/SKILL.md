---
name: look-across
description: Plan by looking across every feature. Turns the draft features into UCs, capabilities, slices with contracts, architectural coverage and tracer-bullet tickets in docs/plan/MATRIX.md.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

# Look Across

Look across every feature, `now` and `planned`, to find the **slices** they share: the capabilities they connect to. Then break the `now` work into **tickets**: tracer bullets, each a thin end-to-end path through its slice, declaring what **blocks** it (`blocked_by`). Everything goes to `docs/plan/MATRIX.md`, in the format of [MATRIX-FORMAT.md](MATRIX-FORMAT.md).

## Process

### 1. Gather context

Read `docs/PRODUCT.md`, `docs/CONTEXT.md`, the Features and Slices sections of `docs/plan/MATRIX.md`, the "Capacidades condicionais" table of `.metri/architecture/INDEX.md` and the area indexes (`.metri/architecture/<área>/INDEX.md`, `docs/architecture/<área>/INDEX.md`). Grep the code for what already exists.

Titles and descriptions use the vocabulary of `docs/CONTEXT.md`. Call the Skill tool with "domain-language" when a term is new or fuzzy, and with "grilling" when a decision branch is open.

### 2. Features → use cases

Give each feature its `horizon` and, when it makes sense, its `milestone`. Give each `now` feature its UCs, with verifiable criteria and BRs, marking the sensitive BRs.

### 3. Look across

For each UC, name the capabilities it needs and ask, in this order:

1. Does it exist in the project? Reuse its slice.
2. Is it a conditional capability of the Source, in the "Capacidades condicionais" table? Activate it by steps 3 to 6 of "Order" in `.metri/skills/setup/ACTIVATION.md`, then instantiate it in a slice.
3. Otherwise it is new: create a slice.

### 4. Contracts

Give each new or changed slice its `contract` block, designed to accommodate what is `planned`. A slice already built changes its contract only through a ticket, in the header of its `entry`.

### 5. Architectural coverage

For each slice, name the areas and rules it needs (the area indexes, `pnpm rules-for <paths>`). A missing rule is a `type: pattern` ticket, the first of its slice.

### 6. Draft tickets

Break each `now` UC into **tracer bullet** tickets.

<tracer-bullet-rules>

- Each ticket cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal cut of one layer
- A completed ticket is demoable or verifiable on its own
- Each ticket is sized to fit in a single fresh context window, with about 5 rules (`pnpm rules-for --ticket <id>`)
- Any prefactoring should be done first

</tracer-bullet-rules>

Give each ticket its `type`, `mode`, `areas`, `touches`, `sensitive`, the executable `checks` that prove its UC's criteria, and its **blocking edges** in `blocked_by`: the tickets or slices that must complete before it can start. A ticket with no blockers can start immediately. Split a ticket into `subtasks` when its parts can run in parallel. Add `task` tickets for the work a UC needs but doesn't deliver, and a `release` ticket per feature, `milestone` or batch of deliveries, never per ticket.

**Wide refactors are the exception to tracer bullets.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no tracer bullet can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

### 7. Slice 0

- **New project**: the foundation slice. The template of the Source version is instantiated and `pnpm verify` is green; with an interface, the `design-system` slice installs the library and styles it by `docs/DESIGN.md`.
- **Existing project**: the mapping. A survey of the code, run in a sub-agent, writes the Slices section with the `entry` of each slice, and the project rules, under human review.

### 8. Quiz the user

For a large initiative, first run a context-free critic in a sub-agent: it reads only `docs/PRODUCT.md` and the matrix, and reports features without a slice, forgotten consumers and UCs without a criterion.

Present the proposed plan as a numbered list: each slice with its contract, and for each ticket:

- **Title**: short descriptive name
- **Blocked by**: which other tickets or slices (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?
- Do the order, the contracts and the coverage hold?

Iterate until the user approves the plan.

### 9. Write the matrix

Write the approved plan to `docs/plan/MATRIX.md`; new terms go to `docs/CONTEXT.md` and hard decisions to ADRs (domain-language).

Done when:

- every `now` UC has a ticket;
- every ticket has a slice, a type and checks;
- every `now` slice has the rules it needs, or a `pattern` ticket that writes them;
- nothing is orphan;
- `pnpm rules-for --ticket <id>` lists about 5 rules or fewer for every ticket;
- `pnpm docs-lint` is green.

Tell the user the plan is ready: /build takes a ticket id, or the next ticket of the **frontier** (any ticket whose blockers are all done).
