import { afterAll, describe, expect, it } from 'vitest';
import { copyFixture, edit, REPO, removeCopies, run } from './lib/testing.ts';

afterAll(removeCopies);

const MATRIX = 'docs/plan/MATRIX.md';

describe('matrix-view', () => {
  it('gera a tabela features × slices e o grafo Mermaid entre os marcadores', () => {
    const dir = copyFixture();
    // A fixture já traz a visão gerada; apaga para simular a primeira execução.
    edit(dir, MATRIX, (source) => source.replace(/<!-- matrix-view -->[\s\S]*<!-- \/matrix-view -->\n\n/, ''));
    const { status, lines } = run('matrix-view.ts', ['--root', dir]);
    expect(status).toBe(0);
    expect(lines).toEqual([`gerado: ${MATRIX}`]);
    expect(run('docs-lint.ts', ['--root', dir])).toEqual({ status: 0, lines: [] });
    // Já atualizada, rodar de novo não escreve nada.
    expect(run('matrix-view.ts', ['--root', dir])).toEqual({ status: 0, lines: [] });
  });

  it('--check: sai 0 quando está atualizada, 1 quando está desatualizada', () => {
    const dir = copyFixture();
    run('matrix-view.ts', ['--root', dir]);
    expect(run('matrix-view.ts', ['--root', dir, '--check'])).toEqual({ status: 0, lines: [] });
    edit(dir, MATRIX, (source) => source.replace('UC1.1 ~', 'UC1.1 ?'));
    expect(run('matrix-view.ts', ['--root', dir, '--check'])).toEqual({
      status: 1,
      lines: [`desatualizado: ${MATRIX}`],
    });
  });

  it('sem docs/plan/MATRIX.md (modo source), não faz nada', () => {
    expect(run('matrix-view.ts', ['--root', REPO, '--check'])).toEqual({ status: 0, lines: [] });
  });
});
