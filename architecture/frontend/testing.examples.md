# Testes do frontend: exemplos

## orderRules.resolveDestination

```ts
// src/shared/rules/order.rule.spec.ts
describe('orderRules.resolveDestination', () => {
  it('pedido confirmado na rota de edição → rota de detalhe', () => {
    const destination = orderRules.resolveDestination({
      status: 'CONFIRMED',
      pathname: '/orders/order-1/edit',
    });

    expect(destination).toBe('/orders/order-1');
  });

  it('pedido confirmado na rota de detalhe → null', () => {
    const destination = orderRules.resolveDestination({
      status: 'CONFIRMED',
      pathname: '/orders/order-1',
    });

    expect(destination).toBe(null);
  });
});
```

## useConfirmOrder

```tsx
// src/hooks/order/use-confirm-order.spec.tsx
const APP_URL = window.location.origin;

describe('useConfirmOrder', () => {
  it('confirmação bem-sucedida → detalhe do pedido atualizado no cache', async () => {
    server.use(
      http.post(`${APP_URL}/api/orders/order-1/confirm`, () =>
        HttpResponse.json({
          order: { id: 'order-1', status: 'CONFIRMED', updatedAt: '2026-01-01T00:00:00.000Z' },
          invoice: { id: 'invoice-1' },
        }),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(orderKeys.detail('order-1'), makeOrder({ id: 'order-1' }).order);

    const { result } = renderHook(() => useConfirmOrder(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate('order-1');

    await waitFor(() => {
      expect(queryClient.getQueryData(orderKeys.detail('order-1'))).toMatchObject({
        status: 'CONFIRMED',
        invoice: { id: 'invoice-1' },
      });
    });
  });
});
```

## makeOrder

```ts
// test/factories/make-order.factory.ts
import { faker } from '@faker-js/faker';
import type { OrderStatus } from '@metri/<pacote-dono>';

interface OrderPayload {
  id: string;
  customerName: string;
  status: OrderStatus;
  totalInCents: number;
}

// o detalhe chega como envelope ({ order }): o override vale para o miolo
export function makeOrder(override: Partial<OrderPayload> = {}): { order: OrderPayload } {
  return {
    order: {
      id: faker.string.uuid(),
      customerName: faker.person.fullName(),
      status: 'DRAFT',
      totalInCents: faker.number.int({ min: 1000, max: 100_000 }),
      ...override,
    },
  };
}
```
