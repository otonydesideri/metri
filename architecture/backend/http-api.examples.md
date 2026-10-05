# API HTTP: exemplos

## ConfirmOrderController

`POST /api/orders/:orderId/confirm`, a porta HTTP do `ConfirmOrderUseCase` (`backend/application.examples.md#confirmorderusecase`).

```ts
// src/infra/http/dtos/order/confirm-order-params.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const confirmOrderParamsSchema = z.object({
  orderId: z.uuid(),
});

export class ConfirmOrderParamsDto extends createZodDto(confirmOrderParamsSchema) {}
```

```ts
// src/infra/http/dtos/order/order-response.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { OrderStatus } from '../../../../domain/enterprise/enums/order-status.enum';

const isoDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (value) => new Date(value),
  encode: (date) => date.toISOString(),
});

export const orderSchema = z
  .object({
    id: z.uuid(),
    customerId: z.uuid(),
    status: z.enum(OrderStatus).meta({ id: 'OrderStatus' }),
    createdAt: isoDate,
    updatedAt: isoDate.nullable(),
  })
  .meta({ id: 'Order' });

export class OrderResponseDto extends createZodDto(
  z.object({ order: orderSchema }),
  { codec: true },
) {}
```

```ts
// src/infra/http/presenters/order.presenter.ts
import type { Order } from '../../../domain/enterprise/order.entity';

export class OrderPresenter {
  static toHTTP(order: Order) {
    return {
      id: order.id.toString(),
      customerId: order.customerId.toString(),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt ?? null,
    };
  }
}
```

```ts
// src/infra/http/controllers/order/confirm-order.controller.ts
import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ConfirmOrderUseCase } from '../../../../domain/application/use-cases/order/confirm-order.use-case';
import { toHttpException } from '../../../common/errors/to-http-exception';
import { ConfirmOrderParamsDto } from '../../dtos/order/confirm-order-params.dto';
import { OrderResponseDto } from '../../dtos/order/order-response.dto';
import { OrderPresenter } from '../../presenters/order.presenter';

@ApiTags('order')
@Controller('orders')
export class ConfirmOrderController {
  constructor(private readonly confirmOrder: ConfirmOrderUseCase) {}

  @Post(':orderId/confirm')
  @HttpCode(200)
  @ZodResponse({ status: 200, type: OrderResponseDto })
  async handle(@Param() params: ConfirmOrderParamsDto): Promise<OrderResponseDto> {
    const result = await this.confirmOrder.execute({ orderId: params.orderId });

    if (result.isFailure()) {
      throw toHttpException(result.value);
    }

    return { order: OrderPresenter.toHTTP(result.value.order) };
  }
}
```

## openapi.ts

```ts title="apps/app-api/src/openapi.ts"
// The OpenAPI generator of app-api (backend/http-api, "Contrato de API: o backend é a fonte"): mounts `AppModule`
// in `preview` (the module graph without instantiating providers, so no database and no env), with the same `/api`
// prefix as main.ts, and writes apps/app-api/openapi.json from `createOpenApiDocument`. It runs from the build,
// because the decorator metadata comes from it, through the root `pnpm api:generate`, which then runs the app-web
// Orval on the file; `pnpm verify` runs the same command and fails when openapi.json or app-web's src/api change
// (`api:drift`).

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { createOpenApiDocument } from './infra/http/openapi-document';

const OPENAPI_PATH = resolve(import.meta.dirname, '../openapi.json');

async function generate(): Promise<void> {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
		{ preview: true, logger: false },
	);
	app.setGlobalPrefix('api');

	writeFileSync(
		OPENAPI_PATH,
		`${JSON.stringify(createOpenApiDocument(app), null, 2)}\n`,
	);
	await app.close();
}

void generate();
```

## HealthController

```ts title="apps/app-api/src/infra/health/health.controller.ts"
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { HealthResponseDto } from '../http/dtos/health/health-response.dto';
import { DatabaseHealth } from './database-health';

/** SOURCE OF TRUTH: HealthController.
 * WHAT: `GET /api/health` answers 200 while the process serves requests, with `database` saying whether the Postgres answers.
 * WHY: an endpoint of external infra (probe, monitor), in its own module (infrastructure/runtime, "Composição no `AppModule`"). The database off is a state of the answer, not an error, so the probe and the start page still read it.
 * WHERE: registered by `HealthModule`; read by the probe, by the app-web start page and by the Playwright `webServer`.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
	constructor(private readonly databaseHealth: DatabaseHealth) {}

	@Get()
	@ZodResponse({ status: 200, type: HealthResponseDto })
	async check(): Promise<HealthResponseDto> {
		const isDatabaseUp = await this.databaseHealth.isUp();
		return { status: 'ok', database: isDatabaseUp ? 'up' : 'down' };
	}
}
```

## HealthResponseDto

```ts title="apps/app-api/src/infra/http/dtos/health/health-response.dto.ts"
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** SOURCE OF TRUTH: HealthResponseDto, healthResponseSchema.
 * WHAT: the body of `GET /api/health`: the process answers, and whether the database does.
 * WHY: every endpoint declares its response in the API contract, validated on the way out and published in the OpenAPI under the class name (backend/http-api, "Contrato de API: o backend é a fonte").
 * WHERE: used by `HealthController` in `@ZodResponse`; generated for app-web as `HealthResponseDto` in src/api/model.zod.ts.
 */
export const healthResponseSchema = z.object({
	status: z.literal('ok'),
	database: z.enum(['up', 'down']),
});

export class HealthResponseDto extends createZodDto(healthResponseSchema, {
	codec: true,
}) {}
```
