// Root, mode and reading shared by the commands.
// Mode: at the root of the metri package (package.json with "name": "metri"), it is the source (global rules in
// architecture/); at any other root, it is a project: global rules in the package folder, project rules in .metri/rules/.
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export type Layout = {
  isProject: boolean;
  // Global rules, as a readable path from the root.
  globalDir: string;
  // Project rules and the file that holds the rules-index marker.
  projectDir?: string;
  rootIndex: string;
};

// The metri package folder: where the global rules, skills and agents come from.
export const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const PACKAGE_NAME = 'metri';
// The package bin: commands that call other commands run through it.
export const BIN = join(PACKAGE_ROOT, 'cli/metri.mjs');

export const PROJECT_INDEX = '.metri/ARCHITECTURE.md';
export const PROJECT_RULES = '.metri/rules';
export const MATRIX = '.metri/MATRIX.md';
export const TICKETS_DIR = '.metri/tickets';
export const SPECS_DIR = '.metri/specs';

// Path of a .md file: tickets, specs and the MATRIX cite only ids.
export const MD_PATH = /(?<![\w/.-])[\w./-]*[\w-]\.md(?![\w-])/g;

// Folders the project file walk skips.
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

// Path of a package file seen from the root: node_modules/metri/... when the project has the package installed,
// otherwise the absolute path.
export function packagePath(root: string, path: string): string {
  const installed = join(root, 'node_modules', PACKAGE_NAME);
  if (existsSync(installed) && realpathSync(installed) === realpathSync(PACKAGE_ROOT)) {
    return join('node_modules', PACKAGE_NAME, path);
  }
  return join(PACKAGE_ROOT, path);
}

export function layoutOf(root = '.'): Layout {
  if (isSource(root)) {
    return { isProject: false, globalDir: 'architecture', rootIndex: 'architecture/INDEX.md' };
  }
  return {
    isProject: true,
    globalDir: packagePath(root, 'architecture'),
    projectDir: PROJECT_RULES,
    rootIndex: PROJECT_INDEX,
  };
}

// Removes "<name> <value>" from args and returns the value.
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

// Rule files of an architecture folder: <dir>/<area>/<topic>.md.
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

// A rule's id from its path: <area>/<topic>.
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

// The "- ..." items of the "## <title>" section of a markdown, without the "- " prefix, with the line number.
export function sectionItems(source: string, title: string): { text: string; line: number }[] {
  return sectionLines(source, title)
    .filter(({ text }) => text.startsWith('- '))
    .map(({ text, line }) => ({ text: text.slice(2).trim(), line }));
}

// Non-empty lines of the "## <title>" section of a markdown, with the line number (including those that are not "- ").
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

// Lines outside the frontmatter and fenced code blocks, each with its number.
export function proseLines(source: string): { text: string; line: number }[] {
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

// All files under the root, as relative paths, outside node_modules and .git.
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
