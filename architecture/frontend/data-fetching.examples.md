# Busca de dados no frontend: exemplos

## useConfirmOrder

```ts
// hooks/order/use-confirm-order.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmOrder } from '@/api/order';
import { orderKeys } from './keys';
import type { OrderDetails } from '@/api/model.zod';

export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => confirmOrder(id),
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
import type { FetchOrdersParams } from '@/api/model.zod';
import { fetchOrders } from '@/api/order';
import { orderKeys } from './keys';

export function useOrders(filters: FetchOrdersParams) {
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
import { ThemeProvider } from '@metri/ui/components/providers/theme-provider';
import * as Sonner from '@metri/ui/components/ui/sonner';
import { BrowserRouter } from 'react-router';
import { queryClient } from './providers/query-client';
import { AppRoutes } from './router/routes';

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <Sonner.Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

## useCancelOrder

```ts
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: orderKeys.detail(id) });
      const previous = queryClient.getQueryData<OrderDetails>(orderKeys.detail(id));
      queryClient.setQueryData<OrderDetails>(orderKeys.detail(id), (old) => {
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
