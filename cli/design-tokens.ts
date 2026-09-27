// design-tokens: confere se o tema do código segue os tokens do docs/DESIGN.md. A explicação está no --help.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { differenceEuclidean, parse } from 'culori';
import { frontmatterOf, takeOption } from './lib/layout.ts';

const HELP = `design-tokens: confere se o tema do código segue os tokens do docs/DESIGN.md, a fonte deles.

Uso: metri design-tokens [--root <dir>] [--theme <arquivo css>]   (tema padrão: packages/ui/src/styles/globals.css)

Compara:
  - colors.<nome> com --<nome> em :root, e colors.<nome>-dark com --<nome> em .dark, nos dois sentidos: token
    sem variável e variável de cor sem token são erro. As cores são comparadas no espaço OKLab (hex, rgb(),
    hsl() e oklch() valem igual), com a transparência;
  - rounded.lg com --radius em :root;
  - typography.<nível> com --text-<nível> (fontSize), --text-<nível>--line-height, --text-<nível>--letter-spacing
    e --text-<nível>--font-weight no @theme.

Sem docs/DESIGN.md ou sem o arquivo de tema, responde "pendente: <motivo>" e sai 0. Com diferença, uma linha por
token e sai 1.
`;

const DESIGN = 'docs/DESIGN.md';
const DEFAULT_THEME = 'packages/ui/src/styles/globals.css';
const DARK_SUFFIX = '-dark';
// Distância no OKLab abaixo da qual duas cores são a mesma, depois do arredondamento de cada formato.
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
process.chdir(resolve(takeOption(args, '--root') ?? '.'));
const themePath = themeOption ?? DEFAULT_THEME;

function pending(reason: string): never {
  console.log(`pendente: ${reason}`);
  process.exit(0);
}

// Variáveis de :root, .dark e @theme do CSS do tema (só blocos sem chaves aninhadas).
function blocksOf(css: string): Blocks {
  const blocks: Blocks = { light: new Map(), dark: new Map(), theme: new Map() };
  for (const [, selector, body] of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const name = selector.trim();
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
if (radius !== undefined && actualRadius !== undefined && !sameValue(radius, actualRadius)) {
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

for (const problem of problems) {
  console.log(`${themePath}: ${problem}`);
}
process.exit(problems.length > 0 ? 1 : 0);
