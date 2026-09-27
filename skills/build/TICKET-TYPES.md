# Ticket types

A T is work without a UC; what each `type` means: `.metri/skills/look-across/MATRIX-FORMAT.md`, "Ticket types". What /build does for each type, on top of the T's "O que entrega" and "Critérios":

## pattern

- Deliver the rule (a file in `docs/architecture/<área>/`, written with the writing-for-agents skill, or a proposal for the Source), the canonical example in the code and its enforcement (a lint, a type or a check).
- It is the only ticket that writes in `docs/architecture/`, `docs/adr/`, `docs/CONTEXT.md` or `docs/DESIGN.md`.
- Its `status` stays `in_progress` until the human reviews the rule, the example and the enforcement; `done` releases the tickets it blocks.
- An update of the Source version is a `pattern` ticket made from `.metri/CHANGELOG.md`.

## task

- `mode: afk`: do it alone.
- `mode: hitl`: prepare a step-by-step script for the human; the ticket closes on their confirmation.

## release

Follow `docs/architecture/infrastructure/release.md`, with this checklist:

- migrations (expand–contract);
- variables and secrets;
- flags;
- deploy;
- smoke test;
- known rollback.

The steps only the human can do become a guided script (`mode: hitl`). Done when the version is in production, with a git tag.
