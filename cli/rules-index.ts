// rules-index: gera o INDEX.md de cada área a partir do frontmatter das regras e, abaixo do marcador do índice
// raiz, a lista de áreas e a tabela "Capacidades condicionais" das regras com activation.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parse } from 'yaml';
import { layoutOf, takeOption } from './lib/layout.ts';

const HELP = `rules-index: gera os INDEX.md das regras a partir do frontmatter.

Uso: metri rules-index [--root <dir>] [--check]

- No source: architecture/<área>/INDEX.md e, abaixo do marcador <!-- rules-index --> de architecture/INDEX.md,
  a lista de áreas e a tabela "Capacidades condicionais" (as regras com activation).
- No projeto: .metri/rules/<área>/INDEX.md e, abaixo do marcador de .metri/ARCHITECTURE.md, o mesmo.
- --check não escreve nada e sai com código 1 se algum INDEX estiver desatualizado.
`;

const HEADER = 'Gerado por rules-index. Não edite.';
const MARKER = '<!-- rules-index -->';

type Rule = { id: string; description: string; useWhen: string[]; activation?: string };

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
const isCheck = args.includes('--check');
process.chdir(resolve(takeOption(args, '--root') ?? '.'));
const layout = layoutOf();
const rulesDir = layout.projectDir ?? layout.globalDir;
const rootPath = layout.rootIndex;

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
    throw new Error(`${rootPath}: sem o marcador ${MARKER}`);
  }
  const handWritten = current.slice(0, markerAt + MARKER.length);
  const lines = [...areas].map(([area, rules]) => {
    const count = rules.length === 1 ? '1 regra' : `${rules.length} regras`;
    const link = relative(dirname(rootPath), join(rulesDir, area, 'INDEX.md'));
    return `- \`${area}\` → \`${link}\` (${count})`;
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
for (const area of existsSync(rulesDir) ? readdirSync(rulesDir).sort() : []) {
  const dir = join(rulesDir, area);
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

const expected = new Map<string, string>();
for (const [area, rules] of areas) {
  expected.set(join(rulesDir, area, 'INDEX.md'), areaIndex(rules));
}
if (existsSync(rootPath) || areas.size > 0) {
  expected.set(rootPath, rootIndex(existsSync(rootPath) ? readFileSync(rootPath, 'utf8') : '', areas));
}

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
