# AGENTS.md

## How to work here

- New request: if it fits a slice in docs/architecture/slices/INDEX.md, in one ticket, with no new rule and outside sensitive areas, do it directly. Otherwise use /shape or /look-across.
- Find before you create: `rules-for <paths>` for rules; grep SOT keywords and CONTEXT.md identifiers for code. Assume it already exists.
- Follow each rule's canonical example. When a rule does not fit, record a pattern proposal (PP-n) in the matrix and stop; while building, you never edit docs/architecture/, docs/adr/, CONTEXT.md or DESIGN.md (only /shape, /look-across, /accept and pattern tickets do).
- When a real case doesn't fit the rules, don't force it or invent a variation: stop, flag it and ask before implementing.
- Anything deferred: `GAP-<n>` in code and a line under Gaps in the matrix.
- UI: base library components, styled only through theme tokens.
- Before handing off: `<verify command>` green.
- Git: commit only on your ticket/<id> branch or worktree, with the ticket id.

## Where things live (read only when needed)

- Product intent and scope → docs/PRODUCT.md (when discussing requirements)
- Domain terms and code identifiers → docs/CONTEXT.md (whenever you name something)
- Visual identity → docs/DESIGN.md (when a frontend rule points to it)
- Plan, UCs, tickets, checks → docs/plan/MATRIX.md (read only your ticket's section)
- Architecture rules → `rules-for` (never read the whole tree)
- Global rules, defaults and templates → .metri/ (read-only, pinned version; never edit it)
- Reusable capabilities → .metri/catalog/INDEX.md (in /look-across)
- Methodology keys → .metri/methodology/VOCABULARY.md (when you write matrix fields or frontmatter)
- Slice contract → docs/architecture/slices/<slice>.md
- Decisions and exceptions → docs/adr/ (when a rule or ticket cites one)
