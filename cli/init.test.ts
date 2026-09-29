import { existsSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { emptyProject, REPO, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

const SKILLS = readdirSync(join(REPO, 'skills'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const AGENTS = readdirSync(join(REPO, 'agents')).filter((name) => name.endsWith('.md'));

function init(dir: string): { status: number | null; lines: string[] } {
  return run('init', ['--root', dir]);
}

describe('init', { timeout: 60_000 }, () => {
  it('projeto novo: cria os arquivos, os links e os scripts, e termina com verify verde', () => {
    const dir = emptyProject();
    const { status, lines } = init(dir);
    expect(status).toBe(0);
    for (const path of ['AGENTS.md', 'CLAUDE.md', '.gitignore', 'package.json', '.metri/ARCHITECTURE.md']) {
      expect(existsSync(join(dir, path))).toBe(true);
    }
    for (const name of SKILLS) {
      expect(readlinkSync(join(dir, '.claude/skills', name))).toBe(`../../node_modules/metri/skills/${name}`);
    }
    for (const name of AGENTS) {
      expect(readlinkSync(join(dir, '.claude/agents', name))).toBe(`../../node_modules/metri/agents/${name}`);
    }
    expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf8')).toBe('@AGENTS.md\n');
    expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toContain('!.env.test\n');
    expect(readFileSync(join(dir, '.metri/ARCHITECTURE.md'), 'utf8')).not.toContain('mapeamento: pendente');
    expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).scripts).toMatchObject({
      verify: 'metri verify',
      'rules-index:check': 'metri rules-index --check',
    });
    expect(lines).toContain('ok docs-lint');
    expect(lines).toContain('ok rules-index:check');
  });

  it('idempotente: rodar de novo não muda nada', () => {
    const dir = emptyProject();
    init(dir);
    const again = init(dir);
    expect(again.status).toBe(0);
    expect(again.lines.filter((line) => /^(criado|atualizado|removido):/.test(line))).toEqual([]);
  });

  it('projeto existente: marca o mapeamento pendente, mescla AGENTS.md e passa o CLAUDE.md para ele', () => {
    const dir = emptyProject();
    write(dir, 'src/main.ts', 'export {};\n');
    write(dir, 'AGENTS.md', '# AGENTS.md\n\n## Local\n\n- Use a VPN.\n');
    write(dir, 'CLAUDE.md', 'Rode os testes com pnpm test.\n');
    write(dir, 'package.json', JSON.stringify({ name: 'app', scripts: { 'rules-for': 'tsx .metri/template/scripts/rules-for.ts', 'plan-view': 'tsx .metri/template/scripts/plan-view.ts' } }));
    expect(init(dir).status).toBe(0);
    expect(readFileSync(join(dir, '.metri/ARCHITECTURE.md'), 'utf8')).toContain('\nmapeamento: pendente\n');
    const agents = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
    expect(agents).toContain('## Local\n\n- Use a VPN.');
    expect(agents).toContain('## How to work here');
    expect(agents).toContain('Rode os testes com pnpm test.');
    expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf8')).toBe('@AGENTS.md\n');
    const { scripts } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    expect(scripts['rules-for']).toBe('metri rules-for');
    expect(scripts).not.toHaveProperty('plan-view');
  });

  it('CLAUDE.md como link para o AGENTS.md: o conteúdo do AGENTS.md fica, uma vez só', () => {
    const dir = emptyProject();
    write(dir, 'AGENTS.md', '# AGENTS.md\n\n## Local\n\n- Use a VPN.\n');
    symlinkSync('AGENTS.md', join(dir, 'CLAUDE.md'));
    expect(init(dir).status).toBe(0);
    const agents = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
    expect(agents.match(/Use a VPN/g)).toHaveLength(1);
    expect(agents).toContain('## How to work here');
    expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf8')).toBe('@AGENTS.md\n');
  });

  it('link para skill que o pacote não tem mais sai', () => {
    const dir = emptyProject();
    init(dir);
    symlinkSync('../../node_modules/metri/skills/retired', join(dir, '.claude/skills/retired'));
    expect(init(dir).lines).toContain('removido: .claude/skills/retired');
    expect(existsSync(join(dir, '.claude/skills/retired'))).toBe(false);
  });

  it('sem o pacote em node_modules/metri é erro', () => {
    const dir = emptyProject();
    rmSync(join(dir, 'node_modules/metri'));
    const { status, lines } = init(dir);
    expect(status).toBe(1);
    expect(lines[0]).toMatch(/^erro: o metri não está em node_modules\/metri/);
  });
});
