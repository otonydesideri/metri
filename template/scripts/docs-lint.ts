// docs-lint: lint estrutural do source (METHODOLOGY 6.13).
// Checa o frontmatter das regras, as citações em architecture/, methodology/ e adr/,
// a presença de cada regra em "Como ler" do architecture/INDEX.md e o rules-index:check.
// Uso: docs-lint   (roda na raiz do source)
// Saída: arquivo:linha: mensagem (aviso com o prefixo "aviso:"). Sai com código 1 se houver erro.
// Arquivo planejado (docs-lint.planned.json, arquivo → passo do SETUP que o cria): citação a ele é aviso;
// arquivo planejado que já existe é erro, para a lista não ficar velha.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { parse } from 'yaml';

const ARCHITECTURE = 'architecture';
const CITATION_ROOTS = ['architecture', 'methodology', 'adr'];
const GENERATED_HEADER = 'Gerado por rules-index. Não edite.';
const REQUIRED_KEYS = ['id', 'description', 'use_when', 'status'];
const KNOWN_KEYS = [
  ...REQUIRED_KEYS,
  'read_first',
  'not_covered',
  'applies_to',
  'enforced_by',
  'keywords',
  'examples',
  'adr',
];
const STATUSES = ['active', 'draft', 'deprecated'];
const PROJECT_TARGETS = [
  'project:AGENTS',
  'project:CONTEXT',
  'project:PRODUCT',
  'project:DESIGN',
  'project:architecture/INDEX',
];
// Arquivos do projeto citados pelo nome: moram no projeto, não no source.
const PROJECT_FILES = ['AGENTS.md', 'CLAUDE.md', 'CONTEXT.md', 'PRODUCT.md', 'DESIGN.md', 'MATRIX.md'];

type Problem = { file: string; line: number; message: string; isWarning?: boolean };
type Heading = { text: string; slug: string };

const PLANNED_PATH = 'template/scripts/docs-lint.planned.json';
const planned: Record<string, string> = JSON.parse(readFileSync(PLANNED_PATH, 'utf8'));

const problems: Problem[] = [];

function report(file: string, line: number, message: string): void {
  problems.push({ file, line, message });
}

function warn(file: string, line: number, message: string): void {
  problems.push({ file, line, message, isWarning: true });
}

function listMarkdown(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        return listMarkdown(path);
      }
      return name.endsWith('.md') ? [path] : [];
    });
}

function isRuleFile(path: string): boolean {
  const name = path.split('/').at(-1) ?? '';
  return name !== 'INDEX.md' && !name.endsWith('.examples.md');
}

function ruleFiles(): string[] {
  return readdirSync(ARCHITECTURE)
    .sort()
    .filter((area) => statSync(join(ARCHITECTURE, area)).isDirectory())
    .flatMap((area) =>
      readdirSync(join(ARCHITECTURE, area))
        .sort()
        .filter((name) => name.endsWith('.md'))
        .map((name) => join(ARCHITECTURE, area, name))
        .filter(isRuleFile),
    );
}

// Linhas fora do frontmatter e de bloco de código cercado, com o número de cada uma.
function proseLines(source: string): { text: string; line: number }[] {
  const lines = source.split('\n');
  const result: { text: string; line: number }[] = [];
  const frontmatterEnd = lines[0] === '---' ? lines.indexOf('---', 1) : -1;
  let isFenced = false;
  lines.forEach((text, index) => {
    if (index <= frontmatterEnd) {
      return;
    }
    if (/^\s*(```|~~~)/.test(text)) {
      isFenced = !isFenced;
      return;
    }
    if (!isFenced) {
      result.push({ text, line: index + 1 });
    }
  });
  return result;
}

function slugOf(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .replaceAll(' ', '-');
}

const headingsCache = new Map<string, Heading[]>();

function headingsOf(path: string): Heading[] {
  const cached = headingsCache.get(path);
  if (cached) {
    return cached;
  }
  const seen = new Map<string, number>();
  const headings = proseLines(readFileSync(path, 'utf8'))
    .map(({ text }) => /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(text)?.[1])
    .filter((text): text is string => text !== undefined)
    .map((text) => {
      const base = slugOf(text);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      return { text, slug: count === 0 ? base : `${base}-${count}` };
    });
  headingsCache.set(path, headings);
  return headings;
}

// A seção citada é o título inteiro, o trecho antes dos dois-pontos ou o título sem o parêntese final.
function hasSection(path: string, section: string): boolean {
  const wanted = section.replaceAll('`', '');
  return headingsOf(path).some(({ text }) => {
    const plain = text.replaceAll('`', '');
    return plain === wanted || plain.startsWith(`${wanted}:`) || plain.startsWith(`${wanted} (`);
  });
}

function hasAnchor(path: string, anchor: string): boolean {
  return headingsOf(path).some(({ slug }) => slug === anchor);
}

function citationCandidates(from: string, cited: string): string[] {
  const path = cited.replace(/^\.metri\//, '');
  return [path, join(ARCHITECTURE, path), join(dirname(from), path)].map((candidate) =>
    normalize(candidate),
  );
}

// Resolve o caminho citado: raiz do source, architecture/ e a pasta do arquivo que cita.
// Devolve null para arquivo do projeto, que o source não tem como conferir.
function resolveCitation(from: string, cited: string): string | null | undefined {
  const path = cited.replace(/^\.metri\//, '');
  if (path.startsWith('docs/') || PROJECT_FILES.includes(path)) {
    return null;
  }
  return citationCandidates(from, cited).find((candidate) => existsSync(candidate));
}

function plannedStep(from: string, cited: string): string | undefined {
  const match = citationCandidates(from, cited).find((candidate) => candidate in planned);
  return match === undefined ? undefined : planned[match];
}

// Citação: o caminho .md (com ou sem o prefixo .metri/), a âncora opcional e, depois do caminho entre crases,
// as seções entre aspas
// (`x.md`, "A" e "B" ou `x.md` ("A", ...)).
const CITATION =
  /(?<![\w./<>*{}-])(`?)((?:\.metri\/)?[A-Za-z0-9_][\w./-]*\.md)(#[\w-]+)?(`?)((?:(?:,| e|,? \(|) ?"[^"]+")*)/g;

// Fora de crase, só conta o que tem cara de caminho: pasta, âncora ou arquivo de exemplos.
// O resto é prosa que termina em .md (o nome de um site, por exemplo).
function isPathLike(cited: string, anchor: string | undefined): boolean {
  return cited.includes('/') || anchor !== undefined || cited.endsWith('.examples.md');
}

function lintCitations(path: string): void {
  const source = readFileSync(path, 'utf8');
  if (source.startsWith(GENERATED_HEADER)) {
    return;
  }
  for (const { text, line } of proseLines(source)) {
    for (const match of text.matchAll(CITATION)) {
      const [, openingTick, cited, anchor, closingTick, sectionList] = match;
      if (!openingTick && !isPathLike(cited, anchor)) {
        continue;
      }
      const target = resolveCitation(path, cited);
      if (target === null) {
        continue;
      }
      if (target === undefined) {
        const step = plannedStep(path, cited);
        if (step === undefined) {
          report(path, line, `citação: ${cited} não existe`);
        } else {
          warn(path, line, `citação: ${cited} é arquivo planejado (passo ${step} do SETUP)`);
        }
        continue;
      }
      if (anchor && !hasAnchor(target, anchor.slice(1))) {
        report(path, line, `âncora: ${cited}${anchor} não resolve`);
      }
      // A seção só conta quando vem logo depois do caminho entre crases.
      if (!openingTick || !closingTick || !sectionList) {
        continue;
      }
      for (const [, section] of sectionList.matchAll(/"([^"]+)"/g)) {
        if (!hasSection(target, section)) {
          report(path, line, `seção: ${cited}, "${section}" não existe`);
        }
      }
    }
  }
}

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

function ruleExists(id: string): boolean {
  return existsSync(join(ARCHITECTURE, `${id}.md`)) && isRuleFile(`${id}.md`);
}

function adrExists(id: string): boolean {
  const number = /^ADR-(\d{4})$/.exec(id)?.[1];
  return number !== undefined && readdirSync('adr').some((name) => name.startsWith(`${number}-`));
}

// Destino de read_first e not_covered: id de regra ou destino project: da lista fechada.
function lintTarget(path: string, line: number, key: string, target: string): void {
  if (target.startsWith('project:')) {
    if (!PROJECT_TARGETS.includes(target)) {
      report(path, line, `${key}: ${target} fora da lista fechada de destinos project:`);
    }
    return;
  }
  if (!ruleExists(target)) {
    report(path, line, `${key}: a regra ${target} não existe`);
  }
}

function lintFrontmatter(path: string): void {
  const source = readFileSync(path, 'utf8');
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) {
    report(path, 1, 'frontmatter: ausente');
    return;
  }
  const lines = source.split('\n');
  let frontmatter: Record<string, unknown>;
  try {
    frontmatter = parse(match[1]) ?? {};
  } catch (error) {
    report(path, 1, `frontmatter: YAML inválido (${(error as Error).message.split('\n')[0]})`);
    return;
  }
  for (const key of REQUIRED_KEYS) {
    if (!(key in frontmatter)) {
      report(path, 1, `frontmatter: falta a chave obrigatória ${key}`);
    }
  }
  for (const [key, value] of Object.entries(frontmatter)) {
    const line = keyLine(lines, key);
    if (!KNOWN_KEYS.includes(key)) {
      report(path, line, `frontmatter: chave ${key} fora da seção 4.3`);
    }
    if (isEmpty(value)) {
      report(path, line, `frontmatter: chave ${key} vazia`);
    }
  }
  const expectedId = relative(ARCHITECTURE, path).replace(/\.md$/, '');
  if (frontmatter.id !== expectedId) {
    report(path, keyLine(lines, 'id'), `frontmatter: id ${String(frontmatter.id)} diferente do caminho ${expectedId}`);
  }
  if (typeof frontmatter.status === 'string' && !STATUSES.includes(frontmatter.status)) {
    report(path, keyLine(lines, 'status'), `frontmatter: status ${frontmatter.status} fora de ${STATUSES.join(' | ')}`);
  }
  for (const target of asList(frontmatter.read_first)) {
    lintTarget(path, keyLine(lines, 'read_first'), 'read_first', target);
  }
  for (const entry of asList(frontmatter.not_covered)) {
    const line = keyLine(lines, 'not_covered');
    const parts = /^.+?(?: \("([^"]+)"\))? → (\S+)$/.exec(entry);
    if (!parts) {
      report(path, line, `not_covered: "${entry}" fora do formato <tema> → <id>`);
      continue;
    }
    const [, section, target] = parts;
    lintTarget(path, line, 'not_covered', target);
    if (section && ruleExists(target) && !hasSection(join(ARCHITECTURE, `${target}.md`), section)) {
      report(path, line, `not_covered: seção "${section}" não existe em ${target}`);
    }
  }
  for (const example of asList(frontmatter.examples)) {
    if (resolveCitation(path, example) === undefined) {
      report(path, keyLine(lines, 'examples'), `examples: ${example} não existe`);
    }
  }
  for (const id of asList(frontmatter.adr)) {
    if (!adrExists(id)) {
      report(path, keyLine(lines, 'adr'), `adr: ${id} não existe em adr/`);
    }
  }
}

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function lintReadingOrder(rules: string[]): void {
  const indexPath = join(ARCHITECTURE, 'INDEX.md');
  const lines = readFileSync(indexPath, 'utf8').split('\n');
  const start = lines.findIndex((text) => text === '## Como ler');
  if (start === -1) {
    report(indexPath, 1, 'Como ler: seção ausente');
    return;
  }
  const end = lines.findIndex((text, index) => index > start && text.startsWith('## '));
  const section = lines.slice(start, end === -1 ? undefined : end).join('\n');
  for (const path of rules) {
    const id = relative(ARCHITECTURE, path).replace(/\.md$/, '');
    if (!section.includes(`\`${id}.md\``)) {
      report(indexPath, start + 1, `Como ler: a regra ${id} não aparece`);
    }
  }
}

function lintGenerated(): void {
  const result = spawnSync(
    process.execPath,
    [...process.execArgv, 'template/scripts/rules-index.ts', '--check'],
    { encoding: 'utf8' },
  );
  for (const text of result.stderr.split('\n')) {
    const stale = /^desatualizado: (.+)$/.exec(text)?.[1];
    if (stale) {
      report(stale, 1, 'rules-index:check: desatualizado (rode pnpm rules-index)');
    }
  }
  if (result.status !== 0 && !problems.some(({ message }) => message.startsWith('rules-index:check'))) {
    report('template/scripts/rules-index.ts', 1, `rules-index:check: falhou (${result.stderr.trim()})`);
  }
}

function lintPlanned(): void {
  const lines = readFileSync(PLANNED_PATH, 'utf8').split('\n');
  for (const path of Object.keys(planned)) {
    if (existsSync(path)) {
      const index = lines.findIndex((text) => text.includes(`"${path}"`));
      report(PLANNED_PATH, index + 1, `planejado: ${path} já existe, tire da lista`);
    }
  }
}

const rules = ruleFiles();
for (const path of rules) {
  lintFrontmatter(path);
}
for (const path of CITATION_ROOTS.flatMap(listMarkdown)) {
  lintCitations(path);
}
lintReadingOrder(rules);
lintPlanned();
lintGenerated();

for (const { file, line, message, isWarning } of problems) {
  console.log(`${file}:${line}: ${isWarning ? 'aviso: ' : ''}${message}`);
}
process.exit(problems.some(({ isWarning }) => !isWarning) ? 1 : 0);
