---
name: shape
description: Shape an idea before planning it. A relentless interview that sharpens the problem, the outcome and the domain language, then writes PRODUCT.md, CONTEXT.md, DESIGN.md, ADRs and a spec with its draft UCs per candidate feature.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Before writing the prose of `docs/PRODUCT.md`, `docs/DESIGN.md`, a spec's Problema and Solução, or a UC's story,
call the Skill tool with "humanizer" on it.

Understand the problem, the outcome and the limits, and align the language; slices, contracts and tickets belong to /look-across. Your output is documents; the only code is a throwaway prototype.

## Process

### 1. Read

`docs/PRODUCT.md`, `docs/CONTEXT.md`, `docs/DESIGN.md` when it exists, and every spec in `.metri/specs/`.

### 2. Interview

Call the Skill tool twice, for "grilling" and "domain-language".

- Challenge the framing before deepening it: is this the right problem, what happens if nothing is built, and what in the code or in a known product already solves part of it. What the answers settle becomes numbered premises, one line each, that the user confirms or corrects; they shape the Para quem e qual problema of `docs/PRODUCT.md` and each spec's Problema.
- Before a feature's Solução, give 2 or 3 approaches: the minimal one (fewest pieces, first to deliver the Resultado esperado), the one the product needs once the `planned` features arrive, and a lateral one when another framing is simpler. Each says what it reuses, its risk and what it leaves out, with your recommendation. The user picks, even when one approach clearly wins; the pick becomes the Solução, and each discarded approach a line in the spec's Notas, with why.
- Write as you go: a round that settles a feature writes its spec and its draft UCs at once, by step 4, so a stopped session loses only the round in progress.
- When a decision depends on a fact outside the repository, call the Skill tool with "research".
- When the doubt is about behaviour, answer it with a throwaway prototype; what it settles goes to the spec's Notas, for /look-across to turn into a `pattern` ticket, and the prototype is discarded. The form of a new type of screen is settled by its "Padrão de tela" ticket, in /look-across.

### 3. Design triage

When the project has an interface and `docs/DESIGN.md` doesn't exist or has no references and principles, run [DESIGN-TRIAGE.md](DESIGN-TRIAGE.md).

### 4. Write

Write what the interview settled:

- `docs/PRODUCT.md`, in the format of [PRODUCT-FORMAT.md](PRODUCT-FORMAT.md);
- an ADR for each hard decision already taken (domain-language, which also kept `docs/CONTEXT.md` current during the interview);
- one spec per candidate feature, `.metri/specs/F<n>.md`, in the format of [SPEC-FORMAT.md](SPEC-FORMAT.md):
  `horizon` inferred (`now` for the minimum that delivers the Resultado esperado of
  `docs/PRODUCT.md`, `planned` or `fog` for the rest) and, when it makes sense, `milestone`; its Problema
  and Solução from the interview, its Casos de uso (each UC's id and title, draft included) and Fora de escopo.
  Each UC of a candidate feature also gets its own file, `.metri/tickets/UC<f>.<n>.md`, in the format of
  `node_modules/metri/skills/look-across/MATRIX-FORMAT.md` ("UC block"): `feature`, `actor`, `status: draft`, its
  story, its BRs and its criteria. /look-across plans it and
  opens it.

### 5. Direction gate

First run a context-free critic in a sub-agent: it reads only `docs/PRODUCT.md`, `docs/CONTEXT.md`, the specs and the draft UCs, and reports a term used against its definition in `docs/CONTEXT.md`, a UC that a builder couldn't act on without asking, scope the Resultado esperado doesn't need, and a UC that no Solução explains.

Show the user the direction (the product, the terms, the specs and UCs) in the three blocks of the grilling skill, with the confirmed premises and the chosen approaches among the Defined, each feature's proposed `horizon` and `milestone` among the Inferred, and the critic's findings among the Open questions, and iterate until they approve it. The human commits the result: the agent never commits on main.

Done when the direction is approved, every premise is confirmed and every `now` feature's approach chosen, every term has its English identifier in `docs/CONTEXT.md`, every candidate feature has its spec in `.metri/specs/` with each draft UC in its own ticket file, and `pnpm docs-lint` is green. Recommend /look-across next, in the same session.
