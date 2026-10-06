import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { projectFiles } from './lib/layout.ts';
import { emptyProject, fakePnpm, REPO, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

const SKILLS = readdirSync(join(REPO, 'skills'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const AGENTS = readdirSync(join(REPO, 'agents')).filter((name) => name.endsWith('.md'));

const STARTER = join(REPO, 'starter');
const STARTER_FILES = projectFiles(STARTER).map((path) => path.slice(STARTER.length + 1));
const CHANGE_LINE = /^(criado|atualizado|removido):/;

// Without the starter: its copy runs pnpm install (initWithStarter fakes it).
function init(dir: string): { status: number | null; lines: string[] } {
  return run('init', ['--root', dir, '--no-starter']);
}

// A git repository (api:drift compares through git) with the pnpm fake on the PATH.
function newRepository(): { dir: string; pnpm: ReturnType<typeof fakePnpm> } {
  const dir = emptyProject();
  spawnSync('git', ['init', '-q'], { cwd: dir });
  return { dir, pnpm: fakePnpm() };
}

function initWithStarter(dir: string, pnpm: ReturnType<typeof fakePnpm>): { status: number | null; lines: string[] } {
  return run('init', ['--root', dir], pnpm.env);
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
    expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toContain('.env*\n!.env.example\n');
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
    expect(again.lines.filter((line) => CHANGE_LINE.test(line))).toEqual([]);
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

  it('projeto novo: copia o starter com o nome do projeto, roda pnpm install e termina com verify', () => {
    const { dir, pnpm } = newRepository();
    const name = basename(dir).toLowerCase();
    const { status, lines } = initWithStarter(dir, pnpm);
    expect(status).toBe(0);
    for (const path of STARTER_FILES) {
      expect(existsSync(join(dir, path)), path).toBe(true);
      expect(readFileSync(join(dir, path), 'utf8'), path).not.toContain('__PROJECT__');
    }
    expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))).toMatchObject({
      name,
      scripts: { lint: 'turbo run lint && metri check', 'db:up': 'docker compose up -d --wait', sot: 'metri sot' },
    });
    expect(existsSync(join(dir, 'scripts'))).toBe(false);
    expect(readFileSync(join(dir, 'apps/app-web/index.html'), 'utf8')).toContain(`<title>${name}</title>`);
    expect(readFileSync(join(dir, 'compose.yaml'), 'utf8')).toContain(`\nname: ${name}\n`);
    for (const app of ['apps/app-api', 'packages/db']) {
      expect(readFileSync(join(dir, app, '.env'), 'utf8')).toBe(readFileSync(join(dir, app, '.env.example'), 'utf8'));
      expect(readFileSync(join(dir, app, '.env'), 'utf8')).toContain(`@localhost:5432/${name}\n`);
    }
    const architecture = readFileSync(join(dir, '.metri/ARCHITECTURE.md'), 'utf8');
    expect(architecture).not.toContain('mapeamento: pendente');
    expect(architecture).toContain('## Caminho linear\n\n1. `apps/app-api/src/main.ts:bootstrap`');
    expect(pnpm.calls()[0]).toBe('install');
    expect(lines).toContain('ok sot');
    expect(lines).toContain('ok api:drift');
  });

  it('o starter nunca sobrescreve arquivo que já existe; package.json e pnpm-workspace.yaml ganham só o que falta', () => {
    const { dir, pnpm } = newRepository();
    write(dir, 'package.json', JSON.stringify({ name: '@acme/minha-loja', scripts: { dev: 'x' }, devDependencies: { metri: 'link:../metri' } }));
    write(dir, 'pnpm-workspace.yaml', 'allowBuilds:\n  esbuild: false\n');
    write(dir, 'biome.json', '{}\n');
    write(dir, '.gitignore', 'node_modules\n.env\n.env.*\n');
    const { status, lines } = initWithStarter(dir, pnpm);
    expect(status).toBe(0);
    expect(readFileSync(join(dir, 'biome.json'), 'utf8')).toBe('{}\n');
    expect(lines).toContain('mantido: biome.json já existe');
    const gitignore = readFileSync(join(dir, '.gitignore'), 'utf8');
    expect(gitignore.startsWith('node_modules\n.env\n.env.*\n')).toBe(true);
    expect(gitignore).toContain('!.env.example\n');
    expect(gitignore).toContain('packages/db/**/generated/\n');
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    expect(pkg).toMatchObject({ name: '@acme/minha-loja', scripts: { dev: 'x', build: 'turbo run build' } });
    expect(pkg.devDependencies).toMatchObject({ metri: 'link:../metri', turbo: expect.any(String) });
    const workspace = parse(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'));
    expect(workspace.packages).toEqual(['apps/*', 'packages/*']);
    expect(workspace.allowBuilds).toMatchObject({ esbuild: false, prisma: true });
    expect(readFileSync(join(dir, 'apps/app-api/src/infra/http/openapi-document.ts'), 'utf8')).toContain("setTitle('minha-loja API')");
  });

  it('starter: rodar de novo não muda nada nem reinstala', () => {
    const { dir, pnpm } = newRepository();
    expect(initWithStarter(dir, pnpm).status).toBe(0);
    const again = initWithStarter(dir, pnpm);
    expect(again.status).toBe(0);
    expect(again.lines.filter((line) => CHANGE_LINE.test(line) || line.startsWith('mantido:'))).toEqual([]);
    expect(pnpm.calls().filter((call) => call === 'install')).toHaveLength(1);
  });

  it('--no-starter e projeto existente: sem starter', () => {
    const skipped = emptyProject();
    expect(init(skipped).status).toBe(0);
    expect(existsSync(join(skipped, 'apps'))).toBe(false);
    const { dir, pnpm } = newRepository();
    write(dir, 'src/main.ts', 'export {};\n');
    expect(initWithStarter(dir, pnpm).status).toBe(0);
    expect(existsSync(join(dir, 'apps'))).toBe(false);
    expect(pnpm.calls()).not.toContain('install');
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
