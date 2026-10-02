# AGENTS.md

## How to work here

- Talk to the user in Brazilian Portuguese (pt-BR); keys, ids and code stay in English.
- New request: if it fits one slice in .metri/MATRIX.md, in one ticket, with no new rule and outside sensitive areas, build it directly (at most one ticket: a UC with that `slice`, or a T of that slice, its file written first by node_modules/metri/skills/look-across/MATRIX-FORMAT.md, "Ticket files", a UC also listed in its spec's Casos de uso); if a new rule, a sensitive area or a second slice turns up, route it again. A bug goes to /diagnose. Otherwise use /shape or /look-across.
- Find before you create: `pnpm rules-for <paths>` for rules; for code, grep `SOURCE OF TRUTH:` with CONTEXT.md identifiers and read the linear path in .metri/ARCHITECTURE.md. Assume it already exists.
- When a real case doesn't fit the rules: stop, flag it and ask before implementing.
- Before handing off: `pnpm verify` green.

## Where things live (read only when needed)

- Building a ticket: canonical examples, GAP-n, PP-n, what you may edit, git → /build
- Product intent and scope → docs/PRODUCT.md (when discussing requirements)
- Domain terms and code identifiers → docs/CONTEXT.md (whenever you name something)
- Visual identity and component usage → docs/DESIGN.md (when building UI)
- A feature's problem, solution, use cases and decisions → .metri/specs/<F-id>.md (a UC reads its feature's)
- Plan: slices, contracts, Fog, Gaps and Pattern proposals → .metri/MATRIX.md
- Your ticket (a UC or a T), its criteria and checks → .metri/tickets/<id>.md (read only your ticket's file)
- Architecture rules → `pnpm rules-for` (never read the whole tree)
- Linear path, stack deviations, active capabilities, delegations, project paths → .metri/ARCHITECTURE.md (when a choice depends on them)
- Decisions and exceptions → docs/adr/ (when a rule, spec or ticket cites one)
- Conditional capabilities → node_modules/metri/architecture/INDEX.md, "Capacidades condicionais" (in /look-across)
- Global rules and methodology keys → node_modules/metri/ (read-only, pinned version)
