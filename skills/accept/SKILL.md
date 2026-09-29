---
name: accept
description: Accept a slice, and its feature when it is the last slice. Isolated reviewers on contract, patterns and experience, the consumer test, the human gate, the knowledge gate and the matrix pruning.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Judge what no check judges, on the diff of a slice, along separate axes:

- **Contract**: does the code deliver the slice contract, its UCs and its T tickets?
- **Patterns**: does the code pass the verification items of its rules that no check covers?
- **Experience**, when the slice has UI: what does the user live on its screens?

The work never judges itself: each axis is a reviewer agent that gets nothing from the builder's conversation, all run in parallel, and this skill aggregates their findings.

## Process

### 1. Pin the fixed point

Check out `slice/<id>` with a clean working tree. When main moved since the slice last took it, merge main into `slice/<id>`. The slice is ready when every UC with `slice: S<id>` and every T of the slice are `done`, and each command in their `checks` and `pnpm verify` exit 0. Run them here, once, the e2e included, and keep each command with its result: they are the check results the reviewers read. When the branch carries only the urgent fix of /diagnose, only its ticket must be `done`; the slice's other tickets wait for a later /accept.

The fixed point is where `slice/<id>` left main: `git merge-base main slice/<id>`. Capture the diff command once: `git diff <fixed-point>...slice/<id>` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..slice/<id> --oneline`.

Before going further, confirm the fixed point resolves and the diff is non-empty.

### 2. Gather the inputs

- **Contract**: the slice's `contract` block in `.metri/MATRIX.md`, which /accept prunes only in step 7 (`S0` has none); in `.metri/tickets/`, each UC and each T with `slice: S<id>`, with its Critérios and the text of its BRs (UC) or its O que entrega (T).
- **Patterns**: `pnpm rules-for` once, with every path of `git diff --name-only <fixed-point>...slice/<id>`; in each listed rule, leaving out the `citada:` lines and `frontend/experience` (whose items go to the Experience reviewer), the items of its verification sections ("Verificação", "Verificação rápida") without a `(check: <id>)` mark. The items with a check already passed `pnpm verify`. With no such item, skip the Patterns reviewer and say so.
- **Experience**, when a ticket of the slice has a `Tela:` criterion: the evidence paths of each `Tela:` criterion, `docs/DESIGN.md`, the UCs, and the verification items of `frontend/experience` without a `(check: <id>)` mark.

### 3. Call the reviewers in parallel

Call each agent (`.claude/agents/<name>.md`, the owner of its brief and of what it may read) as a sub-agent, passing only its inputs and nothing else of this session. The reviewers read the diff, the evidence and the check results of step 1; the checks ran once, in this session.

- `reviewer-contract`: the diff command, the commit list, the check results, and the Contract inputs, pasted in full.
- `reviewer-patterns`: the diff command, the commit list, the check results, and the Patterns items, pasted with their rule id.
- `reviewer-ux`, when the slice has a `Tela:` criterion: the Experience inputs.
- `consumer-tester`: the contract's `interface`, when the contract's `consumers` include an external consumer (a public API, a library, a guide for agents, a critical user flow; ask the user when unsure); and, for each UC with a `Tela:` criterion, only the UC's goal and the URL of the app this session serves once for it, with the development seed, on its own port (`frontend/testing`, "E2e de critério de UI"), stopped when the tester reports.

### 4. Aggregate

Present the reports in the chat under `## Contract` and `## Patterns` (and `## Experience`, `## Consumer`), verbatim or lightly cleaned, each axis with its findings in the reviewer's three groups. Keep the axes apart (see _Why separate axes_).

### 5. Human gate

Call the Skill tool with "grilling" and walk the human through the gate in its three blocks:

- the slice's linear path, "show me the flow and the sources of truth": the "Caminho linear" of `.metri/ARCHITECTURE.md` with the slice's new owners in their places, each step as `arquivo:símbolo` with its `SOURCE OF TRUTH:` header;
- for each criterion, the paths of its evidence (the test that proves it and, for a `Tela:` criterion, `.metri/tickets/<id>/<n>-desktop.png` and `<n>-mobile.png`), with visual conformity to `docs/DESIGN.md`; and, when this is the feature's last slice (every other slice in the feature's `slices` is done), whether the feature delivers its `outcome` across all its UCs. Running the app is optional: give the steps per criterion when the human wants it;
- the diff of every ticket with `sensitive: true` or `type: pattern`;
- each finding, with its group and the reviewer's recommendation; the user decides each one.

What each decision does (the formats: `node_modules/metri/skills/look-across/MATRIX-FORMAT.md`):

- **Corrigir agora**: reopens its UC (`in_progress`, with the finding in its ticket file's "Notas"), or becomes a T of the slice when no UC covers it. Run step 6 and stop, without pruning or merging: /accept runs again, whole, after /build closes them.
- **Virar T**: a new T, `open`, for a later /build; the merge goes on, and the slice stays `horizon: now` by the pruning rule.
- **Aceitar como está**: the code stays; the finding goes to the knowledge gate as a lesson candidate.

### 6. Knowledge gate

Collect the proposed lessons: findings, `PP-n`, `GAP-n`, repeated fixes and the decisions written in the Notas of the slice's tickets, each with its evidence; an approved decision leaves the Notas. When the slice hurt (many findings, proposals or fixes), an architecture survey in a sub-agent brings back only its conclusion, as one more lesson. Call the Skill tool with "guardrail" and put each lesson through its knowledge gate. The human approves the destination of each; write the approved ones in their destination, on `slice/<id>`. A lesson for the Source goes as a PR to the Source's repository: `node_modules/metri/` is read-only.

### 7. Prune and merge

On `slice/<id>`, prune the matrix by the "Pruning" rule of "Matrix rules" in `node_modules/metri/skills/look-across/MATRIX-FORMAT.md`: the done slice becomes `status: done · sot: [<símbolo>]` and its `contract` leaves; the steps the human saw in step 5 enter the "Caminho linear" of `.metri/ARCHITECTURE.md`; its ticket files stay, `status: done`, each in its own file, and `pnpm exec metri prune <slice id>` takes their evidence out of the tree. Keep every id, commit, and run `pnpm docs-lint` and `pnpm verify`. Then, with the human's approval, fast-forward main to the slice: `git merge --ff-only slice/<id>` on main, never a commit, reset or force push there.

Done when the slice is on main, or its reopened UCs and new T tickets are in their files; every finding has the user's decision; its done UCs are collapsed; every lesson has an approved destination or is discarded; and `pnpm verify` is green.

## Why separate axes

A slice can pass one axis and fail another:

- Code that follows every rule but delivers the wrong thing → **Patterns pass, Contract fail.**
- Code that does exactly what the contract asked but breaks the rules → **Contract pass, Patterns fail.**
- Screens that deliver the UC by the rules but bury its main action → **Contract and Patterns pass, Experience fail.**

Reporting them separately stops one axis from masking another.
