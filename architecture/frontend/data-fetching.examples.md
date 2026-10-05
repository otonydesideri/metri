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
