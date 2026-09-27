// Raiz, modo e leitura comum aos scripts.
// Modo: com .metri/ na raiz, é projeto (regras globais em .metri/architecture, do projeto em docs/architecture);
// sem .metri/, é o source (regras globais em architecture/).
import { existsSync, lstatSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

export type Layout = { isProject: boolean; globalDir: string; projectDir?: string };

export const PROJECT_INDEX = 'docs/architecture/INDEX.md';
export const MATRIX = 'docs/plan/MATRIX.md';
export const TICKETS_DIR = 'docs/plan/tickets';

// Pastas que a varredura de arquivos do projeto não percorre.
const SKIPPED_DIRS = ['node_modules', '.git', '.metri'];

export function layoutOf(root = '.'): Layout {
  return existsSync(join(root, '.metri'))
    ? { isProject: true, globalDir: '.metri/architecture', projectDir: 'docs/architecture' }
    : { isProject: false, globalDir: 'architecture' };
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

// Todos os arquivos sob a raiz, em caminho relativo, fora de node_modules, .git e .metri.
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
