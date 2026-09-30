// verify: runs the checks and adds up the result. --help has the details.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { BIN, layoutOf, takeOption } from './lib/layout.ts';

const HELP = `verify: roda os checks e soma o resultado.

Uso: metri verify [--root <dir>]

Ordem (todos rodam, mesmo depois de uma falha):
  1. docs-lint;
  2. rules-index:check (rules-index --check);
  3. design-tokens, só no projeto: o tema do código segue os tokens do docs/DESIGN.md; sem os dois, fica pendente;
  4. sot, só no projeto: os cabeçalhos SOURCE OF TRUTH e o registro das slices construídas (metri sot --help);
  5. api:drift, com o script api:generate no package.json da raiz: roda o gerador do contrato de API
     (backend/http-api) e falha se ele mudar algum arquivo; precisa de git. Sem o script, com apps/app-api e
     apps/app-web, fica pendente;
  6. typecheck, lint e test: os scripts com esses nomes no package.json da raiz, só os que existirem
     (pnpm run <nome>).

Saída: uma linha por check, "ok <nome>", "pendente <nome>: <motivo>" ou "falha <nome>"; a saída do check que
falhou vem logo abaixo da linha dele, recuada. Sai com código 1 se algum check falhar.
`;

const PROJECT_SCRIPTS = ['typecheck', 'lint', 'test'];
const GENERATE_SCRIPT = 'api:generate';

type Result = { status: number | null; output: string };
type Check = { name: string; run: () => Result };

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
const root = resolve(takeOption(args, '--root') ?? '.');
process.chdir(root);

function spawn(command: string, commandArgs: string[]): Result {
  const result = spawnSync(command, commandArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ? String(result.error) : ''}`.trim();
  return { status: result.status, output };
}

const metri = (...rest: string[]) => () => spawn(process.execPath, [BIN, ...rest, '--root', root]);
const pnpm = (name: string) => () => spawn('pnpm', ['--silent', 'run', name]);

// Files that differ from the commit (modified or new), each with the hash of its content.
function dirtyFiles(): Map<string, string> | undefined {
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  const status = spawnSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], { encoding: 'utf8' });
  if (top.status !== 0 || status.status !== 0) {
    return undefined;
  }
  const files = new Map<string, string>();
  const entries = status.stdout.split('\0');
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    if (entry === '') {
      continue;
    }
    if (/[RC]/.test(entry.slice(0, 2))) {
      index++; // the source path of a rename comes in the next entry
    }
    // in porcelain, the path is relative to the repository root
    const path = join(top.stdout.trim(), entry.slice(3));
    const content = !existsSync(path) ? 'removido' : statSync(path).isFile() ? readFileSync(path) : 'diretório';
    files.set(relative(root, path), createHash('sha1').update(content).digest('hex'));
  }
  return files;
}

// api:drift: the contract generator runs again, and any file it changes is drift.
function apiDrift(): Result {
  const before = dirtyFiles();
  if (before === undefined) {
    return { status: 1, output: 'api:drift compara o antes e o depois pelo git; rode num repositório git' };
  }
  const generated = spawn('pnpm', ['--silent', 'run', GENERATE_SCRIPT]);
  if (generated.status !== 0) {
    return generated;
  }
  const after = dirtyFiles() ?? new Map();
  const changed = [...new Set([...before.keys(), ...after.keys()])].filter((path) => before.get(path) !== after.get(path));
  if (changed.length === 0) {
    return { status: 0, output: '' };
  }
  const lines = changed.sort().map((path) => `mudou: ${path}`);
  return { status: 1, output: [...lines, `o contrato gerado estava desatualizado; revise e comite o que o ${GENERATE_SCRIPT} gerou`].join('\n') };
}

const scripts: Record<string, string> = existsSync('package.json')
  ? (JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {})
  : {};
const checks: Check[] = [
  { name: 'docs-lint', run: metri('docs-lint') },
  { name: 'rules-index:check', run: metri('rules-index', '--check') },
];
if (layoutOf().isProject) {
  checks.push({ name: 'design-tokens', run: metri('design-tokens') }, { name: 'sot', run: metri('sot') });
}
if (GENERATE_SCRIPT in scripts) {
  checks.push({ name: 'api:drift', run: apiDrift });
} else if (existsSync('apps/app-api') && existsSync('apps/app-web')) {
  checks.push({ name: 'api:drift', run: () => ({ status: 0, output: `pendente: sem o script ${GENERATE_SCRIPT} (backend/http-api)` }) });
}
for (const name of PROJECT_SCRIPTS.filter((name) => name in scripts)) {
  checks.push({ name, run: pnpm(name) });
}

let hasFailed = false;
for (const { name, run } of checks) {
  const { status, output } = run();
  if (status === 0) {
    const pending = /^pendente: (.+)$/m.exec(output)?.[1];
    console.log(pending ? `pendente ${name}: ${pending}` : `ok ${name}`);
    continue;
  }
  hasFailed = true;
  console.log(`falha ${name}`);
  for (const line of output.split('\n').filter(Boolean)) {
    console.log(`  ${line}`);
  }
}
process.exit(hasFailed ? 1 : 0);
