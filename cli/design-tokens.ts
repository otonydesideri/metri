// design-tokens: checks that the code's theme follows the tokens of docs/DESIGN.md. --help has the details.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { differenceEuclidean, parse } from 'culori';
import { frontmatterOf, takeOption } from './lib/layout.ts';

const HELP = `design-tokens: confere se o tema do código segue os tokens do docs/DESIGN.md, a fonte deles.

Uso: metri design-tokens [--root <dir>] [--theme <arquivo css>] [--utils <arquivo>] [--index <arquivo html>]
Padrões: tema packages/ui/src/styles/globals.css, cn packages/ui/src/lib/utils.ts, apps/app-web/index.html.

Compara:
  - colors.<nome> com --<nome> em :root, e colors.<nome>-dark com --<nome> em .dark, nos dois sentidos: token
    sem variável e variável de cor sem token são erro. As cores são comparadas no espaço OKLab (hex, rgb(),
    hsl() e oklch() valem igual), com a transparência;
  - rounded.lg com --radius em :root;
  - typography.<nível> com --text-<nível> (fontSize), --text-<nível>--line-height, --text-<nível>--letter-spacing
    e --text-<nível>--font-weight no @theme.

E, no código, quando o arquivo existe:
  - a lista theme.text do cn (extendTailwindMerge) com os níveis --text-<nível> do @theme, nos dois sentidos
    (defaults/ui, "Tipografia e espaçamento");
  - o <style> inline do index.html: html { background } com o --background de :root, e html.dark { background }
    com o de .dark (frontend/theming).

Sem docs/DESIGN.md ou sem o arquivo de tema, responde "pendente: <motivo>" e sai 0. Com diferença, uma linha por
token e sai 1.
`;

const DESIGN = 'docs/DESIGN.md';
const DEFAULT_THEME = 'packages/ui/src/styles/globals.css';
const DEFAULT_UTILS = 'packages/ui/src/lib/utils.ts';
const DEFAULT_INDEX = 'apps/app-web/index.html';
const DARK_SUFFIX = '-dark';
// OKLab distance below which two colors are the same, after each format's rounding.
const COLOR_TOLERANCE = 0.002;
const TYPOGRAPHY_VARS: Record<string, string> = {
  fontSize: '',
  lineHeight: '--line-height',
  letterSpacing: '--letter-spacing',
  fontWeight: '--font-weight',
};

type Blocks = { light: Map<string, string>; dark: Map<string, string>; theme: Map<string, string> };

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
const themeOption = takeOption(args, '--theme');
const utilsPath = takeOption(args, '--utils') ?? DEFAULT_UTILS;
const indexPath = takeOption(args, '--index') ?? DEFAULT_INDEX;
process.chdir(resolve(takeOption(args, '--root') ?? '.'));
const themePath = themeOption ?? DEFAULT_THEME;

function pending(reason: string): never {
  console.log(`pendente: ${reason}`);
  process.exit(0);
}

// Variables of :root, .dark and @theme in the theme CSS (only blocks without nested braces).
function blocksOf(css: string): Blocks {
  const blocks: Blocks = { light: new Map(), dark: new Map(), theme: new Map() };
  for (const [, selector, body] of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    // the selector is what follows the last `;`: @import, @source and @custom-variant before the block are left out
    const name = selector.split(';').at(-1)?.trim() ?? '';
    const target =
      name === ':root' ? blocks.light : name === '.dark' ? blocks.dark : name.startsWith('@theme') ? blocks.theme : undefined;
    for (const [, key, value] of target ? body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g) : []) {
      target?.set(key, value.trim());
    }
  }
  return blocks;
}

const distance = differenceEuclidean('oklab');

function sameColor(a: string, b: string): boolean {
  const first = parse(a);
  const second = parse(b);
  if (!first || !second) {
    return a === b;
  }
  return distance(first, second) <= COLOR_TOLERANCE && Math.abs((first.alpha ?? 1) - (second.alpha ?? 1)) <= 0.001;
}

function sameValue(a: unknown, b: string): boolean {
  const normalize = (value: string) => value.replace(/\s+/g, ' ').replace(/^0px$/, '0').trim();
  return normalize(String(a)) === normalize(b);
}

function isColor(value: string): boolean {
  return !value.startsWith('var(') && parse(value) !== undefined;
}

if (!existsSync(DESIGN)) {
  pending(`sem ${DESIGN}`);
}
if (!existsSync(themePath)) {
  pending(`sem tema em ${themePath}`);
}
const tokens = frontmatterOf(readFileSync(DESIGN, 'utf8')) ?? {};
const blocks = blocksOf(readFileSync(themePath, 'utf8'));
const problems: string[] = [];

const colors = (tokens.colors ?? {}) as Record<string, string>;
for (const [token, value] of Object.entries(colors)) {
  const isDark = token.endsWith(DARK_SUFFIX);
  const variable = isDark ? token.slice(0, -DARK_SUFFIX.length) : token;
  const block = isDark ? blocks.dark : blocks.light;
  const selector = isDark ? '.dark' : ':root';
  const actual = block.get(variable);
  if (actual === undefined) {
    problems.push(`colors.${token}: falta --${variable} em ${selector}`);
  } else if (!sameColor(value, actual)) {
    problems.push(`colors.${token}: ${value} no DESIGN.md, ${actual} em --${variable} de ${selector}`);
  }
}
for (const [block, selector, suffix] of [[blocks.light, ':root', ''], [blocks.dark, '.dark', DARK_SUFFIX]] as const) {
  for (const [variable, value] of block) {
    if (isColor(value) && !(`${variable}${suffix}` in colors)) {
      problems.push(`--${variable} de ${selector}: cor sem token colors.${variable}${suffix} no DESIGN.md`);
    }
  }
}

const radius = (tokens.rounded as Record<string, unknown> | undefined)?.lg;
const actualRadius = blocks.light.get('radius');
if (radius !== undefined && actualRadius === undefined) {
  problems.push('rounded.lg: falta --radius em :root');
} else if (radius !== undefined && actualRadius !== undefined && !sameValue(radius, actualRadius)) {
  problems.push(`rounded.lg: ${String(radius)} no DESIGN.md, ${actualRadius} em --radius de :root`);
}

const typography = (tokens.typography ?? {}) as Record<string, Record<string, unknown>>;
for (const [level, properties] of Object.entries(typography)) {
  for (const [property, suffix] of Object.entries(TYPOGRAPHY_VARS)) {
    const expected = properties?.[property];
    if (expected === undefined) {
      continue;
    }
    const variable = `text-${level}${suffix}`;
    const actual = blocks.theme.get(variable);
    if (actual === undefined) {
      problems.push(`typography.${level}.${property}: falta --${variable} no @theme`);
    } else if (!sameValue(expected, actual)) {
      problems.push(`typography.${level}.${property}: ${String(expected)} no DESIGN.md, ${actual} em --${variable}`);
    }
  }
}

const codeProblems: string[] = [];

// theme.text of cn × --text-<level> of @theme (the --text-<level>--<property> keys are left out).
if (existsSync(utilsPath)) {
  const levels = [...blocks.theme.keys()].filter((key) => key.startsWith('text-') && !key.includes('--')).map((key) => key.slice(5));
  const list = /\btext\s*:\s*\[([\s\S]*?)\]/.exec(readFileSync(utilsPath, 'utf8'))?.[1];
  const listed = [...(list ?? '').matchAll(/['"]([^'"]+)['"]/g)].map(([, level]) => level);
  if (list === undefined && levels.length > 0) {
    codeProblems.push(`${utilsPath}: o cn sem extendTailwindMerge com theme.text; os níveis do @theme: ${levels.join(', ')}`);
  }
  for (const level of list === undefined ? [] : levels.filter((level) => !listed.includes(level))) {
    codeProblems.push(`${utilsPath}: --text-${level} do @theme fora de theme.text do cn`);
  }
  for (const level of listed.filter((level) => !levels.includes(level))) {
    codeProblems.push(`${utilsPath}: theme.text do cn tem ${level}, sem --text-${level} no @theme`);
  }
}

// The inline <style> of index.html paints html and html.dark with the light and the dark --background.
if (existsSync(indexPath)) {
  const style = [...readFileSync(indexPath, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(([, css]) => css).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [selector, block, variableBlock] of [['html', blocks.light, ':root'], ['html.dark', blocks.dark, '.dark']] as const) {
    const expected = block.get('background');
    const rule = new RegExp(`(?:^|[}\\s])${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`).exec(style)?.[1];
    const actual = rule && /background(?:-color)?\s*:\s*([^;]+);?/.exec(rule)?.[1]?.trim();
    if (expected === undefined) {
      continue;
    }
    if (!actual) {
      codeProblems.push(`${indexPath}: o <style> sem ${selector} { background }; o valor é o --background de ${variableBlock}`);
    } else if (!sameColor(expected, actual)) {
      codeProblems.push(`${indexPath}: ${selector} { background: ${actual} }, e o --background de ${variableBlock} é ${expected}`);
    }
  }
}

for (const problem of problems) {
  console.log(`${themePath}: ${problem}`);
}
for (const problem of codeProblems) {
  console.log(problem);
}
process.exit(problems.length + codeProblems.length > 0 ? 1 : 0);
