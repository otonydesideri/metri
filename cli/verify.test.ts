import { execSync } from 'node:child_process';
import { afterAll, describe, expect, it } from 'vitest';
import { transientProblems } from './lib/transient-lint.ts';
import { copyFixture, copySource, edit, REPO, removeCopies, run, write } from './lib/testing.ts';

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
      lines: ['ok docs-lint', 'ok rules-index:check', 'pendente design-tokens: sem tema em packages/ui/src/styles/globals.css', 'ok sot', 'pendente api:drift: sem o script api:generate (backend/http-api)', 'ok test'],
    });
  });

  it('um check que falha faz o verify falhar, e os outros continuam rodando', () => {
    const { status, lines } = run('verify', ['--root', projectWithTest(1)]);
    expect(status).toBe(1);
    expect(lines.slice(0, 6)).toEqual(['ok docs-lint', 'ok rules-index:check', 'pendente design-tokens: sem tema em packages/ui/src/styles/globals.css', 'ok sot', 'pendente api:drift: sem o script api:generate (backend/http-api)', 'falha test']);
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
      'ok sot',
      'pendente api:drift: sem o script api:generate (backend/http-api)',
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
    expect(run('verify', ['--root', dir])).toEqual({ status: 0, lines: ['ok docs-lint', 'ok rules-index:check', 'pendente design-tokens: sem tema em packages/ui/src/styles/globals.css', 'ok sot', 'ok api:drift'] });

    write(dir, 'package.json', JSON.stringify({ scripts: { 'api:generate': generate('v2') } }));
    const { status, lines } = run('verify', ['--root', dir]);
    expect(status).toBe(1);
    expect(lines).toContain('falha api:drift');
    expect(lines).toContain('  mudou: openapi.json');
  });
});

describe('verify no source: transient-text', { timeout: 120_000 }, () => {
  it('o source diz as regras no presente: nenhum trecho acusado', () => {
    expect(transientProblems(REPO)).toEqual([]);
  });

  it('barra piloto, número de versão, PP-<n> e GAP-<n> com número e id de ticket nas pastas do método', () => {
    const dir = copySource();
    write(dir, 'architecture/backend/history.md', 'No piloto 2, o contrato passou a valer na v1.4.\nO GAP-7 e o PP-3 vieram do UC1.2 e do T2.0.\n');
    write(dir, 'skills/tdd/NOTES.md', 'A pilot ran here.\n');
    write(dir, 'starter/apps/app-api/src/note.ts', '// since v2.1\n');
    edit(dir, 'README.md', (source) => `${source}\nInstale a tag v3.0.1.\n`);
    // the CHANGELOG is the history: it is outside the folders the check reads
    edit(dir, 'CHANGELOG.md', (source) => `${source}\nv9.9 piloto GAP-1 UC1.1\n`);
    const { status, lines } = run('verify', ['--root', dir]);
    const start = lines.indexOf('falha transient-text');
    const detail = lines.slice(start + 1);
    const end = detail.findIndex((line) => !line.startsWith('  '));
    const reported = (end === -1 ? detail : detail.slice(0, end)).map((line) =>
      /^ {2}(\S+?:\d+): ([^:]+):/.exec(line)?.slice(1, 3).join(' '),
    );
    expect(status).toBe(1);
    expect(start).toBeGreaterThan(-1);
    expect(reported).toEqual([
      'architecture/backend/history.md:1 piloto',
      'architecture/backend/history.md:1 versão',
      'architecture/backend/history.md:2 PP/GAP com número',
      'architecture/backend/history.md:2 id de ticket',
      'skills/tdd/NOTES.md:1 piloto',
      'starter/apps/app-api/src/note.ts:1 versão',
      expect.stringMatching(/^README\.md:\d+ versão$/),
    ]);
  });
});
