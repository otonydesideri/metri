import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { copyFixture, edit, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

const git = (dir: string, command: string) =>
  execSync(`git -c user.email=t@t -c user.name=t ${command}`, { cwd: dir, stdio: 'pipe' });

const SPEC = 'apps/app-api/src/legacy/order-export.spec.ts';
const PATTERN = `---
id: T2.2
title: Padrão de envio de e-mail
slice: S2
type: pattern
mode: afk
status: open
checks: ["\`pnpm verify\`"]
---

# T2.2 · Padrão de envio de e-mail

## O que entrega

A regra de envio de e-mail.

## Critérios

- [ ] A regra existe.
`;

// The fixture as a repository: main, slice/S2 from it and ticket/<id> from the slice, checked out.
function repository(id: string): string {
  const dir = copyFixture();
  write(dir, SPEC, "it('exporta', () => {});\n");
  write(dir, 'package.json', JSON.stringify({ name: 'app', scripts: { test: 'vitest run', dev: 'vite' } }, null, 2));
  write(dir, 'eslint.config.js', 'export default [];\n');
  write(dir, '.metri/tickets/T2.2.md', PATTERN);
  write(dir, '.gitignore', 'node_modules/\n.claude/\n');
  git(dir, 'init -q -b main');
  git(dir, 'add -A');
  git(dir, 'commit -qm fixture');
  git(dir, 'switch -qc slice/S2');
  git(dir, `switch -qc ticket/${id}`);
  return dir;
}

describe('scope', { timeout: 30_000 }, () => {
  it('passa com código, o arquivo do ticket, a evidência dele, a MATRIX e o status de outro ticket', () => {
    const dir = repository('T2.1');
    write(dir, 'apps/app-api/src/mail/send.ts', 'export const send = () => {};\n');
    edit(dir, '.metri/tickets/T2.1.md', (source) => source.replace('status: open', 'status: in_progress'));
    write(dir, '.metri/tickets/T2.1/1-desktop.png', 'png');
    edit(dir, '.metri/MATRIX.md', (source) => `${source}\n`);
    edit(dir, '.metri/tickets/UC1.2.md', (source) => source.replace('status: open', 'status: in_progress'));
    git(dir, 'add -A');
    git(dir, 'commit -qm wip');
    expect(run('scope', ['T2.1', '--root', dir])).toEqual({ status: 0, lines: [] });
  });

  it('falha fora da branch do ticket', () => {
    const dir = repository('T2.1');
    git(dir, 'switch -q main');
    const { status, lines } = run('scope', ['T2.1', '--root', dir]);
    expect(status).toBe(1);
    expect(lines).toEqual(['falha branch: a branch atual é main, não ticket/T2.1']);
  });

  it('falha com docs/ e .metri/ que só um ticket pattern muda', () => {
    const dir = repository('T2.1');
    edit(dir, 'docs/CONTEXT.md', (source) => `${source}\nmais\n`);
    edit(dir, '.metri/tickets/UC1.1.md', (source) => source.replace(/^title: .*$/m, 'title: Outro'));
    const { status, lines } = run('scope', ['T2.1', '--root', dir]);
    expect(status).toBe(1);
    expect(lines[0]).toMatch(/^falha docs: /);
    expect(lines.slice(1).sort()).toEqual(['  .metri/tickets/UC1.1.md', '  docs/CONTEXT.md']);
  });

  it('falha com o que afrouxa um check', () => {
    const dir = repository('T2.1');
    edit(dir, SPEC, () => "it.skip('exporta', () => {});\n");
    write(dir, 'apps/app-api/src/legacy/other.spec.ts', "it.only('outro', () => {});\n");
    edit(dir, 'eslint.config.js', () => 'export default [{ rules: {} }];\n');
    edit(dir, 'package.json', (source) => source.replace('vitest run', 'vitest run --passWithNoTests').replace('"vite"', '"vite --host"'));
    write(dir, 'apps/app-api/src/mail/send.ts', '// eslint-disable-next-line\nexport const send = () => {};\n');
    const { status, lines } = run('scope', ['T2.1', '--root', dir]);
    expect(status).toBe(1);
    expect(lines[0]).toMatch(/^falha checks: /);
    expect(lines.slice(1).sort()).toEqual(
      [
        `  ${SPEC}: it.skip('exporta', () => {});`,
        "  apps/app-api/src/legacy/other.spec.ts: it.only('outro', () => {});",
        '  apps/app-api/src/mail/send.ts: // eslint-disable-next-line',
        '  eslint.config.js: configuração de check alterada',
        '  package.json: script test alterado',
      ].sort(),
    );
  });

  it('falha com um teste apagado', () => {
    const dir = repository('T2.1');
    rmSync(join(dir, SPEC));
    git(dir, 'add -A');
    git(dir, 'commit -qm remove');
    const { status, lines } = run('scope', ['T2.1', '--root', dir]);
    expect(status).toBe(1);
    expect(lines).toEqual(['falha checks: o que afrouxa um check, que só muda por um ticket pattern (MATRIX-FORMAT.md, "Matrix rules", regra 6)', `  ${SPEC}: teste apagado`]);
  });

  it('o ticket pattern muda docs/, .metri/ e os checks', () => {
    const dir = repository('T2.2');
    edit(dir, 'docs/CONTEXT.md', (source) => `${source}\nmais\n`);
    write(dir, '.metri/rules/infrastructure/mail.md', 'regra\n');
    edit(dir, 'eslint.config.js', () => 'export default [{ rules: {} }];\n');
    expect(run('scope', ['T2.2', '--root', dir])).toEqual({ status: 0, lines: [] });
  });

  it('sem o id do ticket, ou com um ticket que não existe, é erro', () => {
    const dir = repository('T2.1');
    expect(run('scope', ['S2', '--root', dir]).lines[0]).toMatch(/^erro: diga o ticket/);
    expect(run('scope', ['T9.9', '--root', dir]).lines[0]).toMatch(/^erro: .*T9\.9\.md não existe/);
  });
});
