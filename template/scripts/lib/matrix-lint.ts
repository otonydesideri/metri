// Checagens do docs/plan/MATRIX.md no modo projeto do docs-lint. A lista está no --help do docs-lint.
import { existsSync, readFileSync } from 'node:fs';
import { type Block, fieldOf, type Kind, listOf, parseMatrix } from './matrix.ts';

export type MatrixProblem = { line: number; message: string };

const SECTIONS = ['Features', 'Slices', 'Fog', 'Gaps', 'Pattern proposals'];
// Campos reservados: opcionais em qualquer bloco, só escritos quando têm valor.
const RESERVED = ['milestone', 'tech_design', 'evidence', 'metrics', 'notes'];
// Chaves de ticket: o UC (o tracer) e o ticket T levam as mesmas.
const TICKET_KEYS = ['mode', 'status', 'blocked_by', 'sensitive', 'areas', 'touches', 'checks', 'subtasks'];
const KEYS: Record<Kind, string[]> = {
  feature: ['horizon', 'slices', 'outcome', ...RESERVED],
  uc: ['actor', 'slice', ...TICKET_KEYS, ...RESERVED],
  slice: ['horizon', 'blocked_by', 'contract', 'entry', 'status', ...RESERVED],
  ticket: ['type', 'what', 'criteria', ...TICKET_KEYS, ...RESERVED],
};
const REQUIRED: Record<Kind, string[]> = {
  feature: ['horizon'],
  uc: ['status'],
  slice: [],
  ticket: ['type', 'mode', 'status', 'checks', 'what', 'criteria'],
};
// Obrigatórias no UC fora de draft e ainda não podado (status: done → <testes>); slice sai em lintOrphans.
const UC_TICKET_REQUIRED = ['mode', 'checks'];
const WHAT_MAX_LINES = 3;
const CONTRACT_KEYS = ['responsibility', 'interface', 'invariants', 'consumers', 'planned'];
const CONTRACT_REQUIRED = ['responsibility', 'interface', 'invariants', 'consumers'];
const VALUES: Record<string, string[]> = {
  horizon: ['now', 'planned', 'fog', 'out'],
  status: ['open', 'in_progress', 'blocked', 'done'],
  type: ['pattern', 'task', 'release'],
  mode: ['afk', 'hitl'],
  sensitive: ['true', 'false'],
};
const LISTS = ['slices', 'blocked_by', 'areas', 'touches', 'checks', 'subtasks', 'consumers'];
// Rótulos do cabeçalho de contrato no entry (A.7), no idioma de comentário do default.
export const CONTRACT_LABELS = [
  'O quê',
  'Por quê',
  'Onde',
  'Como usar',
  'Invariantes',
  'Consumidores',
  'Previsto',
  'Checks',
  'SOT keywords',
];
const TICKET_ID = '(?:UC|T)\\d+\\.\\d+';
const ITEMS: Record<string, RegExp | undefined> = {
  Fog: undefined,
  Gaps: new RegExp(`^GAP-\\d+ · .+ → ${TICKET_ID}$`),
  'Pattern proposals': new RegExp(`^PP-\\d+ · de ${TICKET_ID} · .+ → .+$`),
};

export function matrixProblems(source: string): MatrixProblem[] {
  const matrix = parseMatrix(source);
  const problems: MatrixProblem[] = [...matrix.problems];
  const report = (line: number, message: string) => problems.push({ line, message });

  if (matrix.title?.text !== 'MATRIX') {
    report(matrix.title?.line ?? 1, 'título: a primeira linha é "# MATRIX"');
  }
  const sections = matrix.sections.map(({ text }) => text);
  if (sections.join('|') !== SECTIONS.join('|')) {
    report(matrix.sections[0]?.line ?? 1, `seções: ${SECTIONS.map((text) => `## ${text}`).join(', ')}, nessa ordem`);
  }

  const ids = new Map<string, Block>();
  for (const block of matrix.blocks) {
    if (ids.has(block.id)) {
      report(block.line, `id: ${block.id} repetido`);
    }
    ids.set(block.id, block);
  }
  const itemIds = new Set<string>();
  for (const item of matrix.items) {
    const pattern = ITEMS[item.section];
    if (!(item.section in ITEMS)) {
      report(item.line, `item de lista fora de bloco em ## ${item.section}`);
    } else if (pattern && !pattern.test(item.text)) {
      report(item.line, `${item.section}: "${item.text}" fora do formato`);
    }
    const id = /^(GAP-\d+|PP-\d+) /.exec(item.text)?.[1];
    if (id && itemIds.has(id)) {
      report(item.line, `id: ${id} repetido`);
    }
    if (id) {
      itemIds.add(id);
    }
  }

  for (const block of matrix.blocks) {
    lintParent(block, report);
    lintFields(block, ids, report);
  }
  lintOrphans(matrix.blocks, report);
  return problems.sort((a, b) => a.line - b.line);
}

function numberOf(id: string): string {
  return /^[A-Z]+(\d+)/.exec(id)?.[1] ?? '';
}

function lintParent(block: Block, report: (line: number, message: string) => void): void {
  if (block.kind !== 'uc' && block.kind !== 'ticket') {
    return;
  }
  const owner = block.kind === 'uc' ? 'feature' : 'slice';
  if (!block.parent) {
    report(block.line, `${block.id} fora de uma ${owner}`);
    return;
  }
  if (numberOf(block.id) !== numberOf(block.parent.id)) {
    report(block.line, `id: ${block.id} dentro de ${block.parent.id}; o número depois da letra é o da ${owner}`);
  }
}

function lintFields(
  block: Block,
  ids: Map<string, Block>,
  report: (line: number, message: string) => void,
): void {
  const seen = new Set<string>();
  for (const field of block.fields) {
    if (!KEYS[block.kind].includes(field.key)) {
      report(field.line, `chave ${field.key} fora do VOCABULARY para ${block.kind} (${KEYS[block.kind].join(', ')})`);
      continue;
    }
    if (seen.has(field.key)) {
      report(field.line, `chave ${field.key} repetida em ${block.id}`);
    }
    seen.add(field.key);
    if (field.key === 'contract' || field.key === 'criteria') {
      continue;
    }
    lintValue(block, field.key, field.value, field.line, ids, report);
  }
  const required = isUcInPlay(block) ? [...REQUIRED.uc, ...UC_TICKET_REQUIRED] : REQUIRED[block.kind];
  for (const key of required) {
    if (!seen.has(key)) {
      report(block.line, `${block.id}: falta a chave ${key}${block.kind === 'uc' ? ' (UC fora de draft)' : ''}`);
    }
  }
  if (block.kind === 'slice') {
    lintSlice(block, seen, ids, report);
  }
  if (block.kind === 'ticket') {
    lintTicket(block, report);
  }
}

// UC que já é ticket: fora de draft e ainda não podado para "status: done → <testes>".
function isUcInPlay(block: Block): boolean {
  if (block.kind !== 'uc') {
    return false;
  }
  const status = fieldOf(block, 'status')?.value ?? '';
  return status !== 'draft' && !/^done → \S+$/.test(status);
}

// Ticket T: what em 1 a 3 linhas e criteria com ao menos um item.
function lintTicket(block: Block, report: (line: number, message: string) => void): void {
  const what = fieldOf(block, 'what');
  if (what && (block.whatLines ?? 1) > WHAT_MAX_LINES) {
    report(what.line, `what de ${block.id}: ${block.whatLines} linhas, mais de ${WHAT_MAX_LINES}`);
  }
  const criteria = fieldOf(block, 'criteria');
  if (criteria && criteria.value !== '') {
    report(criteria.line, `criteria de ${block.id}: os critérios vêm nas linhas "- " abaixo da chave`);
  } else if (criteria && (block.criteria ?? []).length === 0) {
    report(criteria.line, `criteria de ${block.id} sem item`);
  }
}

function lintValue(
  block: Block,
  key: string,
  value: string,
  line: number,
  ids: Map<string, Block>,
  report: (line: number, message: string) => void,
): void {
  if (value === '' || value === '[]') {
    report(line, `chave ${key} vazia em ${block.id}`);
    return;
  }
  const isUcStatus = block.kind === 'uc' && key === 'status';
  const allowed = isUcStatus ? ['draft', ...VALUES.status] : VALUES[key];
  const plain = isUcStatus ? value.replace(/^done → \S+$/, 'done') : value;
  if (key === 'status' && plain === 'draft' && !isUcStatus) {
    report(line, `status: draft só no UC (${block.id})`);
  } else if (allowed && !allowed.includes(plain)) {
    report(line, `${key}: ${value} fora de ${allowed.join(' | ')}`);
  }
  if (LISTS.includes(key)) {
    const items = listOf(value);
    if (!items) {
      report(line, `${key}: ${value} não é lista [a, b]`);
      return;
    }
    for (const item of items) {
      lintReference(block, key, item, line, ids, report);
    }
  }
  if (key === 'slice') {
    lintReference(block, key, value, line, ids, report);
  }
}

function lintReference(
  block: Block,
  key: string,
  target: string,
  line: number,
  ids: Map<string, Block>,
  report: (line: number, message: string) => void,
): void {
  const kinds: Record<string, Kind[]> = { slices: ['slice'], blocked_by: ['slice', 'ticket', 'uc'], slice: ['slice'] };
  const expected = kinds[key];
  if (!expected) {
    return;
  }
  if (!expected.includes(ids.get(target)?.kind as Kind)) {
    report(line, `${key} de ${block.id}: ${target} não existe na matriz`);
  }
}

function lintSlice(
  block: Block,
  seen: Set<string>,
  ids: Map<string, Block>,
  report: (line: number, message: string) => void,
): void {
  if (!seen.has('horizon') && !seen.has('status')) {
    report(block.line, `${block.id}: falta horizon (ou status: done)`);
  }
  const isDone = fieldOf(block, 'status')?.value === 'done';
  const hasContract = seen.has('contract');
  const entry = fieldOf(block, 'entry');
  if (hasContract && entry) {
    report(block.line, `${block.id}: contract e entry juntos; construída, a slice guarda só o entry (o contrato vai para o cabeçalho)`);
  } else if (isDone && !entry) {
    report(block.line, `${block.id}: slice done sem entry`);
  } else if (!hasContract && !entry) {
    report(block.line, `${block.id}: sem contract nem entry`);
  }
  if (hasContract) {
    const contract = block.contract ?? [];
    for (const field of contract) {
      if (!CONTRACT_KEYS.includes(field.key)) {
        report(field.line, `contract: chave ${field.key} fora de ${CONTRACT_KEYS.join(', ')}`);
        continue;
      }
      lintValue(block, field.key, field.value, field.line, ids, report);
    }
    for (const key of CONTRACT_REQUIRED) {
      if (!contract.some((field) => field.key === key)) {
        report(fieldOf(block, 'contract')?.line ?? block.line, `contract de ${block.id}: falta ${key}`);
      }
    }
  }
  if (entry && entry.value !== '') {
    const problem = entryProblem(entry.value.replaceAll('`', ''));
    if (problem) {
      report(entry.line, problem);
    }
  }
}

function entryProblem(path: string): string | undefined {
  if (!existsSync(path)) {
    return `entry: ${path} não existe`;
  }
  const header = /\/\*\*([\s\S]*?)\*\//.exec(readFileSync(path, 'utf8'))?.[1];
  if (header === undefined) {
    return `entry: ${path} sem o cabeçalho de contrato (/** ... */)`;
  }
  const missing = CONTRACT_LABELS.filter((label) => !new RegExp(`^\\s*\\*\\s*${label}:`, 'm').test(header));
  return missing.length === 0 ? undefined : `entry: cabeçalho de ${path} sem ${missing.join(', ')}`;
}

// Nada órfão: UC fora de draft tem slice; slice now serve a uma feature now, que a lista em slices ou tem um UC
// com ela em slice. Ticket T fora de slice sai em lintParent.
function lintOrphans(blocks: Block[], report: (line: number, message: string) => void): void {
  const isNow = (block: Block) => fieldOf(block, 'horizon')?.value === 'now';
  const servedNow = new Set([
    ...blocks
      .filter((block) => block.kind === 'feature' && isNow(block))
      .flatMap((block) => listOf(fieldOf(block, 'slices')?.value ?? '') ?? []),
    ...blocks
      .filter((block) => block.kind === 'uc' && block.parent !== undefined && isNow(block.parent))
      .map((block) => fieldOf(block, 'slice')?.value ?? ''),
  ]);
  for (const block of blocks) {
    if (isUcInPlay(block) && !fieldOf(block, 'slice')) {
      report(block.line, `${block.id}: UC fora de draft sem slice`);
    }
    if (block.kind === 'slice' && isNow(block) && !servedNow.has(block.id)) {
      report(block.line, `${block.id}: slice now que nenhuma feature now serve (slices da feature ou slice de um UC)`);
    }
  }
}
