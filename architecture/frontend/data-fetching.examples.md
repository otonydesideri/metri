# Busca de dados no frontend: exemplos

## api/order.ts

```ts
// api/order.ts
import {
  type CreateOrderInput,
  type FetchOrdersFilters,
  type Order,
  type OrderList,
  orderListSchema,
  orderSchema,
} from '@metri/<pacote-dono>';
import { httpClient } from '@/lib/http/client';

export function fetchOrder(id: string): Promise<Order> {
  return httpClient(`/orders/${id}`, { output: orderSchema });
}

export function fetchOrders(filters?: FetchOrdersFilters): Promise<OrderList> {
  return httpClient('/orders', {
    query: filters,
    output: orderListSchema,
  });
}

export function createOrder(input: CreateOrderInput): Promise<{ order: Order }> {
  return httpClient('/orders', { method: 'POST', body: input });
}

export function cancelOrder(id: string): Promise<{ order: Order }> {
  return httpClient(`/orders/${id}/cancel`, { method: 'POST' });
}
```

## useConfirmOrder

```ts
// hooks/order/use-confirm-order.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmOrder } from '@/api/order';
import { orderKeys } from './keys';
import type { OrderDetails } from '@metri/<pacote-dono>';

export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmOrder,
    onSuccess: ({ order, invoice }) => {
      // a resposta carrega o estado novo — inclusive a fatura emitida no
      // mesmo commit: entra no cache do detalhe sem outra ida ao servidor
      queryClient.setQueryData<OrderDetails>(orderKeys.detail(order.id), (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          status: order.status,
          updatedAt: order.updatedAt,
          invoice,
        };
      });
      // ordenação, filtro e contagem da lista são do backend, e o pedido
      // pode mudar de página com o status novo: invalida
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
```

## useOrders

```ts
// hooks/order/use-orders.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { FetchOrdersFilters } from '@metri/<pacote-dono>';
import { fetchOrders } from '@/api/order';
import { orderKeys } from './keys';

export function useOrders(filters: FetchOrdersFilters) {
  const queryClient = useQueryClient();
  const { status, page, pageSize } = filters;

  const query = useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => fetchOrders(filters),
    placeholderData: (previous) => previous,
  });

  // deps primitivas de propósito: o objeto `filters` muda de referência a
  // cada render e dispararia o prefetch em todo commit
  const total = query.data?.total;

  useEffect(() => {
    const hasNextPage = total !== undefined && page * pageSize < total;

    if (hasNextPage) {
      const nextFilters = { status, page: page + 1, pageSize };
      queryClient.prefetchQuery({
        queryKey: orderKeys.list(nextFilters),
        queryFn: () => fetchOrders(nextFilters),
      });
    }
  }, [total, status, page, pageSize, queryClient]);

  return query;
}
```

## App

```tsx
// app/index.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '@metri/ui/components/providers/notification-provider';
import { Toaster } from '@metri/ui/components/ui/toast';
import { BrowserRouter } from 'react-router';
import { queryClient } from './providers/query-client';
import { AppRoutes } from './router/routes';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <NotificationProvider />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

## useCancelOrder

```ts
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: orderKeys.detail(id) });
      const previous = queryClient.getQueryData<Order>(orderKeys.detail(id));
      queryClient.setQueryData<Order>(orderKeys.detail(id), (old) => {
        if (!old) {
          return old;
        }
        return { ...old, status: 'CANCELLED' };
      });
      return { previous };
    },
    onError: (_err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(orderKeys.detail(id), context.previous);
      }
    },
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
}
```
