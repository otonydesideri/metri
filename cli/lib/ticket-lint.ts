// Checagens de um ticket (.metri/tickets/<id>.md): frontmatter, corpo (O que entrega / Critérios do T) e
// referências cruzadas com a MATRIX (feature, slice, blocked_by). Chamado pelo docs-lint, um arquivo por vez.
import { parse } from 'yaml';
import { sectionItems, sectionLines } from './layout.ts';

export type TicketProblem = { line: number; message: string };
export type TicketContext = {
  featureIds: Set<string>;
  sliceIds: Set<string>;
  ticketIds: Set<string>;
  featureUcs: Map<string, string[]>;
};

const COMMON_KEYS = ['id', 'title', 'slice', 'status', 'mode', 'blocked_by', 'areas', 'touches', 'sensitive', 'checks', 'subtasks', 'metrics'];
const UC_KEYS = [...COMMON_KEYS, 'feature', 'actor'];
const T_KEYS = [...COMMON_KEYS, 'type'];
const REQUIRED_ALWAYS = ['id', 'title', 'status'];
const UC_REQUIRED_ALWAYS = ['feature'];
const UC_REQUIRED_OPEN = ['slice', 'mode', 'checks'];
const T_REQUIRED_ALWAYS = ['type', 'slice', 'mode', 'checks'];
const UC_STATUSES = ['draft', 'open', 'in_progress', 'blocked', 'done'];
const T_STATUSES = ['open', 'in_progress', 'blocked', 'done'];
const MODES = ['afk', 'hitl'];
const TYPES = ['pattern', 'task', 'release'];
const LIST_KEYS = ['blocked_by', 'areas', 'touches', 'checks', 'subtasks'];
const WHAT_MAX_LINES = 3;

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }
  return typeof value === 'object' && Object.keys(value).length === 0;
}

function keyLine(lines: string[], key: string): number {
  const index = lines.findIndex((text) => text.startsWith(`${key}:`));
  return index === -1 ? 1 : index + 1;
}

// UC<f>.<n> ou T<s>.<n>: id, número da feature/slice do id, e o kind.
function idParts(id: string): { kind: 'uc' | 't'; owner: string } | undefined {
  const uc = /^UC(\d+)\.\d+$/.exec(id);
  if (uc) {
    return { kind: 'uc', owner: `F${uc[1]}` };
  }
  const t = /^T(\d+)\.\d+$/.exec(id);
  if (t) {
    return { kind: 't', owner: `S${t[1]}` };
  }
  return undefined;
}

export function ticketProblems(path: string, source: string, expectedId: string, ctx: TicketContext): TicketProblem[] {
  const problems: TicketProblem[] = [];
  const report = (line: number, message: string) => problems.push({ line, message });

  const parts = idParts(expectedId);
  if (!parts) {
    report(1, `nome de arquivo: ${expectedId}.md fora do formato UC<f>.<n>.md ou T<s>.<n>.md`);
    return problems;
  }
  const { kind, owner } = parts;

  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) {
    report(1, 'frontmatter: ausente');
    return problems;
  }
  let frontmatter: Record<string, unknown>;
  try {
    frontmatter = parse(match[1]) ?? {};
  } catch (error) {
    report(1, `frontmatter: YAML inválido (${(error as Error).message.split('\n')[0]})`);
    return problems;
  }
  const lines = source.split('\n');
  const knownKeys = kind === 'uc' ? UC_KEYS : T_KEYS;
  for (const key of REQUIRED_ALWAYS) {
    if (!(key in frontmatter)) {
      report(1, `frontmatter: falta a chave obrigatória ${key}`);
    }
  }
  for (const [key, value] of Object.entries(frontmatter)) {
    const line = keyLine(lines, key);
    if (!knownKeys.includes(key)) {
      report(line, `frontmatter: chave ${key} fora de VOCABULARY.md para ${kind === 'uc' ? 'UC' : 'T'}`);
      continue;
    }
    if (isEmpty(value)) {
      report(line, `frontmatter: chave ${key} vazia`);
    }
  }
  if (frontmatter.id !== expectedId) {
    report(keyLine(lines, 'id'), `frontmatter: id ${String(frontmatter.id)} diferente do nome do arquivo ${expectedId}.md`);
  }
  const status = typeof frontmatter.status === 'string' ? frontmatter.status : undefined;
  const allowedStatuses = kind === 'uc' ? UC_STATUSES : T_STATUSES;
  if (status !== undefined && !allowedStatuses.includes(status)) {
    report(keyLine(lines, 'status'), `status: ${status} fora de ${allowedStatuses.join(' | ')}`);
  }
  if (typeof frontmatter.mode === 'string' && !MODES.includes(frontmatter.mode)) {
    report(keyLine(lines, 'mode'), `mode: ${frontmatter.mode} fora de ${MODES.join(' | ')}`);
  }
  if ('sensitive' in frontmatter && typeof frontmatter.sensitive !== 'boolean') {
    report(keyLine(lines, 'sensitive'), 'sensitive: precisa ser true ou false (booleano, sem aspas)');
  }
  for (const key of LIST_KEYS) {
    if (key in frontmatter && !Array.isArray(frontmatter[key])) {
      report(keyLine(lines, key), `${key}: precisa ser uma lista [a, b]`);
    }
  }

  const isDraft = kind === 'uc' && status === 'draft';
  const required = kind === 'uc' ? [...UC_REQUIRED_ALWAYS, ...(isDraft ? [] : UC_REQUIRED_OPEN)] : T_REQUIRED_ALWAYS;
  for (const key of required) {
    if (!(key in frontmatter) || isEmpty(frontmatter[key])) {
      report(1, `${expectedId}: falta a chave ${key}${kind === 'uc' ? ' (UC fora de draft)' : ''}`);
    }
  }

  if (kind === 't' && typeof frontmatter.type === 'string' && !TYPES.includes(frontmatter.type)) {
    report(keyLine(lines, 'type'), `type: ${frontmatter.type} fora de ${TYPES.join(' | ')}`);
  }

  if (kind === 'uc' && !isDraft && Array.isArray(frontmatter.checks) && frontmatter.checks.length > 0) {
    const isOnlyVerify = frontmatter.checks
      .map((check) => String(check).replaceAll('`', '').trim())
      .every((check) => check === 'pnpm verify');
    if (isOnlyVerify) {
      report(keyLine(lines, 'checks'), `checks de ${expectedId}: só pnpm verify; falta o teste ou padrão de teste que prova os critérios`);
    }
  }

  const featureOrSlice = kind === 'uc' ? frontmatter.feature : frontmatter.slice;
  if (typeof featureOrSlice === 'string' && featureOrSlice !== '') {
    const validOwners = kind === 'uc' ? ctx.featureIds : ctx.sliceIds;
    if (!validOwners.has(featureOrSlice)) {
      report(keyLine(lines, kind === 'uc' ? 'feature' : 'slice'), `${kind === 'uc' ? 'feature' : 'slice'}: ${featureOrSlice} não existe na matriz`);
    } else if (featureOrSlice !== owner) {
      report(
        keyLine(lines, kind === 'uc' ? 'feature' : 'slice'),
        `${expectedId}: ${kind === 'uc' ? 'feature' : 'slice'} ${featureOrSlice} diferente de ${owner}; o número depois da letra no id é o de ${kind === 'uc' ? 'feature' : 'slice'}`,
      );
    }
  }
  if (kind === 'uc' && typeof frontmatter.slice === 'string' && frontmatter.slice !== '' && !ctx.sliceIds.has(frontmatter.slice)) {
    report(keyLine(lines, 'slice'), `slice: ${frontmatter.slice} não existe na matriz`);
  }
  for (const target of Array.isArray(frontmatter.blocked_by) ? frontmatter.blocked_by.map(String) : []) {
    if (!ctx.ticketIds.has(target) && !ctx.sliceIds.has(target)) {
      report(keyLine(lines, 'blocked_by'), `blocked_by de ${expectedId}: ${target} não existe`);
    }
  }

  if (kind === 'uc' && !isDraft) {
    const ucs = ctx.featureUcs.get(String(frontmatter.feature)) ?? [];
    if (!ucs.includes(expectedId)) {
      report(1, `${expectedId}: fora da lista ucs da feature ${String(frontmatter.feature)} em .metri/MATRIX.md`);
    }
  }

  if (kind === 't') {
    const what = sectionLines(source, 'O que entrega');
    if (what.length === 0) {
      report(1, `${expectedId}: falta a seção "O que entrega"`);
    } else if (what.length > WHAT_MAX_LINES) {
      report(what[0].line, `"O que entrega" de ${expectedId}: ${what.length} linhas, mais de ${WHAT_MAX_LINES}`);
    }
    const criteria = sectionItems(source, 'Critérios');
    if (criteria.length === 0) {
      report(1, `${expectedId}: "Critérios" sem item`);
    }
  }

  return problems;
}
