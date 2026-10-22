# AGENTS.md

## How to work here

- Talk to the user in Brazilian Portuguese (pt-BR); keys, ids and code stay in English.
- New request with no new rule, no sensitive area and no new type of screen: within one module, it takes the direct lane (a branch from the integration branch of node_modules/metri/skills/build/SKILL.md, "Git", `pnpm verify` green, squash-merged saying what changed; no ticket file, no /accept); within one slice and one ticket, build it directly, its ticket file written first (node_modules/metri/skills/look-across/MATRIX-FORMAT.md, "Ticket files"). When it grows, route it again. A bug goes to /diagnose; anything else to /shape or /look-across.
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
- Linear path, stack deviations, active capabilities, delegations, project paths, exceptions → .metri/ARCHITECTURE.md (when a choice depends on them)
- Decisions → docs/adr/ (when a rule, spec, ticket or exception line cites one)
- Conditional capabilities → node_modules/metri/architecture/INDEX.md, "Capacidades condicionais" (in /look-across)
- Global rules and methodology keys → node_modules/metri/ (read-only, pinned version)
