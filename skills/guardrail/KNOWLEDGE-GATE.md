# Knowledge gate

Persistent knowledge **changes a future decision or implementation**, **can't be derived** from the code, the tests, the checks, git or the existing rules and ADRs, and **would be lost** if not recorded.

## Five questions, all "yes"

Any "no" discards the lesson.

1. **Not derivable?** An agent would _not_ find it with a grep, or by reading the code, the tests, the rules or the `git log`.
2. **Not verifiable?** If it is verifiable, the result is **a check**, not knowledge. Creating a check is code, not a learning artifact.
3. **Worth beyond this ticket?** It affects future work, not only what was just done.
4. **Recurring, or the first instance of a pattern?** A one-off doesn't count.
5. **Has an existing home?** `docs/CONTEXT.md`, a rule (preferably **by changing one that exists**), an ADR, `docs/PRODUCT.md` or `docs/DESIGN.md`. **Learning never creates a new kind of artifact.**

## Never knowledge

- What was done → git.
- How a bug was fixed → test + commit.
- Status → `docs/plan/MATRIX.md`.
- A temporary workaround → `GAP-n`.
- A one-off preference.
- A fact the code already shows.
- What an existing rule or check already covers.
- Library documentation → fetched on demand.
- Debugging steps.
- A session summary.
- Generic "lessons learned".

## Who records it, and when

- /build never records knowledge: it only raises `PP-n` or `GAP-n`.
- Outside planning (/shape and /look-across record decisions and new terms), only three moments record knowledge: the end of /accept, the end of /diagnose and a `pattern` ticket.
- Every proposed lesson carries its evidence (the ticket or the finding) and its destination; **the human approves** each destination.
- The agent tool's automatic memory is not project knowledge: only what is in the repository counts.

Most tickets and slices end with zero lessons: that is health, not omission. Many lessons per slice mean the gate is loose.

## Destination

For a lesson that passed the gate:

1. **Turned out verifiable?** Create the check; at most one line in the rule's `enforced_by`.
2. **Recurring pattern that can't be verified?** Canonical example in the code, plus a change to a rule or a new rule (call the Skill tool with "writing-for-agents").
3. **Hard to reverse, surprising and the result of a real trade-off?** An ADR (call the Skill tool with "domain-language").
4. **Domain term?** `docs/CONTEXT.md` (call the Skill tool with "domain-language").
5. **Visual identity or usage?** `docs/DESIGN.md`.

## Promotion to the Source

A lesson becomes global only when all three hold: it depends on no technology or project decision (unless it is a `default`, with a global ADR); it was used unchanged in at least one project; it holds for the next projects. It enters by a PR to the Source repository, with a new version and an entry in its `CHANGELOG.md`.

## Pruning

- A rule whose verification items all have a check can shrink to its frontmatter, its why and its exceptions: the check's message teaches the rest.
- A rule whose `applies_to` matches no file is a pruning candidate (`pnpm docs-lint` warns).
- A superseded ADR gets `superseded by ADR-NNNN`.
