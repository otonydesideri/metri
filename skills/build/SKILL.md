---
name: build
description: Build one ticket of .metri/MATRIX.md to green, a UC or a T, by its id or the next frontier ticket. Coordinator mode runs unblocked tickets in parallel.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Build the ticket the user names: a UC (the tracer) or a T. With no id, take the next ticket of the **frontier**: among the unblocked ones (`status: open`, every `blocked_by` done; a slice, once /accept merged it into main), the T tickets first, since they unblock, then the lowest id in numeric order. A UC in `draft` is never built: stop and tell the user to run /look-across. A named ticket with a blocker not done: stop and say which. A named ticket `in_progress` or `blocked`: resume it on its branch. Each ticket runs in a clean context: a fresh session, or a worker in coordinator mode. For several ticket ids, or a slice id, read [COORDINATOR.md](COORDINATOR.md). For a T, read [TICKET-TYPES.md](TICKET-TYPES.md) too.

## Steps

1. **Load the ticket.** Its slice is the ticket file's `slice` key. Switch to `ticket/<id>` (`ticket/UC1.1`, `ticket/T2.0`), created from `slice/<slice id>` (itself created from main when missing). Read the ticket's file, `.metri/tickets/<id>.md` (its frontmatter, and its BRs and Critérios, or its O que entrega and Critérios), and in `.metri/MATRIX.md` only its slice's header and the Gaps and Pattern proposals lines; the slice contract is the slice's `contract` block, or the header of its `entry` file. Run `pnpm rules-for --ticket <id>` and read each rule it lists, the ADRs they cite (in `adr` and in its `exceção:` lines) and the canonical examples in their `examples`, plus `docs/DESIGN.md` when a rule cites it. Set `status: in_progress` in the ticket file (in coordinator mode, the coordinator does). Done when you can name the seam, the canonical examples, the checks and the done criteria: the ticket file's Critérios.
2. **Find before you create.** Call the Skill tool with "guardrail" and follow it for the whole ticket. Done when every block you will reuse is named.
3. **Build.** When the ticket changes a domain rule, call the Skill tool with "tdd" and work at its seam. Before creating a file or a module, read `node_modules/metri/architecture/backend/layers.md` (backend) or `node_modules/metri/architecture/frontend/structure.md` (frontend). Run typechecking regularly, single test files regularly, and the full test suite once at the end. You change code and tests; in `docs/` and `.metri/` only: this ticket's file (`status`, `Notas` and `metrics`) and its evidence, the MATRIX's slice contract (step 4), a done ticket's file whose checks broke (back to `in_progress`), and the MATRIX's Gaps and Pattern proposals lines. The rest of `docs/` and `.metri/` changes only in a `pattern` ticket. A ticket with a `frontend/*` area also follows "UI tickets", below. When a rule doesn't fit or is missing, write its `PP-n` in Pattern proposals, set the ticket's `status: blocked`, commit on `ticket/<id>` and stop: tell the user the `PP-n`, for /look-across.
4. **Contract header.** When the slice still has its `contract` block, this ticket moves it into the header of the slice `entry` (the file its consumers reach first) and puts `entry: <path>` on the slice's `horizon` line, in the format of `node_modules/metri/skills/look-across/MATRIX-FORMAT.md`, "Contrato de slice". When the ticket's `notes` change the contract of a built slice, write the change in that header.
5. **Verify.** Run every command in the ticket's `checks` and in the `Checks` of the slice's contract header, when it has one, then `pnpm verify`. The checks are immutable: add tests, and never remove or loosen a check or what it runs (a skipped test, a disabled rule, a lowered threshold); a check that must change goes back to /look-across. Done when all are green and every done criterion holds (the UC's criteria, or the T's `criteria`).
6. **Commit and close.** Set the ticket file's `status: done` (and `metrics`, when the tool reports them), commit on `ticket/<id>` with the ticket id in the message (`UC1.1 …`, `T2.0 …`), then merge it into its slice branch. `done` means the checks and `pnpm verify` are green on the slice branch; acceptance is per slice, in /accept. In coordinator mode, the coordinator alone writes `status` and `metrics` and merges. A `mode: hitl` ticket closes only on the human's confirmation.

## UI tickets

- **Seed**: realistic development data in the language of `docs/CONTEXT.md`: zero, one and many items, and long texts.
- **Evidence**: each UI criterion has a Playwright e2e that ends saving `.metri/tickets/<id>/<n>-desktop.png` and `<n>-mobile.png`, `<n>` the criterion's order (`node_modules/metri/architecture/frontend/testing.md`, "E2e de critério de UI"). The evidence is versioned; /accept's pruning takes it out of the tree, and git keeps it.
- **Critique**: read the screenshots and judge them against the principles of `docs/DESIGN.md`, the UC's criteria, the rule `frontend/experience` and the canonical screen; fix and shoot again, at most 2 rounds, before step 5.

## Git

- Branches: `slice/<id>` and `ticket/<id>`, with the UC or T id (`slice/S2`, `ticket/UC1.1`, `ticket/T2.0`); the ticket branch starts from its slice branch.
- The work is committed only on the ticket's branch or worktree, with the ticket id in the message.
- The ticket enters its slice branch, by a merge, only after its checks pass; when the slice moved, merge it into the ticket first and run the checks again.
- The slice enters main only through /accept.
- Never commit, reset or force-push on main.
