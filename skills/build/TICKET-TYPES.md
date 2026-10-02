# Ticket types

A T is work without a UC; what each `type` means: `node_modules/metri/skills/look-across/MATRIX-FORMAT.md`, "Ticket types". What /build does for each type, on top of the T's "O que entrega" and "Critérios":

## pattern

- Deliver the rule (a file in `.metri/rules/<área>/`, written by the writing-for-agents skill (call the Skill tool with "writing-for-agents"), or a proposal for the Source), the canonical example in the code and its enforcement (a lint, a type or a check).
- It is the only ticket that writes in `.metri/rules/`, `docs/adr/`, `docs/CONTEXT.md` or `docs/DESIGN.md`; outside a ticket, only the knowledge gate of /accept and /diagnose writes there.
- Its `status` stays `in_progress` until the human reviews the rule, the example and the enforcement, shown in the three blocks of the grilling skill (call the Skill tool with "grilling"); `done` releases the tickets it blocks.
- An update of the Source version is a `pattern` ticket made from `node_modules/metri/CHANGELOG.md`.
- A T "Padrão de tela: <tipo>" (adapted from the `prototype` skill of mattpocock/skills, MIT): 2–3 radically different variants of the screen, in structure and not only in colour, on the same route, switched by `?variant=`, frontend only, over seed data. The human picks one at the pattern gate; the winner stays and enters "Telas canônicas" of `docs/DESIGN.md` in the one line of `node_modules/metri/skills/shape/DESIGN-FORMAT.md`, and the other variants are deleted in the same ticket.

## task

- `mode: afk`: do it alone.
- `mode: hitl`: prepare a step-by-step script for the human; the ticket closes on their confirmation.

## release

Follow `.metri/rules/infrastructure/release.md`, with this checklist:

- migrations (expand–contract);
- variables and secrets;
- flags;
- deploy;
- smoke test;
- known rollback.

The steps only the human can do become a guided script (`mode: hitl`). Done when the version is in production, with a git tag.
