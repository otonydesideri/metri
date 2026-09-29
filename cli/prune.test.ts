import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { copyFixture, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

describe('prune', { timeout: 30_000 }, () => {
  it('apaga a evidência dos tickets da slice e deixa o resto', () => {
    const dir = copyFixture();
    write(dir, '.metri/tickets/UC1.1/1-desktop.png', 'png');
    write(dir, '.metri/tickets/T2.1/1-desktop.png', 'png');
    expect(run('prune', ['S1', '--root', dir])).toEqual({ status: 0, lines: ['removido: .metri/tickets/UC1.1'] });
    expect(existsSync(join(dir, '.metri/tickets/UC1.1'))).toBe(false);
    expect(existsSync(join(dir, '.metri/tickets/UC1.1.md'))).toBe(true);
    expect(existsSync(join(dir, '.metri/tickets/T2.1/1-desktop.png'))).toBe(true);
    expect(run('prune', ['S1', '--root', dir])).toEqual({ status: 0, lines: ['nada a remover'] });
  });

  it('sem o id da slice é erro', () => {
    const { status, lines } = run('prune', ['UC1.1', '--root', copyFixture()]);
    expect(status).toBe(1);
    expect(lines[0]).toMatch(/^erro: diga a slice/);
  });
});
