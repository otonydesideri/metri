---
name: build
description: Build one ticket of the plan (.metri/tickets/) to green, a UC or a T, by its id or the next frontier ticket. Coordinator mode runs unblocked tickets in parallel.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Build the ticket the user names: a UC (the tracer) or a T. With no id, take the next ticket of the **frontier**: an `open` ticket with no `ticket/<id>` branch, unblocked by rule 3 of `node_modules/metri/skills/look-across/MATRIX-FORMAT.md`, "Matrix rules", preferring the slices already started (not accepted, with a ticket `in_progress` or `done`); within that, T first, then the lowest id in numeric order. A UC in `draft` is never built: stop and tell the user to run /look-across. A named ticket still blocked: stop and say by what. A named ticket `in_progress` or `blocked`: resume it on its branch. Each ticket runs in a clean context: a fresh session, or a worker in coordinator mode. For several ticket ids, or a slice id, read [COORDINATOR.md](COORDINATOR.md). For a T, read [TICKET-TYPES.md](TICKET-TYPES.md) too.

## Steps

1. **Load the ticket.** Switch to `ticket/<id>` ("Git", below). Read `.metri/tickets/<id>.md`, and in `.metri/MATRIX.md` only the block of its `slice` (its `contract`, or the `sot` symbols, found by their `SOURCE OF TRUTH:` headers) and the Gaps and Pattern proposals lines. A UC also reads its feature's spec, `.metri/specs/<F-id>.md` (only Decisões de implementação, Decisões de teste and Fora de escopo). Run `pnpm rules-for --ticket <id>` and read each rule it lists (a `citada:` rule only when the work reaches it), following each `exceção:` line in place of the section it names, the ADRs they cite and the canonical examples in their `examples`, plus `docs/DESIGN.md` when a rule cites it. Set `status: in_progress` in the ticket file. Done when you can name the seam, the canonical examples, the checks and the Critérios.
2. **Find before you create.** Call the Skill tool with "guardrail" and follow it for the whole ticket. Done when every block you will reuse is named.
3. **Build.** When the ticket changes a domain rule, call the Skill tool with "tdd" and work at the seam the UC's feature spec names in Decisões de teste (a T: its `checks`). Before creating a file or a module, read `node_modules/metri/architecture/backend/layers.md` (backend) or `node_modules/metri/architecture/frontend/structure.md` (frontend). Run typechecking regularly, single test files regularly, and the full test suite once at the end. Each time a step goes green, commit it on `ticket/<id>` (`<id> wip: …`), so a stopped session loses nothing. A ticket with a `frontend/*` area also follows "UI tickets", below. When a rule doesn't fit or is missing, write a `PP-n` in Pattern proposals, set `status: blocked`, commit and stop: tell the user the `PP-n` and what the rule doesn't cover, for /look-across.
   - You change code and tests; in `docs/` and `.metri/`, only this ticket's `status`, `areas`, Notas, `metrics` and evidence, and the story of a reopened UC without one (MATRIX-FORMAT.md, "Ticket files"), the MATRIX's Gaps and Pattern proposals lines, and a doc your change makes wrong (a line of the linear path in `.metri/ARCHITECTURE.md`, a rule or ADR passage), listed in Notas.
   - A new rule, ADR, `docs/CONTEXT.md` term or `docs/DESIGN.md` change comes only from a `pattern` ticket or a knowledge gate.
4. **Verify.** Run every command in the ticket's `checks`, then `pnpm verify`. With the machine loaded (coordinator mode, or an e2e red in code the ticket didn't touch), run the e2e with `--workers=1` before judging it. The checks are immutable: add tests; a check that must change goes back to /look-across. When the same check stays red after 3 fixes, stop fixing: write the 3 attempts in Notas, set `status: blocked`, commit and tell the user what is red and what you tried. Done when all are green and every Critério holds.
5. **Close.** Reconcile the ticket's `areas` with the diff: an area whose rules the diff never reached leaves, and one it reached enters (`pnpm rules-for <paths of the diff>`). Set `status: done` and `metrics` (MATRIX-FORMAT.md, "Ticket files"), commit and integrate ("Git", below): the ticket is `done` once its commit is on the integration branch; acceptance is per slice, in /accept. A `mode: hitl` ticket closes only on the human's confirmation.

## UI tickets

- **Seed**: realistic development data in the language of `docs/CONTEXT.md`: zero, one and many items, and long texts.
- **Evidence**: each `Tela:` criterion has a Playwright e2e that ends saving `.metri/tickets/<id>/<n>-desktop.png` (and `<n>-mobile.png` for a criterion about the phone, tagged `@mobile`), `<n>` the criterion's order (`node_modules/metri/architecture/frontend/testing.md`, "E2e de critério de UI"). Run the ticket's e2e with `METRI_EVIDENCE=<id>`: only then does it save. Commit the evidence; /accept's pruning takes it out of the tree.
- **Critique**: read the screenshots and judge them against the principles of `docs/DESIGN.md`, the UC's criteria, the rule `frontend/experience` and the canonical screen; fix and shoot again, at most 2 rounds, before step 4.

## Git

- The **integration branch** is `metri.integrationBranch` in the root `package.json`, `main` when absent.
- A ticket works on `ticket/<id>`, from the integration branch, and commits only there, staging by path (`git add <path>`) only what it changed.
- To integrate: when the integration branch moved since `ticket/<id>` took it, merge it in and run the checks and `pnpm verify` again; then squash-merge `ticket/<id>` into it as one commit `<id> <summary>`.
- Besides those squash-merges (and those of `plan/` and direct-lane branches), the integration branch takes only /accept's commits, with the human's approval: never a reset or a force-push.
