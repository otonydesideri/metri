# Transações: exemplos

## OrderInvoicingPrismaTransactionImpl

```ts
@Injectable()
export class OrderInvoicingPrismaTransactionImpl implements OrderInvoicingTransaction {
  constructor(private readonly prisma: PrismaService) {}

  async run(params: OrderInvoicingTransactionParams): Promise<void> {
    const orderData = OrderPrismaMapper.toPrisma(params.order);
    const invoiceData = InvoicePrismaMapper.toPrisma(params.invoice);

    await this.prisma.client.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderData.id },
        data: { status: orderData.status, updatedAt: orderData.updatedAt },
      });

      await tx.invoice.create({ data: invoiceData });
    });

    DomainEvents.dispatchEventsForAggregate(params.order.id);
    DomainEvents.dispatchEventsForAggregate(params.invoice.id);
  }
}
```
