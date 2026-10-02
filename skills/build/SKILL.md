---
name: build
description: Build one ticket of the plan (.metri/tickets/) to green, a UC or a T, by its id or the next frontier ticket. Coordinator mode runs unblocked tickets in parallel.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Build the ticket the user names: a UC (the tracer) or a T. With no id, take the next ticket of the **frontier**: among the unblocked ones (`status: open`, every `blocked_by` done; a slice, once /accept merged it into main), the T tickets first, since they unblock, then the lowest id in numeric order. A UC in `draft` is never built: stop and tell the user to run /look-across. A named ticket with a blocker not done: stop and say which. A named ticket `in_progress` or `blocked`: resume it on its branch. Each ticket runs in a clean context: a fresh session, or a worker in coordinator mode. For several ticket ids, or a slice id, read [COORDINATOR.md](COORDINATOR.md). For a T, read [TICKET-TYPES.md](TICKET-TYPES.md) too.

## Steps

1. **Load the ticket.** Its slice is the ticket file's `slice` key. Switch to `ticket/<id>` (`ticket/UC1.1`, `ticket/T2.0`), created from `slice/<slice id>` (itself created from main when missing). Read the ticket's file, `.metri/tickets/<id>.md` (its frontmatter, and its story, BRs and Critérios, or its O que entrega and Critérios), and in `.metri/MATRIX.md` only its slice's block and the Gaps and Pattern proposals lines; the slice contract is its `contract` block, and a built slice's owners are the symbols of its `sot`, found by their `SOURCE OF TRUTH:` headers. A UC also reads its feature's spec, `.metri/specs/<F-id>.md` (only Decisões de implementação, Decisões de teste and Fora de escopo). Run `pnpm rules-for --ticket <id>` and read each rule it lists (a `citada:` rule only when the work reaches it), the ADRs they cite (in `adr` and in its `exceção:` lines) and the canonical examples in their `examples`, plus `docs/DESIGN.md` when a rule cites it. Set `status: in_progress` in the ticket file (in coordinator mode, the coordinator does). Done when you can name the seam, the canonical examples, the checks and the done criteria: the ticket file's Critérios.
2. **Find before you create.** Call the Skill tool with "guardrail" and follow it for the whole ticket. Done when every block you will reuse is named.
3. **Build.** When the ticket changes a domain rule, call the Skill tool with "tdd" and work at the seam the UC's feature spec names in Decisões de teste (a T, which has no spec, uses its own `checks`). Before creating a file or a module, read `node_modules/metri/architecture/backend/layers.md` (backend) or `node_modules/metri/architecture/frontend/structure.md` (frontend). Run typechecking regularly, single test files regularly, and the full test suite once at the end. Each time a step goes green, commit it as WIP on `ticket/<id>` (`<id> wip: …`), so a stopped session loses nothing. You change code and tests; in `docs/` and `.metri/` only: this ticket's file (`status`, `areas`, `Notas`, `metrics` and the story of a reopened UC without one, by `node_modules/metri/skills/look-across/MATRIX-FORMAT.md`, "Ticket files") and its evidence, a done ticket's file whose checks broke (back to `in_progress`), and the MATRIX's Gaps and Pattern proposals lines. The rest of `docs/` and `.metri/` changes only in a `pattern` ticket. A ticket with a `frontend/*` area also follows "UI tickets", below. When a rule doesn't fit or is missing, write its `PP-n` in Pattern proposals, set the ticket's `status: blocked`, commit on `ticket/<id>` and stop: tell the user the `PP-n` with what the rule doesn't cover, for /look-across.
4. **Verify.** Run every command in the ticket's `checks`, then `pnpm verify`. With the machine loaded (coordinator mode, or an e2e red in code the ticket didn't touch), run the e2e with `--workers=1` before judging it. The checks are immutable: add tests, and never remove or loosen a check or what it runs (a skipped test, a disabled rule, a lowered threshold); a check that must change goes back to /look-across. Done when all are green and every done criterion holds (the UC's criteria, or the T's `criteria`).
5. **Commit and close.** Reconcile the ticket's `areas` with the diff: an area whose rules the diff never reached leaves, and one it reached enters (`pnpm rules-for <paths of the diff>`). Set the ticket file's `status: done` and its `metrics` (MATRIX-FORMAT, "Ticket files"), commit on `ticket/<id>` with the ticket id in the message (`UC1.1 …`, `T2.0 …`), then merge it into its slice branch. `done` means the checks and `pnpm verify` are green on the slice branch; acceptance is per slice, in /accept. In coordinator mode, the coordinator alone writes `status` and `metrics` and merges. A `mode: hitl` ticket closes only on the human's confirmation.

## UI tickets

- **Seed**: realistic development data in the language of `docs/CONTEXT.md`: zero, one and many items, and long texts.
- **Evidence**: each `Tela:` criterion has a Playwright e2e that ends saving `.metri/tickets/<id>/<n>-desktop.png` and `<n>-mobile.png`, `<n>` the criterion's order (`node_modules/metri/architecture/frontend/testing.md`, "E2e de critério de UI"). Run the ticket's e2e with `METRI_EVIDENCE=<id>`: only then does it save. The evidence is versioned; /accept's pruning takes it out of the tree, and git keeps it.
- **Critique**: read the screenshots and judge them against the principles of `docs/DESIGN.md`, the UC's criteria, the rule `frontend/experience` and the canonical screen; fix and shoot again, at most 2 rounds, before step 4.

## Git

- Branches: `slice/<id>` and `ticket/<id>`, with the UC or T id (`slice/S2`, `ticket/UC1.1`, `ticket/T2.0`); the ticket branch starts from its slice branch.
- The work is committed only on the ticket's branch or worktree, with the ticket id in the message.
- Stage by path, only what the ticket changed (`git add <path>`), so nothing else lying in the tree enters the commit.
- The ticket enters its slice branch, by a merge, only after its checks pass; when the slice moved, merge it into the ticket first and run the checks again.
- The slice enters main only through /accept.
- Never commit, reset or force-push on main.
