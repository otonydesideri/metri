// rules-index: gera o INDEX.md de cada área a partir do frontmatter das regras e, abaixo do marcador do
// INDEX.md raiz, a lista de áreas e a tabela "Capacidades condicionais" das regras com activation (METHODOLOGY 6.11).
// Uso: rules-index [<raiz>] [--check]   (raiz padrão: architecture)
// --check não escreve nada e sai com código 1 se algum INDEX estiver desatualizado.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const HEADER = 'Gerado por rules-index. Não edite.';
const MARKER = '<!-- rules-index -->';

type Rule = { id: string; description: string; useWhen: string[]; activation?: string };

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
  const activation = typeof frontmatter.activation === 'string' ? frontmatter.activation : undefined;
  return { id: frontmatter.id, description: frontmatter.description, useWhen: frontmatter.use_when, activation };
}

function isRuleFile(name: string): boolean {
  return name.endsWith('.md') && !name.endsWith('.examples.md') && name !== 'INDEX.md';
}

function cell(text: string): string {
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function row(cells: string[]): string {
  return `| ${cells.map(cell).join(' | ')} |`;
}

function areaIndex(rules: Rule[]): string {
  const rows = rules.map((rule) => row([rule.id, rule.description, rule.useWhen.join('; ')]));
  return [HEADER, '', '| id | description | use_when |', '| --- | --- | --- |', ...rows, ''].join('\n');
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
  if (lines.length === 0) {
    return `${handWritten}\n`;
  }
  const conditional = [...areas.values()]
    .flat()
    .filter((rule) => rule.activation !== undefined)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((rule) => row([rule.id, rule.activation ?? '']));
  const table =
    conditional.length === 0
      ? []
      : ['', '## Capacidades condicionais', '', '| id | activation |', '| --- | --- |', ...conditional];
  return [handWritten, '', ...lines, ...table, ''].join('\n');
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
