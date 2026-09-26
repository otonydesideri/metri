# Componentes do frontend: exemplos

Domínio didático de pedidos. Ilustra `frontend/components`.

## Corpo da página

Hooks → condições de leitura → guards terminais → handlers → condições do conteúdo → JSX. O vazio (`!hasItems`) é condição do conteúdo, depois dos handlers.

```tsx
export function OrderPage() {
  const {
    data: order,
    isPending,
    isError,
    isFetching,
    refetch: refetchOrder,
  } = useOrder();
  const updateOrder = useUpdateOrder();

  const isLoading = isPending;
  const hasLoadError = isError && order === undefined;
  const isRetrying = hasLoadError && isFetching;

  if (isLoading) {
    return <OrderSkeleton />;
  }

  if (hasLoadError) {
    return (
      <LoadErrorState isRetrying={isRetrying} onRetry={() => refetchOrder()} />
    );
  }

  if (!order) {
    return <OrderUnavailableState />;
  }

  function handleSave() {
    updateOrder.mutate();
  }

  const hasItems = order.items.length > 0;
  const canEdit = order.status === "draft";
  const isSaving = updateOrder.isPending;

  if (!hasItems) {
    return <OrderEmptyState />;
  }

  return (
    <OrderDetails
      order={order}
      canEdit={canEdit}
      isSaving={isSaving}
      onSave={handleSave}
    />
  );
}
```
