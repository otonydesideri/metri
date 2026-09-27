import { afterAll, describe, expect, it } from 'vitest';
import { copyFixture, edit, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

const THEME = 'packages/ui/src/styles/globals.css';

const DESIGN = `---
name: Pedidos
colors:
  background: "#ffffff"
  background-dark: "oklch(0.145 0 0)"
  border-dark: "oklch(1 0 0 / 10%)"
rounded:
  lg: 0.625rem
typography:
  body-sm:
    fontSize: 14px
    lineHeight: 20px
    letterSpacing: 0px
---

# Pedidos
`;

const CSS = `:root {
  --background: oklch(1 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --border: rgb(255 255 255 / 0.1);
}

@theme inline {
  --color-background: var(--background);
  --text-body-sm: 14px;
  --text-body-sm--line-height: 20px;
  --text-body-sm--letter-spacing: 0;
}
`;

function project(): string {
  const dir = copyFixture();
  write(dir, 'docs/DESIGN.md', DESIGN);
  write(dir, THEME, CSS);
  return dir;
}

describe('design-tokens', { timeout: 30_000 }, () => {
  it('sem tema, pendente e sem falhar', () => {
    expect(run('design-tokens', ['--root', copyFixture()])).toEqual({
      status: 0,
      lines: [`pendente: sem tema em ${THEME}`],
    });
  });

  it('tema que segue os tokens passa, com cor comparada no mesmo espaço (hex, rgb e oklch)', () => {
    expect(run('design-tokens', ['--root', project()])).toEqual({ status: 0, lines: [] });
  });

  it('valor diferente, token sem variável e variável de cor sem token são erro', () => {
    const dir = project();
    edit(dir, 'docs/DESIGN.md', (source) => source.replace('background-dark: "oklch(0.145 0 0)"', 'background-dark: "oklch(0.3 0 0)"'));
    edit(dir, THEME, (source) => source.replace('--radius: 0.625rem;', '--radius: 0.5rem;\n  --ring: #999999;'));
    edit(dir, THEME, (source) => source.replace('  --text-body-sm--line-height: 20px;\n', ''));
    const { status, lines } = run('design-tokens', ['--root', dir]);
    expect(status).toBe(1);
    expect(lines).toEqual([
      `${THEME}: colors.background-dark: oklch(0.3 0 0) no DESIGN.md, oklch(0.145 0 0) em --background de .dark`,
      `${THEME}: --ring de :root: cor sem token colors.ring no DESIGN.md`,
      `${THEME}: rounded.lg: 0.625rem no DESIGN.md, 0.5rem em --radius de :root`,
      `${THEME}: typography.body-sm.lineHeight: falta --text-body-sm--line-height no @theme`,
    ]);
  });
});
