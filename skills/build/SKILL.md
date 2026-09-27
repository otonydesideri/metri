---
name: build
description: Build one ticket of docs/plan/MATRIX.md to green, by its id or the next frontier ticket. Coordinator mode runs unblocked tickets in parallel.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Build the ticket the user names; with no id, take the next ticket of the **frontier** (unblocked, not taken, first by id). For several tickets at once, read [COORDINATOR.md](COORDINATOR.md). For a ticket whose `type` isn't `tracer`, read [TICKET-TYPES.md](TICKET-TYPES.md) too.

## Steps

1. **Load the ticket.** Read only its section of `docs/plan/MATRIX.md` (`uc`, slice, `type`, `mode`, `areas`, `touches`, `sensitive`, `checks`), its UC and the slice contract: the `contract` block in the matrix, or the header of the slice `entry`. Run `pnpm rules-for --ticket <id>` and read each rule it lists and the canonical examples in their `examples` (plus `docs/DESIGN.md` when a frontend rule points to it). When the ticket creates a file or a module, also read `.metri/architecture/backend/layers.md` (backend) or `.metri/architecture/frontend/structure.md` (frontend). Set `status: in_progress`. Done when you can name the seam, the canonical examples and the checks.
2. **Find before you create.** Call the Skill tool with "guardrail" and follow it for the whole ticket. Done when every block you will reuse is named.
3. **Build.** Call the Skill tool with "tdd" and work at the seam when the ticket changes a domain rule. Run typechecking regularly, single test files regularly, and the full test suite once at the end. You change code, tests and, in the matrix, this ticket's status and the Gaps and Pattern proposals lines; `docs/architecture/`, `docs/adr/`, `docs/CONTEXT.md` and `docs/DESIGN.md` change only in a `pattern` ticket. When a rule doesn't fit, record a pattern proposal (`PP-n`, in Pattern proposals) and stop.
4. **Contract header.** When this is the first ticket of its slice to be built, move the slice's `contract` block into the header of the slice `entry` and put `entry: <path>` on the slice's `horizon` line, in the format of `.metri/skills/look-across/MATRIX-FORMAT.md`, "Contrato de slice".
5. **Verify.** Run every command in `checks`, then `pnpm verify`. The checks are immutable: add tests, never remove or loosen a check; a check that must change goes back to /look-across. Done when all are green.
6. **Commit and close.** Set `status: done` (and `metrics` when the tool exposes the tokens and the rules loaded), commit on `ticket/<id>` with the ticket id in the message, then merge `ticket/<id>` into its `slice/<id>` (in coordinator mode, the coordinator does). A `mode: hitl` ticket closes only on the human's confirmation. A done ticket whose checks break later goes back to `in_progress`.

## Git

- Branches: `slice/<id>` and `ticket/<id>` (`slice/S2`, `ticket/T2.1`); the ticket branch starts from its slice branch.
- Commit only on the ticket's branch or worktree, with the ticket id in the message.
- The ticket enters its slice branch only after its checks pass.
- The slice enters main only after /accept.
- Never commit, reset or force-push on main.
