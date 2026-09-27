# Design triage

Classify each decision by the grilling skill ("Defined, inferred, ask"), in this order:

1. **Find what was given**: `docs/DESIGN.md`, a design system file or link in the conversation, in the attachments or in the repo, and the brand. Convert it to the format of [DESIGN-FORMAT.md](DESIGN-FORMAT.md) and show a summary to confirm.
2. **Ask only what is missing**: 2–3 reference products or screens, and what to avoid.
3. **Infer density, theme and devices** from the design system and `docs/PRODUCT.md` (who uses it, how often, where), and confirm.
4. **Propose 3–5 experience principles** from `docs/PRODUCT.md` and the references, and confirm.
5. **Library**: the global default (`node_modules/metri/architecture/defaults/ui.md`); ask only when the design system requires another.

## Result

- `docs/DESIGN.md`, in the format of [DESIGN-FORMAT.md](DESIGN-FORMAT.md). With no design system given, it starts from [DESIGN-TEMPLATE.md](DESIGN-TEMPLATE.md), the neutral base, adapted to the answers.
- A library other than the default: an ADR of `kind: default-change` (call the Skill tool with "domain-language"); its project rule in `.metri/rules/frontend/` comes as a `pattern` ticket from /look-across.

## Where each design decision lives

| Decision | Home |
| --- | --- |
| Visual identity, principles, component usage | `docs/DESIGN.md` |
| Token values | `docs/DESIGN.md`; the theme follows it |
| Default library | `node_modules/metri/architecture/defaults/ui.md` and its global ADR |
| Swapping the library | Project ADR and a rule in `.metri/rules/frontend/` |
| How components are built (global vs. route, slots, variants, tokens only) | The global `frontend/` rules |
| The design system as a capability | The `activation` of `defaults/ui`; its slice enters slice 0 of every project with an interface |
