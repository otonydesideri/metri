---
name: guardrail
description: "Keep code findable and guarded while writing it: find before you create, third-party before own code, the SOURCE OF TRUTH header, GAP-n, checks over text, the rules ladder and the knowledge gate. Use when writing or changing code, when a rule is violated again, or when a lesson is proposed."
---

## While writing code

1. **Find before you create.** Assume it already exists: grep `SOURCE OF TRUTH:` with the identifiers of `docs/CONTEXT.md`, read the linear path of `.metri/ARCHITECTURE.md`, open only the relevant files, and reuse what you find.
2. **Third-party before own code.** What the project and its stack (`node_modules/metri/architecture/defaults/stack.md`) lack comes from a well-known library before code of your own. A library that swaps a stack item or carries lock-in (database, auth, queue, UI kit) is a decision: stop, flag it and ask (AGENTS.md, "How to work here").
3. **Copy the canonical example.** Each rule names its example in `examples`: follow it, and go through the pattern's central points (the block, the registry), never around them. A code block with a `title` path is the project's own file at that path, copied by `metri init` from the starter, which replicates the example.
4. **Name with the glossary.** Identifiers are the English identifiers of `docs/CONTEXT.md`.
5. **Source of truth in code.** Every canonical owner (the export a concept lives in) carries this header right above that export, after the imports:

   ```ts
   /** SOURCE OF TRUTH: <exported symbols or concept>.
    * WHAT: <one line>.
    * WHY: <one line>.
    * WHERE: <who calls it; which owners it relies on>.
    * <optional: one line per limit or invariant>
    */
   ```

   - One header per canonical owner: a file with two owners has two headers.
   - The first line is the SOT keyword: a grep for `SOURCE OF TRUTH:` and the symbol finds the owner.
   - The whole header is in English, labels and text. WHY cites by id the ADR or BR it follows: stable ids only.
   - The owner of a slice's `contract` carries it, since /accept prunes the contract from the MATRIX: `interface` is the `SOURCE OF TRUTH` line, `responsibility` goes in WHAT, the calling owners of `consumers` in WHERE, one line per item of `invariants`; `planned` leaves with the contract (git keeps it).
   - Without a header: generated files, the UI kit's vendor code (`packages/ui/src/components/ui/`), barrels, specs, e2e and their support, type declarations, and a file that exports nothing (an entry such as `main.ts`, a script); `metri sot --help` has the exact list. When the linear path names a symbol of a file that exports nothing, its header sits above that top-level declaration.
   - `pnpm sot` checks the headers, the `sot:` of the done slices and the linear path (`metri sot --help`).
6. **Flag the gaps.** What you leave for later is a `GAP-n` comment at the spot plus its line in the Gaps section of `.metri/MATRIX.md`: nothing stays incomplete in silence.

Done when every canonical owner you created or changed has its header, every new identifier of a domain term is its English identifier in `docs/CONTEXT.md` (never a synonym under `_Evitar:_`), and every deferral has its `GAP-n` in the code and in the matrix.

## Trust errors and checks, not text

What code can verify becomes a check (type, lint, test, script, schema constraint), never a comment or a doc line. When a check fails, its message is the instruction: fix the cause and keep the check.

## The rules ladder

Every rule or lesson goes down to the lowest rung that works:

1. **Executable check**: type, lint, test, script, schema constraint.
2. **Pattern in the code**: a canonical example the agent copies.
3. **Inline header** where the information is needed.
4. **Rule or ADR**: only the why, the decision tree and what can't be verified.
5. **Product, context or design document**: only intent, language and identity.

A rule violated again (a Patterns finding in /accept, a bug in /diagnose) and a failure that recurs (a Risk finding in /accept) are proposed as a check: name the check that would have caught it, as a lesson whose destination is that check.

## Knowledge gate

When a lesson is proposed, at the end of /accept or /diagnose, run it through [KNOWLEDGE-GATE.md](KNOWLEDGE-GATE.md).
