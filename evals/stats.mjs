#!/usr/bin/env node
// evals/stats: o peso estático do método — regras, skills, agentes e o contexto que um builder carrega por ticket.
// Determinístico e sem rede. Uso:
//   node evals/stats.mjs                       imprime a tabela e grava evals/stats.json
//   node evals/stats.mjs --json                imprime o JSON (não grava)
//   node evals/stats.mjs --baseline <file>     compara com um stats.json anterior e imprime o delta
//   node evals/stats.mjs --root <dir>          mede outra cópia do Source (padrão: a pasta acima de evals/)
//   node evals/stats.mjs --label <texto>       anota o JSON (ex.: "baseline antes do corte")
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const opts = { json: false, baseline: null, root: resolve(HERE, '..'), label: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--baseline') opts.baseline = argv[++i];
    else if (a === '--root') opts.root = resolve(argv[++i]);
    else if (a === '--label') opts.label = argv[++i];
    else if (a === '-h' || a === '--help') {
      console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 8).join('\n').replace(/^\/\/ ?/gm, ''));
      process.exit(0);
    } else {
      console.error(`argumento desconhecido: ${a}`);
      process.exit(2);
    }
  }
  if (opts.baseline === undefined) {
    console.error('--baseline pede um arquivo');
    process.exit(2);
  }
  return opts;
}

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

const size = (file) => statSync(file).size;
const sumSize = (files) => files.reduce((acc, f) => acc + size(f), 0);

// Itens de lista sob um heading que começa com "Verifica", até o próximo heading de nível igual ou maior.
// Um item continua nas linhas seguintes até outro item, linha em branco ou heading.
function verificationItems(text) {
  const items = [];
  let level = 0;
  let inFence = false;
  let current = null;
  const flush = () => {
    if (current !== null) items.push(current);
    current = null;
  };
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      flush();
      continue;
    }
    if (inFence) continue;
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      const n = heading[1].length;
      if (/^Verifica/i.test(heading[2].trim())) level = n;
      else if (level && n <= level) level = 0;
      continue;
    }
    if (!level) continue;
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      flush();
      current = line.trim();
    } else if (line.trim() === '') flush();
    else if (current !== null) current += ` ${line.trim()}`;
  }
  flush();
  return items;
}

function architectureStats(root) {
  const dir = join(root, 'architecture');
  const files = walk(dir).filter((f) => f.endsWith('.md'));
  const examples = files.filter((f) => f.endsWith('.examples.md'));
  const rules = files.filter(
    (f) => !f.endsWith('.examples.md') && basename(f) !== 'INDEX.md' && readFileSync(f, 'utf8').startsWith('---\n'),
  );
  const perRule = {};
  let items = 0;
  let withCheck = 0;
  for (const f of rules) {
    perRule[relative(dir, f).replace(/\.md$/, '')] = kb(size(f));
    const list = verificationItems(readFileSync(f, 'utf8'));
    items += list.length;
    withCheck += list.filter((i) => /\(check:\s*[^)]+\)/.test(i)).length;
  }
  return {
    rules: rules.length,
    rules_kb: kb(sumSize(rules)),
    examples: examples.length,
    examples_kb: kb(sumSize(examples)),
    verification_items: items,
    verification_with_check: withCheck,
    per_rule_kb: sortedDesc(perRule),
  };
}

function sortedDesc(map) {
  return Object.fromEntries(Object.entries(map).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function folderStats(root, name, { perEntry }) {
  const dir = join(root, name);
  const total = kb(sumSize(walk(dir)));
  const per = {};
  if (existsSync(dir)) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (perEntry === 'dir' && entry.isDirectory()) per[entry.name] = kb(sumSize(walk(join(dir, entry.name))));
      if (perEntry === 'file' && entry.isFile() && entry.name.endsWith('.md'))
        per[entry.name.replace(/\.md$/, '')] = kb(size(join(dir, entry.name)));
    }
  }
  return { total_kb: total, [perEntry === 'dir' ? 'per_skill_kb' : 'per_agent_kb']: sortedDesc(per) };
}

// A linha de regra completa do rules-for termina em "(<path>)" ou "(<path>, <n> KB)";
// citada:, exceção:, aviso: e erro: não são regra completa.
const NOT_FULL = /^(citada|exceção|excecao|aviso|erro):/i;

export function fullRulePaths(output) {
  const paths = [];
  for (const raw of output.split('\n')) {
    const line = raw.trim();
    if (!line || NOT_FULL.test(line)) continue;
    const m = /\(([^()]+)\)\s*$/.exec(line);
    if (!m) continue;
    const inner = m[1].trim();
    const path = (/^(.*?),\s*[\d.,]+\s*KB$/i.exec(inner)?.[1] ?? inner).trim();
    if (path.endsWith('.md')) paths.push(path);
  }
  return paths;
}

function builderContext(root) {
  const project = join(root, 'cli', '__fixtures__', 'project');
  const ticketsDir = join(project, '.metri', 'tickets');
  const cli = join(root, 'cli', 'metri.mjs');
  const tickets = {};
  let totalFull = 0;
  let totalOutput = 0;
  const ids = existsSync(ticketsDir)
    ? readdirSync(ticketsDir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace(/\.md$/, ''))
        .sort()
    : [];
  for (const id of ids) {
    const run = spawnSync(process.execPath, [cli, 'rules-for', '--ticket', id, '--root', project], {
      encoding: 'utf8',
      cwd: root,
    });
    const stdout = run.stdout ?? '';
    const paths = fullRulePaths(stdout);
    const missing = [];
    let bytes = 0;
    for (const p of paths) {
      const abs = isAbsolute(p) ? p : resolve(project, p);
      if (existsSync(abs)) bytes += size(abs);
      else missing.push(p);
    }
    const outputBytes = Buffer.byteLength(stdout, 'utf8');
    tickets[id] = {
      exit: run.status,
      full_rules: paths.length,
      full_rules_kb: kb(bytes),
      output_kb: kb(outputBytes),
      ...(missing.length ? { missing } : {}),
      ...(run.status !== 0 && run.stderr?.trim() ? { stderr: run.stderr.trim().split('\n').slice(0, 3).join(' | ') } : {}),
    };
    totalFull += bytes;
    totalOutput += outputBytes;
  }
  return { tickets: ids.length, full_rules_kb: kb(totalFull), output_kb: kb(totalOutput), per_ticket: tickets };
}

function meta(root, label) {
  let version = null;
  try {
    version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version ?? null;
  } catch {}
  const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' });
  const isRepo = git.status === 0 && existsSync(join(root, '.git'));
  const commit = isRepo ? git.stdout.trim() : null;
  const dirty = isRepo
    ? spawnSync('git', ['status', '--porcelain', '--', 'architecture', 'skills', 'agents', 'cli'], { cwd: root, encoding: 'utf8' })
        .stdout.trim() !== ''
    : null;
  return { version, commit, dirty, ...(label ? { label } : {}) };
}

export function collect(root, label = null) {
  return {
    meta: meta(root, label),
    architecture: architectureStats(root),
    skills: folderStats(root, 'skills', { perEntry: 'dir' }),
    agents: folderStats(root, 'agents', { perEntry: 'file' }),
    builder_context: builderContext(root),
  };
}

// ---------- saída ----------

function table(rows, header) {
  const all = header ? [header, ...rows] : rows;
  const widths = all[0].map((_, i) => Math.max(...all.map((r) => String(r[i]).length)));
  const fmt = (r) => r.map((c, i) => (i === 0 ? String(c).padEnd(widths[i]) : String(c).padStart(widths[i]))).join('  ');
  const lines = all.map(fmt);
  if (header) lines.splice(1, 0, widths.map((w) => '-'.repeat(w)).join('  '));
  return lines.join('\n');
}

function report(s) {
  const a = s.architecture;
  const out = [];
  const commit = s.meta.commit ? ` (${s.meta.commit}${s.meta.dirty ? ' + mudanças não commitadas' : ''})` : '';
  out.push(`metri ${s.meta.version ?? '?'}${commit}${s.meta.label ? ` — ${s.meta.label}` : ''}`);
  out.push('');
  out.push('architecture/');
  out.push(
    table([
      ['regras', a.rules],
      ['prosa das regras (KB)', a.rules_kb],
      ['exemplos (arquivos)', a.examples],
      ['exemplos (KB)', a.examples_kb],
      ['itens de verificação', a.verification_items],
      ['  com (check: <id>)', a.verification_with_check],
    ]),
  );
  out.push('');
  out.push('maiores regras (KB)');
  out.push(table(Object.entries(a.per_rule_kb).slice(0, 10)));
  out.push('');
  out.push(`skills/ ${s.skills.total_kb} KB`);
  out.push(table(Object.entries(s.skills.per_skill_kb)));
  out.push('');
  out.push(`agents/ ${s.agents.total_kb} KB`);
  out.push(table(Object.entries(s.agents.per_agent_kb)));
  out.push('');
  out.push('contexto do builder por ticket (cli/__fixtures__/project)');
  out.push(
    table(
      Object.entries(s.builder_context.per_ticket).map(([id, t]) => [
        id,
        t.exit,
        t.full_rules,
        t.full_rules_kb,
        t.output_kb,
      ]),
      ['ticket', 'exit', 'regras', 'regras KB', 'saída KB'],
    ),
  );
  out.push(
    `total: ${s.builder_context.full_rules_kb} KB de regras completas, ${s.builder_context.output_kb} KB de saída do rules-for`,
  );
  return out.join('\n');
}

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else if (typeof v === 'number') out[key] = v;
  }
  return out;
}

const HEADLINE = [
  'architecture.rules',
  'architecture.rules_kb',
  'architecture.examples_kb',
  'architecture.verification_items',
  'architecture.verification_with_check',
  'skills.total_kb',
  'agents.total_kb',
  'builder_context.full_rules_kb',
  'builder_context.output_kb',
];

export function delta(base, cur) {
  const b = flatten({ ...base, meta: {} });
  const c = flatten({ ...cur, meta: {} });
  const keys = [...new Set([...Object.keys(b), ...Object.keys(c)])];
  const ordered = [...HEADLINE.filter((k) => keys.includes(k)), ...keys.filter((k) => !HEADLINE.includes(k)).sort()];
  const rows = [];
  for (const k of ordered) {
    const bv = b[k];
    const cv = c[k];
    if (!HEADLINE.includes(k) && bv === cv) continue;
    const d = bv !== undefined && cv !== undefined ? Math.round((cv - bv) * 10) / 10 : null;
    const pct = d !== null && bv ? `${d > 0 ? '+' : ''}${Math.round((d / bv) * 100)}%` : '';
    rows.push([k, bv ?? '—', cv ?? '—', d === null ? (bv === undefined ? 'novo' : 'saiu') : `${d > 0 ? '+' : ''}${d}`, pct]);
  }
  return rows;
}

// ---------- main ----------

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const opts = parseArgs(process.argv.slice(2));
  const stats = collect(opts.root, opts.label);
  if (opts.json) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    console.log(report(stats));
    const out = join(HERE, 'stats.json');
    writeFileSync(out, `${JSON.stringify(stats, null, 2)}\n`);
    console.log(`\ngravado: ${relative(process.cwd(), out) || out}`);
  }
  if (opts.baseline) {
    const base = JSON.parse(readFileSync(resolve(opts.baseline), 'utf8'));
    const rows = delta(base, stats);
    const label = base.meta?.label ?? base.meta?.commit ?? opts.baseline;
    // Com --json o stdout é só o JSON; o delta vai para o stderr.
    const print = opts.json ? console.error : console.log;
    print(`\ndelta contra ${label} (as métricas principais sempre; as demais só quando mudam)`);
    print(table(rows, ['métrica', 'antes', 'agora', 'delta', '%']));
  }
}
