// Checks of one ticket (.metri/tickets/<id>.md): frontmatter, body (the T's O que entrega / Critérios) and
// cross-references to the specs (feature) and the MATRIX (slice, blocked_by). Called by docs-lint, one file at a
// time.
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
const NOTES_MAX_LINES = 10;
const METRICS_KEYS = ['rules', 'tokens'];
const STORY = /^Como (.+?), quero (.+?), para (.+)\.$/;

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

// The line right below the title ("# <id> · <título>"), before any "## " section: the UC's story, if it wrote one.
function storyOf(source: string): { text: string; line: number } | undefined {
  const lines = source.split('\n');
  const title = lines.findIndex((text) => text.startsWith('# '));
  for (let index = title + 1; title !== -1 && index < lines.length && !lines[index].startsWith('## '); index++) {
    if (lines[index].trim() !== '') {
      return { text: lines[index].trim(), line: index + 1 };
    }
  }
  return undefined;
}

// UC<f>.<n> or T<s>.<n>: the id, the feature/slice number in the id, and the kind.
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
      const message =
        kind === 'uc'
          ? `feature: ${featureOrSlice} não tem spec em .metri/specs/`
          : `slice: ${featureOrSlice} não existe na matriz`;
      report(keyLine(lines, kind === 'uc' ? 'feature' : 'slice'), message);
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
      report(1, `${expectedId}: fora de Casos de uso da spec ${String(frontmatter.feature)} (.metri/specs/${String(frontmatter.feature)}.md)`);
    }
  }

  if (kind === 't') {
    const what = sectionLines(source, 'O que entrega');
    if (what.length === 0) {
      report(1, `${expectedId}: falta a seção "O que entrega"`);
    } else if (what.length > WHAT_MAX_LINES) {
      report(what[0].line, `"O que entrega" de ${expectedId}: ${what.length} linhas, mais de ${WHAT_MAX_LINES}`);
    }
  }

  if (kind === 'uc' && status !== 'done') {
    const story = storyOf(source);
    if (!story) {
      report(1, `${expectedId}: falta a história ("Como <ator>, quero <ação>, para <benefício>.") logo abaixo do título`);
    } else {
      const storyMatch = STORY.exec(story.text);
      if (!storyMatch) {
        report(story.line, `${expectedId}: história "${story.text}" fora do formato "Como <ator>, quero <ação>, para <benefício>."`);
      } else if (typeof frontmatter.actor === 'string' && storyMatch[1] !== frontmatter.actor) {
        report(story.line, `${expectedId}: história com ator "${storyMatch[1]}", diferente da chave actor: ${frontmatter.actor}`);
      }
    }
  }

  if (!isDraft && sectionItems(source, 'Critérios').length === 0) {
    report(1, `${expectedId}: "Critérios" sem item`);
  }

  if ('metrics' in frontmatter && !isEmpty(frontmatter.metrics)) {
    const metrics = frontmatter.metrics;
    const entries = typeof metrics === 'object' && !Array.isArray(metrics) ? Object.entries(metrics as Record<string, unknown>) : [];
    const isValid =
      entries.length > 0 &&
      entries.every(([key, value]) => METRICS_KEYS.includes(key) && Number.isInteger(value) && (value as number) >= 0) &&
      entries.some(([key]) => key === 'rules');
    if (!isValid) {
      report(keyLine(lines, 'metrics'), `metrics: { rules: <n>, tokens: <n> }, com rules sempre e números inteiros (tokens só quando a ferramenta informa)`);
    }
  }

  const notes = sectionLines(source, 'Notas');
  if (notes.length > NOTES_MAX_LINES) {
    report(notes[0].line, `"Notas" de ${expectedId}: ${notes.length} linhas, mais de ${NOTES_MAX_LINES}; só o que o código, os testes e o git não mostram`);
  }

  return problems;
}
