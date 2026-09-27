# Design triage

Once per project with an interface, while `docs/DESIGN.md` doesn't exist. Four questions, each with a default:

| Question | Example answers | Default |
| --- | --- | --- |
| Visual reference | A `DESIGN.md` from getdesign.md, a site URL, images, the brand | The Source's neutral base |
| Component library | shadcn/ui, Coss UI, another | shadcn/ui (`node_modules/metri/architecture/defaults/ui.md`) |
| Icons, density, tone, light/dark | — | The library's and the neutral base's |
| Constraints | Accessibility, languages, devices | None beyond the global rules |

## Result

- `docs/DESIGN.md`: start from [DESIGN-TEMPLATE.md](DESIGN-TEMPLATE.md), the neutral base, and adapt it to the answers; a ready reference (a `DESIGN.md` from getdesign.md) is pasted and adapted the same way.
- A library other than the default: an ADR of `kind: default-change` (call the Skill tool with "domain-language"); its project rule in `.metri/rules/frontend/` comes as a `pattern` ticket from /look-across.

## The format of docs/DESIGN.md

- It follows the DESIGN.md specification (https://github.com/google-labs-code/design.md/blob/main/docs/spec.md), the one getdesign.md uses: tokens in the YAML frontmatter, and the sections with its titles, in its order.
- Prose in Portuguese.
- When the design-system slice is built, the token values move to the theme in the code, and `docs/DESIGN.md` swaps each value for a pointer to the theme file; it keeps the principles, the rationale and the guidance on using the components.

## Where each design decision lives

| Decision | Home |
| --- | --- |
| Visual identity, principles, component usage | `docs/DESIGN.md` |
| Token values | The theme in the code |
| Default library | `node_modules/metri/architecture/defaults/ui.md` and its global ADR |
| Swapping the library | Project ADR and a rule in `.metri/rules/frontend/` |
| How components are built (global vs. route, slots, variants, tokens only) | The global `frontend/` rules |
| The design system as a capability | The `activation` of `defaults/ui`; its slice enters slice 0 of every project with an interface |
