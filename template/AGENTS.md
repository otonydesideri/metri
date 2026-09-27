# AGENTS.md

## How to work here

- New request: if it fits one slice in docs/plan/MATRIX.md, in one ticket, with no new rule and outside sensitive areas, build it directly. A bug goes to /diagnose. Otherwise use /shape or /look-across.
- Find before you create: `rules-for <paths>` for rules; grep SOT keywords and CONTEXT.md identifiers for code. Assume it already exists.
- When a real case doesn't fit the rules, don't force it or invent a variation: stop, flag it and ask before implementing.
- Before handing off: `<verify command>` green.

## Where things live (read only when needed)

- Building a ticket: canonical examples, GAP-n, PP-n, what you may edit, git → /build
- Product intent and scope → docs/PRODUCT.md (when discussing requirements)
- Domain terms and code identifiers → docs/CONTEXT.md (whenever you name something)
- Visual identity and component usage → docs/DESIGN.md (when building UI)
- Plan, slice contracts, UCs, tickets, checks → docs/plan/MATRIX.md (read only your ticket's section)
- Architecture rules → `rules-for` (never read the whole tree)
- Stack deviations, active capabilities, delegations, project paths → docs/architecture/INDEX.md (when a choice depends on them)
- Decisions and exceptions → docs/adr/ (when a rule or ticket cites one)
- Conditional capabilities → .metri/architecture/INDEX.md, "Capacidades condicionais" (in /look-across)
- Global rules and methodology keys → .metri/ (read-only, pinned version; never edit it)
