# DESIGN.md Format

- `docs/DESIGN.md` follows the DESIGN.md specification (https://github.com/google-labs-code/design.md/blob/main/docs/spec.md), the one getdesign.md uses: tokens in the YAML frontmatter, and the sections with its titles, in its order.
- Prose in Portuguese.
- When the design-system slice is built, the token values move to the theme in the code, and `docs/DESIGN.md` swaps each value for a pointer to the theme file; it keeps the principles, the rationale and the guidance on using the components.
