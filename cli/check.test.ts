import { afterAll, describe, expect, it } from 'vitest';
import { emptyProject, removeCopies, run, write } from './lib/testing.ts';

afterAll(removeCopies);

const CONTROLLER = "import { Controller } from '@nestjs/common';\n\n@Controller('health')\nexport class HealthController {}\n";

// A project that passes every check: a controller, a use case with Injectable, a date built in UTC.
function project(): string {
  const dir = emptyProject();
  write(dir, 'package.json', JSON.stringify({ name: 'app' }));
  write(dir, 'apps/app-api/src/infra/health/health.controller.ts', CONTROLLER);
  write(dir, 'apps/app-api/src/domain/application/use-cases/create-order.ts', "import { Injectable } from '@nestjs/common';\nimport { TZDate } from '@date-fns/tz';\nimport { right } from '@metri/core/types';\n");
  write(dir, 'apps/app-api/src/infra/persistence/prisma/prisma.service.ts', "import { PrismaClient } from '@metri/db/postgres/app';\n");
  write(dir, 'packages/core/src/types/either.ts', "import { randomUUID } from 'node:crypto';\nconst epoch = new Date(Date.UTC(2026, 0, 1));\n");
  return dir;
}

function check(dir: string, ...names: string[]): { status: number | null; lines: string[] } {
  return run('check', [...names, '--root', dir]);
}

describe('check', { timeout: 30_000 }, () => {
  it('projeto dentro das regras: sai 0, sem saída', () => {
    expect(check(project())).toEqual({ status: 0, lines: [] });
  });

  it('boundaries: cada import fora do grafo, pela fronteira dele', () => {
    const dir = project();
    write(dir, 'apps/app-api/src/domain/enterprise/entities/order.ts', "import { Module } from '@nestjs/common';\nimport { z } from 'zod';\nimport { PrismaService } from '../../../infra/persistence/prisma/prisma.service';\n");
    write(dir, 'apps/app-api/src/infra/http/controllers/order.controller.ts', "import { Order } from '@metri/db/postgres/app';\nimport { makeOrder } from '../../../../test/factories/make-order.factory';\n");
    write(dir, 'packages/core/src/entities/entity.ts', "import { z } from 'zod';\n");
    write(dir, 'apps/app-web/src/pages/orders/orders-page.tsx', "import { server } from '@/test/msw/server';\n");
    const { status, lines } = check(dir, 'boundaries');
    expect(status).toBe(1);
    expect(lines).toEqual([
      'falha boundaries: domain importando db, Zod ou nestjs-pino',
      '  apps/app-api/src/domain/enterprise/entities/order.ts: zod',
      'falha boundaries: enterprise importando NestJS',
      '  apps/app-api/src/domain/enterprise/entities/order.ts: @nestjs/common',
      'falha boundaries: domain importando src/infra',
      '  apps/app-api/src/domain/enterprise/entities/order.ts: ../../../infra/persistence/prisma/prisma.service',
      'falha boundaries: domain importando pacote externo fora da allowlist',
      '  apps/app-api/src/domain/enterprise/entities/order.ts: zod',
      'falha boundaries: domain usando de @nestjs/common algo além de Injectable',
      "  apps/app-api/src/domain/enterprise/entities/order.ts: import { Module } from '@nestjs/common'",
      'falha boundaries: @metri/db fora de infra/persistence/prisma e do setup do e2e',
      '  apps/app-api/src/infra/http/controllers/order.controller.ts: @metri/db/postgres/app',
      'falha boundaries: core com dependência externa',
      '  packages/core/src/entities/entity.ts: zod',
      'falha boundaries: produção do app-api importando test/',
      '  apps/app-api/src/infra/http/controllers/order.controller.ts: ../../../../test/factories/make-order.factory',
      'falha boundaries: produção do app-web importando test/',
      '  apps/app-web/src/pages/orders/orders-page.tsx: @/test/msw/server',
    ]);
  });

  it('boundaries: o pacote que o projeto libera no domínio, pela chave metri do package.json', () => {
    const dir = project();
    write(dir, 'apps/app-api/src/domain/enterprise/entities/money.ts', "import Decimal from 'decimal.js';\n");
    expect(check(dir, 'boundaries').status).toBe(1);
    write(dir, 'package.json', JSON.stringify({ name: 'app', metri: { checks: { boundaries: { domainPackages: ['decimal.js'] } } } }));
    expect(check(dir, 'boundaries')).toEqual({ status: 0, lines: [] });
  });

  it('date-time: new Date com componentes soltos no app-api e nos pacotes; o app-web fica de fora', () => {
    const dir = project();
    write(dir, 'apps/app-api/src/domain/enterprise/domain-services/cutoff.ts', 'const a = 1;\nconst cutoff = new Date(2026, 8, 30, 14);\n');
    write(dir, 'apps/app-web/src/shared/utils/today.ts', 'const today = new Date(2026, 8, 30);\n');
    expect(check(dir, 'date-time')).toEqual({
      status: 1,
      lines: [
        'falha date-time: new Date(...) com componentes soltos, sem fuso explícito (use TZDate, de @date-fns/tz, ou um instante ISO com offset ou Z)',
        '  apps/app-api/src/domain/enterprise/domain-services/cutoff.ts:2',
      ],
    });
  });

  it('boundaries: infra importando domain service', () => {
    const dir = project();
    write(dir, 'apps/app-api/src/infra/persistence/prisma/repositories/order.prisma-repository.impl.ts', "import { calculateLoyaltyDiscount } from '../../../../domain/enterprise/domain-services/calculate-loyalty-discount';\n");
    expect(check(dir, 'boundaries')).toEqual({
      status: 1,
      lines: [
        'falha boundaries: infra importando domain service',
        '  apps/app-api/src/infra/persistence/prisma/repositories/order.prisma-repository.impl.ts: ../../../../domain/enterprise/domain-services/calculate-loyalty-discount',
      ],
    });
  });

  it('boundaries: entidade importando domain service, sem acusar domain service importando outro', () => {
    const dir = project();
    write(dir, 'apps/app-api/src/domain/enterprise/order.entity.ts', "import { calculateLoyaltyDiscount } from './domain-services/calculate-loyalty-discount';\n");
    write(dir, 'apps/app-api/src/domain/enterprise/domain-services/calculate-loyalty-discount.ts', "import { roundMoney } from '../domain-services/round-money';\n");
    expect(check(dir, 'boundaries')).toEqual({
      status: 1,
      lines: [
        'falha boundaries: entidade importando domain service',
        '  apps/app-api/src/domain/enterprise/order.entity.ts: ./domain-services/calculate-loyalty-discount',
      ],
    });
  });

  it('check ou parâmetro que não existe é erro', () => {
    const dir = project();
    expect(check(dir, 'lint')).toEqual({ status: 1, lines: ['erro: o check lint não existe (metri check --help)'] });
    write(dir, 'package.json', JSON.stringify({ name: 'app', metri: { checks: { boundaries: { domainPackage: 'decimal.js' } } } }));
    expect(check(dir)).toEqual({
      status: 1,
      lines: ['erro: metri.checks.boundaries.domainPackage no package.json: o parâmetro não existe (metri check --help)'],
    });
  });
});
