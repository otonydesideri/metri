// prune: removes a slice's ticket evidence from the tree, in the /accept prune. --help has the details.
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { frontmatterOf, takeOption, TICKETS_DIR } from './lib/layout.ts';

const HELP = `prune: tira da árvore a evidência dos tickets de uma slice, na poda do /accept.

Uso: metri prune <S<n>> [--root <dir>]

Apaga a pasta .metri/tickets/<id>/ (os PNG de evidência) de cada ticket com "slice: <S<n>>" no frontmatter. Os
arquivos .metri/tickets/<id>.md ficam. O git guarda a evidência apagada; o /accept comita a remoção.

Saída: "removido: <pasta>" por pasta apagada, ou "nada a remover". Sai com código 1 quando o id não é de slice.
`;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
process.chdir(resolve(takeOption(args, '--root') ?? '.'));
const [slice] = args;
if (slice === undefined || !/^S\d+$/.test(slice)) {
  console.log('erro: diga a slice, S<n> (metri prune --help)');
  process.exit(1);
}

const tickets = existsSync(TICKETS_DIR) ? readdirSync(TICKETS_DIR).filter((name) => name.endsWith('.md')).sort() : [];
let removed = 0;
for (const name of tickets) {
  let frontmatter: Record<string, unknown> | undefined;
  try {
    frontmatter = frontmatterOf(readFileSync(join(TICKETS_DIR, name), 'utf8'));
  } catch {
    continue; // invalid YAML: docs-lint reports it.
  }
  const dir = join(TICKETS_DIR, name.replace(/\.md$/, ''));
  if (frontmatter?.slice === slice && existsSync(dir)) {
    rmSync(dir, { recursive: true });
    console.log(`removido: ${dir}`);
    removed++;
  }
}
if (removed === 0) {
  console.log('nada a remover');
}
