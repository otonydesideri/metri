// rules-for: devolve as regras que valem para caminhos ou para um ticket, sem o conteúdo delas.
// A explicação completa está no --help.
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import picomatch from 'picomatch';
import {
  asList,
  frontmatterOf,
  layoutOf,
  PROJECT_INDEX,
  projectFiles,
  ruleFiles,
  sectionItems,
  takeOption,
  TICKETS_DIR,
} from './lib/layout.ts';

const HELP = `rules-for: lista as regras de arquitetura que valem para caminhos ou para um ticket.

Uso:
  rules-for <caminho | glob>...         regras dos arquivos
  rules-for --ticket <UC<f>.<n> | T<s>.<n>>   regras do ticket: um UC (o tracer) ou um ticket T
  rules-for ... --root <dir>            outra raiz (padrão: a pasta atual)

Modo:
  - Com .metri/ na raiz, é projeto: regras globais em .metri/architecture/, do projeto em docs/architecture/.
  - Sem .metri/, é o source: regras em architecture/.

Entrada:
  - Caminho: relativo à raiz. Casa com o applies_to das regras globais e das do projeto, e com a seção
    "Caminhos do projeto" do docs/architecture/INDEX.md ("- <glob> → <id>"), que soma o glob ao applies_to da regra.
    Caminho que depende de decisão de projeto (ex.: o pacote do contrato de API) não entra no applies_to global:
    fica em "Caminhos do projeto".
  - Glob: expandido contra os arquivos da raiz (fora de node_modules, .git e .metri); glob sem arquivo gera aviso.
  - --ticket: lê o frontmatter de docs/plan/tickets/<id>.md (um UC ou um ticket T) e usa os ids de "areas".
  - Nos dois casos, entram também as regras de read_first, em cadeia. Destino project: sai numa linha "ler antes:".

Capacidades condicionais:
  - No projeto, regra com activation só entra se o id dela estiver em "Capacidades ativas" do
    docs/architecture/INDEX.md ("- <id>: <valores>"). As que ficam de fora saem numa linha de aviso.
  - No source, todas entram.

Saída (não imprime o conteúdo das regras):
  - Uma linha por regra: "<id> — <description> (<caminho>)", as do projeto primeiro, cada grupo em ordem de id.
  - Depois, as linhas de "Exceções e defaults trocados" do INDEX do projeto que citam algum id devolvido,
    com o prefixo "exceção:".
  - Avisos com o prefixo "aviso:". Mais de 5 regras gera o aviso "ticket grande demais ou applies_to largo";
    não é erro.

Erros (saem com código 1, prefixo "erro:"):
  - Id de regra do projeto igual a id global, a não ser que "Exceções e defaults trocados" declare a
    substituição: "- <id> substituída pela regra do projeto → ADR-NNNN" (a linha cita o id, "substitu" e o
    ADR). Declarada, a regra do projeto entra no lugar da global.
  - Ticket cujo arquivo não existe, ticket sem "areas" e chamada sem caminho nem ticket.
`;

const BUDGET = 5;

type Rule = {
  id: string;
  path: string;
  description: string;
  appliesTo: string[];
  readFirst: string[];
  isConditional: boolean;
  isProject: boolean;
};

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}

const lines: string[] = [];
const warnings: string[] = [];

function fail(message: string): never {
  console.log(`erro: ${message}`);
  process.exit(1);
}

let root: string;
let ticket: string | undefined;
try {
  root = resolve(takeOption(args, '--root') ?? '.');
  ticket = takeOption(args, '--ticket');
} catch (error) {
  fail((error as Error).message);
}
const inputs = args.map((arg) => (isAbsolute(arg) ? relative(root, arg) : arg).replace(/^\.\//, ''));
if (inputs.length === 0 && ticket === undefined) {
  fail('informe caminhos ou --ticket <id> (veja --help)');
}
process.chdir(root);

const layout = layoutOf();
const indexSource = layout.isProject && existsSync(PROJECT_INDEX) ? readFileSync(PROJECT_INDEX, 'utf8') : '';
const exceptions = sectionItems(indexSource, 'Exceções e defaults trocados').map(({ text }) => text);
const activeIds = new Set(
  sectionItems(indexSource, 'Capacidades ativas')
    .map(({ text }) => /^`?([\w-]+\/[\w-]+)`?:/.exec(text)?.[1])
    .filter((id): id is string => id !== undefined),
);

function mentions(text: string, id: string): boolean {
  return new RegExp(`(?<![\\w/-])${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w/-])`).test(text);
}

function readRules(dir: string | undefined, isProject: boolean): Rule[] {
  if (dir === undefined) {
    return [];
  }
  return ruleFiles(dir).flatMap((path) => {
    const frontmatter = frontmatterOf(readFileSync(path, 'utf8'));
    if (typeof frontmatter?.id !== 'string') {
      warnings.push(`${path} sem frontmatter com id; rode docs-lint`);
      return [];
    }
    return [
      {
        id: frontmatter.id,
        path,
        description: String(frontmatter.description ?? ''),
        appliesTo: asList(frontmatter.applies_to),
        readFirst: asList(frontmatter.read_first),
        isConditional: typeof frontmatter.activation === 'string',
        isProject,
      },
    ];
  });
}

const globalRules = readRules(layout.globalDir, false);
const projectRules = readRules(layout.projectDir, true);
const globalIds = new Set(globalRules.map(({ id }) => id));
const replaced = new Set<string>();
for (const rule of projectRules.filter(({ id }) => globalIds.has(id))) {
  const isDeclared = exceptions.some(
    (text) => mentions(text, rule.id) && /substitu/i.test(text) && /ADR-\d{4}/.test(text),
  );
  if (!isDeclared) {
    fail(
      `${rule.path}: o id ${rule.id} já é regra global; para substituí-la, declare em "Exceções e defaults trocados" do ${PROJECT_INDEX}: - ${rule.id} substituída pela regra do projeto → ADR-NNNN`,
    );
  }
  replaced.add(rule.id);
}
const rules = new Map<string, Rule>();
for (const rule of [...globalRules.filter(({ id }) => !replaced.has(id)), ...projectRules]) {
  rules.set(rule.id, rule);
}

for (const { text } of sectionItems(indexSource, 'Caminhos do projeto')) {
  const match = /^`?(.+?)`? → `?([\w-]+\/[\w-]+)`?$/.exec(text);
  const rule = match ? rules.get(match[2]) : undefined;
  if (!match || !rule) {
    warnings.push(`"Caminhos do projeto": ${text} não aponta para uma regra`);
    continue;
  }
  rule.appliesTo.push(match[1]);
}

const selected = new Set<string>();

function selectFile(file: string): void {
  for (const rule of rules.values()) {
    if (rule.appliesTo.length > 0 && picomatch(rule.appliesTo, { dot: true })(file)) {
      selected.add(rule.id);
    }
  }
}

let files: string[] | undefined;
for (const input of inputs) {
  if (!picomatch.scan(input).isGlob) {
    selectFile(input);
    continue;
  }
  files ??= projectFiles();
  const isMatch = picomatch(input, { dot: true });
  const matched = files.filter((file) => isMatch(file));
  if (matched.length === 0) {
    warnings.push(`${input} não casa com nenhum arquivo`);
  }
  matched.forEach(selectFile);
}

if (ticket !== undefined) {
  const ticketPath = `${TICKETS_DIR}/${ticket}.md`;
  if (!existsSync(ticketPath)) {
    fail(`ticket ${ticket} não existe (${ticketPath})`);
  }
  const frontmatter = frontmatterOf(readFileSync(ticketPath, 'utf8'));
  const areas = asList(frontmatter?.areas);
  if (areas.length === 0) {
    fail(`ticket ${ticket} sem areas em ${ticketPath}`);
  }
  for (const id of areas) {
    if (rules.has(id)) {
      selected.add(id);
    } else {
      warnings.push(`areas de ${ticket}: ${id} não é regra`);
    }
  }
}

const readBefore: string[] = [];
const queue = [...selected];
while (queue.length > 0) {
  const rule = rules.get(queue.shift() as string);
  for (const target of rule?.readFirst ?? []) {
    if (target.startsWith('project:')) {
      readBefore.push(`ler antes: ${target} (read_first de ${rule?.id})`);
    } else if (!rules.has(target)) {
      warnings.push(`read_first de ${rule?.id}: ${target} não é regra`);
    } else if (!selected.has(target)) {
      selected.add(target);
      queue.push(target);
    }
  }
}

const inactive: string[] = [];
const result = [...selected]
  .map((id) => rules.get(id) as Rule)
  .filter((rule) => {
    const isActive = !layout.isProject || !rule.isConditional || activeIds.has(rule.id);
    if (!isActive) {
      inactive.push(rule.id);
    }
    return isActive;
  })
  .sort((a, b) => Number(b.isProject) - Number(a.isProject) || a.id.localeCompare(b.id));

for (const rule of result) {
  lines.push(`${rule.id} — ${rule.description} (${rule.path})`);
}
lines.push(...readBefore);
for (const text of exceptions) {
  if (result.some(({ id }) => mentions(text, id))) {
    lines.push(`exceção: ${text}`);
  }
}
if (inactive.length > 0) {
  warnings.push(
    `capacidade condicional fora de "Capacidades ativas" do ${PROJECT_INDEX}, não entra: ${inactive.sort().join(', ')}`,
  );
}
if (result.length === 0) {
  warnings.push('nenhuma regra');
}
if (result.length > BUDGET) {
  warnings.push(`${result.length} regras, mais de ${BUDGET}: ticket grande demais ou applies_to largo`);
}

for (const text of [...lines, ...warnings.map((warning) => `aviso: ${warning}`)]) {
  console.log(text);
}
