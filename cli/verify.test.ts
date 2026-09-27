import { execSync } from 'node:child_process';
import { afterAll, describe, expect, it } from 'vitest';
import { copyFixture, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

function projectWithTest(exitCode: number): string {
  const dir = copyFixture();
  write(dir, 'package.json', JSON.stringify({ scripts: { test: `node -e "process.exit(${exitCode})"` } }));
  return dir;
}

describe('verify', { timeout: 60_000 }, () => {
  it('passa quando todos os checks passam', () => {
    expect(run('verify', ['--root', projectWithTest(0)])).toEqual({
      status: 0,
      lines: ['ok docs-lint', 'ok rules-index:check', 'pendente design-tokens: sem tema em packages/ui/src/styles/globals.css', 'ok test'],
    });
  });

  it('um check que falha faz o verify falhar, e os outros continuam rodando', () => {
    const { status, lines } = run('verify', ['--root', projectWithTest(1)]);
    expect(status).toBe(1);
    expect(lines.slice(0, 4)).toEqual(['ok docs-lint', 'ok rules-index:check', 'pendente design-tokens: sem tema em packages/ui/src/styles/globals.css', 'falha test']);
  });

  it('falha do docs-lint aparece com a saída dele', () => {
    const dir = projectWithTest(0);
    write(dir, 'docs/notes.md', '# Notas\n');
    const { status, lines } = run('verify', ['--root', dir]);
    expect(status).toBe(1);
    expect(lines).toEqual([
      'falha docs-lint',
      '  docs/notes.md:1: árvore de docs/: arquivo fora da lista fechada (docs-lint --help)',
      'ok rules-index:check',
      'pendente design-tokens: sem tema em packages/ui/src/styles/globals.css',
      'ok test',
    ]);
  });

  it('api:drift: o gerador do contrato não pode mudar nenhum arquivo', () => {
    const dir = copyFixture();
    const generate = (content: string) => `node -e "require('fs').writeFileSync('openapi.json', '${content}')"`;
    write(dir, 'package.json', JSON.stringify({ scripts: { 'api:generate': generate('v1') } }));
    write(dir, 'openapi.json', 'v1');
    write(dir, '.gitignore', 'node_modules/\npnpm-lock.yaml\n');
    execSync('git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm fixture', { cwd: dir });
    expect(run('verify', ['--root', dir])).toEqual({ status: 0, lines: ['ok docs-lint', 'ok rules-index:check', 'pendente design-tokens: sem tema em packages/ui/src/styles/globals.css', 'ok api:drift'] });

    write(dir, 'package.json', JSON.stringify({ scripts: { 'api:generate': generate('v2') } }));
    const { status, lines } = run('verify', ['--root', dir]);
    expect(status).toBe(1);
    expect(lines).toContain('falha api:drift');
    expect(lines).toContain('  mudou: openapi.json');
  });
});
