---
name: accept
description: Accept a slice, and its feature when it is the last slice. Isolated reviewers on contract and patterns, the consumer test, the human gate, the knowledge gate and the matrix pruning.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Judge what no check judges, on the diff of a slice, along two axes:

- **Contract**: does the code deliver the slice contract and its UCs?
- **Patterns**: does the code pass the verification items of its rules that no check covers?

The work never judges itself: both axes run as **parallel sub-agents** that get nothing from the builder's conversation, then this skill aggregates their findings.

## Process

### 1. Pin the fixed point

The fixed point is where `slice/<id>` left main: `git merge-base main slice/<id>`. Capture the diff command once: `git diff <fixed-point>...slice/<id>` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..slice/<id> --oneline`.

Before going further, confirm the slice's tickets are all `done` with their checks green, the fixed point resolves and the diff is non-empty. A bad ref or an empty diff should fail here, not inside the sub-agents.

### 2. Gather the inputs

- **Contract**: the header of the slice `entry`, and the UCs its tickets serve (criteria and BRs) in `docs/plan/MATRIX.md`.
- **Patterns**: `pnpm rules-for <each path the diff touches>`, and in each listed rule the items of its verification section ("Verificação" or "Verificação rápida") without a `(check: <id>)` mark. The items with a check already passed `pnpm verify`.

### 3. Spawn the sub-agents in parallel

**Contract sub-agent prompt** should include:

- The diff command and the commit list.
- The contract and the UCs, pasted in full.
- The brief: "Report: (a) contract items or UC criteria that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) items that look implemented but where the implementation looks wrong; (d) UC criteria that no check proves. Quote the contract or UC line for each finding. Under 400 words."

**Patterns sub-agent prompt** should include:

- The diff command and the commit list.
- The unchecked verification items, pasted with their rule id.
- The brief: "Report, per file/hunk, every verification item the diff fails: cite the rule id and the item, and quote the hunk. Skip anything tooling enforces. Under 400 words."

**Consumer sub-agent**, only when the slice has an external consumer (a public API, a library, a guide for agents, a critical user flow): an agent that knows only the public interface (the contract's `interface`) tries to use it, and reports where it got stuck.

### 4. Aggregate

Present the reports under `## Contract` and `## Patterns` (and `## Consumer`), verbatim or lightly cleaned. Do **not** merge or rerank findings, because the axes are deliberately separate (see _Why two axes_).

### 5. Human gate

Walk the human through:

- the slice's linear path: "show me the flow and the sources of truth";
- the QA of its UCs (and of the feature, when this is its last slice), with visual conformity to `docs/DESIGN.md`;
- the diff of every `sensitive` and `pattern` ticket.

A finding to fix becomes a ticket in the slice (`.metri/skills/look-across/MATRIX-FORMAT.md`) and goes back to /build; the slice isn't accepted yet.

### 6. Knowledge gate

Collect the proposed lessons: findings, `PP-n`, `GAP-n` and repeated fixes, each with its evidence. Call the Skill tool with "guardrail" and put each one through its knowledge gate. The human approves the destination of each lesson; write the approved ones in their destination, on `slice/<id>`.

### 7. Prune and merge

On `slice/<id>`, prune the matrix by rule 7 of "Matrix rules" in `.metri/skills/look-across/MATRIX-FORMAT.md`: each done UC becomes one line pointing to its tests, and the done slice one line with its `entry`. Then, with the human's approval, merge `slice/<id>` into main: a merge, never a direct commit, reset or force push on main.

Done when the slice is merged, or its correction tickets are in the matrix; its done UCs are collapsed; every lesson has an approved destination or is discarded; and `pnpm verify` is green.

## Why two axes

A slice can pass one axis and fail the other:

- Code that follows every rule but delivers the wrong thing → **Patterns pass, Contract fail.**
- Code that does exactly what the contract asked but breaks the rules → **Contract pass, Patterns fail.**

Reporting them separately stops one axis from masking the other.
