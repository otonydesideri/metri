# DESIGN.md Format

- `docs/DESIGN.md` follows the DESIGN.md specification (https://github.com/google-labs-code/design.md/blob/main/docs/spec.md), the one getdesign.md uses: tokens in the YAML frontmatter, and the sections with its titles, in its order. Prose in Portuguese, through the humanizer skill.
- The tokens are the source of the theme: the theme in the code follows them, and `pnpm design-tokens` (inside `pnpm verify`) compares colors, `rounded.lg` and typography (`metri design-tokens --help`).
- "Overview" holds, besides the brand and the tone, the devices, the density, the theme, the references (2–3 links or images of products or screens), what to avoid and the 3–5 experience principles, one line each as in [DESIGN-TEMPLATE.md](DESIGN-TEMPLATE.md).
- "Telas canônicas", a section after "Do's and Don'ts" (the spec keeps a section it doesn't know): one line per canonical screen, `- <rota> → <para que serve>; descartada: <a variante>, pelo princípio "<princípio>"`, added by the `pattern` ticket "Padrão de tela: <tipo>". The rest of the pattern gate's reasoning stays in git.
