import { rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { copyFixture, copySource, edit, REPO, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

const MATRIX = '.metri/MATRIX.md';
const TICKETS = '.metri/tickets';

function lint(dir: string): { status: number | null; lines: string[] } {
  return run('docs-lint', ['--root', dir]);
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

function inTicket(id: string, from: string, to: string): (dir: string) => void {
  return (dir) => edit(dir, `${TICKETS}/${id}.md`, (source) => source.replace(from, to));
}

describe('docs-lint', { timeout: 30_000 }, () => {
  it('passa: a fixture de projeto e este repositório (modo source)', () => {
    expect(lint(copyFixture())).toEqual({ status: 0, lines: [] });
    // No source, só sai aviso de citação a arquivo planejado (cli/docs-lint.planned.json).
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

  it('agents (source): name igual ao arquivo, description e tools não vazio', () => {
    const dir = copySource();
    write(dir, 'agents/good.md', '---\nname: good\ndescription: Does X.\ntools: Read, Grep\n---\nBody.\n');
    write(dir, 'agents/bad.md', '---\nname: other\ntools: ""\n---\nBody.\n');
    const { status, lines } = lint(dir);
    expect(status).toBe(1);
    expect(lines).toContain('agents/bad.md:2: agent: name other diferente do arquivo bad');
    expect(lines).toContain('agents/bad.md:1: agent: falta a description');
    expect(lines).toContain('agents/bad.md:3: agent: tools vazio (sem a chave, o agent herda as ferramentas da sessão)');
    expect(lines.join('\n')).not.toContain('agents/good.md');
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

  it('árvore fechada de .metri/: arquivo fora da lista é erro; evidência do ticket entra', () => {
    const { status, output } = lintChanged((dir) => write(dir, '.metri/notes.md', '# Notas\n'));
    expect(status).toBe(1);
    expect(output).toContain('.metri/notes.md:1: árvore de .metri/: arquivo fora da lista fechada');
    expect(lintChanged((dir) => write(dir, '.metri/tickets/UC1.1/1-desktop.png', 'png')).status).toBe(0);
    expect(lintChanged((dir) => write(dir, '.metri/tickets/UC1.1/notas.txt', 'x')).output).toContain(
      '.metri/tickets/UC1.1/notas.txt:1: árvore de .metri/: arquivo fora da lista fechada',
    );
  });

  it('árvore fechada de .metri/: <tema>.examples.md de regra do projeto entra', () => {
    expect(lintChanged((dir) => write(dir, '.metri/rules/frontend/order-list.examples.md', '# Exemplos\n')).status).toBe(0);
  });

  it('árvore fechada de .metri/: INDEX de área não gerado é erro', () => {
    const { status, output } = lintChanged((dir) =>
      edit(dir, '.metri/rules/frontend/INDEX.md', (source) => source.replace('Gerado por', 'Feito por')),
    );
    expect(status).toBe(1);
    expect(output).toContain('.metri/rules/frontend/INDEX.md:1: árvore de .metri/: INDEX de área é gerado');
  });

  it('links: cada skill do pacote tem o seu em .claude/skills, apontando para node_modules/metri', () => {
    const missing = lintChanged((dir) => rmSync(join(dir, '.claude/skills/build')));
    expect(missing.status).toBe(1);
    expect(missing.output).toContain('.claude/skills/build:1: link: falta o link para ../../node_modules/metri/skills/build');
    const wrong = lintChanged((dir) => {
      rmSync(join(dir, '.claude/skills/build'));
      symlinkSync('../../elsewhere/build', join(dir, '.claude/skills/build'));
    });
    expect(wrong.output).toContain('link: aponta para ../../elsewhere/build');
  });

  it('ticket e MATRIX citam só ids: caminho de arquivo .md é erro', () => {
    const ticket = lintChanged(inTicket('UC1.1', '## Notas', '## Notas\n\nVer docs/DESIGN.md.'));
    expect(ticket.status).toBe(1);
    expect(ticket.output).toContain('citação: docs/DESIGN.md é caminho de arquivo; ticket e MATRIX citam só ids');
    expect(lintChanged(inMatrix('- Como relatórios', '- Ver `frontend/components.md`. Como relatórios')).output).toContain(
      'citação: frontend/components.md é caminho de arquivo',
    );
  });

  it('regra do projeto: frontmatter checado como no source', () => {
    const { status, output } = lintChanged((dir) =>
      edit(dir, '.metri/rules/frontend/order-list.md', (source) =>
        source.replace('read_first: [frontend/state]', 'read_first: [frontend/nope]'),
      ),
    );
    expect(status).toBe(1);
    expect(output).toContain('read_first: a regra frontend/nope não existe');
  });

  it('gerados: INDEX do projeto desatualizado é erro', () => {
    const { status, output } = lintChanged((dir) =>
      edit(dir, '.metri/rules/frontend/order-list.md', (source) =>
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
      edit(dir, '.metri/ARCHITECTURE.md', (source) =>
        source.replace('apps/app-api/src/legacy/**', 'apps/app-api/src/old/**'),
      ),
    );
    expect(status).toBe(0);
    expect(output).toContain('aviso: applies_to: apps/app-api/src/old/** não casa com nenhum arquivo');
  });

  it('MATRIX: títulos de seção fixos', () => {
    const { status, output } = lintChanged(inMatrix('## Fog', '## Névoa'));
    expect(status).toBe(1);
    expect(output).toContain('seções: ## Features, ## Slices, ## Fog, ## Gaps, ## Pattern proposals, nessa ordem');
  });

  it('MATRIX: ids no formato', () => {
    expect(lintChanged(inMatrix('### F2 · Relatórios', '### Feature 2 · Relatórios')).output).toContain(
      'título fora do formato: ### Feature 2 · Relatórios',
    );
    expect(lintChanged(inMatrix('- GAP-1 · filtro', '- GAP · filtro')).output).toContain('Gaps: "GAP · filtro');
  });

  it('MATRIX: chaves e valores do VOCABULARY', () => {
    expect(lintChanged(inMatrix('horizon: planned', 'horizon: later')).output).toContain(
      'horizon: later fora de now | planned | fog | out',
    );
    expect(lintChanged(inMatrix('ucs: [UC1.1, UC1.2]', 'featured: [UC1.1, UC1.2]')).output).toContain(
      'chave featured fora do VOCABULARY para feature',
    );
  });

  it('MATRIX: slice now serve a uma feature now (slices da feature ou slice de um ticket)', () => {
    expect(lintChanged(inMatrix('horizon: now · slices: [S1, S2]', 'horizon: now · slices: [S1]')).status).toBe(0);
    const unserved = lintChanged((dir) => {
      inMatrix('horizon: now · slices: [S1, S2]', 'horizon: now · slices: [S1]')(dir);
      inTicket('UC1.2', 'slice: S2', 'slice: S1')(dir);
      inTicket('T2.1', 'slice: S2', 'slice: S1')(dir);
    });
    expect(unserved.status).toBe(1);
    expect(unserved.output).toContain('S2: slice now que nenhuma feature now serve');
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

  it('MATRIX: a slice de fundação, S0, não tem contract nem entry', () => {
    const foundation = '### S0 · Fundação\n\nhorizon: now\n\n### S1 · Lista de pedidos';
    const ticket = '---\nid: T0.1\ntitle: Fundação\nslice: S0\ntype: task\nstatus: open\nmode: afk\nchecks: ["`pnpm verify`"]\n---\n\n# T0.1 · Fundação\n\n## O que entrega\n\nO monorepo com o verify verde.\n\n## Critérios\n\n- [ ] O `pnpm verify` passa.\n';
    expect(
      lintChanged((dir) => {
        inMatrix('### S1 · Lista de pedidos', foundation)(dir);
        write(dir, `${TICKETS}/T0.1.md`, ticket);
      }),
    ).toEqual({ status: 0, output: '' });
    const done = '### S0 · Fundação\n\nstatus: done\n\n### S1 · Lista de pedidos';
    expect(lintChanged(inMatrix('### S1 · Lista de pedidos', done)).status).toBe(0);
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

  it('Tickets: a árvore aceita .metri/tickets/<id>.md, e o nome do arquivo tem que ser um id de UC ou T', () => {
    const { status, output } = lintChanged((dir) => write(dir, `${TICKETS}/notes.md`, '---\nid: notes\n---\n# Notas\n'));
    expect(status).toBe(1);
    expect(output).toContain('nome de arquivo: notes.md fora do formato UC<f>.<n>.md ou T<s>.<n>.md');
    expect(output).not.toContain('árvore de .metri/: arquivo fora da lista fechada');
  });

  it('Tickets: o frontmatter id bate com o nome do arquivo', () => {
    const { status, output } = lintChanged(inTicket('UC1.1', 'id: UC1.1', 'id: UC1.2'));
    expect(status).toBe(1);
    expect(output).toContain('frontmatter: id UC1.2 diferente do nome do arquivo UC1.1.md');
  });

  it('Tickets: frontmatter válido (chave fora de VOCABULARY, chave vazia)', () => {
    expect(lintChanged(inTicket('UC1.1', 'actor: operador', 'owner: operador')).output).toContain(
      'frontmatter: chave owner fora de VOCABULARY.md para UC',
    );
    expect(lintChanged(inTicket('T2.1', 'type: task', 'uc: UC1.2\ntype: task')).output).toContain(
      'frontmatter: chave uc fora de VOCABULARY.md para T',
    );
    expect(lintChanged(inTicket('UC1.1', 'touches: [router:orders]', 'touches: []')).output).toContain(
      'frontmatter: chave touches vazia',
    );
  });

  it('Tickets: status, mode, type e sensitive dentro do permitido; draft só no UC', () => {
    expect(lintChanged(inTicket('T2.1', 'mode: hitl', 'mode: solo')).output).toContain('mode: solo fora de afk | hitl');
    expect(lintChanged(inTicket('T2.1', 'type: task', 'type: tracer')).output).toContain('type: tracer fora de pattern | task | release');
    expect(lintChanged(inTicket('T2.1', 'type: task', 'type: pattern')).status).toBe(0);
    expect(lintChanged(inTicket('T2.1', 'status: open', 'status: draft')).output).toContain(
      'status: draft fora de open | in_progress | blocked | done',
    );
    expect(lintChanged(inTicket('T2.1', 'sensitive: true', 'sensitive: "true"')).output).toContain(
      'sensitive: precisa ser true ou false (booleano, sem aspas)',
    );
  });

  it('Tickets: UC fora de draft sem slice, mode ou checks; T sempre exige type, slice, mode e checks', () => {
    expect(lintChanged(inTicket('UC1.1', 'slice: S1\n', '')).output).toContain('UC1.1: falta a chave slice (UC fora de draft)');
    expect(lintChanged(inTicket('UC1.1', 'mode: afk\n', '')).output).toContain('UC1.1: falta a chave mode (UC fora de draft)');
    expect(lintChanged(inTicket('UC1.1', 'status: in_progress', 'status: draft')).status).toBe(0);
    const noType = lintChanged(inTicket('T2.1', 'type: task\n', ''));
    expect(noType.output).toContain('T2.1: falta a chave type');
    expect(lintChanged(inTicket('T2.1', 'status: open', 'status: done')).status).toBe(0);
  });

  it('Tickets: UC fora de draft tem em checks um teste além de pnpm verify', () => {
    const checks = 'checks: ["`pnpm verify`", "`pnpm test orders-page`"]';
    const onlyVerify = lintChanged(inTicket('UC1.1', checks, 'checks: ["`pnpm verify`"]'));
    expect(onlyVerify.status).toBe(1);
    expect(onlyVerify.output).toContain(
      'checks de UC1.1: só pnpm verify; falta o teste ou padrão de teste que prova os critérios',
    );
    const testFile = 'checks: ["`pnpm verify`", "`pnpm vitest run apps/app-web/src/pages/orders/orders-page.test.tsx`"]';
    expect(lintChanged(inTicket('UC1.1', checks, testFile))).toEqual({ status: 0, output: '' });
  });

  it('Tickets: feature (UC) e slice (T) apontam para algo que existe, com o número certo', () => {
    expect(lintChanged(inTicket('UC1.1', 'feature: F1', 'feature: F9')).output).toContain('feature: F9 não existe na matriz');
    expect(lintChanged(inTicket('UC1.1', 'feature: F1', 'feature: F2')).output).toContain(
      'UC1.1: feature F2 diferente de F1; o número depois da letra no id é o de feature',
    );
    expect(lintChanged(inTicket('T2.1', 'slice: S2', 'slice: S9')).output).toContain('slice: S9 não existe na matriz');
    expect(lintChanged(inTicket('T2.1', 'slice: S2', 'slice: S1')).output).toContain(
      'T2.1: slice S1 diferente de S2; o número depois da letra no id é o de slice',
    );
  });

  it('Tickets: blocked_by aponta para um ticket ou uma slice que existe', () => {
    const { status, output } = lintChanged(inTicket('UC1.2', 'blocked_by: [UC1.1, T2.1]', 'blocked_by: [UC1.9, T2.1]'));
    expect(status).toBe(1);
    expect(output).toContain('blocked_by de UC1.2: UC1.9 não existe');
    expect(lintChanged(inTicket('UC1.2', 'blocked_by: [UC1.1, T2.1]', 'blocked_by: [UC1.1, T2.1, S1]')).status).toBe(0);
  });

  it('Tickets: todo UC fora de draft aparece em ucs da feature dele', () => {
    const { status, output } = lintChanged(inMatrix('ucs: [UC1.1, UC1.2]', 'ucs: [UC1.2]'));
    expect(status).toBe(1);
    expect(output).toContain('UC1.1: fora da lista ucs da feature F1 em .metri/MATRIX.md');
    // Draft não precisa aparecer em ucs (nem a chave precisa existir).
    expect(lintChanged(inMatrix('ucs: [UC2.1]\n', '')).status).toBe(0);
  });

  it('Tickets: T tem "O que entrega" (1 a 3 linhas) e "Critérios" (com item)', () => {
    const what = 'A conta no provedor de e-mail, com o domínio de envio verificado e a chave de API no env do app-api.';
    expect(lintChanged(inTicket('T2.1', `## O que entrega\n\n${what}\n`, '## O que entrega\n')).output).toContain(
      'T2.1: falta a seção "O que entrega"',
    );
    expect(lintChanged(inTicket('T2.1', what, `${what}\nlinha 2.\nlinha 3.`)).status).toBe(0);
    expect(lintChanged(inTicket('T2.1', what, `${what}\nlinha 2.\nlinha 3.\nlinha 4.`)).output).toContain(
      '"O que entrega" de T2.1: 4 linhas, mais de 3',
    );
    const items = '- [ ] O domínio de envio está verificado no provedor.\n- [ ] A chave de API existe no env de desenvolvimento do app-api.\n';
    expect(lintChanged(inTicket('T2.1', items, '')).output).toContain('T2.1: "Critérios" sem item');
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

  it('evidência: ticket done de frontend tem desktop e mobile por critério, até a poda da slice', () => {
    const done = inTicket('UC1.1', 'status: in_progress', 'status: done');
    const missing = lintChanged(done);
    expect(missing.status).toBe(1);
    expect(missing.output).toContain('evidência: falta .metri/tickets/UC1.1/1-desktop.png (frontend/experience)');
    expect(missing.output).toContain('evidência: falta .metri/tickets/UC1.1/1-mobile.png');
    const withEvidence = lintChanged((dir) => {
      done(dir);
      write(dir, '.metri/tickets/UC1.1/1-desktop.png', 'png');
      write(dir, '.metri/tickets/UC1.1/1-mobile.png', 'png');
    });
    expect(withEvidence).toEqual({ status: 0, output: '' });
    // sub-item recuado não é critério
    const nested = lintChanged((dir) => {
      done(dir);
      inTicket('UC1.1', '- [ ] A lista mostra os pedidos mais recentes primeiro.', '- [ ] A lista mostra os pedidos mais recentes primeiro.\n  - inclusive com zero pedidos')(dir);
      write(dir, '.metri/tickets/UC1.1/1-desktop.png', 'png');
      write(dir, '.metri/tickets/UC1.1/1-mobile.png', 'png');
    });
    expect(nested).toEqual({ status: 0, output: '' });
    const pruned = lintChanged((dir) => {
      done(dir);
      inMatrix('horizon: now · entry: apps/app-web/src/pages/orders/orders-page.tsx', 'status: done · entry: apps/app-web/src/pages/orders/orders-page.tsx')(dir);
    });
    expect(pruned.output).not.toContain('evidência');
  });
});
