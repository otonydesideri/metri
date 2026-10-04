// scope: checks that a ticket's branch changes only what the ticket may change. --help has the details.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { frontmatterOf, MATRIX, takeOption, TICKETS_DIR } from './lib/layout.ts';

const HELP = `scope: confere se a branch de um ticket muda só o que o ticket pode mudar (skills/build/SKILL.md, passos 3 e
4; skills/look-across/MATRIX-FORMAT.md, "Matrix rules", regra 6).

Uso: metri scope <id> [--root <dir>]

Roda na branch ticket/<id>. Compara a árvore de trabalho (commits, mudanças e arquivos novos) com o ponto em que a
branch saiu de slice/<S<n>>, a slice do ticket, ou de main quando slice/<S<n>> não existe.

Falha quando:
  branch   a branch atual não é ticket/<id>
  docs     um arquivo de docs/ ou .metri/ fora do que o ticket pode mudar: o arquivo dele, a pasta de evidência
           dele (.metri/tickets/<id>/), o .metri/MATRIX.md e, no arquivo de outro ticket, só a linha status:
  checks   o que afrouxa um check: um arquivo de teste apagado; .skip(, .only(, .todo(, .fixme(, xit(,
           xdescribe(, xtest( ou eslint-disable acrescentados; um arquivo de configuração de lint, de teste ou de
           tipos alterado ou apagado (eslint.config.*, .eslintrc*, vitest.config.*, vitest.workspace.*,
           playwright.config.*, tsconfig*.json); um script typecheck, lint, test ou verify (ou test:<algo>) de um
           package.json alterado ou apagado

Um ticket pattern pode mudar docs/ e .metri/ inteiros e os checks: o humano revisa o diff dele no portão de padrão.

Saída: nada quando passa; na falha, "falha <nome>: <o quê>" e, recuado, cada arquivo ou linha. Sai com código 1
quando algum falha.
`;

type Change = { status: string; path: string };
type Failure = { name: string; label: string; items: string[] };

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
process.chdir(resolve(takeOption(args, '--root') ?? '.'));
const [id] = args;
if (id === undefined || !/^(UC\d+\.\d+|T\d+\.\d+)$/.test(id)) {
  console.log('erro: diga o ticket, UC<f>.<n> ou T<s>.<n> (metri scope --help)');
  process.exit(1);
}
const ticketPath = join(TICKETS_DIR, `${id}.md`);
if (!existsSync(ticketPath)) {
  console.log(`erro: ${ticketPath} não existe`);
  process.exit(1);
}
const frontmatter = frontmatterOf(readFileSync(ticketPath, 'utf8')) ?? {};

function git(...gitArgs: string[]): { ok: boolean; out: string } {
  const result = spawnSync('git', gitArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { ok: result.status === 0, out: result.stdout ?? '' };
}

if (!git('rev-parse', '--git-dir').ok) {
  console.log('erro: scope compara pelo git; rode num repositório git');
  process.exit(1);
}

const failures: Failure[] = [];
const branch = git('rev-parse', '--abbrev-ref', 'HEAD').out.trim();
if (branch !== `ticket/${id}`) {
  failures.push({ name: 'branch', label: `a branch atual é ${branch}, não ticket/${id}`, items: [] });
}

const slice = typeof frontmatter.slice === 'string' ? frontmatter.slice : undefined;
const from = slice !== undefined && git('rev-parse', '--verify', '--quiet', `slice/${slice}`).ok ? `slice/${slice}` : 'main';
const base = git('merge-base', from, 'HEAD');
if (!base.ok) {
  console.log(`erro: sem ponto comum entre ${from} e HEAD`);
  process.exit(1);
}
const baseCommit = base.out.trim();

// The changes from the base to the working tree, renames kept as one change, plus the untracked files.
function changes(): Change[] {
  const entries = git('diff', '--name-status', '-z', '-M', baseCommit).out.split('\0');
  const list: Change[] = [];
  for (let index = 0; index < entries.length - 1; index++) {
    const status = entries[index];
    if (status === '') {
      continue;
    }
    if (/^[RC]/.test(status)) {
      list.push({ status: status[0], path: entries[index + 2] });
      index += 2;
    } else {
      list.push({ status, path: entries[index + 1] });
      index += 1;
    }
  }
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z').out.split('\0').filter(Boolean);
  return [...list, ...untracked.map((path) => ({ status: 'A', path }))];
}

// The lines a change added and removed, without the diff headers; an untracked file adds all of its lines.
function changedLines(change: Change): { added: string[]; removed: string[] } {
  if (!git('ls-files', '--error-unmatch', change.path).ok && existsSync(change.path)) {
    return { added: readFileSync(change.path, 'utf8').split('\n'), removed: [] };
  }
  const lines = git('diff', '-U0', '--no-color', baseCommit, '--', change.path).out.split('\n');
  return {
    added: lines.filter((line) => line.startsWith('+') && !line.startsWith('+++')).map((line) => line.slice(1)),
    removed: lines.filter((line) => line.startsWith('-') && !line.startsWith('---')).map((line) => line.slice(1)),
  };
}

const all = changes();
const isPattern = frontmatter.type === 'pattern';

if (!isPattern) {
  const otherTicket = new RegExp(`^${TICKETS_DIR.replace('.', '\\.')}/(?:UC|T)\\d+\\.\\d+\\.md$`);
  const outside = all.filter(({ path }) => {
    if (!/^(docs|\.metri)\//.test(path) || path === ticketPath || path === MATRIX || path.startsWith(`${TICKETS_DIR}/${id}/`)) {
      return false;
    }
    if (otherTicket.test(path)) {
      const { added, removed } = changedLines({ status: 'M', path });
      return ![...added, ...removed].every((line) => /^status: /.test(line));
    }
    return true;
  });
  failures.push({
    name: 'docs',
    label: 'mudança em docs/ ou .metri/ que só um ticket pattern faz (skills/build/SKILL.md, passo 3)',
    items: outside.map(({ path }) => path),
  });

  const loosened: string[] = [];
  const isTest = (path: string) => /\.(?:spec|test|e2e-spec)\.[cm]?[jt]sx?$/.test(path);
  const isConfig = (path: string) =>
    /(^|\/)(?:eslint\.config\.[cm]?[jt]s|\.eslintrc[^/]*|vitest\.(?:config|workspace)\.[cm]?[jt]s|playwright\.config\.[cm]?[jt]s|tsconfig[^/]*\.json)$/.test(path);
  const skipping = /\b(?:it|test|describe)\.(?:skip|only|todo|fixme)\(|\b(?:xit|xdescribe|xtest)\(|eslint-disable/;
  const checkScript = /^(?:typecheck|lint|test|verify)(?::.*)?$/;
  for (const change of all) {
    if (change.status === 'D' && isTest(change.path)) {
      loosened.push(`${change.path}: teste apagado`);
    } else if (isConfig(change.path) && change.status !== 'A') {
      loosened.push(`${change.path}: configuração de check ${change.status === 'D' ? 'apagada' : 'alterada'}`);
    } else if (/(^|\/)package\.json$/.test(change.path) && change.status !== 'A') {
      const before = git('show', `${baseCommit}:${change.path}`);
      const scriptsOf = (source: string): Record<string, string> => {
        try {
          return JSON.parse(source).scripts ?? {};
        } catch {
          return {};
        }
      };
      const old = before.ok ? scriptsOf(before.out) : {};
      const now = existsSync(change.path) ? scriptsOf(readFileSync(change.path, 'utf8')) : {};
      for (const name of Object.keys(old).filter((name) => checkScript.test(name) && old[name] !== now[name])) {
        loosened.push(`${change.path}: script ${name} ${name in now ? 'alterado' : 'apagado'}`);
      }
    }
    if (change.status !== 'D' && !change.path.endsWith('.md')) {
      for (const line of changedLines(change).added.filter((line) => skipping.test(line))) {
        loosened.push(`${change.path}: ${line.trim()}`);
      }
    }
  }
  failures.push({
    name: 'checks',
    label: 'o que afrouxa um check, que só muda por um ticket pattern (MATRIX-FORMAT.md, "Matrix rules", regra 6)',
    items: loosened,
  });
}

let hasFailed = false;
for (const { name, label, items } of failures.filter((failure) => failure.name === 'branch' || failure.items.length > 0)) {
  hasFailed = true;
  console.log(`falha ${name}: ${label}`);
  for (const item of items) {
    console.log(`  ${item}`);
  }
}
process.exit(hasFailed ? 1 : 0);
