// rules-index: gera o INDEX.md de cada área a partir do frontmatter das regras
// e a lista de áreas abaixo do marcador do INDEX.md raiz (METHODOLOGY 6.11).
// Uso: rules-index [<raiz>] [--check]   (raiz padrão: architecture)
// --check não escreve nada e sai com código 1 se algum INDEX estiver desatualizado.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const HEADER = 'Gerado por rules-index. Não edite.';
const MARKER = '<!-- rules-index -->';

type Rule = { id: string; description: string; useWhen: string[]; entry?: string };

const args = process.argv.slice(2);
const isCheck = args.includes('--check');
const root = args.find((arg) => !arg.startsWith('--')) ?? 'architecture';

function readRule(path: string): Rule {
  const source = readFileSync(path, 'utf8');
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) {
    throw new Error(`${path}: regra sem frontmatter`);
  }
  const frontmatter = parse(match[1]);
  if (typeof frontmatter?.id !== 'string' || typeof frontmatter.description !== 'string') {
    throw new Error(`${path}: frontmatter sem id ou description`);
  }
  if (!Array.isArray(frontmatter.use_when)) {
    throw new Error(`${path}: frontmatter sem use_when`);
  }
  const entry = typeof frontmatter.entry === 'string' ? frontmatter.entry : undefined;
  return { id: frontmatter.id, description: frontmatter.description, useWhen: frontmatter.use_when, entry };
}

function isRuleFile(name: string): boolean {
  return name.endsWith('.md') && !name.endsWith('.examples.md') && name !== 'INDEX.md';
}

function cell(text: string): string {
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

// Quando as entradas têm `entry` (as slices, A.7), a tabela ganha a coluna do ponto de entrada.
function areaIndex(rules: Rule[]): string {
  const hasEntry = rules.some((rule) => rule.entry !== undefined);
  const rows = rules.map((rule) => {
    const cells = [rule.id, rule.description, rule.useWhen.join('; ')];
    if (hasEntry) {
      cells.push(rule.entry ?? '');
    }
    return `| ${cells.map(cell).join(' | ')} |`;
  });
  const head = hasEntry
    ? ['| id | description | use_when | entry |', '| --- | --- | --- | --- |']
    : ['| id | description | use_when |', '| --- | --- | --- |'];
  return [HEADER, '', ...head, ...rows, ''].join('\n');
}

function rootIndex(current: string, areas: Map<string, Rule[]>): string {
  const markerAt = current.indexOf(MARKER);
  if (markerAt === -1) {
    throw new Error(`${join(root, 'INDEX.md')}: sem o marcador ${MARKER}`);
  }
  const handWritten = current.slice(0, markerAt + MARKER.length);
  const lines = [...areas].map(([area, rules]) => {
    const count = rules.length === 1 ? '1 regra' : `${rules.length} regras`;
    return `- \`${area}\` → \`${area}/INDEX.md\` (${count})`;
  });
  return [handWritten, '', ...lines, ''].join('\n');
}

const areas = new Map<string, Rule[]>();
for (const area of readdirSync(root).sort()) {
  const dir = join(root, area);
  if (!statSync(dir).isDirectory()) {
    continue;
  }
  const rules = readdirSync(dir)
    .filter(isRuleFile)
    .map((name) => readRule(join(dir, name)))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (rules.length > 0) {
    areas.set(area, rules);
  }
}

const rootPath = join(root, 'INDEX.md');
const expected = new Map<string, string>();
for (const [area, rules] of areas) {
  expected.set(join(root, area, 'INDEX.md'), areaIndex(rules));
}
expected.set(rootPath, rootIndex(existsSync(rootPath) ? readFileSync(rootPath, 'utf8') : '', areas));

const stale = [...expected].filter(
  ([path, content]) => !existsSync(path) || readFileSync(path, 'utf8') !== content,
);

if (isCheck) {
  for (const [path] of stale) {
    console.error(`desatualizado: ${path}`);
  }
  process.exit(stale.length > 0 ? 1 : 0);
}

for (const [path, content] of stale) {
  writeFileSync(path, content);
  console.log(`gerado: ${path}`);
}
