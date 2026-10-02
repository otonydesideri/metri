import { afterAll, describe, expect, it } from 'vitest';
import { copyFixture, edit, FIXTURE, REPO, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

const PAGE = 'apps/app-web/src/pages/orders/orders-page.tsx';
const MAIL = 'apps/app-api/src/infra/services/mail/resend-mail.service.ts';
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
      'frontend/order-list — a lista de pedidos do painel — o estado vazio sem a ação de criar pedido. (.metri/rules/frontend/order-list.md)',
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
    const backend = ids(run('rules-for', ['--root', FIXTURE, MAIL]).lines);
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
    expect(ids(lines)).toEqual(['infrastructure/mail', 'infrastructure/runtime']);
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
    const storage = 'apps/app-api/src/infra/services/storage/r2-storage.service.ts';
    expect(ids(run('rules-for', ['--root', FIXTURE, storage]).lines)).toContain('infrastructure/storage');
    expect(ids(run('rules-for', ['--root', REPO, MAIL]).lines)).toContain('infrastructure/mail');
  });

  it('orçamento: mais de 5 regras gera aviso, sem erro', () => {
    const { status, lines } = run('rules-for', ['--root', FIXTURE, '--ticket', 'UC1.2']);
    expect(status).toBe(0);
    expect(ids(lines)).toHaveLength(7);
    expect(lines).toContain('aviso: 7 regras, mais de 5: ticket grande demais ou applies_to largo');
    expect(run('rules-for', ['--root', FIXTURE, PAGE]).lines.join('\n')).not.toContain('mais de 5');
  });

  it('colisão de id com regra global é erro, salvo substituição declarada com ADR', () => {
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
        '## Exceções e defaults trocados\n\n- frontend/components substituída pela regra do projeto → ADR-0001\n',
      ),
    );
    const replaced = run('rules-for', ['--root', dir, PAGE]);
    expect(replaced.status).toBe(0);
    expect(replaced.lines).toContain('frontend/components — componentes do projeto (.metri/rules/frontend/components.md)');
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
    expect(run('rules-for', ['--root', dir, '--ticket', 'UC1.2']).lines).toContain(
      'aviso: 7 regras, mais de 5: exceção esperada, primeiro ticket depois do pattern T2.1',
    );
  });

  it('sem caminho nem ticket é erro', () => {
    expect(run('rules-for', ['--root', FIXTURE]).status).toBe(1);
  });
});
