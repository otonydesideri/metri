// matrix-view: gera, no topo de docs/plan/MATRIX.md, entre <!-- matrix-view --> e <!-- /matrix-view -->, a tabela
// features × slices (com os ids dos tickets de cada célula e um marcador curto de status) e um grafo Mermaid das
// dependências (blocked_by), com uma classe por status. Só roda no modo projeto (com docs/plan/MATRIX.md).
//
// Uso: matrix-view [--root <dir>] [--check]
// --check não escreve nada e sai com código 1 se a visão estiver desatualizada.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { frontmatterOf, MATRIX, takeOption, TICKETS_DIR } from './lib/layout.ts';
import { blankMatrixView, MATRIX_VIEW_END, MATRIX_VIEW_START, parseMatrix } from './lib/matrix.ts';

const HELP = `matrix-view: gera a visão da matriz (tabela features × slices e grafo Mermaid de blocked_by) no topo
de docs/plan/MATRIX.md, entre ${MATRIX_VIEW_START} e ${MATRIX_VIEW_END}.

Uso: matrix-view [--root <dir>] [--check]
--check não escreve nada e sai com código 1 se a visão estiver desatualizada; sem --check, escreve e sai 0.
Sem docs/plan/MATRIX.md (modo source, ou projeto sem plano ainda), não faz nada e sai 0.
`;

const STATUS_MARK: Record<string, string> = { draft: '·', open: 'o', in_progress: '~', blocked: '!', done: '✓' };
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
const isCheck = args.includes('--check');
process.chdir(resolve(takeOption(args, '--root') ?? '.'));

if (!existsSync(MATRIX)) {
  process.exit(0);
}

type Ticket = {
  id: string;
  kind: 'uc' | 't';
  feature?: string;
  slice?: string;
  status: string;
  blockedBy: string[];
};

function readTickets(): Ticket[] {
  if (!existsSync(TICKETS_DIR)) {
    return [];
  }
  return readdirSync(TICKETS_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => {
      const id = name.replace(/\.md$/, '');
      const frontmatter = frontmatterOf(readFileSync(`${TICKETS_DIR}/${name}`, 'utf8')) ?? {};
      return {
        id,
        kind: id.startsWith('UC') ? 'uc' : 't',
        feature: typeof frontmatter.feature === 'string' ? frontmatter.feature : undefined,
        slice: typeof frontmatter.slice === 'string' ? frontmatter.slice : undefined,
        status: typeof frontmatter.status === 'string' ? frontmatter.status : 'open',
        blockedBy: Array.isArray(frontmatter.blocked_by) ? frontmatter.blocked_by.map(String) : [],
      };
    });
}

function cell(ids: Ticket[]): string {
  return ids.length === 0 ? '—' : ids.map((ticket) => `${ticket.id} ${STATUS_MARK[ticket.status] ?? '?'}`).join(', ');
}

function table(featureIds: string[], sliceIds: string[], tickets: Ticket[]): string {
  const header = `| Feature \\ Slice | ${sliceIds.join(' | ')} |`;
  const divider = `| --- | ${sliceIds.map(() => '---').join(' | ')} |`;
  const rows = featureIds.map((feature) => {
    const cells = sliceIds.map((slice) => cell(tickets.filter((t) => t.kind === 'uc' && t.feature === feature && t.slice === slice)));
    return `| ${feature} | ${cells.join(' | ')} |`;
  });
  const tRow = `| T (sem UC) | ${sliceIds.map((slice) => cell(tickets.filter((t) => t.kind === 't' && t.slice === slice))).join(' | ')} |`;
  return [header, divider, ...rows, tRow].join('\n');
}

function nodeId(id: string): string {
  return id.replace(/[.]/g, '_');
}

function mermaid(sliceIds: string[], tickets: Ticket[]): string {
  const lines = [
    '```mermaid',
    'graph LR',
    '  classDef draft fill:#eee,stroke:#999',
    '  classDef open fill:#dbeafe,stroke:#3b82f6',
    '  classDef in_progress fill:#fef9c3,stroke:#ca8a04',
    '  classDef blocked fill:#fee2e2,stroke:#dc2626',
    '  classDef done fill:#dcfce7,stroke:#16a34a',
    '  classDef slice fill:#f3e8ff,stroke:#9333ea',
    ...sliceIds.map((slice) => `  ${nodeId(slice)}["${slice}"]:::slice`),
    ...tickets.map((ticket) => `  ${nodeId(ticket.id)}["${ticket.id}"]:::${ticket.status}`),
  ];
  for (const ticket of tickets) {
    for (const target of ticket.blockedBy) {
      lines.push(`  ${nodeId(target)} --> ${nodeId(ticket.id)}`);
    }
  }
  lines.push('```');
  return lines.join('\n');
}

const matrix = parseMatrix(blankMatrixView(readFileSync(MATRIX, 'utf8')));
const featureIds = matrix.blocks.filter((block) => block.kind === 'feature').map((block) => block.id);
const sliceIds = matrix.blocks.filter((block) => block.kind === 'slice').map((block) => block.id);
const tickets = readTickets();

const view = [
  '### Features × Slices',
  '',
  table(featureIds, sliceIds, tickets),
  '',
  '### Dependências (blocked_by)',
  '',
  mermaid(sliceIds, tickets),
].join('\n');

const current = readFileSync(MATRIX, 'utf8');
const startAt = current.indexOf(MATRIX_VIEW_START);
const endAt = current.indexOf(MATRIX_VIEW_END);
const block = `${MATRIX_VIEW_START}\n${view}\n${MATRIX_VIEW_END}`;
const expected =
  startAt !== -1 && endAt !== -1
    ? current.slice(0, startAt) + block + current.slice(endAt + MATRIX_VIEW_END.length)
    : current.replace(/^# MATRIX\n/, `# MATRIX\n\n${block}\n`);

if (isCheck) {
  if (expected !== current) {
    console.error(`desatualizado: ${MATRIX}`);
    process.exit(1);
  }
  process.exit(0);
}
if (expected !== current) {
  writeFileSync(MATRIX, expected);
  console.log(`gerado: ${MATRIX}`);
}
