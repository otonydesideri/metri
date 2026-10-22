#!/usr/bin/env node
// evals/run: roda um cenário de ponta a ponta num projeto temporário e grava o resultado.
// Uso: node evals/run.mjs <cenário> [--dry-run] [--yes] [--keep]
//   --dry-run  só o setup (starter + arquivos do cenário); sem install, sem claude
//   --yes      chama o claude (custa dinheiro); sem ele, para depois do preparo e imprime os comandos
//   --keep     mantém o projeto temporário no fim
// Cenário: evals/scenarios/<nome>/project/** (docs/ e .metri/, copiados sobre o starter) e steps.json.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(HERE, '..');
const STARTER = join(SOURCE, 'starter');
// O que o starter tem de gerado ou instalado e um projeto novo não recebe (o .gitignore do metri init).
const SKIPPED = new Set(['node_modules', '.git', '.turbo', 'dist', 'coverage', 'generated', 'test-results', 'playwright-report']);
const DEFAULT_CLAUDE_ARGS = ['--setting-sources', 'project,local'];

function usage(code) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 7).join('\n').replace(/^\/\/ ?/gm, ''));
  process.exit(code);
}

function parseArgs(argv) {
  const opts = { scenario: null, dryRun: false, yes: false, keep: false };
  for (const a of argv) {
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--yes') opts.yes = true;
    else if (a === '--keep') opts.keep = true;
    else if (a === '-h' || a === '--help') usage(0);
    else if (a.startsWith('-')) {
      console.error(`argumento desconhecido: ${a}`);
      usage(2);
    } else if (!opts.scenario) opts.scenario = a;
    else usage(2);
  }
  if (!opts.scenario) usage(2);
  return opts;
}

function loadScenario(name) {
  const dir = join(HERE, 'scenarios', name);
  const stepsFile = join(dir, 'steps.json');
  if (!existsSync(stepsFile)) {
    const known = existsSync(join(HERE, 'scenarios')) ? readdirSync(join(HERE, 'scenarios')).join(', ') : '—';
    console.error(`cenário ${name} sem ${relative(process.cwd(), stepsFile)}; cenários: ${known}`);
    process.exit(2);
  }
  const raw = JSON.parse(readFileSync(stepsFile, 'utf8'));
  const config = Array.isArray(raw) ? { steps: raw } : raw;
  if (!Array.isArray(config.steps) || config.steps.some((s) => typeof s.prompt !== 'string')) {
    console.error(`${stepsFile}: "steps" é uma lista de { "prompt": "..." }`);
    process.exit(2);
  }
  return { dir, project: join(dir, 'project'), ...config };
}

const slug = (raw) =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'app';

function copyTree(from, to, transform) {
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (SKIPPED.has(entry.name)) continue;
    const src = join(from, entry.name);
    const dst = join(to, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(dst, { recursive: true });
      copyTree(src, dst, transform);
    } else if (entry.isFile()) {
      const content = readFileSync(src);
      writeFileSync(dst, transform ? transform(content) : content);
    }
  }
}

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return SKIPPED.has(e.name) ? [] : filesUnder(p);
    return e.isFile() ? [p] : [];
  });
}

// O setup que o metri init faria depois de copiar o starter: __PROJECT__ trocado, o .env de cada app e pacote a
// partir do .env.example e o "Caminho linear" vazio com os donos do starter. Depois, os arquivos do cenário por cima;
// sem docs/DESIGN.md no cenário, a base neutra, como o /shape faz sem design system dado.
function setup(projectDir, scenario) {
  const name = slug(basename(projectDir));
  copyTree(STARTER, projectDir, (buf) => {
    const text = buf.toString('utf8');
    return text.includes('__PROJECT__') && !text.includes('\u0000') ? Buffer.from(text.replaceAll('__PROJECT__', name)) : buf;
  });
  for (const example of filesUnder(projectDir).filter((p) => basename(p) === '.env.example')) {
    const target = example.replace(/\.example$/, '');
    if (!existsSync(target)) cpSync(example, target);
  }
  if (existsSync(scenario.project)) cpSync(scenario.project, projectDir, { recursive: true });
  const design = join(projectDir, 'docs', 'DESIGN.md');
  if (!existsSync(design)) {
    mkdirSync(dirname(design), { recursive: true });
    cpSync(join(SOURCE, 'skills', 'shape', 'DESIGN-TEMPLATE.md'), design);
  }
  const index = join(projectDir, '.metri', 'ARCHITECTURE.md');
  if (existsSync(index)) {
    const text = readFileSync(index, 'utf8');
    const steps = readFileSync(join(SOURCE, 'cli', 'templates', 'STARTER-LINEAR-PATH.md'), 'utf8').trimEnd();
    if (/^## Caminho linear\n\n## /m.test(text)) {
      writeFileSync(index, text.replace(/^## Caminho linear\n\n/m, `## Caminho linear\n\n${steps}\n\n`));
    }
  }
  return name;
}

// O preparo: um repositório git (o verify e o /build precisam), o metri ligado ao Source, o install, o metri init (links de
// .claude/, AGENTS.md, CLAUDE.md, .gitignore, scripts; termina no verify), o Chromium do Playwright e o commit inicial.
function prepareCommands() {
  return [
    { label: 'git init', cmd: 'git', args: ['init', '-q', '-b', 'main'] },
    { label: 'git identity', cmd: 'git', args: ['config', 'user.name', 'metri eval'] },
    { label: 'git identity', cmd: 'git', args: ['config', 'user.email', 'eval@metri.invalid'] },
    { label: 'link metri', cmd: 'pnpm', args: ['add', '-D', '-w', `link:${SOURCE}`] },
    // O pnpm add -w instala só a raiz; o install traz os apps e pacotes.
    { label: 'pnpm install', cmd: 'pnpm', args: ['install'] },
    { label: 'metri init', cmd: process.execPath, args: ['node_modules/metri/cli/metri.mjs', 'init'], verify: true },
    { label: 'playwright', cmd: 'pnpm', args: ['--filter', 'app-web', 'exec', 'playwright', 'install', 'chromium'] },
    { label: 'git add', cmd: 'git', args: ['add', '-A'] },
    { label: 'git commit', cmd: 'git', args: ['commit', '-q', '-m', 'eval: setup'] },
  ];
}

function claudeArgs(scenario, step) {
  const args = ['-p', step.prompt];
  if (scenario.allowed_tools?.length) args.push('--allowedTools', ...scenario.allowed_tools);
  args.push('--output-format', 'json', '--permission-mode', scenario.permission_mode ?? 'acceptEdits');
  if (scenario.max_budget_usd) args.push('--max-budget-usd', String(scenario.max_budget_usd));
  args.push(...(scenario.claude_args ?? DEFAULT_CLAUDE_ARGS), ...(step.args ?? []));
  return args;
}

const quote = (a) => (/^[\w@%+=:,./-]+$/.test(a) ? a : `'${a.replaceAll("'", "'\\''")}'`);
const show = (cmd, args) => [basename(cmd) === basename(process.execPath) ? 'node' : cmd, ...args].map(quote).join(' ');

function run(cmd, args, cwd, { capture = false, timeoutMs } = {}) {
  const started = Date.now();
  // A sessão do eval é independente da que chamou o runner.
  const env = { ...process.env };
  delete env.CLAUDECODE;
  const res = spawnSync(cmd, args, {
    cwd,
    env,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'inherit'],
    timeout: timeoutMs,
  });
  const output = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  return { exit: res.status, signal: res.signal ?? null, error: res.error?.message ?? null, output, stdout: res.stdout ?? '', ms: Date.now() - started };
}

// "ok <nome>", "pendente <nome>: ..." e "falha <nome>", uma linha por check do metri verify.
function verifyChecks(output) {
  const checks = {};
  for (const line of output.split('\n')) {
    const m = /^(ok|pendente|falha) ([\w:.-]+)/.exec(line);
    if (m) checks[m[2]] = m[1];
  }
  return checks;
}

const tail = (text, n = 40) => text.trimEnd().split('\n').slice(-n).join('\n');

function which(cmd) {
  return spawnSync('sh', ['-c', `command -v ${cmd}`], { encoding: 'utf8' }).status === 0;
}

function postgresReachable(projectDir) {
  const envFile = join(projectDir, 'apps', 'app-api', '.env');
  const url = existsSync(envFile) ? /^DATABASE_URL=(.+)$/m.exec(readFileSync(envFile, 'utf8'))?.[1] : undefined;
  if (!url) return Promise.resolve({ url: null, ok: false });
  const { hostname, port } = new URL(url.trim());
  return new Promise((done) => {
    const socket = connect({ host: hostname, port: Number(port || 5432) });
    const finish = (ok) => {
      socket.destroy();
      done({ url: `${hostname}:${port || 5432}`, ok });
    };
    socket.setTimeout(1500, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

function ticketStatuses(projectDir) {
  const dir = join(projectDir, '.metri', 'tickets');
  if (!existsSync(dir)) return {};
  return Object.fromEntries(
    readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => [f.replace(/\.md$/, ''), /^status:\s*(\S+)/m.exec(readFileSync(join(dir, f), 'utf8'))?.[1] ?? null]),
  );
}

function gitSummary(projectDir) {
  const g = (...args) => spawnSync('git', args, { cwd: projectDir, encoding: 'utf8' });
  const setup = g('rev-list', '--max-parents=0', 'HEAD').stdout.trim().split('\n')[0];
  if (!setup) return null;
  const branches = g('branch', '--format=%(refname:short)').stdout.trim().split('\n').filter(Boolean);
  const commits = Number(g('rev-list', '--count', '--all', `^${setup}`).stdout.trim() || 0);
  const stat = g('diff', '--shortstat', setup, 'main').stdout.trim();
  const num = (re) => Number(re.exec(stat)?.[1] ?? 0);
  return {
    branches,
    commits_after_setup: commits,
    main_vs_setup: { files: num(/(\d+) files? changed/), insertions: num(/(\d+) insertions?/), deletions: num(/(\d+) deletions?/) },
    dirty: g('status', '--porcelain').stdout.trim() !== '',
  };
}

// O Source medido nesta execução: versão, commit e as métricas principais do stats.
function sourceInfo() {
  const { meta, architecture: a, skills, agents, builder_context: b } = collect(SOURCE);
  return {
    ...meta,
    stats: {
      rules: a.rules,
      rules_kb: a.rules_kb,
      examples_kb: a.examples_kb,
      verification_items: a.verification_items,
      skills_kb: skills.total_kb,
      agents_kb: agents.total_kb,
      builder_full_rules_kb: b.full_rules_kb,
      builder_output_kb: b.output_kb,
    },
  };
}

function totals(steps) {
  const sum = (f) => steps.reduce((acc, s) => acc + (Number(f(s)) || 0), 0);
  return {
    duration_ms: sum((s) => s.duration_ms ?? s.wall_ms),
    num_turns: sum((s) => s.num_turns),
    total_cost_usd: Math.round(sum((s) => s.total_cost_usd) * 10000) / 10000,
    input_tokens: sum((s) => s.usage?.input_tokens),
    output_tokens: sum((s) => s.usage?.output_tokens),
    cache_creation_input_tokens: sum((s) => s.usage?.cache_creation_input_tokens),
    cache_read_input_tokens: sum((s) => s.usage?.cache_read_input_tokens),
  };
}

// ---------- main ----------

const opts = parseArgs(process.argv.slice(2));
const scenario = loadScenario(opts.scenario);
const projectDir = mkdtempSync(join(tmpdir(), 'metri-eval-'));
const prepare = prepareCommands();
const verifyCmd = { cmd: 'pnpm', args: ['verify'] };
const timeoutMs = (scenario.timeout_min ?? 90) * 60_000;

const mode = opts.dryRun ? 'dry-run: só o setup' : opts.yes ? 'execução completa (chama o claude)' : 'preparo sem claude (falta --yes)';
console.log(`cenário ${opts.scenario}${scenario.description ? ` — ${scenario.description}` : ''}`);
console.log(`modo: ${mode}`);
console.log(`projeto temporário: ${projectDir}`);
console.log('\nplano:');
console.log(`  1. setup: copia ${relative(process.cwd(), STARTER) || STARTER}/ (sem node_modules nem gerados) e ${relative(process.cwd(), scenario.project)}/ por cima`);
console.log('  2. preparo:');
for (const p of prepare) console.log(`       ${show(p.cmd, p.args)}`);
console.log(`  3. passos (claude, ${scenario.max_budget_usd ? `até US$ ${scenario.max_budget_usd} por passo` : 'sem teto de custo'}, timeout ${scenario.timeout_min ?? 90} min):`);
for (const s of scenario.steps) console.log(`       ${show('claude', claudeArgs(scenario, s))}`);
console.log(`  4. ${show(verifyCmd.cmd, verifyCmd.args)}; grava evals/results/${opts.scenario}-<timestamp>.json`);
console.log('');

const projectName = setup(projectDir, scenario);
console.log(`setup ok: starter + cenário em ${projectDir} (nome do projeto: ${projectName})`);

const cleanup = (keep) => {
  if (keep) console.log(`\nprojeto mantido em ${projectDir} (rm -rf ${quote(projectDir)} para limpar)`);
  else rmSync(projectDir, { recursive: true, force: true });
};

if (opts.dryRun) {
  console.log('\ndry-run: parou depois do setup; nenhum install, nenhum claude.');
  cleanup(opts.keep);
  process.exit(0);
}

const missing = ['git', 'pnpm', ...(opts.yes ? ['claude'] : [])].filter((c) => !which(c));
if (missing.length) {
  console.error(`erro: falta no PATH: ${missing.join(', ')}`);
  cleanup(opts.keep);
  process.exit(1);
}

const result = {
  scenario: opts.scenario,
  started_at: new Date().toISOString(),
  source: sourceInfo(),
  project_dir: projectDir,
  prepare: [],
  verify_before: null,
  steps: [],
  verify: null,
  tickets: null,
  git: null,
  totals: null,
};

const writeResult = () => {
  result.finished_at = new Date().toISOString();
  const dir = join(HERE, 'results');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${opts.scenario}-${result.started_at.replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`);
  return file;
};

console.log('\npreparo:');
for (const p of prepare) {
  console.log(`$ ${show(p.cmd, p.args)}`);
  const r = run(p.cmd, p.args, projectDir, { capture: true });
  result.prepare.push({ cmd: show(p.cmd, p.args), exit: r.exit, ms: r.ms });
  if (p.verify) {
    // O metri init termina no verify e sai com o código dele: é o verify antes do agente.
    result.verify_before = { ok: r.exit === 0, exit: r.exit, checks: verifyChecks(r.output) };
    if (!existsSync(join(projectDir, '.claude', 'skills', 'build'))) {
      console.error(tail(r.output));
      console.error('erro: o metri init não criou .claude/skills/build');
      console.log(`resultado: ${relative(process.cwd(), writeResult())}`);
      cleanup(true);
      process.exit(1);
    }
    console.log(`  verify antes do agente: ${r.exit === 0 ? 'verde' : 'vermelho'}`);
    if (r.exit !== 0) console.log(tail(r.output, 20).replace(/^/gm, '  '));
  } else if (r.exit !== 0) {
    console.error(tail(r.output));
    console.error(`erro: ${p.label} falhou`);
    console.log(`resultado: ${relative(process.cwd(), writeResult())}`);
    cleanup(true);
    process.exit(1);
  }
}

const pg = await postgresReachable(projectDir);
if (!pg.ok) console.log(`aviso: Postgres fora do ar em ${pg.url ?? 'DATABASE_URL de apps/app-api/.env'}; os e2e do ticket vão falhar (pnpm db:up)`);

if (!opts.yes) {
  console.log('\nsem --yes: parou antes do claude. Para rodar à mão, no projeto:');
  console.log(`  cd ${quote(projectDir)}`);
  for (const s of scenario.steps) console.log(`  ${show('claude', claudeArgs(scenario, s))}`);
  console.log(`  ${show(verifyCmd.cmd, verifyCmd.args)}`);
  cleanup(true);
  process.exit(0);
}

for (const [i, step] of scenario.steps.entries()) {
  console.log(`\npasso ${i + 1}/${scenario.steps.length}: ${step.prompt} (pode levar dezenas de minutos)`);
  const r = run('claude', claudeArgs(scenario, step), projectDir, { timeoutMs });
  let json = null;
  try {
    json = JSON.parse(r.stdout.trim().split('\n').filter(Boolean).at(-1) ?? '');
  } catch {}
  const record = {
    prompt: step.prompt,
    exit: r.exit,
    signal: r.signal,
    error: r.error,
    wall_ms: r.ms,
    subtype: json?.subtype ?? null,
    is_error: json?.is_error ?? null,
    duration_ms: json?.duration_ms ?? null,
    duration_api_ms: json?.duration_api_ms ?? null,
    num_turns: json?.num_turns ?? null,
    total_cost_usd: json?.total_cost_usd ?? null,
    usage: json?.usage ?? null,
    model_usage: json?.modelUsage ?? null,
    permission_denials: json?.permission_denials ?? null,
    session_id: json?.session_id ?? null,
    result_excerpt: typeof json?.result === 'string' ? json.result.slice(-2000) : tail(r.stdout, 20),
  };
  result.steps.push(record);
  console.log(
    `  exit ${r.exit} · ${Math.round(r.ms / 1000)} s · ${record.num_turns ?? '?'} turnos · US$ ${record.total_cost_usd ?? '?'}${record.permission_denials?.length ? ` · ${record.permission_denials.length} permissões negadas` : ''}`,
  );
}

console.log(`\n$ ${show(verifyCmd.cmd, verifyCmd.args)}`);
const v = run(verifyCmd.cmd, verifyCmd.args, projectDir, { capture: true });
result.verify = { ok: v.exit === 0, exit: v.exit, ms: v.ms, checks: verifyChecks(v.output), tail: tail(v.output) };
result.tickets = ticketStatuses(projectDir);
result.git = gitSummary(projectDir);
result.totals = totals(result.steps);
const file = writeResult();

console.log(`  verify ${result.verify.ok ? 'verde' : 'vermelho'}`);
console.log(`\ntickets: ${Object.entries(result.tickets).map(([id, s]) => `${id} ${s}`).join(', ')}`);
console.log(
  `total: ${result.totals.num_turns} turnos · US$ ${result.totals.total_cost_usd} · ${result.totals.input_tokens + result.totals.cache_creation_input_tokens + result.totals.cache_read_input_tokens} tokens de entrada · ${result.totals.output_tokens} de saída`,
);
console.log(`resultado: ${relative(process.cwd(), file)}`);
cleanup(opts.keep);
process.exit(result.verify.ok ? 0 : 1);
