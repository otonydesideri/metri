// check: the code checks of the Source that no linter covers (boundaries, access-boundaries, date-time,
// concurrency). --help has the details.
import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { projectFiles, takeOption } from './lib/layout.ts';

const HELP = `check: os checks de código da Source que nenhum lint cobre. Sem nome, roda todos.

Uso: metri check [<nome>...] [--root <dir>]

Checks:
  boundaries          o grafo de dependência do backend (backend/boundaries, "O grafo permitido") e a fronteira
                      produção/teste (frontend/testing): cada import fora do grafo, por fronteira
  access-boundaries   todo controller do app-api (arquivo com @Controller( fora dos specs) declara @Public() ou um
                      marcador do dono como decorator de classe, na própria linha e na coluna 0
                      (backend/access-scope, "Declaração por controller")
  date-time           o construtor Date com componentes soltos (new Date(ano, mês, dia)) no app-api e nos pacotes,
                      que monta a data no fuso do processo; Date.UTC(...) dentro dele passa (general/date-time)
  concurrency         todo model do schema Prisma com coluna version tem um *.concurrency.e2e-spec.ts em algum lugar
                      do app-api, nomeado pelo model em kebab-case (backend/testing, "Teste de concorrência real")

Parâmetros, na chave metri do package.json da raiz:
  "metri": {
    "checks": {
      "access-boundaries": { "ownerMarkers": ["CustomerOwned"] },
      "boundaries": { "domainPackages": ["decimal.js"] }
    }
  }
  ownerMarkers     os marcadores do dono aceitos ao lado de @Public() (a delegação "Identidade do dono")
  domainPackages   os pacotes que um ADR do projeto libera em src/domain, além dos da Source

Um check próprio do projeto: node_modules/metri/skills/guardrail/KNOWLEDGE-GATE.md, "Destination".

Saída: nada quando passa; na falha, "falha <check>: <o quê>" e, recuado, cada arquivo. Sai com código 1 quando
algum falha. Roda no lint da raiz ("lint": "turbo run lint && metri check"), e por ele no metri verify.
`;

type Params = { ownerMarkers: string[]; domainPackages: string[] };
type Failure = { label: string; items: string[] };
type Check = (params: Params) => Failure[];

const API_SRC = 'apps/app-api/src';
const API_TEST = 'apps/app-api/test';
const DOMAIN = `${API_SRC}/domain`;
const WEB_SRC = 'apps/app-web/src';
const SETUP_E2E = `${API_TEST}/setup-e2e.ts`;
// The packages the Source allows in src/domain (general/date-time names the date ones).
const DOMAIN_PACKAGES = ['@nestjs/common', '@metri/core', '@metri/utils', 'date-fns', '@date-fns/tz'];
const PARAMS: Record<string, (keyof Params)[]> = { boundaries: ['domainPackages'], 'access-boundaries': ['ownerMarkers'] };

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
process.chdir(resolve(takeOption(args, '--root') ?? '.'));

function tsFiles(dir: string, { tsx = false, specs = false } = {}): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return projectFiles(dir).filter(
    (path) => (tsx ? /\.tsx?$/ : /\.ts$/).test(path) && (specs || !/\.(?:spec|e2e-spec)\.tsx?$/.test(path)),
  );
}

// The module specifiers a file imports, from `from '...'` and `import('...')`.
function importsOf(path: string): string[] {
  return [...readFileSync(path, 'utf8').matchAll(/(?:\bfrom\s+|\bimport\s*\(\s*)['"]([^'"]+)['"]/g)].map(([, specifier]) => specifier);
}

// The package of a specifier: `@scope/name` or `name`, without the subpath.
function packageOf(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

const isRelative = (specifier: string) => specifier.startsWith('.');
const isBuiltin = (specifier: string) => specifier.startsWith('node:');

// Each file whose imports match, as `file: specifier`.
function importing(files: string[], matches: (specifier: string) => boolean): string[] {
  return files.flatMap((path) => importsOf(path).filter(matches).map((specifier) => `${path}: ${specifier}`));
}

const boundaries: Check = ({ domainPackages }) => {
  const domain = tsFiles(DOMAIN);
  const allowed = new Set([...DOMAIN_PACKAGES, ...domainPackages]);
  const apiProduction = tsFiles(API_SRC);
  const failures: Failure[] = [
    {
      label: 'domain importando db, Zod ou nestjs-pino',
      items: importing(domain, (s) => ['@metri/db', 'zod', 'nestjs-zod', 'nestjs-pino'].includes(packageOf(s))),
    },
    {
      label: 'domain importando NestJS além de @nestjs/common',
      items: importing(domain, (s) => s.startsWith('@nestjs/') && s !== '@nestjs/common'),
    },
    {
      label: 'enterprise importando NestJS',
      items: importing(tsFiles(`${DOMAIN}/enterprise`), (s) => s.startsWith('@nestjs/')),
    },
    {
      label: 'domain importando src/infra',
      items: importing(domain, (s) => /(^|\/)infra\//.test(s)),
    },
    {
      label: 'domain importando pacote externo fora da allowlist',
      items: importing(domain, (s) => !isRelative(s) && !isBuiltin(s) && !allowed.has(packageOf(s))),
    },
    {
      label: 'infra importando domain service',
      items: importing(tsFiles(`${API_SRC}/infra`), (s) => /(^|\/)domain\/enterprise\/domain-services\//.test(s)),
    },
    {
      label: 'entidade importando domain service',
      items: importing(
        tsFiles(`${DOMAIN}/enterprise`).filter((path) => !path.includes(`${DOMAIN}/enterprise/domain-services/`)),
        (s) => /(^|\/)domain-services\//.test(s),
      ),
    },
    {
      label: 'domain usando de @nestjs/common algo além de Injectable',
      items: domain.flatMap((path) =>
        [...readFileSync(path, 'utf8').matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]@nestjs\/common['"]/g)]
          .filter(([, names]) => names.split(',').some((name) => !['Injectable', ''].includes(name.trim().replace(/^type\s+/, ''))))
          .map(([statement]) => `${path}: ${statement.replace(/\s+/g, ' ')}`),
      ),
    },
    {
      label: '@metri/db fora de infra/persistence/prisma e do setup do e2e',
      items: importing(
        [...tsFiles(API_SRC, { specs: true }), ...tsFiles(API_TEST, { specs: true })].filter(
          (path) => !path.includes('infra/persistence/prisma/') && path !== SETUP_E2E,
        ),
        (s) => packageOf(s) === '@metri/db',
      ),
    },
    ...['core', 'utils'].map((name) => ({
      label: name === 'core' ? 'core com dependência externa' : 'utils com dependência externa, inclusive o core',
      items: importing(tsFiles(`packages/${name}/src`), (s) => !isRelative(s) && !isBuiltin(s)),
    })),
    {
      label: 'produção do app-api importando test/',
      items: importing(apiProduction, (s) => /(^|\/)test\//.test(s)),
    },
    {
      label: 'produção do app-web importando test/',
      items: importing(tsFiles(WEB_SRC, { tsx: true }), (s) => /(^|\/)test\//.test(s) || s === '@/test' || s.startsWith('@/test/')),
    },
  ];
  return failures;
};

const accessBoundaries: Check = ({ ownerMarkers }) => {
  const markers = ['Public', ...ownerMarkers];
  const declaration = new RegExp(`^@(${markers.map((marker) => marker.replace(/[.$]/g, '\\$&')).join('|')})\\(\\)\\s*$`, 'm');
  const controllers = tsFiles(API_SRC).filter((path) => readFileSync(path, 'utf8').includes('@Controller('));
  const accepted = markers.map((marker) => `@${marker}()`).join(' nem ');
  return [
    {
      label: `controller sem ${accepted} na classe`,
      items: controllers.filter((path) => !declaration.test(readFileSync(path, 'utf8'))),
    },
  ];
};

const dateTime: Check = () => {
  const files = [...tsFiles(API_SRC, { specs: true }), ...tsFiles(API_TEST, { specs: true })];
  const packages = existsSync('packages') ? projectFiles('packages').filter((path) => /^packages\/[^/]+\/src\/.*\.ts$/.test(path) && !path.includes('/generated/')) : [];
  return [
    {
      label: 'new Date(...) com componentes soltos, sem fuso explícito (use TZDate, de @date-fns/tz, ou um instante ISO com offset ou Z)',
      items: [...files, ...packages].flatMap((path) =>
        readFileSync(path, 'utf8')
          .split('\n')
          .flatMap((line, index) => (/new Date\((?!Date\.UTC\()[^)]*,/.test(line) ? [`${path}:${index + 1}`] : [])),
      ),
    },
  ];
};

// The model names (PascalCase, as declared) of a .prisma source that have a `version` field.
function versionedModelsOf(source: string): string[] {
  return [...source.matchAll(/model\s+(\w+)\s*\{([^}]*)\}/g)]
    .filter(([, , body]) => /^\s*version\s+Int\b/m.test(body))
    .map(([, name]) => name);
}

const toKebabCase = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const concurrency: Check = () => {
  const schemaDir = 'packages/db/prisma/models';
  const models = existsSync(schemaDir)
    ? projectFiles(schemaDir)
        .filter((path) => path.endsWith('.prisma'))
        .flatMap((path) => versionedModelsOf(readFileSync(path, 'utf8')).map((name) => `${path}: ${name}`))
    : [];
  const specs = tsFiles(API_SRC, { specs: true }).filter((path) => path.endsWith('.concurrency.e2e-spec.ts'));
  const specNames = new Set(specs.map((path) => basename(path)));
  return [
    {
      label: 'model com version sem *.concurrency.e2e-spec.ts nomeado pelo model',
      items: models.filter((item) => {
        const name = item.split(': ').pop() as string;
        return ![...specNames].some((fileName) => fileName.startsWith(`${toKebabCase(name)}.`));
      }),
    },
  ];
};

const CHECKS: Record<string, Check> = { boundaries, 'access-boundaries': accessBoundaries, 'date-time': dateTime, concurrency };

// The metri.checks key of the root package.json; an unknown check or parameter is an error, never ignored.
function paramsOf(name: string): Params | string {
  const pkg = existsSync('package.json') ? JSON.parse(readFileSync('package.json', 'utf8')) : {};
  const all: Record<string, Record<string, unknown>> = pkg.metri?.checks ?? {};
  const unknown = Object.keys(all).find((key) => !(key in CHECKS));
  if (unknown !== undefined) {
    return `metri.checks.${unknown} no package.json: o check não existe (metri check --help)`;
  }
  const given = all[name] ?? {};
  const params: Params = { ownerMarkers: [], domainPackages: [] };
  for (const [key, value] of Object.entries(given)) {
    if (!(PARAMS[name] ?? []).includes(key as keyof Params)) {
      return `metri.checks.${name}.${key} no package.json: o parâmetro não existe (metri check --help)`;
    }
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !/^[\w@./-]+$/.test(item))) {
      return `metri.checks.${name}.${key} no package.json: uma lista de nomes`;
    }
    params[key as keyof Params] = value;
  }
  return params;
}

const names = args.filter((arg) => !arg.startsWith('-'));
const unknownName = names.find((name) => !(name in CHECKS));
if (unknownName !== undefined) {
  console.log(`erro: o check ${unknownName} não existe (metri check --help)`);
  process.exit(1);
}

let hasFailed = false;
for (const name of names.length > 0 ? names : Object.keys(CHECKS)) {
  const params = paramsOf(name);
  if (typeof params === 'string') {
    console.log(`erro: ${params}`);
    process.exit(1);
  }
  for (const { label, items } of CHECKS[name](params).filter((failure) => failure.items.length > 0)) {
    hasFailed = true;
    console.log(`falha ${name}: ${label}`);
    for (const item of items) {
      console.log(`  ${item}`);
    }
  }
}
process.exit(hasFailed ? 1 : 0);
