// Checks of one feature's spec (.metri/specs/<F-id>.md): frontmatter, sections and the Casos de uso list. Called
// by docs-lint, one file at a time. Whether every non-draft UC of a feature appears in its spec, and whether a
// ticket's feature has a spec at all, is ticket-lint's job, since it already walks every ticket.
import { parse } from 'yaml';
import { MD_PATH, proseLines, sectionItems } from './layout.ts';

export type SpecProblem = { line: number; message: string; isWarning?: boolean };
export type SpecContext = { ticketIds: Set<string> };

// The spec holds no state of its own (draft, planned, done): that is read from the status of its UCs.
const KNOWN_KEYS = ['id', 'title', 'horizon', 'milestone'];
const REQUIRED_KEYS = ['id', 'title', 'horizon'];
const HORIZONS = ['now', 'planned', 'fog'];
const SECTIONS = ['Problema', 'Solução', 'Casos de uso', 'Decisões de implementação', 'Decisões de teste', 'Fora de escopo', 'Notas'];
const UC_ITEM = /^(UC(\d+)\.\d+) · \S/;

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

export function specProblems(source: string, expectedId: string, ctx: SpecContext): SpecProblem[] {
  const problems: SpecProblem[] = [];
  const report = (line: number, message: string) => problems.push({ line, message });
  const warn = (line: number, message: string) => problems.push({ line, message, isWarning: true });

  const number = /^F(\d+)$/.exec(expectedId)?.[1];
  if (number === undefined) {
    report(1, `nome de arquivo: ${expectedId}.md fora do formato F<n>.md`);
    return problems;
  }

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
  for (const key of REQUIRED_KEYS) {
    if (!(key in frontmatter)) {
      report(1, `frontmatter: falta a chave obrigatória ${key}`);
    }
  }
  for (const [key, value] of Object.entries(frontmatter)) {
    const line = keyLine(lines, key);
    if (!KNOWN_KEYS.includes(key)) {
      const hint = key === 'status' ? '; o estado da feature se deduz do status dos UCs' : '';
      report(line, `frontmatter: chave ${key} fora de VOCABULARY.md para spec${hint}`);
      continue;
    }
    if (isEmpty(value)) {
      report(line, `frontmatter: chave ${key} vazia`);
    }
  }
  if (frontmatter.id !== expectedId) {
    report(keyLine(lines, 'id'), `frontmatter: id ${String(frontmatter.id)} diferente do nome do arquivo ${expectedId}.md`);
  }
  if (typeof frontmatter.horizon === 'string' && !HORIZONS.includes(frontmatter.horizon)) {
    report(keyLine(lines, 'horizon'), `horizon: ${frontmatter.horizon} fora de ${HORIZONS.join(' | ')}`);
  }

  const sections = lines.filter((text) => text.startsWith('## ')).map((text) => text.slice(3).trim());
  if (sections.join('|') !== SECTIONS.join('|')) {
    report(1, `seções: ${SECTIONS.join(', ')}, nessa ordem`);
  }

  for (const { text, line } of sectionItems(source, 'Casos de uso')) {
    const item = UC_ITEM.exec(text);
    if (!item) {
      report(line, `Casos de uso de ${expectedId}: "${text}" fora do formato UC<f>.<n> · <título>`);
      continue;
    }
    const [, ucId, featureNumber] = item;
    if (featureNumber !== number) {
      report(line, `Casos de uso de ${expectedId}: ${ucId} é de outra feature; o número depois da letra no id é o da feature`);
    } else if (!ctx.ticketIds.has(ucId)) {
      report(line, `Casos de uso de ${expectedId}: ${ucId} não existe em .metri/tickets/`);
    }
  }

  for (const { text, line } of proseLines(source)) {
    for (const [cited] of text.matchAll(MD_PATH)) {
      warn(line, `${expectedId}: cita ${cited}, caminho de arquivo; a spec aponta para ids (UC, T, S, ADR-NNNN), não para arquivos`);
    }
  }

  return problems;
}
