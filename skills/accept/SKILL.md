---
name: accept
description: Accept a slice, and its feature when it is the last slice. Isolated reviewers on contract and patterns, the consumer test, the human gate, the knowledge gate and the matrix pruning.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Judge what no check judges, on the diff of a slice, along two axes:

- **Contract**: does the code deliver the slice contract, its UCs and its T tickets?
- **Patterns**: does the code pass the verification items of its rules that no check covers?

The work never judges itself: both axes run as **parallel sub-agents** that get nothing from the builder's conversation, then this skill aggregates their findings.

## Process

### 1. Pin the fixed point

Check out `slice/<id>` with a clean working tree. When main moved since the slice last took it, merge main into `slice/<id>`. The slice is ready when every UC with `slice: S<id>` and every T of the slice are `done`, and each command in their `checks` and `pnpm verify` exit 0.

The fixed point is where `slice/<id>` left main: `git merge-base main slice/<id>`. Capture the diff command once: `git diff <fixed-point>...slice/<id>` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..slice/<id> --oneline`.

Before going further, confirm the fixed point resolves and the diff is non-empty. A bad ref or an empty diff should fail here, not inside the sub-agents.

### 2. Gather the inputs

- **Contract**: the contract header at the top of the file named by the slice's `entry`; in `docs/plan/tickets/`, each UC and each T with `slice: S<id>`, with its Critérios and the text of its BRs (UC) or its O que entrega (T).
- **Patterns**: `pnpm rules-for` once, with every path of `git diff --name-only <fixed-point>...slice/<id>`; in each listed rule, the items of its verification sections ("Verificação", "Verificação rápida") without a `(check: <id>)` mark. The items with a check already passed `pnpm verify`. With no such item, skip the Patterns sub-agent and say so.

### 3. Spawn the sub-agents in parallel

They may read the repository at `slice/<id>`, nothing else of this session.

**Contract sub-agent prompt** includes:

- The diff command and the commit list.
- The contract, the UCs and the T tickets, pasted in full.
- The brief: "Report: (a) contract items, UC criteria, or T `what` and `criteria` that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep), leaving out the edits to `docs/plan/`; (c) items that look implemented but where the implementation looks wrong; (d) UC criteria that no test run by the UC's `checks` proves. Quote the contract, UC or T line for each finding. Under 400 words."

**Patterns sub-agent prompt** includes:

- The diff command and the commit list.
- The unchecked verification items, pasted with their rule id.
- The brief: "Report, per file/hunk, every verification item the diff fails: cite the rule id and the item, and quote the hunk. Under 400 words."

**Consumer sub-agent**, only when the contract's `consumers` include an external consumer (a public API, a library, a guide for agents, a critical user flow; ask the user when unsure): an agent that knows only the public interface (the contract's `interface`) tries to use it, and reports where it got stuck.

### 4. Aggregate

Present the reports in the chat under `## Contract` and `## Patterns` (and `## Consumer`), verbatim or lightly cleaned. Do **not** merge or rerank findings, because the axes are deliberately separate (see _Why two axes_).

### 5. Human gate

Walk the human through:

- the slice's linear path, "show me the flow and the sources of truth": from the `entry` to each source of truth, as file:line;
- the QA of its UCs, which the human runs from the steps you give per UC criterion, with visual conformity to `docs/DESIGN.md`; and of the feature, when this is its last slice (every other slice in the feature's `slices` is done);
- the diff of every ticket with `sensitive: true` or `type: pattern`.

A finding to fix reopens its UC (`in_progress`, with the finding in its ticket file's "Notas"), or becomes a T of the slice when no UC covers it (`.metri/skills/look-across/MATRIX-FORMAT.md`). With a reopened UC or a new T, run step 6 and stop, without pruning or merging: /accept runs again, whole, after /build closes them.

### 6. Knowledge gate

Collect the proposed lessons: findings, `PP-n`, `GAP-n` and repeated fixes, each with its evidence. When the slice hurt (many findings, proposals or fixes), an architecture survey in a sub-agent brings back only its conclusion, as one more lesson. Call the Skill tool with "guardrail" and put each lesson through its knowledge gate. The human approves the destination of each; write the approved ones in their destination, on `slice/<id>`. A lesson for the Source goes as a PR to the Source's repository: `.metri/` is read-only.

### 7. Prune and merge

On `slice/<id>`, prune the matrix by the "Pruning" rule of "Matrix rules" in `.metri/skills/look-across/MATRIX-FORMAT.md` (the done slice becomes one line with its `entry`; its ticket files stay, `status: done`, each in its own file), keeping every id, commit, and run `pnpm docs-lint` and `pnpm verify`. Then, with the human's approval, fast-forward main to the slice: `git merge --ff-only slice/<id>` on main, never a commit, reset or force push there.

Done when the slice is on main, or its reopened UCs and new T tickets are in the matrix; its done UCs are collapsed; every lesson has an approved destination or is discarded; and `pnpm verify` is green.

## Why two axes

A slice can pass one axis and fail the other:

- Code that follows every rule but delivers the wrong thing → **Patterns pass, Contract fail.**
- Code that does exactly what the contract asked but breaks the rules → **Contract pass, Patterns fail.**

Reporting them separately stops one axis from masking the other.
