# E-mail: exemplos

## OrderConfirmationSenderImpl

```ts
// infra/services/mail/order-confirmation-sender.impl.ts
import { Injectable } from '@nestjs/common';
import { render } from '@react-email/render';
import {
  OrderConfirmationSender,
  type OrderConfirmationSenderInput,
} from '../../../domain/application/services/mail/order-confirmation-sender.contract';
import { MAIL_FROM } from '../../common/constants/mail.constant';
import { ResendMailService } from './resend-mail.service';
import { OrderConfirmationEmail } from './viewers/order-confirmation.viewer';

@Injectable()
export class OrderConfirmationSenderImpl implements OrderConfirmationSender {
  constructor(private readonly mail: ResendMailService) {}

  async send({
    orderId,
    customerEmail,
    customerName,
  }: OrderConfirmationSenderInput): Promise<void> {
    const html = await render(
      OrderConfirmationEmail({ customerName, orderId }),
    );

    const response = await this.mail.client.emails.send({
      from: MAIL_FROM,
      to: customerEmail,
      subject: `Pedido ${orderId} confirmado`,
      html,
    });

    if (response.error) {
      throw new Error(
        `Falha ao enviar e-mail via Resend: ${response.error.message}`,
      );
    }
  }
}
```
