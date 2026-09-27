---
name: shape
description: Shape an idea before planning it. A relentless interview that sharpens the problem, the outcome and the domain language, then writes PRODUCT.md, CONTEXT.md, DESIGN.md, ADRs and the draft features and UCs of the matrix.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Understand the problem, the outcome and the limits, and align the language. Don't plan yet: slices, contracts and tickets belong to /look-across.

## Process

### 1. Read

`docs/PRODUCT.md`, `docs/CONTEXT.md`, `docs/DESIGN.md` when it exists, and the Features section of `docs/plan/MATRIX.md`.

### 2. Interview

Call the Skill tool twice, for "grilling" and "domain-language".

- Explore approaches with the user: help them understand the path, without generating the plan.
- When a decision depends on a fact outside the repository, call the Skill tool with "research".
- When the doubt is about form or behaviour, answer it with a throwaway prototype; what it settles goes to `docs/DESIGN.md` (visual) or to a `frontend/` rule (implementation), and the prototype is discarded.

### 3. Design triage

When the project has an interface and no `docs/DESIGN.md`, run [DESIGN-TRIAGE.md](DESIGN-TRIAGE.md).

### 4. Write

Do NOT interview the user again; synthesize what the interview settled:

- `docs/PRODUCT.md`, in the format of [PRODUCT-FORMAT.md](PRODUCT-FORMAT.md);
- an ADR for each hard decision already taken (domain-language, which also kept `docs/CONTEXT.md` current during the interview);
- the candidate features in the Features section of `docs/plan/MATRIX.md`, each with `horizon`, `outcome` and `ucs` (the ids of its UCs); each UC of a candidate feature as its own file, `docs/plan/tickets/UC<f>.<n>.md`, in the format of `.metri/skills/look-across/MATRIX-FORMAT.md` ("UC block"): `feature`, `actor`, `status: draft`, its BRs and its criteria. /look-across plans it and opens it.

### 5. Direction gate

Show the user the direction (the product, the terms, the features and UCs) and iterate until they approve it. The human commits the result: the agent never commits on main.

Done when the direction is approved, every term has its English identifier in `docs/CONTEXT.md`, the candidate features are in the matrix with each draft UC in its own ticket file, and `pnpm docs-lint` is green. Recommend /look-across next, in the same session.
