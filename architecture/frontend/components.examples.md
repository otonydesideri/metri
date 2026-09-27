# Componentes do frontend: exemplos

## OrderPage

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
  const [isSaving, startSaveTransition] = useTransition();

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
    startSaveTransition(async () => {
      try {
        await updateOrder.mutateAsync();
        notification({
          status: 'success',
          title: 'Pedido salvo',
          description: `O pedido ${order.number} já aparece com as alterações.`,
        });
      } catch (error) {
        notification({
          status: 'error',
          title: 'Não foi possível salvar o pedido',
          description: toUserFacingMessage(error),
        });
      }
    });
  }

  const hasItems = order.items.length > 0;
  const canEdit = order.status === 'draft';

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
