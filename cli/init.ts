// init: prepares the project for the method, mechanically and idempotently. --help has the details.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { BIN, PACKAGE_NAME, PACKAGE_ROOT, PROJECT_INDEX, projectFiles, takeOption } from './lib/layout.ts';
import { linkTargetOf, packageLinks, staleLinks } from './lib/links.ts';

const HELP = `init: prepara o projeto para o método. Mecânico e idempotente: rodar de novo só completa o que falta.

Uso: metri init [--root <dir>] [--no-starter]

Pré-requisito: o metri instalado no projeto, em node_modules/metri (pnpm add -D link:<caminho> ou
github:<dono>/<repo>#<tag>).

Cria o que falta:
  - num projeto novo (sem código em apps/, packages/ ou src/), o starter: o código inicial da fundação, copiado
    de starter/ com __PROJECT__ trocado pelo nome do projeto (o name do package.json ou, sem ele, o nome do
    diretório). Arquivo que já existe fica como está; o package.json e o pnpm-workspace.yaml ganham só as chaves
    que não têm, e o .gitignore, as linhas do .gitignore do init que não tem. O "Caminho linear" vazio do
    .metri/ARCHITECTURE.md ganha os donos do starter. Depois da cópia, cria o .env a partir do .env.example, sem
    sobrescrever um que já exista, e roda pnpm install. --no-starter pula a cópia; num projeto existente, ela não
    acontece;
  - AGENTS.md e CLAUDE.md, de cli/templates/. Um AGENTS.md que já existe ganha as seções do template que não
    tem; um CLAUDE.md que já existe passa o conteúdo para o fim do AGENTS.md e fica só com "@AGENTS.md";
  - .metri/ARCHITECTURE.md, de cli/templates/; com código em apps/, packages/ ou src/, ganha a linha
    "mapeamento: pendente", por onde o /look-across começa;
  - .claude/skills/<nome> e .claude/agents/<nome>.md, links para cada skill e agent do pacote; o link para o
    que o pacote não tem mais sai;
  - .gitignore, quando o projeto não tem;
  - no package.json, os scripts verify, docs-lint, rules-for, rules-index, rules-index:check, design-tokens e
    sot (metri <comando>).

Termina rodando metri verify e sai com o código dele. PRODUCT.md, CONTEXT.md, DESIGN.md, MATRIX.md e as specs em
.metri/specs/ nascem no /shape.
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
const GITIGNORE = [
  'node_modules/',
  '.env*',
  '!.env.example',
  'dist/',
  '.turbo/',
  'coverage/',
  'packages/db/**/generated/',
  'test-results/',
  'playwright-report/',
  '',
].join('\n');
const CODE_DIRS = ['apps', 'packages', 'src'];
const PENDING_MAPPING = 'mapeamento: pendente';
const STARTER = join(PACKAGE_ROOT, 'starter');
const PROJECT_PLACEHOLDER = /__PROJECT__/g;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
const skipsStarter = args.includes('--no-starter');
const root = resolve(takeOption(args, '--root') ?? '.');
process.chdir(root);

const installed = join('node_modules', PACKAGE_NAME);
const hadCode = hasCode();
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

// The "## ..." sections of a markdown, each with its title and body.
function sections(source: string): string[] {
  return source.split(/\n(?=## )/).filter((part) => part.startsWith('## '));
}

function agentFiles(): void {
  const claudePointer = template('CLAUDE.md');
  // CLAUDE.md and AGENTS.md linked to each other hold one content, read through AGENTS.md.
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
  write(PROJECT_INDEX, hadCode ? content.replace(/^(# .+\n)/, `$1\n${PENDING_MAPPING}\n`) : content);
}

// The project name for __PROJECT__: the package.json name without its scope, or the directory name, as a slug
// that also works as a database and a container name.
function projectName(): string {
  const pkgName = existsSync('package.json') ? JSON.parse(readFileSync('package.json', 'utf8')).name : undefined;
  const raw = typeof pkgName === 'string' && pkgName.trim() !== '' ? pkgName : basename(root);
  const slug = raw
    .replace(/^@[^/]+\//, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'app' : slug;
}

// Adds to `target` the keys of `source` it lacks, one level into objects; the existing value always wins.
function mergeMissing(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const merged = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const current = merged[key];
    if (current === undefined) {
      merged[key] = value;
    } else if (isPlainObject(current) && isPlainObject(value)) {
      merged[key] = { ...value, ...current };
    }
  }
  return merged;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergePackageJson(content: string): void {
  const current = JSON.parse(readFileSync('package.json', 'utf8'));
  write('package.json', `${JSON.stringify(mergeMissing(current, JSON.parse(content)), null, 2)}\n`);
}

function mergeWorkspace(content: string): void {
  const document = parseDocument(readFileSync('pnpm-workspace.yaml', 'utf8'));
  const current = (document.toJS() ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(mergeMissing(current, parseDocument(content).toJS()))) {
    document.set(key, value);
  }
  write('pnpm-workspace.yaml', document.toString());
}

// Copies starter/ into a new project; returns whether it wrote anything.
function starter(): boolean {
  if (skipsStarter || hadCode || !existsSync(STARTER)) {
    return false;
  }
  const name = projectName();
  let hasWritten = false;
  for (const source of projectFiles(STARTER)) {
    const path = relative(STARTER, source);
    const content = readFileSync(source, 'utf8').replace(PROJECT_PLACEHOLDER, name);
    const before = existsSync(path) ? readFileSync(path, 'utf8') : undefined;
    if (path === 'package.json' && before !== undefined) {
      mergePackageJson(content);
    } else if (path === 'pnpm-workspace.yaml' && before !== undefined) {
      mergeWorkspace(content);
    } else if (before === undefined) {
      write(path, content);
    } else {
      console.log(`mantido: ${path} já existe`);
    }
    hasWritten ||= !existsSync(path) || readFileSync(path, 'utf8') !== before;
  }
  return hasWritten;
}

function install(): void {
  const installed = spawnSync('pnpm', ['install'], { stdio: 'inherit' });
  if (installed.status !== 0) {
    console.log('erro: o pnpm install falhou; corrija e rode metri init de novo');
    process.exit(installed.status ?? 1);
  }
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

// The starter depends on these lines (the .env out of git, the generated client out of Biome): an existing
// .gitignore gains the ones it lacks, after its own, so a negation such as !.env.example wins.
function mergeGitignore(): void {
  const current = readFileSync('.gitignore', 'utf8');
  const lines = current.split('\n').map((line) => line.trim());
  const missing = GITIGNORE.split('\n').filter((line) => line !== '' && !lines.includes(line));
  if (missing.length > 0) {
    write('.gitignore', `${current.trimEnd()}\n\n# metri starter\n${missing.join('\n')}\n`);
  }
}

// The project's .env, from the starter's .env.example; one that exists is never overwritten.
function env(): void {
  if (existsSync('.env.example') && !existsSync('.env')) {
    write('.env', readFileSync('.env.example', 'utf8'));
  }
}

// The owners of the starter as the first steps of the linear path, which /accept extends slice by slice.
function starterLinearPath(): void {
  const index = readFileSync(PROJECT_INDEX, 'utf8');
  const steps = template('STARTER-LINEAR-PATH.md').trimEnd();
  if (!/^## Caminho linear\n\n## /m.test(index)) {
    return;
  }
  write(PROJECT_INDEX, index.replace(/^## Caminho linear\n\n/m, `## Caminho linear\n\n${steps}\n\n`));
}

function packageScripts(): void {
  const pkg = existsSync('package.json')
    ? JSON.parse(readFileSync('package.json', 'utf8'))
    : { name: basename(root), private: true };
  const scripts: Record<string, string> = { ...(pkg.scripts ?? {}) };
  for (const [name, command] of Object.entries(scripts)) {
    if (command.includes('.metri/template/scripts/')) {
      delete scripts[name]; // a v1.1 script, which ran the source mounted in .metri/.
    }
  }
  pkg.scripts = { ...scripts, ...SCRIPTS };
  write('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
}

agentFiles();
architecture();
links();
gitignore();
const hasCopiedStarter = starter();
packageScripts();
if (hasCopiedStarter) {
  mergeGitignore();
  env();
  starterLinearPath();
  install();
}

const verify = spawnSync(process.execPath, [BIN, 'verify', '--root', root], { stdio: 'inherit' });
if (verify.status === 0) {
  console.log('Próximo: /shape (antes, /reload-skills se .claude/skills/ não existia ao abrir a sessão).');
}
process.exit(verify.status ?? 1);
