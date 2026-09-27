// Raiz, modo e leitura comum aos comandos.
// Modo: na raiz do pacote metri (package.json com "name": "metri"), é o source (regras globais em architecture/);
// em qualquer outra raiz, é projeto: regras globais na pasta do pacote, regras do projeto em .metri/rules/.
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export type Layout = {
  isProject: boolean;
  // Regras e ADRs globais, como caminho legível a partir da raiz.
  globalDir: string;
  globalAdrDir: string;
  // Regras do projeto e o arquivo que leva o marcador do rules-index.
  projectDir?: string;
  rootIndex: string;
};

// A pasta do pacote metri: de onde vêm regras, ADRs, skills e agents globais.
export const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const PACKAGE_NAME = 'metri';
// O bin do pacote: os comandos que chamam outros comandos rodam por ele.
export const BIN = join(PACKAGE_ROOT, 'cli/metri.mjs');

export const PROJECT_INDEX = '.metri/ARCHITECTURE.md';
export const PROJECT_RULES = '.metri/rules';
export const MATRIX = '.metri/MATRIX.md';
export const TICKETS_DIR = '.metri/tickets';

// Pastas que a varredura de arquivos do projeto não percorre.
const SKIPPED_DIRS = ['node_modules', '.git'];

function isSource(root: string): boolean {
  const path = join(root, 'package.json');
  if (!existsSync(path)) {
    return false;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8')).name === PACKAGE_NAME;
  } catch {
    return false;
  }
}

// Caminho de um arquivo do pacote visto da raiz: node_modules/metri/... quando o projeto tem o pacote instalado,
// senão o caminho absoluto.
export function packagePath(root: string, path: string): string {
  const installed = join(root, 'node_modules', PACKAGE_NAME);
  if (existsSync(installed) && realpathSync(installed) === realpathSync(PACKAGE_ROOT)) {
    return join('node_modules', PACKAGE_NAME, path);
  }
  return join(PACKAGE_ROOT, path);
}

export function layoutOf(root = '.'): Layout {
  if (isSource(root)) {
    return { isProject: false, globalDir: 'architecture', globalAdrDir: 'adr', rootIndex: 'architecture/INDEX.md' };
  }
  return {
    isProject: true,
    globalDir: packagePath(root, 'architecture'),
    globalAdrDir: packagePath(root, 'adr'),
    projectDir: PROJECT_RULES,
    rootIndex: PROJECT_INDEX,
  };
}

// Tira "<nome> <valor>" de args e devolve o valor.
export function takeOption(args: string[], name: string): string | undefined {
  const at = args.indexOf(name);
  if (at === -1) {
    return undefined;
  }
  const value = args[at + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${name} sem valor`);
  }
  args.splice(at, 2);
  return value;
}

export function isRuleName(name: string): boolean {
  return name.endsWith('.md') && name !== 'INDEX.md' && !name.endsWith('.examples.md');
}

// Arquivos de regra de uma pasta de arquitetura: <dir>/<área>/<tema>.md.
export function ruleFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .sort()
    .filter((area) => statSync(join(dir, area)).isDirectory())
    .flatMap((area) =>
      readdirSync(join(dir, area))
        .sort()
        .filter(isRuleName)
        .map((name) => join(dir, area, name)),
    );
}

// Id de uma regra pelo caminho: <área>/<tema>.
export function ruleIdOf(dir: string, path: string): string {
  return relative(dir, path).replace(/\.md$/, '');
}

export function frontmatterOf(source: string): Record<string, unknown> | undefined {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  return match ? (parse(match[1]) ?? {}) : undefined;
}

export function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

// Itens "- ..." da seção "## <título>" de um markdown, sem o prefixo "- ", com o número da linha.
export function sectionItems(source: string, title: string): { text: string; line: number }[] {
  return sectionLines(source, title)
    .filter(({ text }) => text.startsWith('- '))
    .map(({ text, line }) => ({ text: text.slice(2).trim(), line }));
}

// Linhas não vazias da seção "## <título>" de um markdown, com o número da linha (inclui as que não são "- ").
export function sectionLines(source: string, title: string): { text: string; line: number }[] {
  const lines = source.split('\n');
  const start = lines.indexOf(`## ${title}`);
  if (start === -1) {
    return [];
  }
  const items: { text: string; line: number }[] = [];
  for (let index = start + 1; index < lines.length && !lines[index].startsWith('## '); index++) {
    if (lines[index].trim() !== '') {
      items.push({ text: lines[index].trim(), line: index + 1 });
    }
  }
  return items;
}

// Todos os arquivos sob a raiz, em caminho relativo, fora de node_modules e .git.
export function projectFiles(dir = '.'): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = dir === '.' ? name : join(dir, name);
      const stat = lstatSync(path);
      if (stat.isDirectory()) {
        return SKIPPED_DIRS.includes(name) ? [] : projectFiles(path);
      }
      return stat.isFile() ? [path] : [];
    });
}
