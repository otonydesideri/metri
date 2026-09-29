// docs-lint: lint estrutural do source e do projeto. As checagens de cada modo estão no --help.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, normalize, relative, resolve } from 'node:path';
import picomatch from 'picomatch';
import { parse } from 'yaml';
import { linkTargetOf, packageLinks } from './lib/links.ts';
import {
  asList,
  BIN,
  frontmatterOf,
  layoutOf,
  MATRIX,
  PROJECT_INDEX,
  PROJECT_RULES,
  projectFiles,
  ruleFiles,
  sectionItems,
  takeOption,
  TICKETS_DIR,
} from './lib/layout.ts';
import { fieldOf, listOf, parseMatrix } from './lib/matrix.ts';
import { matrixProblems } from './lib/matrix-lint.ts';
import { ticketProblems } from './lib/ticket-lint.ts';

const HELP = `docs-lint: lint estrutural. Roda na raiz (ou em --root <dir>) e detecta o modo:
na raiz do pacote metri, é o source; em qualquer outra, é projeto.

Uso: metri docs-lint [--root <dir>]
Saída: arquivo:linha: mensagem, com o prefixo "aviso:" no aviso. Sai com código 1 só quando há erro.

Nos dois modos:
  - Regras: o frontmatter de cada <área>/<tema>.md (architecture/ no source, .metri/rules/ no projeto):
    - as quatro chaves obrigatórias de VOCABULARY.md (id, description, use_when, status), nenhuma
      chave vazia, nenhuma chave fora dele, status com um valor dele e activation, quando existe, em texto;
    - id igual ao caminho <área>/<tema>;
    - os ids de read_first e not_covered existem ou são destinos project: da lista fechada de
      VOCABULARY.md, e a seção que not_covered cita existe na regra;
    - os arquivos citados em examples existem, e os ids de adr existem: metri:ADR-NNNN nos ADRs globais do pacote,
      ADR-NNNN em docs/adr/ do projeto.
    Arquivos *.examples.md não têm frontmatter e ficam fora dessa checagem. O lint não confere seções do corpo
    nem número de linhas.
  - Gerados: INDEX.md atualizados; o rules-index --check sai com código 1 se algum estiver desatualizado.

Só no source:
  - README: regra (architecture/), skill (skills/, com os formatos de cada uma), agent (agents/) e template
    (cli/templates/) não citam o README.md, que é para humano, nem em frontmatter nem em bloco de código; citação a ele é erro, e o
    texto cita o dono.
  - Citações (em architecture/, adr/, skills/, agents/, cli/templates/, VOCABULARY.md e README.md, fora de
    bloco de código): todo caminho .md citado existe;
    quando o caminho entre crases vem seguido de uma seção entre aspas (\`<arquivo>.md\`, "Seção" ou
    \`<arquivo>.md\` ("Seção")), o arquivo tem esse título, inteiro, até os dois-pontos ou sem o parêntese final;
    toda âncora #... resolve para um título do arquivo. Arquivo do projeto (docs/..., .metri/..., AGENTS.md,
    CONTEXT.md, PRODUCT.md, DESIGN.md, MATRIX.md) não é conferido; node_modules/metri/<caminho> é <caminho> do
    source.
  - Arquivos planejados: cli/docs-lint.planned.json lista cada arquivo que ainda não existe e o que o cria
    (a versão ou o ticket). Citação a arquivo planejado é aviso, não erro; arquivo planejado que já existe é
    erro ("tire da lista"), para a lista não ficar velha.
  - "Como ler": todo id de regra do source aparece em "Como ler" do architecture/INDEX.md.
  - Skills: cada pasta de skills/ tem SKILL.md, com frontmatter: name igual ao nome da pasta e description.
  - Agents: cada agents/<nome>.md tem frontmatter com name igual ao nome do arquivo, description e, quando tem,
    tools não vazio.

Só no projeto:
  - Árvores fechadas (qualquer outro arquivo nelas é erro):
    - docs/: PRODUCT.md, CONTEXT.md, DESIGN.md e adr/NNNN-<slug>.md;
    - .metri/: ARCHITECTURE.md, rules/<área>/<tema>.md (com frontmatter), rules/<área>/<tema>.examples.md,
      rules/<área>/INDEX.md (gerado), MATRIX.md, tickets/<id>.md e tickets/<id>/*.png (evidências).
  - Links: .claude/skills/<nome> para cada skill do pacote, e .claude/agents/<nome>.md para cada agent, apontando
    para node_modules/metri/skills/<nome> e node_modules/metri/agents/<nome>.md (metri init cria).
  - AGENTS.md com mais de 30 linhas: aviso.
  - applies_to sem casamento: glob de regra do projeto ou de "Caminhos do projeto" que não casa com nenhum
    arquivo gera aviso, não erro; a regra é candidata a poda.
  - Tickets e MATRIX citam só ids (UC, T, S, F, ADR-NNNN, id de regra): caminho de arquivo .md neles é erro.
  - MATRIX.md, só o plano:
    - títulos: "# MATRIX" e, nessa ordem, ## Features, ## Slices, ## Fog, ## Gaps, ## Pattern proposals;
    - ids: ### F<n> em Features, ### S<n> em Slices, GAP-<n> e PP-<n> nas listas; sem id repetido;
    - chaves de VOCABULARY.md por bloco (feature: horizon, slices, outcome, ucs, milestone;
      slice: horizon, blocked_by, contract, sot, status), sem chave repetida; valores de horizon dentro do
      permitido; listas em [a, b]; nenhuma chave vazia;
    - obrigatória: horizon na feature;
    - slice now serve a uma feature now (a feature a lista em slices) ou um ticket com ela em slice;
    - slices e blocked_by (da slice) apontam para uma slice que existe na matriz;
    - slice: contract (responsibility, interface, invariants, consumers; planned opcional) ou sot; a de
      fundação, S0, não precisa de nenhum dos dois. O que sot aponta e a slice done: metri sot --help;
    - Gaps: "- GAP-<n> · <texto> → <UC ou T>"; Pattern proposals: "- PP-<n> · de <UC ou T> · <texto> → <destino>".
  - Tickets (.metri/tickets/<id>.md, um UC ou um T; formato: skills/look-across/MATRIX-FORMAT.md,
    "Ticket files"):
    - o nome do arquivo é UC<f>.<n>.md ou T<s>.<n>.md, e o frontmatter id é igual a ele;
    - frontmatter válido: as chaves de VOCABULARY.md (id, title, status e, no UC, feature; no T, slice, type,
      mode e checks sempre; no UC, slice, mode e checks fora de draft), sem chave fora dela nem vazia; status,
      mode, type e sensitive dentro do permitido (status draft só no UC);
    - feature (UC) e slice (T sempre; UC fora de draft) apontam para algo que existe na matriz, com o número
      depois da letra do id batendo com o da feature ou da slice;
    - blocked_by aponta para um ticket ou uma slice que existe;
    - todo UC fora de draft aparece em ucs da feature dele, em MATRIX.md;
    - T: seção "O que entrega" (1 a 3 linhas) e "Critérios" (ao menos um item "- [ ]");
    - ticket done com área frontend/* tem, para cada critério n (os itens "- [ ]" do primeiro nível),
      tickets/<id>/<n>-desktop.png e <n>-mobile.png (frontend/experience); a evidência que a poda da slice tirou
      da árvore conta pelo histórico do git.
  - ADR (docs/adr/NNNN-<slug>.md): "# ADR-NNNN <título>" com o número do arquivo; status accepted ou
    superseded by ADR-NNNN (que existe); area; kind decision, exception ou default-change; as seções Contexto,
    Decisão, Alternativas consideradas, Consequências e Imposto por, nessa ordem.
`;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
const root = resolve(takeOption(args, '--root') ?? '.');
process.chdir(root);

const layout = layoutOf();
// Pastas de regra onde um id é procurado: o projeto primeiro, depois o global do pacote.
const RULE_DIRS = layout.isProject ? [PROJECT_RULES, layout.globalDir] : ['architecture'];
const ARCHITECTURE = 'architecture';
const CITATION_ROOTS = ['architecture', 'adr', 'skills', 'agents', 'cli/templates', 'VOCABULARY.md', 'README.md'];
// Onde o README não é citado: as regras, as skills (com os formatos de cada uma), os agents e os templates.
const NO_README_ROOTS = ['architecture', 'skills', 'agents', 'cli/templates'];
// Prefixo de um arquivo do pacote citado a partir do projeto; no source, é o caminho sem ele.
const PACKAGE_PREFIX = /^node_modules\/metri\//;
const README_CITATION = /`(?:node_modules\/metri\/)?README\.md`/;
const SKILLS = 'skills';
const AGENTS = 'agents';
// Pastas fora da varredura de markdown do source: a fixture de teste é um projeto.
const SKIPPED_DIRS = ['node_modules', '__fixtures__'];
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
  'activation',
];
const STATUSES = ['active', 'draft', 'deprecated'];
const PROJECT_TARGETS = [
  'project:AGENTS',
  'project:CONTEXT',
  'project:PRODUCT',
  'project:DESIGN',
  'project:ARCHITECTURE',
];
// Arquivos do projeto citados pelo nome: moram no projeto, não no source.
const PROJECT_FILES = ['AGENTS.md', 'CLAUDE.md', 'CONTEXT.md', 'PRODUCT.md', 'DESIGN.md', 'MATRIX.md', 'ARCHITECTURE.md'];
const DOCS_FILES = ['docs/PRODUCT.md', 'docs/CONTEXT.md', 'docs/DESIGN.md'];
const METRI_FILES = [PROJECT_INDEX, MATRIX];
const EVIDENCE_DEVICES = ['desktop', 'mobile'];
// Caminho de arquivo .md: ticket e MATRIX citam só ids.
const MD_PATH = /(?<![\w/.-])[\w./-]*[\w-]\.md(?![\w-])/g;
const AGENTS_MAX_LINES = 30;
const ADR_STATUS = /^(accepted|superseded by (ADR-\d{4}))$/;
const ADR_KINDS = ['decision', 'exception', 'default-change'];
const ADR_SECTIONS = ['Contexto', 'Decisão', 'Alternativas consideradas', 'Consequências', 'Imposto por'];

type Problem = { file: string; line: number; message: string; isWarning?: boolean };
type Heading = { text: string; slug: string };

const PLANNED_PATH = 'cli/docs-lint.planned.json';
const planned: Record<string, string> = layout.isProject ? {} : JSON.parse(readFileSync(PLANNED_PATH, 'utf8'));

const problems: Problem[] = [];

function report(file: string, line: number, message: string): void {
  problems.push({ file, line, message });
}

function warn(file: string, line: number, message: string): void {
  problems.push({ file, line, message, isWarning: true });
}

// Os .md de uma pasta, recursivamente; um arquivo .md entra sozinho.
function listMarkdown(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  if (!statSync(dir).isDirectory()) {
    return dir.endsWith('.md') ? [dir] : [];
  }
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        return SKIPPED_DIRS.includes(name) ? [] : listMarkdown(path);
      }
      return name.endsWith('.md') ? [path] : [];
    });
}

function isRuleFile(path: string): boolean {
  const name = path.split('/').at(-1) ?? '';
  return name !== 'INDEX.md' && !name.endsWith('.examples.md');
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
  if (layout.isProject) {
    return [cited, join(dirname(from), cited)].map((candidate) => normalize(candidate));
  }
  const path = cited.replace(PACKAGE_PREFIX, '');
  return [path, join(ARCHITECTURE, path), join(dirname(from), path)].map((candidate) =>
    normalize(candidate),
  );
}

// Resolve o caminho citado: raiz do source, architecture/ e a pasta do arquivo que cita.
// Devolve null para arquivo do projeto, que o source não tem como conferir.
function resolveCitation(from: string, cited: string): string | null | undefined {
  if (!layout.isProject && (/^(docs|\.metri)\//.test(cited) || PROJECT_FILES.includes(cited))) {
    return null;
  }
  return citationCandidates(from, cited).find((candidate) => existsSync(candidate));
}

function plannedBy(from: string, cited: string): string | undefined {
  const match = citationCandidates(from, cited).find((candidate) => candidate in planned);
  return match === undefined ? undefined : planned[match];
}

// Citação: o caminho .md (do source, do pacote em node_modules/metri/ ou do projeto em .metri/), a âncora
// opcional e, depois do caminho entre crases, as seções entre aspas (`x.md`, "A" e "B" ou `x.md` ("A", ...)).
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
        const by = plannedBy(path, cited);
        if (by === undefined) {
          report(path, line, `citação: ${cited} não existe`);
        } else {
          warn(path, line, `citação: ${cited} é arquivo planejado (${by})`);
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

// Caminho da regra com esse id, na primeira pasta de regra que a tem.
function rulePath(id: string): string | undefined {
  return RULE_DIRS.map((dir) => join(dir, `${id}.md`)).find((path) => existsSync(path) && isRuleFile(path));
}

// Pasta de um id de ADR, sem cair de uma na outra: metri:ADR-NNNN é global (adr/ do pacote), ADR-NNNN é do projeto.
function adrDir(id: string): string {
  return id.startsWith('metri:') ? layout.globalAdrDir : 'docs/adr';
}

function adrPath(id: string): string | undefined {
  const number = /^(?:metri:)?ADR-(\d{4})$/.exec(id)?.[1];
  const dir = adrDir(id);
  if (number === undefined || !existsSync(dir)) {
    return undefined;
  }
  const name = readdirSync(dir).find((candidate) => candidate.startsWith(`${number}-`));
  return name ? join(dir, name) : undefined;
}

// Destino de read_first e not_covered: id de regra ou destino project: da lista fechada.
function lintTarget(path: string, line: number, key: string, target: string): void {
  if (target.startsWith('project:')) {
    if (!PROJECT_TARGETS.includes(target)) {
      report(path, line, `${key}: ${target} fora da lista fechada de destinos project:`);
    }
    return;
  }
  if (!rulePath(target)) {
    report(path, line, `${key}: a regra ${target} não existe`);
  }
}

function readFrontmatter(path: string): { frontmatter: Record<string, unknown>; lines: string[] } | undefined {
  const source = readFileSync(path, 'utf8');
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) {
    report(path, 1, 'frontmatter: ausente');
    return undefined;
  }
  try {
    return { frontmatter: parse(match[1]) ?? {}, lines: source.split('\n') };
  } catch (error) {
    report(path, 1, `frontmatter: YAML inválido (${(error as Error).message.split('\n')[0]})`);
    return undefined;
  }
}

function lintFrontmatter(path: string, dir: string): void {
  const read = readFrontmatter(path);
  if (!read) {
    return;
  }
  const { frontmatter, lines } = read;
  for (const key of REQUIRED_KEYS) {
    if (!(key in frontmatter)) {
      report(path, 1, `frontmatter: falta a chave obrigatória ${key}`);
    }
  }
  for (const [key, value] of Object.entries(frontmatter)) {
    const line = keyLine(lines, key);
    if (!KNOWN_KEYS.includes(key)) {
      report(path, line, `frontmatter: chave ${key} fora de VOCABULARY.md`);
    }
    if (isEmpty(value)) {
      report(path, line, `frontmatter: chave ${key} vazia`);
    }
  }
  const expectedId = relative(dir, path).replace(/\.md$/, '');
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
    const targetPath = rulePath(target);
    if (section && targetPath && !hasSection(targetPath, section)) {
      report(path, line, `not_covered: seção "${section}" não existe em ${target}`);
    }
  }
  for (const example of asList(frontmatter.examples)) {
    if (resolveCitation(path, example) === undefined) {
      report(path, keyLine(lines, 'examples'), `examples: ${example} não existe`);
    }
  }
  for (const id of asList(frontmatter.adr)) {
    if (!adrPath(id)) {
      report(path, keyLine(lines, 'adr'), `adr: ${id} não existe em ${adrDir(id)}/`);
    }
  }
  if ('activation' in frontmatter && typeof frontmatter.activation !== 'string') {
    report(path, keyLine(lines, 'activation'), 'frontmatter: activation não é texto');
  }
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
  const result = spawnSync(process.execPath, [BIN, 'rules-index', '--check', '--root', root], { encoding: 'utf8' });
  for (const text of result.stderr.split('\n')) {
    const stale = /^desatualizado: (.+)$/.exec(text)?.[1];
    if (stale) {
      report(stale, 1, 'rules-index:check: desatualizado (rode pnpm rules-index)');
    }
  }
  if (result.status !== 0 && !problems.some(({ message }) => message.startsWith('rules-index:check'))) {
    report(layout.rootIndex, 1, `rules-index:check: falhou (${result.stderr.trim()})`);
  }
}

// Toda linha conta, inclusive frontmatter e bloco de código: o README é para humano.
function lintReadmeCitations(path: string): void {
  const source = readFileSync(path, 'utf8');
  if (source.startsWith(GENERATED_HEADER)) {
    return;
  }
  source.split('\n').forEach((text, index) => {
    if (README_CITATION.test(text)) {
      report(path, index + 1, 'citação: regra e skill não citam o README.md, que é para humano (cite o dono)');
    }
  });
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

// Cada pasta de skills/ tem SKILL.md, com name igual ao nome da pasta e description no frontmatter.
function lintSkills(): void {
  if (!existsSync(SKILLS)) {
    return;
  }
  for (const name of readdirSync(SKILLS).sort()) {
    const dir = join(SKILLS, name);
    if (!statSync(dir).isDirectory()) {
      continue;
    }
    const path = join(dir, 'SKILL.md');
    if (!existsSync(path)) {
      report(dir, 1, 'skill: pasta sem SKILL.md');
      continue;
    }
    const read = readFrontmatter(path);
    if (!read) {
      continue;
    }
    const { frontmatter, lines } = read;
    if (frontmatter.name !== name) {
      report(path, keyLine(lines, 'name'), `skill: name ${String(frontmatter.name)} diferente da pasta ${name}`);
    }
    if (typeof frontmatter.description !== 'string' || frontmatter.description.trim() === '') {
      report(path, keyLine(lines, 'description'), 'skill: falta a description');
    }
  }
}

// Cada agents/<nome>.md tem name igual ao nome do arquivo, description e, quando tem, tools não vazio.
function lintAgentFiles(): void {
  for (const name of existsSync(AGENTS) ? readdirSync(AGENTS).filter((file) => file.endsWith('.md')).sort() : []) {
    const path = join(AGENTS, name);
    const read = readFrontmatter(path);
    if (!read) {
      continue;
    }
    const { frontmatter, lines } = read;
    const expected = name.replace(/\.md$/, '');
    if (frontmatter.name !== expected) {
      report(path, keyLine(lines, 'name'), `agent: name ${String(frontmatter.name)} diferente do arquivo ${expected}`);
    }
    if (typeof frontmatter.description !== 'string' || frontmatter.description.trim() === '') {
      report(path, keyLine(lines, 'description'), 'agent: falta a description');
    }
    if ('tools' in frontmatter && isEmpty(frontmatter.tools)) {
      report(path, keyLine(lines, 'tools'), 'agent: tools vazio (sem a chave, o agent herda as ferramentas da sessão)');
    }
  }
}

function lintSource(): void {
  const rules = ruleFiles(ARCHITECTURE);
  for (const path of rules) {
    lintFrontmatter(path, ARCHITECTURE);
  }
  for (const path of CITATION_ROOTS.flatMap(listMarkdown)) {
    lintCitations(path);
  }
  for (const path of NO_README_ROOTS.flatMap(listMarkdown)) {
    lintReadmeCitations(path);
  }
  lintReadingOrder(rules);
  lintSkills();
  lintAgentFiles();
  lintPlanned();
  lintGenerated();
}

function lintDocsTree(): void {
  for (const path of existsSync('docs') ? projectFiles('docs') : []) {
    if (DOCS_FILES.includes(path)) {
      continue;
    }
    if (/^docs\/adr\/\d{4}-[a-z0-9-]+\.md$/.test(path)) {
      lintAdr(path);
    } else {
      report(path, 1, 'árvore de docs/: arquivo fora da lista fechada (docs-lint --help)');
    }
  }
}

function lintMetriTree(): void {
  for (const path of existsSync('.metri') ? projectFiles('.metri') : []) {
    if (METRI_FILES.includes(path)) {
      continue;
    }
    if (/^\.metri\/rules\/[^/]+\/INDEX\.md$/.test(path)) {
      if (!readFileSync(path, 'utf8').startsWith(GENERATED_HEADER)) {
        report(path, 1, `árvore de .metri/: INDEX de área é gerado ("${GENERATED_HEADER}")`);
      }
    } else if (/^\.metri\/rules\/[^/]+\/[a-z0-9-]+\.examples\.md$/.test(path)) {
      continue; // exemplos de regra não têm frontmatter.
    } else if (/^\.metri\/rules\/[^/]+\/[a-z0-9-]+\.md$/.test(path)) {
      lintFrontmatter(path, PROJECT_RULES);
    } else if (/^\.metri\/tickets\/[^/]+\.md$/.test(path)) {
      continue; // checado em lintTickets, que também confere o nome do arquivo.
    } else if (/^\.metri\/tickets\/(?:UC|T)\d+\.\d+\/[^/]+\.png$/.test(path)) {
      continue;
    } else {
      report(path, 1, 'árvore de .metri/: arquivo fora da lista fechada (docs-lint --help)');
    }
  }
}

// .claude/skills/<nome> e .claude/agents/<nome>.md: um link para cada skill e agent do pacote.
function lintLinks(): void {
  for (const { path, target } of packageLinks()) {
    const current = linkTargetOf(path);
    if (current === undefined) {
      report(path, 1, `link: falta o link para ${target} (rode metri init)`);
    } else if (current !== target) {
      report(path, 1, `link: aponta para ${current}, não para ${target} (rode metri init)`);
    }
  }
}

// Ticket e MATRIX citam só ids: caminho de arquivo .md neles é erro.
function lintIdsOnly(path: string): void {
  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((text, index) => {
      for (const [cited] of text.matchAll(MD_PATH)) {
        report(path, index + 1, `citação: ${cited} é caminho de arquivo; ticket e MATRIX citam só ids (UC, T, S, F, ADR-NNNN, id de regra)`);
      }
    });
}

// Ids da feature (F<n>) e da slice (S<n>) presentes na matriz, e o valor de "ucs" de cada feature.
function matrixIds(matrixSource: string): {
  featureIds: Set<string>;
  sliceIds: Set<string>;
  featureUcs: Map<string, string[]>;
  featureSlices: Map<string, string[]>;
} {
  const matrix = parseMatrix(matrixSource);
  const featureIds = new Set(matrix.blocks.filter((block) => block.kind === 'feature').map((block) => block.id));
  const sliceIds = new Set(matrix.blocks.filter((block) => block.kind === 'slice').map((block) => block.id));
  const featureUcs = new Map<string, string[]>();
  const featureSlices = new Map<string, string[]>();
  for (const block of matrix.blocks.filter((block) => block.kind === 'feature')) {
    featureUcs.set(block.id, listOf(fieldOf(block, 'ucs')?.value ?? '') ?? []);
    featureSlices.set(block.id, listOf(fieldOf(block, 'slices')?.value ?? '') ?? []);
  }
  return { featureIds, sliceIds, featureUcs, featureSlices };
}

// Tickets (.metri/tickets/<id>.md): frontmatter, corpo e referências para a MATRIX.
function lintTickets(): void {
  const matrixSource = existsSync(MATRIX) ? readFileSync(MATRIX, 'utf8') : '';
  const { featureIds, sliceIds, featureUcs, featureSlices } = matrixIds(matrixSource);
  const files = existsSync(TICKETS_DIR)
    ? readdirSync(TICKETS_DIR)
        .filter((name) => name.endsWith('.md'))
        .sort()
    : [];
  const ticketIds = new Set(files.map((name) => name.replace(/\.md$/, '')));
  const collapsed = new Set(
    parseMatrix(matrixSource)
      .blocks.filter((block) => block.kind === 'slice' && fieldOf(block, 'status')?.value === 'done')
      .map((block) => block.id),
  );
  const servedSlices = new Set([...featureSlices.values()].flat());
  for (const name of files) {
    const path = join(TICKETS_DIR, name);
    const expectedId = name.replace(/\.md$/, '');
    const source = readFileSync(path, 'utf8');
    lintIdsOnly(path);
    const problems = ticketProblems(path, source, expectedId, { featureIds, sliceIds, ticketIds, featureUcs });
    for (const { line, message } of problems) {
      report(path, line, message);
    }
    const frontmatter = frontmatterOf(source);
    if (typeof frontmatter?.slice === 'string') {
      servedSlices.add(frontmatter.slice);
    }
    if (!collapsed.has(String(frontmatter?.slice))) {
      lintEvidence(path, expectedId, frontmatter, source);
    }
  }
  const matrix = parseMatrix(matrixSource);
  for (const block of matrix.blocks) {
    if (block.kind === 'slice' && fieldOf(block, 'horizon')?.value === 'now' && !servedSlices.has(block.id)) {
      report(MATRIX, block.line, `${block.id}: slice now que nenhuma feature now serve (slices da feature ou slice de um ticket)`);
    }
  }
}

// Ticket done de frontend tem, por critério, a evidência em desktop e em mobile (frontend/experience).
function lintEvidence(path: string, id: string, frontmatter: Record<string, unknown> | undefined, source: string): void {
  const isFrontend = asList(frontmatter?.areas).some((area) => area.startsWith('frontend/'));
  if (frontmatter?.status !== 'done' || !isFrontend) {
    return;
  }
  topLevelCriteria(source).forEach((line, index) => {
    for (const device of EVIDENCE_DEVICES) {
      const evidence = `${TICKETS_DIR}/${id}/${index + 1}-${device}.png`;
      if (!existsSync(evidence) && !isInGitHistory(evidence)) {
        report(path, line, `evidência: falta ${evidence} (frontend/experience)`);
      }
    }
  });
}

// Linha de cada critério do primeiro nível ("- [ ]" ou "- [x]" sem recuo) da seção "Critérios".
function topLevelCriteria(source: string): number[] {
  const lines = source.split('\n');
  const start = lines.indexOf('## Critérios');
  const result: number[] = [];
  for (let index = start + 1; start !== -1 && index < lines.length && !lines[index].startsWith('## '); index++) {
    if (/^- \[[ xX]\] /.test(lines[index])) {
      result.push(index + 1);
    }
  }
  return result;
}

// A evidência podada saiu da árvore, mas continua no histórico do git.
function isInGitHistory(path: string): boolean {
  const result = spawnSync('git', ['log', '-1', '--format=%h', '--', path], { encoding: 'utf8' });
  return result.status === 0 && result.stdout.trim() !== '';
}

function lintAgents(): void {
  if (!existsSync('AGENTS.md')) {
    return;
  }
  const count = readFileSync('AGENTS.md', 'utf8').trimEnd().split('\n').length;
  if (count > AGENTS_MAX_LINES) {
    warn('AGENTS.md', 1, `AGENTS.md com ${count} linhas, mais de ${AGENTS_MAX_LINES}`);
  }
}

function lintAdr(path: string): void {
  const lines = readFileSync(path, 'utf8').split('\n');
  const number = basename(path).slice(0, 4);
  if (!new RegExp(`^# ADR-${number} \\S`).test(lines[0] ?? '')) {
    report(path, 1, `ADR: a primeira linha é "# ADR-${number} <título>"`);
  }
  const firstSection = lines.findIndex((text) => text.startsWith('## '));
  const header = lines.slice(0, firstSection === -1 ? undefined : firstSection);
  const field = (key: string) => {
    const index = header.findIndex((text) => text.startsWith(`${key}: `));
    return index === -1 ? undefined : { value: header[index].slice(key.length + 2).trim(), line: index + 1 };
  };
  const status = field('status');
  const statusMatch = status && ADR_STATUS.exec(status.value);
  if (!status || !statusMatch) {
    report(path, status?.line ?? 1, 'ADR: status accepted ou superseded by ADR-NNNN');
  } else if (statusMatch[2] && !adrPath(statusMatch[2])) {
    report(path, status.line, `ADR: ${statusMatch[2]} não existe em ${adrDir(statusMatch[2])}/`);
  }
  if (!field('area')) {
    report(path, 1, 'ADR: falta area');
  }
  const kind = field('kind');
  if (!kind || !ADR_KINDS.includes(kind.value)) {
    report(path, kind?.line ?? 1, `ADR: kind ${ADR_KINDS.join(' | ')}`);
  }
  const sections = lines.filter((text) => text.startsWith('## ')).map((text) => text.slice(3).trim());
  if (sections.join('|') !== ADR_SECTIONS.join('|')) {
    report(path, firstSection + 1 || 1, `ADR: seções ${ADR_SECTIONS.join(', ')}, nessa ordem`);
  }
}

function lintMatrix(): void {
  if (!existsSync(MATRIX)) {
    return;
  }
  lintIdsOnly(MATRIX);
  for (const { line, message } of matrixProblems(readFileSync(MATRIX, 'utf8'))) {
    report(MATRIX, line, message);
  }
}

// Glob de regra do projeto ou de "Caminhos do projeto" que não casa com nenhum arquivo: candidata a poda.
function lintAppliesTo(): void {
  const files = projectFiles();
  const globs: { glob: string; file: string; line: number }[] = [];
  for (const path of ruleFiles(PROJECT_RULES)) {
    const source = readFileSync(path, 'utf8');
    let frontmatter: Record<string, unknown> | undefined;
    try {
      frontmatter = frontmatterOf(source);
    } catch {
      continue; // YAML inválido já sai como erro na checagem do frontmatter.
    }
    for (const glob of asList(frontmatter?.applies_to)) {
      globs.push({ glob, file: path, line: keyLine(source.split('\n'), 'applies_to') });
    }
  }
  if (existsSync(PROJECT_INDEX)) {
    for (const { text, line } of sectionItems(readFileSync(PROJECT_INDEX, 'utf8'), 'Caminhos do projeto')) {
      const glob = /^`?(.+?)`? → /.exec(text)?.[1];
      if (glob) {
        globs.push({ glob, file: PROJECT_INDEX, line });
      }
    }
  }
  for (const { glob, file, line } of globs) {
    const isMatch = picomatch(glob, { dot: true });
    if (!files.some((path) => isMatch(path))) {
      warn(file, line, `applies_to: ${glob} não casa com nenhum arquivo (candidata a poda)`);
    }
  }
}

function lintProject(): void {
  lintDocsTree();
  lintMetriTree();
  lintLinks();
  lintAgents();
  lintMatrix();
  lintTickets();
  lintAppliesTo();
  lintGenerated();
}

if (layout.isProject) {
  lintProject();
} else {
  lintSource();
}

for (const { file, line, message, isWarning } of problems) {
  console.log(`${file}:${line}: ${isWarning ? 'aviso: ' : ''}${message}`);
}
process.exit(problems.some(({ isWarning }) => !isWarning) ? 1 : 0);
