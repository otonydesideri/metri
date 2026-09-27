---
name: guardrail
description: "Keep code findable and guarded while writing it: find before you create, third-party before own code, the inline header with SOT keywords, GAP-n, checks over text, the rules ladder and the knowledge gate. Use when writing or changing code, when a rule is violated again, or when a lesson is proposed."
---

## While writing code

1. **Find before you create.** Assume it already exists: grep the SOT keywords and the identifiers of `docs/CONTEXT.md`, list the files, open only the relevant ones, and reuse what you find.
2. **Third-party before own code.** What the project and its stack (`.metri/architecture/defaults/stack.md`) lack comes from a well-known library before code of your own. A library that swaps a stack item or carries lock-in (database, auth, queue, UI kit) is a decision: stop, flag it and ask (AGENTS.md, "How to work here").
3. **Copy the canonical example.** Each rule names its example in `examples`: follow it, and go through the pattern's central points (the block, the registry), never around them.
4. **Name with the glossary.** Identifiers are the English identifiers of `docs/CONTEXT.md`.
5. **Context in code.** Every new code file opens with an inline header: what it is, why it exists, where it connects and how to use it, then its SOT keywords (the words a grep for this concept would use) and the ids of the ADRs and BRs it follows. In a slice `entry`, the header is the slice contract (`.metri/skills/look-across/MATRIX-FORMAT.md`, "Contrato de slice"). A module's barrel (`index`) is its map.
6. **Flag the gaps.** What you leave for later is a `GAP-n` comment at the spot plus its line in the Gaps section of `docs/plan/MATRIX.md`: nothing stays incomplete in silence.

Done when every new code file has its header with SOT keywords, every new identifier of a domain term is its English identifier in `docs/CONTEXT.md` (never a synonym under `_Evitar:_`), and every deferral has its `GAP-n` in the code and in the matrix.

## Trust errors and checks, not text

What code can verify becomes a check (type, lint, test, script, schema constraint), never a comment or a doc line. When a check fails, its message is the instruction: fix the cause and keep the check.

## The rules ladder

Every rule or lesson goes down to the lowest rung that works:

1. **Executable check**: type, lint, test, script, schema constraint.
2. **Pattern in the code**: a canonical example the agent copies.
3. **Inline header** where the information is needed.
4. **Rule or ADR**: only the why, the decision tree and what can't be verified.
5. **Product, context or design document**: only intent, language and identity.

A rule violated again (a Patterns finding in /accept, a bug in /diagnose) is proposed as a check: name the check that would have caught it, as a lesson whose destination is that check.

## Knowledge gate

When a lesson is proposed, at the end of /accept or /diagnose, run it through [KNOWLEDGE-GATE.md](KNOWLEDGE-GATE.md).
