---
name: shape
description: Shape an idea before planning it. A relentless interview that sharpens the problem, the outcome and the domain language, then writes PRODUCT.md, CONTEXT.md, DESIGN.md, ADRs and the draft features and UCs of the matrix.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Understand the problem, the outcome and the limits, and align the language; slices, contracts and tickets belong to /look-across.

## Process

### 1. Read

`docs/PRODUCT.md`, `docs/CONTEXT.md`, `docs/DESIGN.md` when it exists, and the Features section of `.metri/MATRIX.md`.

### 2. Interview

Call the Skill tool twice, for "grilling" and "domain-language".

- Explore approaches with the user: help them understand the path.
- When a decision depends on a fact outside the repository, call the Skill tool with "research".
- When the doubt is about behaviour, answer it with a throwaway prototype; what it settles goes to a `frontend/` rule, and the prototype is discarded. The form of a new type of screen is settled by its "Padrão de tela" ticket, in /look-across.

### 3. Design triage

When the project has an interface and `docs/DESIGN.md` doesn't exist or has no references and principles, run [DESIGN-TRIAGE.md](DESIGN-TRIAGE.md).

### 4. Write

Write what the interview settled:

- `docs/PRODUCT.md`, in the format of [PRODUCT-FORMAT.md](PRODUCT-FORMAT.md);
- an ADR for each hard decision already taken (domain-language, which also kept `docs/CONTEXT.md` current during the interview);
- the candidate features in the Features section of `.metri/MATRIX.md`, each with `outcome`, `ucs` (the ids of its UCs), `horizon` and, when it makes sense, `milestone`, inferred: `now` for the minimum that delivers the expected outcome of `docs/PRODUCT.md`, `planned`, `fog` or `out` for the rest; each UC of a candidate feature as its own file, `.metri/tickets/UC<f>.<n>.md`, in the format of `node_modules/metri/skills/look-across/MATRIX-FORMAT.md` ("UC block"): `feature`, `actor`, `status: draft`, its BRs and its criteria. /look-across plans it and opens it.

### 5. Direction gate

Show the user the direction (the product, the terms, the features and UCs) in the three blocks of the grilling skill, with each feature's proposed `horizon` and `milestone` among the Inferred, and iterate until they approve it. The human commits the result: the agent never commits on main.

Done when the direction is approved, every term has its English identifier in `docs/CONTEXT.md`, the candidate features are in the matrix with each draft UC in its own ticket file, and `pnpm docs-lint` is green. Recommend /look-across next, in the same session.
