# Builder: exemplos

## InvoiceDocumentBuilder

```ts
import { type Either, failure, success } from '@metri/core/types';

interface InvoiceLine {
  description: string;
  quantity: number;
  unitPriceInCents: number;
}

export interface InvoiceDocument {
  brandName: string | null;
  lines: InvoiceLine[];
  discountInCents: number | null;
  legalFooter: string | null;
  totalInCents: number;
}

export class InvoiceDocumentBuilder {
  private brandName: string | null = null;
  private lines: InvoiceLine[] = [];
  private discountInCents: number | null = null;
  private legalFooter: string | null = null;

  withBrand(brandName: string): this {
    this.brandName = brandName;
    return this;
  }

  addLine(line: InvoiceLine): this {
    this.lines.push(line);
    return this;
  }

  withDiscount(discountInCents: number): this {
    this.discountInCents = discountInCents;
    return this;
  }

  withLegalFooter(legalFooter: string): this {
    this.legalFooter = legalFooter;
    return this;
  }

  build(): Either<EmptyInvoiceDocumentError, InvoiceDocument> {
    if (this.lines.length === 0) {
      return failure(new EmptyInvoiceDocumentError());
    }

    const grossInCents = this.lines.reduce(
      (total, line) => total + line.quantity * line.unitPriceInCents,
      0,
    );
    const discountInCents = this.discountInCents ?? 0;
    const totalInCents = grossInCents - discountInCents;

    const document: InvoiceDocument = {
      brandName: this.brandName,
      lines: this.lines,
      discountInCents: this.discountInCents,
      legalFooter: this.legalFooter,
      totalInCents,
    };

    return success(document);
  }
}
```
