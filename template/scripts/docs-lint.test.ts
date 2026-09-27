import { afterAll, describe, expect, it } from 'vitest';
import { copyFixture, copySource, edit, FIXTURE, REPO, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

const MATRIX = 'docs/plan/MATRIX.md';

function lint(dir: string): { status: number | null; lines: string[] } {
  return run('docs-lint.ts', ['--root', dir]);
}

// Roda o docs-lint numa cópia da fixture depois da mudança e devolve a saída.
function lintChanged(change: (dir: string) => void): { status: number | null; output: string } {
  const dir = copyFixture();
  change(dir);
  const { status, lines } = lint(dir);
  return { status, output: lines.join('\n') };
}

function inMatrix(from: string, to: string): (dir: string) => void {
  return (dir) => edit(dir, MATRIX, (source) => source.replace(from, to));
}

describe('docs-lint', { timeout: 30_000 }, () => {
  it('passa: a fixture de projeto e este repositório (modo source)', () => {
    expect(lint(FIXTURE)).toEqual({ status: 0, lines: [] });
    // No source, só sai aviso de citação a arquivo planejado (template/scripts/docs-lint.planned.json).
    const source = lint(REPO);
    expect(source.status).toBe(0);
    expect(source.lines.filter((line) => !/: aviso: citação: .+ é arquivo planejado/.test(line))).toEqual([]);
  });

  it('skills (source): SKILL.md com name igual à pasta e description', () => {
    const dir = copySource();
    write(dir, 'skills/good/SKILL.md', '---\nname: good\ndescription: Does X. Use when Y.\n---\nBody.\n');
    write(dir, 'skills/demo/SKILL.md', '---\nname: other\n---\nBody.\n');
    write(dir, 'skills/empty/NOTES.md', '# Notas\n');
    const { status, lines } = lint(dir);
    expect(status).toBe(1);
    expect(lines).toContain('skills/demo/SKILL.md:2: skill: name other diferente da pasta demo');
    expect(lines).toContain('skills/demo/SKILL.md:1: skill: falta a description');
    expect(lines).toContain('skills/empty:1: skill: pasta sem SKILL.md');
    expect(lines.join('\n')).not.toContain('skills/good');
  });

  it('source: regra e skill não citam o README.md', () => {
    const dir = copySource();
    edit(dir, 'skills/tdd/SKILL.md', (source) => `${source}\nSee \`README.md\`.\n`);
    const { status, lines } = lint(dir);
    expect(status).toBe(1);
    expect(lines).toContain('skills/tdd/SKILL.md:42: citação: regra e skill não citam o README.md, que é para humano (cite o dono)');
  });

  it('árvore fechada de docs/: arquivo fora da lista é erro', () => {
    const { status, output } = lintChanged((dir) => write(dir, 'docs/notes.md', '# Notas\n'));
    expect(status).toBe(1);
    expect(output).toContain('docs/notes.md:1: árvore de docs/: arquivo fora da lista fechada');
  });

  it('árvore fechada de docs/: INDEX de área não gerado é erro', () => {
    const { status, output } = lintChanged((dir) =>
      edit(dir, 'docs/architecture/frontend/INDEX.md', (source) => source.replace('Gerado por', 'Feito por')),
    );
    expect(status).toBe(1);
    expect(output).toContain('docs/architecture/frontend/INDEX.md:1: árvore de docs/: INDEX de área é gerado');
  });

  it('regra do projeto: frontmatter checado como no source', () => {
    const { status, output } = lintChanged((dir) =>
      edit(dir, 'docs/architecture/frontend/order-list.md', (source) =>
        source.replace('read_first: [frontend/state]', 'read_first: [frontend/nope]'),
      ),
    );
    expect(status).toBe(1);
    expect(output).toContain('read_first: a regra frontend/nope não existe');
  });

  it('gerados: INDEX do projeto desatualizado é erro', () => {
    const { status, output } = lintChanged((dir) =>
      edit(dir, 'docs/architecture/frontend/order-list.md', (source) =>
        source.replace('paginação no servidor e filtros na URL.', 'paginação no servidor.'),
      ),
    );
    expect(status).toBe(1);
    expect(output).toContain('rules-index:check: desatualizado');
  });

  it('AGENTS.md com mais de 30 linhas: aviso, sem erro', () => {
    const { status, output } = lintChanged((dir) =>
      edit(dir, 'AGENTS.md', (source) => `${source}${'- linha\n'.repeat(30)}`),
    );
    expect(status).toBe(0);
    expect(output).toContain('AGENTS.md:1: aviso: AGENTS.md com 36 linhas, mais de 30');
  });

  it('applies_to sem casamento: aviso, sem erro', () => {
    const { status, output } = lintChanged((dir) =>
      edit(dir, 'docs/architecture/INDEX.md', (source) =>
        source.replace('packages/orders-contract/src/**', 'packages/billing-contract/src/**'),
      ),
    );
    expect(status).toBe(0);
    expect(output).toContain('aviso: applies_to: packages/billing-contract/src/** não casa com nenhum arquivo');
  });

  it('MATRIX: títulos de seção fixos', () => {
    const { status, output } = lintChanged(inMatrix('## Fog', '## Névoa'));
    expect(status).toBe(1);
    expect(output).toContain('seções: ## Features, ## Slices, ## Fog, ## Gaps, ## Pattern proposals, nessa ordem');
  });

  it('MATRIX: ids no formato e dentro do pai certo', () => {
    expect(lintChanged(inMatrix('### F2 · Relatórios', '### Feature 2 · Relatórios')).output).toContain(
      'título fora do formato: ### Feature 2 · Relatórios',
    );
    expect(lintChanged(inMatrix('#### T2.1 ·', '#### T1.2 ·')).output).toContain(
      'id: T1.2 dentro de S2; o número depois da letra é o da slice',
    );
    expect(lintChanged(inMatrix('- GAP-1 · filtro', '- GAP · filtro')).output).toContain('Gaps: "GAP · filtro');
  });

  it('MATRIX: chaves e valores do VOCABULARY', () => {
    expect(lintChanged(inMatrix('actor: operador', 'owner: operador')).output).toContain(
      'chave owner fora do VOCABULARY para uc',
    );
    expect(lintChanged(inMatrix('horizon: planned', 'horizon: later')).output).toContain(
      'horizon: later fora de now | planned | fog | out',
    );
    expect(lintChanged(inMatrix('slice: S1 · mode: afk', 'slice: S1 · mode: solo')).output).toContain(
      'mode: solo fora de afk | hitl',
    );
  });

  it('MATRIX: nenhuma chave vazia', () => {
    const { status, output } = lintChanged(inMatrix('touches: [router:orders]', 'touches: []'));
    expect(status).toBe(1);
    expect(output).toContain('chave touches vazia em UC1.1');
  });

  it('MATRIX: nada órfão', () => {
    const noSlice = lintChanged(inMatrix('status: in_progress · slice: S1 · ', 'status: in_progress · '));
    expect(noSlice.status).toBe(1);
    expect(noSlice.output).toContain('UC1.1: UC fora de draft sem slice');
    expect(lintChanged(inMatrix('status: in_progress · slice: S1 · mode: afk · sensitive: false', 'status: draft')).status).toBe(0);
    expect(lintChanged(inMatrix('horizon: now · slices: [S1, S2]', 'horizon: now · slices: [S1]')).status).toBe(0);
    const unserved = lintChanged((dir) => {
      inMatrix('horizon: now · slices: [S1, S2]', 'horizon: now · slices: [S1]')(dir);
      inMatrix('slice: S2', 'slice: S1')(dir);
    });
    expect(unserved.status).toBe(1);
    expect(unserved.output).toContain('S2: slice now que nenhuma feature now serve');
    expect(lintChanged(inMatrix('## Slices\n', '## Slices\n\n#### T0.1 · Solto\n')).output).toContain(
      'T0.1 fora de uma slice',
    );
  });

  it('MATRIX: blocked_by aponta para um UC, T ou slice que existe', () => {
    const { status, output } = lintChanged(inMatrix('blocked_by: [UC1.1, T2.1]', 'blocked_by: [UC1.9, T2.1]'));
    expect(status).toBe(1);
    expect(output).toContain('blocked_by de UC1.2: UC1.9 não existe na matriz');
    expect(lintChanged(inMatrix('blocked_by: [UC1.1, T2.1]', 'blocked_by: [UC1.1, T2.1, S1]')).status).toBe(0);
  });

  it('MATRIX: chaves de ticket obrigatórias no UC fora de draft', () => {
    expect(lintChanged(inMatrix('slice: S1 · mode: afk · ', 'slice: S1 · ')).output).toContain(
      'UC1.1: falta a chave mode (UC fora de draft)',
    );
    expect(lintChanged(inMatrix('checks: [`pnpm verify`]\n\n- BR1', '- BR1')).output).toContain(
      'UC1.1: falta a chave checks (UC fora de draft)',
    );
    const pruned = lintChanged((dir) =>
      edit(dir, MATRIX, (source) =>
        source.replace(/actor: cliente · status: open[^\n]*\nareas: [^\n]*\nchecks: [^\n]*\n/, 'status: done → apps/app-api/test/order-confirmation.e2e-spec.ts\n'),
      ),
    );
    expect(pruned).toEqual({ status: 0, output: '' });
  });

  it('MATRIX: what e criteria obrigatórios no ticket T', () => {
    const what = 'what: A conta no provedor de e-mail, com o domínio de envio verificado e a chave de API no env do app-api.\n';
    expect(lintChanged(inMatrix(what, '')).output).toContain('T2.1: falta a chave what');
    expect(lintChanged(inMatrix(what, `${what}  linha 2.\n  linha 3.\n`)).status).toBe(0);
    expect(lintChanged(inMatrix(what, `${what}  linha 2.\n  linha 3.\n  linha 4.\n`)).output).toContain(
      'what de T2.1: 4 linhas, mais de 3',
    );
    const items = '- [ ] O domínio de envio está verificado no provedor.\n- [ ] A chave de API existe no env de desenvolvimento do app-api.\n';
    expect(lintChanged(inMatrix(`criteria:\n${items}`, '')).output).toContain('T2.1: falta a chave criteria');
    expect(lintChanged(inMatrix(items, '')).output).toContain('criteria de T2.1 sem item');
  });

  it('MATRIX: type do ticket T só pattern, task ou release; uc não é chave', () => {
    const tracer = lintChanged(inMatrix('type: task', 'type: tracer'));
    expect(tracer.status).toBe(1);
    expect(tracer.output).toContain('type: tracer fora de pattern | task | release');
    expect(lintChanged(inMatrix('type: task', 'type: pattern')).status).toBe(0);
    expect(lintChanged(inMatrix('type: task', 'uc: UC1.2 · type: task')).output).toContain(
      'chave uc fora do VOCABULARY para ticket',
    );
  });

  it('MATRIX: status draft só no UC', () => {
    const draft = lintChanged(inMatrix('status: open · sensitive: true', 'status: draft · sensitive: true'));
    expect(draft.status).toBe(1);
    expect(draft.output).toContain('status: draft só no UC (T2.1)');
  });

  it('MATRIX: slice com contract ou entry, e done com entry', () => {
    expect(
      lintChanged(inMatrix('horizon: now · blocked_by: [S1]', 'horizon: now · blocked_by: [S1] · entry: apps/x.ts')).output,
    ).toContain('S2: contract e entry juntos');
    expect(
      lintChanged(inMatrix('horizon: now · entry: apps/app-web/src/pages/orders/orders-page.tsx', 'status: done')).output,
    ).toContain('S1: slice done sem entry');
    expect(lintChanged(inMatrix('  invariants: Um aviso por mudança de estado.\n', '')).output).toContain(
      'contract de S2: falta invariants',
    );
  });

  it('MATRIX: o entry existe e tem o cabeçalho de contrato', () => {
    expect(
      lintChanged((dir) =>
        edit(dir, 'apps/app-web/src/pages/orders/orders-page.tsx', (source) =>
          source.replace(' * Previsto: filtros por período (F2).\n', ''),
        ),
      ).output,
    ).toContain('entry: cabeçalho de apps/app-web/src/pages/orders/orders-page.tsx sem Previsto');
    expect(lintChanged(inMatrix('orders/orders-page.tsx', 'orders/page.tsx')).output).toContain(
      'entry: apps/app-web/src/pages/orders/page.tsx não existe',
    );
  });

  it('ADR: status permitido e as seções do formato', () => {
    const adr = 'docs/adr/0001-orders-server-pagination.md';
    expect(lintChanged((dir) => edit(dir, adr, (source) => source.replace('accepted', 'proposed'))).output).toContain(
      'ADR: status accepted ou superseded by ADR-NNNN',
    );
    expect(
      lintChanged((dir) => edit(dir, adr, (source) => source.replace('## Imposto por\n\nnão imposto\n', ''))).output,
    ).toContain('ADR: seções Contexto, Decisão, Alternativas consideradas, Consequências, Imposto por, nessa ordem');
  });
});
