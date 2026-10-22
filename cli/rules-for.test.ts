import { afterAll, describe, expect, it } from 'vitest';
import { copyFixture, edit, FIXTURE, REPO, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

const PAGE = 'apps/app-web/src/pages/orders/orders-page.tsx';
const STORAGE = 'apps/app-api/src/infra/services/storage/r2-storage.service.ts';
const CACHE = 'apps/app-api/src/infra/services/cache/cache-provider.service.ts';

function ids(lines: string[]): string[] {
  return lines.filter((line) => line.includes(' — ') && !line.startsWith('citada: ')).map((line) => line.split(' — ')[0]);
}

describe('rules-for', { timeout: 30_000 }, () => {
  it('caminho: casa com o applies_to global e do projeto, projeto primeiro, com read_first e exceção', () => {
    const { status, lines } = run('rules-for', ['--root', FIXTURE, PAGE]);
    expect(status).toBe(0);
    expect(ids(lines)).toEqual(['frontend/order-list', 'frontend/components', 'frontend/experience', 'frontend/state']);
    expect(lines[0]).toBe(
      'frontend/order-list — a lista de pedidos do painel — o estado vazio sem a ação de criar pedido. (.metri/rules/frontend/order-list.md, 0.4 KB)',
    );
    expect(lines).toContain(
      'exceção: `frontend/components`, "Estados de leitura": o vazio da lista de pedidos não convida a criar → ADR-0001',
    );
    expect(lines.join('\n')).not.toContain('Obrigatório');
  });

  it('glob: expande contra os arquivos do projeto', () => {
    expect(ids(run('rules-for', ['--root', FIXTURE, 'apps/**/*.tsx']).lines)).toEqual([
      'frontend/order-list',
      'frontend/components',
      'frontend/experience',
      'frontend/state',
    ]);
    expect(run('rules-for', ['--root', FIXTURE, 'libs/**']).lines).toContain(
      'aviso: libs/** não casa com nenhum arquivo',
    );
  });

  it('regra sem applies_to não sai por caminho: backend/layers e frontend/structure; backend/boundaries sai', () => {
    expect(ids(run('rules-for', ['--root', FIXTURE, PAGE]).lines)).not.toContain('frontend/structure');
    const backend = ids(run('rules-for', ['--root', FIXTURE, STORAGE]).lines);
    expect(backend).toContain('backend/boundaries');
    expect(backend).not.toContain('backend/layers');
  });

  it('ticket UC: usa os ids de areas do bloco do UC e expande read_first', () => {
    const { status, lines } = run('rules-for', ['--root', FIXTURE, '--ticket', 'UC1.1']);
    expect(status).toBe(0);
    expect(ids(lines)).toEqual(['frontend/order-list', 'frontend/components', 'frontend/data-fetching', 'frontend/state']);
  });

  it('ticket T: usa os ids de areas do bloco do T', () => {
    const { status, lines } = run('rules-for', ['--root', FIXTURE, '--ticket', 'T2.1']);
    expect(status).toBe(0);
    expect(ids(lines)).toEqual(['infrastructure/runtime', 'infrastructure/storage']);
  });

  it('ticket inexistente é erro', () => {
    const { status, lines } = run('rules-for', ['--root', FIXTURE, '--ticket', 'T9.9']);
    expect(status).toBe(1);
    expect(lines[0]).toMatch(/^erro: ticket T9.9 não existe/);
  });

  it('capacidade inativa: fica de fora, com aviso', () => {
    const { status, lines } = run('rules-for', ['--root', FIXTURE, CACHE]);
    expect(status).toBe(0);
    expect(ids(lines)).not.toContain('infrastructure/cache');
    expect(lines).toContain(
      'aviso: capacidade condicional fora de "Capacidades ativas" do .metri/ARCHITECTURE.md, não entra: infrastructure/cache',
    );
  });

  it('capacidade ativa entra; no source, todas entram', () => {
    expect(ids(run('rules-for', ['--root', FIXTURE, STORAGE]).lines)).toContain('infrastructure/storage');
    expect(ids(run('rules-for', ['--root', REPO, CACHE]).lines)).toContain('infrastructure/cache');
  });

  it('orçamento: cada regra devolvida sai com o tamanho; mais de 80 KB somados gera aviso, sem erro', () => {
    const { status, lines } = run('rules-for', ['--root', FIXTURE, '--ticket', 'UC1.2']);
    expect(status).toBe(0);
    const sizes = lines.filter((line) => ids([line]).length === 1).map((line) => Number(/, ([\d.]+) KB\)$/.exec(line)?.[1]));
    expect(sizes).toHaveLength(7);
    expect(sizes.every((size) => size > 0)).toBe(true);
    expect(lines.filter((line) => line.startsWith('aviso: '))).toEqual([]);
    // the size counts, not the number of rules: the same 4 rules warn once one of them grows
    expect(ids(run('rules-for', ['--root', FIXTURE, PAGE]).lines)).toHaveLength(4);
    expect(run('rules-for', ['--root', FIXTURE, PAGE]).lines.join('\n')).not.toContain('mais de 80 KB');
    const dir = copyFixture();
    edit(dir, '.metri/rules/frontend/order-list.md', (source) => `${source}\n${'Texto longo da regra.\n'.repeat(4000)}`);
    expect(run('rules-for', ['--root', dir, PAGE]).lines.filter((line) => line.startsWith('aviso: '))).toEqual([
      expect.stringMatching(/^aviso: regras somam [\d.]+ KB, mais de 80 KB: divida o ticket se ele cruza áreas que os caminhos dele não pedem; regra longa é lição para a Source$/),
    ]);
  });

  it('colisão de id com regra global é erro, salvo substituição declarada, com ADR opcional', () => {
    const dir = copyFixture();
    write(
      dir,
      '.metri/rules/frontend/components.md',
      '---\nid: frontend/components\ndescription: "componentes do projeto"\nuse_when: ["x"]\napplies_to: ["apps/app-web/src/**"]\nstatus: active\n---\n# Componentes\n',
    );
    const collision = run('rules-for', ['--root', dir, PAGE]);
    expect(collision.status).toBe(1);
    expect(collision.lines[0]).toMatch(/^erro: .metri\/rules\/frontend\/components\.md: o id frontend\/components já é regra global/);

    edit(dir, '.metri/ARCHITECTURE.md', (source) =>
      source.replace(
        '## Exceções e defaults trocados\n',
        '## Exceções e defaults trocados\n\n- frontend/components substituída pela regra do projeto\n',
      ),
    );
    const replaced = run('rules-for', ['--root', dir, PAGE]);
    expect(replaced.status).toBe(0);
    expect(replaced.lines).toContain('frontend/components — componentes do projeto (.metri/rules/frontend/components.md, 0.1 KB)');
    expect(replaced.lines.join('\n')).not.toContain('node_modules/metri/architecture/frontend/components.md');
  });

  it('Caminhos do projeto: o glob do INDEX soma ao applies_to da regra', () => {
    const legacy = 'apps/app-api/src/legacy/order-export.ts';
    expect(ids(run('rules-for', ['--root', FIXTURE, legacy]).lines)).toContain('backend/http-api');
    const dir = copyFixture();
    edit(dir, '.metri/ARCHITECTURE.md', (source) => source.replace('- `apps/app-api/src/legacy/**` → backend/http-api\n', ''));
    expect(ids(run('rules-for', ['--root', dir, legacy]).lines)).not.toContain('backend/http-api');
  });

  it('citadas: as regras que as devolvidas citam, só com id e description, sem repetir as devolvidas', () => {
    const { lines } = run('rules-for', ['--root', FIXTURE, PAGE]);
    const cited = lines.filter((line) => line.startsWith('citada: ')).map((line) => line.slice(8).split(' — ')[0]);
    expect(cited).toContain('frontend/theming');
    expect(cited).toContain('frontend/forms');
    expect(cited).not.toContain('frontend/components');
    // a conditional capability outside "Capacidades ativas" is not cited
    const backend = run('rules-for', ['--root', FIXTURE, 'apps/app-api/src/main.ts']).lines.join('\n');
    expect(backend).not.toContain('citada: backend/async-jobs');
    expect(backend).not.toContain('citada: infrastructure/observability');
    expect(lines.join('\n')).not.toContain('Obrigatório');
  });

  it('orçamento: no primeiro ticket depois de um pattern novo, o aviso diz que é exceção esperada', () => {
    const dir = copyFixture();
    edit(dir, '.metri/tickets/T2.1.md', (source) => source.replace('type: task', 'type: pattern'));
    edit(dir, '.metri/tickets/UC1.2.md', (source) => source.replace('areas: [', 'areas: [frontend/order-list, '));
    edit(dir, '.metri/rules/frontend/order-list.md', (source) => `${source}\n${'Texto longo da regra.\n'.repeat(4000)}`);
    expect(run('rules-for', ['--root', dir, '--ticket', 'UC1.2']).lines).toContainEqual(
      expect.stringMatching(/^aviso: regras somam [\d.]+ KB, mais de 80 KB: exceção esperada, primeiro ticket depois do pattern T2\.1$/),
    );
  });

  it('exceção: sai a linha que cita uma regra devolvida ou citada; a de outra regra, não', () => {
    const dir = copyFixture();
    edit(dir, '.metri/ARCHITECTURE.md', (source) =>
      source.replace(
        '## Exceções e defaults trocados\n\n',
        '## Exceções e defaults trocados\n\n- `frontend/theming`, "Tokens": o painel usa a paleta do cliente → ADR-0001\n- `backend/errors`, "Envelope": o envelope legado da exportação, enquanto o parceiro não migra\n',
      ),
    );
    const { lines } = run('rules-for', ['--root', dir, PAGE]);
    expect(lines.some((line) => line.startsWith('citada: frontend/theming — '))).toBe(true);
    expect(lines).toContain('exceção: `frontend/theming`, "Tokens": o painel usa a paleta do cliente → ADR-0001');
    expect(lines).toContain(
      'exceção: `frontend/components`, "Estados de leitura": o vazio da lista de pedidos não convida a criar → ADR-0001',
    );
    expect(lines.join('\n')).not.toContain('backend/errors');
  });

  it('sem caminho nem ticket é erro', () => {
    expect(run('rules-for', ['--root', FIXTURE]).status).toBe(1);
  });
});
