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

  it('o preâmbulo do globals.css (@import, @source, @custom-variant) antes do primeiro bloco não esconde o bloco', () => {
    const dir = project();
    const preamble = '@import "tailwindcss";\n@source "../../../../apps";\n@custom-variant dark (&:is(.dark *));\n\n';
    edit(dir, THEME, (source) => preamble + source);
    expect(run('design-tokens', ['--root', dir])).toEqual({ status: 0, lines: [] });
    const themeFirst = project();
    edit(themeFirst, THEME, (source) => {
      const theme = source.slice(source.indexOf('@theme inline'));
      return `${preamble}${theme}\n${source.slice(0, source.indexOf('@theme inline'))}`;
    });
    expect(run('design-tokens', ['--root', themeFirst])).toEqual({ status: 0, lines: [] });
  });

  it('rounded.lg sem --radius é erro', () => {
    const dir = project();
    edit(dir, THEME, (source) => source.replace('  --radius: 0.625rem;\n', ''));
    expect(run('design-tokens', ['--root', dir]).lines).toContain(`${THEME}: rounded.lg: falta --radius em :root`);
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

  it('cn: a lista theme.text bate com os --text-<nível> do @theme, nos dois sentidos', () => {
    const utils = (levels: string) => `const twMerge = extendTailwindMerge({ extend: { theme: { text: [${levels}] } } });\n`;
    const dir = project();
    write(dir, 'packages/ui/src/lib/utils.ts', utils("'body-sm'"));
    expect(run('design-tokens', ['--root', dir])).toEqual({ status: 0, lines: [] });
    write(dir, 'packages/ui/src/lib/utils.ts', utils("'caption'"));
    const { status, lines } = run('design-tokens', ['--root', dir]);
    expect(status).toBe(1);
    expect(lines).toEqual([
      'packages/ui/src/lib/utils.ts: --text-body-sm do @theme fora de theme.text do cn',
      'packages/ui/src/lib/utils.ts: theme.text do cn tem caption, sem --text-caption no @theme',
    ]);
    write(dir, 'packages/ui/src/lib/utils.ts', 'export { twMerge as cn } from "tailwind-merge";\n');
    expect(run('design-tokens', ['--root', dir]).lines).toEqual([
      'packages/ui/src/lib/utils.ts: o cn sem extendTailwindMerge com theme.text; os níveis do @theme: body-sm',
    ]);
  });

  it('index.html: o <style> pinta html e html.dark com o --background de :root e de .dark', () => {
    const html = (light: string, dark: string) =>
      `<html><head><style>\n  /* html { background: red; } */\n  html { background: ${light}; }\n  html.dark { background: ${dark}; }\n</style></head></html>\n`;
    const dir = project();
    write(dir, 'apps/app-web/index.html', html('#ffffff', 'oklch(0.145 0 0)'));
    expect(run('design-tokens', ['--root', dir])).toEqual({ status: 0, lines: [] });
    write(dir, 'apps/app-web/index.html', html('#ffffff', 'oklch(0.3 0 0)'));
    expect(run('design-tokens', ['--root', dir]).lines).toEqual([
      'apps/app-web/index.html: html.dark { background: oklch(0.3 0 0) }, e o --background de .dark é oklch(0.145 0 0)',
    ]);
    write(dir, 'apps/app-web/index.html', '<html><head></head></html>\n');
    expect(run('design-tokens', ['--root', dir]).lines).toContain(
      'apps/app-web/index.html: o <style> sem html { background }; o valor é o --background de :root',
    );
  });

  it('typography.fontFamily: a lista do nível é a de --font-sans ou de --font-mono, sem as aspas', () => {
    const dir = project();
    edit(dir, 'docs/DESIGN.md', (source) => source.replace('    fontSize: 14px', '    fontFamily: Geist Variable, system-ui\n    fontSize: 14px'));
    const theme = (sans: string) => CSS.replace('@theme inline {', `@theme {\n  --font-sans: ${sans};\n  --font-mono: "Geist Mono Variable", monospace;\n}\n\n@theme inline {`);
    write(dir, THEME, theme('"Geist Variable", system-ui'));
    expect(run('design-tokens', ['--root', dir])).toEqual({ status: 0, lines: [] });
    write(dir, THEME, theme('"Geist", system-ui'));
    expect(run('design-tokens', ['--root', dir])).toEqual({
      status: 1,
      lines: [`${THEME}: typography.body-sm.fontFamily: Geist Variable, system-ui no DESIGN.md, sem --font-sans nem --font-mono igual no @theme`],
    });
  });

  it('a dependência npm cn no package.json do kit de UI é erro, mesmo com o tema pendente', () => {
    const dir = copyFixture();
    write(dir, 'packages/ui/package.json', JSON.stringify({ name: '@metri/ui', dependencies: { cn: '1.0.0', clsx: '2.1.1' } }));
    expect(run('design-tokens', ['--root', dir])).toEqual({
      status: 1,
      lines: ['packages/ui/package.json: a dependência npm cn em dependencies; o cn do kit é o de lib/utils.ts (defaults/ui, "Componente novo")'],
    });
    write(dir, 'packages/ui/package.json', JSON.stringify({ name: '@metri/ui', dependencies: { clsx: '2.1.1' } }));
    expect(run('design-tokens', ['--root', dir]).status).toBe(0);
  });
});
