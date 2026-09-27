import { afterAll, describe, expect, it } from 'vitest';
import { copyFixture, edit, FIXTURE, REPO, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

const PAGE = 'apps/app-web/src/pages/orders/orders-page.tsx';
const MAIL = 'apps/app-api/src/infra/services/mail/resend-mail.service.ts';

function ids(lines: string[]): string[] {
  return lines.filter((line) => line.includes(' — ')).map((line) => line.split(' — ')[0]);
}

describe('rules-for', () => {
  it('caminho: casa com o applies_to global e do projeto, projeto primeiro, com read_first e exceção', () => {
    const { status, lines } = run('rules-for.ts', ['--root', FIXTURE, PAGE]);
    expect(status).toBe(0);
    expect(ids(lines)).toEqual(['frontend/order-list', 'frontend/components', 'frontend/state']);
    expect(lines[0]).toBe(
      'frontend/order-list — a lista de pedidos do painel — paginação no servidor e filtros na URL. (docs/architecture/frontend/order-list.md)',
    );
    expect(lines).toContain(
      'exceção: `frontend/components`, "Estados de leitura": a lista de pedidos pagina no servidor → ADR-0001',
    );
    expect(lines.join('\n')).not.toContain('Obrigatório');
  });

  it('glob: expande contra os arquivos do projeto', () => {
    expect(ids(run('rules-for.ts', ['--root', FIXTURE, 'apps/**/*.tsx']).lines)).toEqual([
      'frontend/order-list',
      'frontend/components',
      'frontend/state',
    ]);
    expect(run('rules-for.ts', ['--root', FIXTURE, 'libs/**']).lines).toContain(
      'aviso: libs/** não casa com nenhum arquivo',
    );
  });

  it('regra sem applies_to não sai por caminho: backend/layers e frontend/structure; backend/boundaries sai', () => {
    expect(ids(run('rules-for.ts', ['--root', FIXTURE, PAGE]).lines)).not.toContain('frontend/structure');
    const backend = ids(run('rules-for.ts', ['--root', FIXTURE, MAIL]).lines);
    expect(backend).toContain('backend/boundaries');
    expect(backend).not.toContain('backend/layers');
  });

  it('ticket UC: usa os ids de areas do bloco do UC e expande read_first', () => {
    const { status, lines } = run('rules-for.ts', ['--root', FIXTURE, '--ticket', 'UC1.1']);
    expect(status).toBe(0);
    expect(ids(lines)).toEqual(['frontend/order-list', 'frontend/components', 'frontend/data-fetching', 'frontend/state']);
  });

  it('ticket T: usa os ids de areas do bloco do T', () => {
    const { status, lines } = run('rules-for.ts', ['--root', FIXTURE, '--ticket', 'T2.1']);
    expect(status).toBe(0);
    expect(ids(lines)).toEqual(['infrastructure/runtime']);
  });

  it('ticket inexistente é erro', () => {
    const { status, lines } = run('rules-for.ts', ['--root', FIXTURE, '--ticket', 'T9.9']);
    expect(status).toBe(1);
    expect(lines[0]).toMatch(/^erro: ticket T9.9 não existe/);
  });

  it('capacidade inativa: fica de fora, com aviso', () => {
    const { status, lines } = run('rules-for.ts', ['--root', FIXTURE, MAIL]);
    expect(status).toBe(0);
    expect(ids(lines)).not.toContain('infrastructure/mail');
    expect(lines).toContain(
      'aviso: capacidade condicional fora de "Capacidades ativas" do docs/architecture/INDEX.md, não entra: infrastructure/mail',
    );
  });

  it('capacidade ativa entra; no source, todas entram', () => {
    const storage = 'apps/app-api/src/infra/services/storage/r2-storage.service.ts';
    expect(ids(run('rules-for.ts', ['--root', FIXTURE, storage]).lines)).toContain('infrastructure/storage');
    expect(ids(run('rules-for.ts', ['--root', REPO, MAIL]).lines)).toContain('infrastructure/mail');
  });

  it('orçamento: mais de 5 regras gera aviso, sem erro', () => {
    const { status, lines } = run('rules-for.ts', ['--root', FIXTURE, '--ticket', 'UC1.2']);
    expect(status).toBe(0);
    expect(ids(lines)).toHaveLength(6);
    expect(lines).toContain('aviso: 6 regras, mais de 5: ticket grande demais ou applies_to largo');
    expect(run('rules-for.ts', ['--root', FIXTURE, PAGE]).lines.join('\n')).not.toContain('mais de 5');
  });

  it('colisão de id com regra global é erro, salvo substituição declarada com ADR', () => {
    const dir = copyFixture();
    write(
      dir,
      'docs/architecture/frontend/components.md',
      '---\nid: frontend/components\ndescription: "componentes do projeto"\nuse_when: ["x"]\napplies_to: ["apps/app-web/src/**"]\nstatus: active\n---\n# Componentes\n',
    );
    const collision = run('rules-for.ts', ['--root', dir, PAGE]);
    expect(collision.status).toBe(1);
    expect(collision.lines[0]).toMatch(/^erro: docs\/architecture\/frontend\/components\.md: o id frontend\/components já é regra global/);

    edit(dir, 'docs/architecture/INDEX.md', (source) =>
      source.replace(
        '## Exceções e defaults trocados\n',
        '## Exceções e defaults trocados\n\n- frontend/components substituída pela regra do projeto → ADR-0001\n',
      ),
    );
    const replaced = run('rules-for.ts', ['--root', dir, PAGE]);
    expect(replaced.status).toBe(0);
    expect(replaced.lines).toContain('frontend/components — componentes do projeto (docs/architecture/frontend/components.md)');
    expect(replaced.lines.join('\n')).not.toContain('.metri/architecture/frontend/components.md');
  });

  it('Caminhos do projeto: o glob do INDEX soma ao applies_to da regra', () => {
    const { lines } = run('rules-for.ts', ['--root', FIXTURE, 'packages/orders-contract/src/order.schema.ts']);
    expect(ids(lines)).toEqual(['backend/http-api']);
  });

  it('sem caminho nem ticket é erro', () => {
    expect(run('rules-for.ts', ['--root', FIXTURE]).status).toBe(1);
  });
});
