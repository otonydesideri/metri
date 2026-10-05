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
