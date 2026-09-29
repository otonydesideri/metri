// Checagens do .metri/MATRIX.md no modo projeto do docs-lint: só o plano (features, slices, Fog, Gaps,
// Pattern proposals). O que valida cada ticket (UC ou T), em .metri/tickets/<id>.md, está em ticket-lint.ts.
// A lista está no --help do docs-lint.
import { type Block, fieldOf, type Kind, listOf, parseMatrix } from './matrix.ts';

export type MatrixProblem = { line: number; message: string };

const SECTIONS = ['Features', 'Slices', 'Fog', 'Gaps', 'Pattern proposals'];
const KEYS: Record<Kind, string[]> = {
  feature: ['horizon', 'slices', 'outcome', 'ucs', 'milestone'],
  slice: ['horizon', 'blocked_by', 'contract', 'sot', 'status'],
};
const REQUIRED: Record<Kind, string[]> = {
  feature: ['horizon'],
  slice: [],
};
const CONTRACT_KEYS = ['responsibility', 'interface', 'invariants', 'consumers', 'planned'];
const FOUNDATION = 'S0';
const CONTRACT_REQUIRED = ['responsibility', 'interface', 'invariants', 'consumers'];
const VALUES: Record<string, string[]> = {
  horizon: ['now', 'planned', 'fog', 'out'],
  status: ['done'],
};
const LISTS = ['slices', 'blocked_by', 'ucs', 'consumers', 'sot'];
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
    lintFields(block, ids, report);
  }
  return problems.sort((a, b) => a.line - b.line);
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
    if (field.key === 'contract') {
      continue;
    }
    lintValue(block, field.key, field.value, field.line, ids, report);
  }
  for (const key of REQUIRED[block.kind]) {
    if (!seen.has(key)) {
      report(block.line, `${block.id}: falta a chave ${key}`);
    }
  }
  if (block.kind === 'slice') {
    lintSlice(block, seen, ids, report);
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
  const allowed = VALUES[key];
  if (allowed && !allowed.includes(value)) {
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
}

function lintReference(
  block: Block,
  key: string,
  target: string,
  line: number,
  ids: Map<string, Block>,
  report: (line: number, message: string) => void,
): void {
  const kinds: Record<string, Kind[]> = { slices: ['slice'], blocked_by: ['slice'] };
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
  const hasContract = seen.has('contract');
  const isDone = fieldOf(block, 'status')?.value === 'done';
  // A slice done é conferida pelo metri sot; a de plano tem o contrato ou, reaberta, os donos em sot.
  if (block.id !== FOUNDATION && !isDone && !hasContract && !seen.has('sot')) {
    report(block.line, `${block.id}: sem contract nem sot`);
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
}
