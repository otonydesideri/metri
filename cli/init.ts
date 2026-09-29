// init: prepara o projeto para o método, de forma mecânica e idempotente. A explicação está no --help.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { BIN, PACKAGE_NAME, PACKAGE_ROOT, PROJECT_INDEX, projectFiles, takeOption } from './lib/layout.ts';
import { linkTargetOf, packageLinks, staleLinks } from './lib/links.ts';

const HELP = `init: prepara o projeto para o método. Mecânico e idempotente: rodar de novo só completa o que falta.

Uso: metri init [--root <dir>]

Pré-requisito: o metri instalado no projeto, em node_modules/metri (pnpm add -D link:<caminho> ou
github:<dono>/<repo>#<tag>).

Cria o que falta:
  - AGENTS.md e CLAUDE.md, de cli/templates/. Um AGENTS.md que já existe ganha as seções do template que não
    tem; um CLAUDE.md que já existe passa o conteúdo para o fim do AGENTS.md e fica só com "@AGENTS.md";
  - .metri/ARCHITECTURE.md, de cli/templates/; com código em apps/, packages/ ou src/, ganha a linha
    "mapeamento: pendente", por onde o /look-across começa;
  - .claude/skills/<nome> e .claude/agents/<nome>.md, links para cada skill e agent do pacote; o link para o
    que o pacote não tem mais sai;
  - .gitignore, quando o projeto não tem;
  - no package.json, os scripts verify, docs-lint, rules-for, rules-index, rules-index:check, design-tokens e
    sot (metri <comando>).

Termina rodando metri verify e sai com o código dele. PRODUCT.md, CONTEXT.md, DESIGN.md e MATRIX.md nascem no
/shape.
`;

const TEMPLATES = join(PACKAGE_ROOT, 'cli/templates');
const SCRIPTS: Record<string, string> = {
  verify: 'metri verify',
  'docs-lint': 'metri docs-lint',
  'rules-for': 'metri rules-for',
  'rules-index': 'metri rules-index',
  'rules-index:check': 'metri rules-index --check',
  'design-tokens': 'metri design-tokens',
  sot: 'metri sot',
};
const GITIGNORE = ['node_modules/', '.env*', '!.env.example', 'dist/', '.turbo/', 'coverage/', ''].join('\n');
const CODE_DIRS = ['apps', 'packages', 'src'];
const PENDING_MAPPING = 'mapeamento: pendente';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
const root = resolve(takeOption(args, '--root') ?? '.');
process.chdir(root);

const installed = join('node_modules', PACKAGE_NAME);
if (!existsSync(installed) || realpathSync(installed) !== realpathSync(PACKAGE_ROOT)) {
  console.log(`erro: o metri não está em ${installed}; instale antes (pnpm add -D link:<caminho> ou github:<dono>/<repo>#<tag>)`);
  process.exit(1);
}

function template(name: string): string {
  return readFileSync(join(TEMPLATES, name), 'utf8');
}

function write(path: string, content: string): void {
  const isNew = !existsSync(path);
  if (!isNew && readFileSync(path, 'utf8') === content) {
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`${isNew ? 'criado' : 'atualizado'}: ${path}`);
}

// Seções "## ..." de um markdown, cada uma com o título e o corpo.
function sections(source: string): string[] {
  return source.split(/\n(?=## )/).filter((part) => part.startsWith('## '));
}

function agentFiles(): void {
  const claudePointer = template('CLAUDE.md');
  // CLAUDE.md e AGENTS.md ligados um ao outro por link têm um conteúdo só, lido pelo AGENTS.md.
  const isLinked = linkTargetOf('CLAUDE.md') !== undefined || linkTargetOf('AGENTS.md') !== undefined;
  let agents = existsSync('AGENTS.md') ? readFileSync('AGENTS.md', 'utf8') : template('AGENTS.md');
  for (const section of sections(template('AGENTS.md'))) {
    const title = section.split('\n')[0];
    if (!agents.split('\n').includes(title)) {
      agents = `${agents.trimEnd()}\n\n${section.trimEnd()}\n`;
    }
  }
  if (existsSync('CLAUDE.md') && !isLinked) {
    const held = readFileSync('CLAUDE.md', 'utf8')
      .split('\n')
      .filter((line) => line.trim() !== claudePointer.trim())
      .join('\n')
      .trim();
    if (held !== '') {
      agents = `${agents.trimEnd()}\n\n${held}\n`;
    }
  }
  for (const path of ['AGENTS.md', 'CLAUDE.md'].filter((file) => linkTargetOf(file) !== undefined)) {
    rmSync(path);
  }
  write('AGENTS.md', agents);
  write('CLAUDE.md', claudePointer);
}

function hasCode(): boolean {
  return CODE_DIRS.some((dir) => existsSync(dir) && projectFiles(dir).length > 0);
}

function architecture(): void {
  if (existsSync(PROJECT_INDEX)) {
    return;
  }
  const content = template('ARCHITECTURE.md');
  write(PROJECT_INDEX, hasCode() ? content.replace(/^(# .+\n)/, `$1\n${PENDING_MAPPING}\n`) : content);
}

function links(): void {
  for (const path of staleLinks()) {
    rmSync(path);
    console.log(`removido: ${path}`);
  }
  for (const { path, target } of packageLinks()) {
    const current = linkTargetOf(path);
    if (current === target) {
      continue;
    }
    if (current === undefined && existsSync(path)) {
      console.log(`mantido: ${path} não é link; o docs-lint vai apontar`);
      continue;
    }
    mkdirSync(dirname(path), { recursive: true });
    if (current !== undefined) {
      rmSync(path);
    }
    symlinkSync(target, path);
    console.log(`criado: ${path} → ${target}`);
  }
}

function gitignore(): void {
  if (!existsSync('.gitignore')) {
    write('.gitignore', GITIGNORE);
  }
}

function packageScripts(): void {
  const pkg = existsSync('package.json')
    ? JSON.parse(readFileSync('package.json', 'utf8'))
    : { name: basename(root), private: true };
  const scripts: Record<string, string> = { ...(pkg.scripts ?? {}) };
  for (const [name, command] of Object.entries(scripts)) {
    if (command.includes('.metri/template/scripts/')) {
      delete scripts[name]; // script da v1.1, que rodava o source montado em .metri/.
    }
  }
  pkg.scripts = { ...scripts, ...SCRIPTS };
  write('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
}

agentFiles();
architecture();
links();
gitignore();
packageScripts();

const verify = spawnSync(process.execPath, [BIN, 'verify', '--root', root], { stdio: 'inherit' });
if (verify.status === 0) {
  console.log('Próximo: /shape (antes, /reload-skills se .claude/skills/ não existia ao abrir a sessão).');
}
process.exit(verify.status ?? 1);
