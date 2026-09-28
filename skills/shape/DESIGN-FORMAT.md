# DESIGN.md Format

- `docs/DESIGN.md` follows the DESIGN.md specification (https://github.com/google-labs-code/design.md/blob/main/docs/spec.md), the one getdesign.md uses: tokens in the YAML frontmatter, and the sections with its titles, in its order. Prose in Portuguese.
- The tokens are the source of the theme: the theme in the code follows them, and `pnpm design-tokens` (inside `pnpm verify`) compares the two.
- "Overview" holds, besides the brand and the tone, the references (2–3 links or images of products or screens) and the 3–5 experience principles.
- "Telas canônicas", a section after "Do's and Don'ts" (the spec keeps a section it doesn't know): one line per canonical screen, `- <rota> → <para que serve>`, added by the `pattern` ticket "Padrão de tela: <tipo>".
