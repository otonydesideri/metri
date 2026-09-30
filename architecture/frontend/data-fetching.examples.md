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
      // the response carries the new state — including the invoice issued in the
      // same commit: it goes into the detail cache without another trip to the server
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
      // the list's sorting, filtering and count belong to the backend, and the order
      // may move to another page with the new status: invalidate
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

  // primitive deps on purpose: the `filters` object changes reference on
  // every render and would fire the prefetch on every commit
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
