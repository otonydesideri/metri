// verify: roda os checks e soma o resultado. A explicação está no --help.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layoutOf, takeOption } from './lib/layout.ts';

const HELP = `verify: roda os checks e soma o resultado.

Uso: verify [--root <dir>]

Ordem (todos rodam, mesmo depois de uma falha):
  1. docs-lint;
  2. rules-index:check (rules-index --check em docs/architecture/ no projeto, em architecture/ no source);
  3. typecheck, lint e test: os scripts com esses nomes no package.json da raiz, só os que existirem
     (pnpm run <nome>).

Saída: uma linha por check, "ok <nome>" ou "falha <nome>"; a saída do check que falhou vem logo abaixo da
linha dele, recuada. Sai com código 1 se algum check falhar.
`;

const PROJECT_SCRIPTS = ['typecheck', 'lint', 'test'];

type Check = { name: string; command: string; args: string[] };

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
process.chdir(resolve(takeOption(args, '--root') ?? '.'));

const layout = layoutOf();
const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const tsx = (script: string, ...rest: string[]) => [...process.execArgv, join(SCRIPTS, script), ...rest];

const checks: Check[] = [
  { name: 'docs-lint', command: process.execPath, args: tsx('docs-lint.ts') },
  {
    name: 'rules-index:check',
    command: process.execPath,
    args: tsx('rules-index.ts', layout.projectDir ?? layout.globalDir, '--check'),
  },
];
const scripts: Record<string, string> = existsSync('package.json')
  ? (JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {})
  : {};
for (const name of PROJECT_SCRIPTS.filter((name) => name in scripts)) {
  checks.push({ name, command: 'pnpm', args: ['--silent', 'run', name] });
}

let hasFailed = false;
for (const { name, command, args: commandArgs } of checks) {
  const result = spawnSync(command, commandArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.status === 0) {
    console.log(`ok ${name}`);
    continue;
  }
  hasFailed = true;
  console.log(`falha ${name}`);
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ? String(result.error) : ''}`.trim();
  for (const line of output.split('\n').filter(Boolean)) {
    console.log(`  ${line}`);
  }
}
process.exit(hasFailed ? 1 : 0);
