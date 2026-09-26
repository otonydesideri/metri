---
id: infrastructure/mail
description: "o envio de e-mail — a classe de infra única que guarda o client do vendor de e-mail e é o único lugar com o nome dele; o sender de cada fluxo de e-mail do produto, consumido por quem dispara o fluxo, com a composição da mensagem dentro dele."
use_when:
  - "criar um fluxo novo de e-mail"
  - "disparar um e-mail a partir de um fluxo do produto"
  - "escolher ou trocar o vendor de e-mail"
applies_to:
  - "apps/app-api/src/domain/application/services/mail/**"
  - "apps/app-api/src/infra/services/mail/**"
keywords: [e-mail, vendor de e-mail, Resend, ResendMailService, RESEND_API_KEY, sender, OrderConfirmationSender, OrderConfirmationSenderImpl, viewer, render, "@react-email/render", client.emails.send, response.error, MAIL_FROM, contrato por fluxo]
not_covered:
  - "a regra transversal de organização — classe de infra sem contrato, contrato por fluxo, registro no `ServicesModule`, dublê por contrato → infrastructure/services"
  - "o mecanismo que dispara o envio, chamada direta, evento ou job → backend/operation-routing"
examples: [infrastructure/mail.examples.md]
status: active
---
# E-mail

O envio de e-mail: uma classe de infra que expõe o client do vendor e um contrato por fluxo real do produto (confirmação de pedido, aviso de fatura vencida), consumido por quem dispara aquele fluxo, nunca pela classe de infra direto.

O vendor de e-mail é delegação de projeto (`activation.md`, "Matriz de delegações"); os exemplos usam o Resend como referência concreta, porque parte da regra (a checagem do campo `error`) só faz sentido com um SDK real na frente. O que é padrão aqui é a forma — classe de infra, contrato por fluxo, composição dentro do sender —, não o nome do vendor. O resto dos exemplos segue o domínio didático de pedidos de `backend/modules.md`.

## A classe de infra

```ts
// infra/services/mail/resend-mail.service.ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { EnvService } from '../../common/env/env.service';

@Injectable()
export class ResendMailService {
  readonly client: Resend;

  constructor(env: EnvService) {
    this.client = new Resend(env.getOrThrow('RESEND_API_KEY'));
  }
}
```

Só monta e expõe o client, `readonly` e público, nenhum método próprio envolvendo a chamada. Quem precisa do Resend chama `client.emails.send(...)` direto.

O Resend não lança em falha de negócio do vendor (chave inválida, destinatário rejeitado, limite de taxa): a promise resolve normalmente, e o erro vem no campo `error` da resposta, só rejeitando em falha de rede de fato. Sem checar esse campo, esse tipo de falha nunca chegaria no catch que quem chama já espera. A checagem fica inline, logo depois da chamada, em cada sender que envia e-mail, sem função nem método intermediário.

## O contrato por fluxo

```ts
// domain/application/services/mail/order-confirmation-sender.contract.ts
export type OrderConfirmationSenderInput = {
  orderId: string;
  customerEmail: string;
  customerName: string;
};

export abstract class OrderConfirmationSender {
  abstract send(input: OrderConfirmationSenderInput): Promise<void>;
}
```

Exemplo completo: mail.examples.md#orderconfirmationsenderimpl

Quem dispara a confirmação (o caso de uso do fluxo, ver `backend/operation-routing.md`, "Job") entrega só dado de domínio, nunca HTML pronto:

```ts
// domain/application/use-cases/notification/send-order-confirmation.use-case.ts (trecho)
@Injectable()
export class SendOrderConfirmationUseCase {
  constructor(
    private readonly orderConfirmationSender: OrderConfirmationSender,
  ) {}

  async execute(input: SendOrderConfirmationInput) {
    // ...busca o pedido...
    await this.orderConfirmationSender.send({
      orderId: order.id.toString(),
      customerEmail: order.customerEmail,
      customerName: order.customerName,
    });
  }
}
```

Todo fluxo real segue a mesma forma: um contrato e uma implementação por fluxo, cada uma montando o próprio viewer e chamando a classe de infra por baixo. Nenhum contrato sabe que os outros existem.

Pontos-chave:

- A composição do e-mail (viewer React, assunto) mora dentro do sender, nunca em quem chama. Quem chama entrega dado de domínio (`orderId`, `customerName`); é o que torna o contrato testável por intenção, não por conteúdo de string.
- Dado de domínio inclui link já pronto (URL de redefinição, de verificação, de convite): o sender nunca monta URL nem faz lookup pra construir um campo do e-mail, mesmo que precise de env var ou repositório pra isso. Quem dispara o fluxo entrega pronto, do mesmo jeito que entrega `orderId`/`customerName`. Isso mantém o sender com uma dependência só (a classe de infra do vendor) e evita que a infra de e-mail acumule acesso a env e persistência que já existe em quem chama.
- Cada fluxo de e-mail tem template e campos próprios (convite não é o mesmo formato de redefinição de senha). Agrupar vários fluxos num contrato só, um método por fluxo, esconderia essa diferença atrás de um nome comum, sem eliminá-la.
- Falha ao enviar propaga como exceção do sender. Quem chama decide o destino: um caso de uso deixa subir; um subscriber de evento engole com log, pela regra de `backend/events.md` ("Falha no handler"), porque a operação principal já commitou antes do envio e o e-mail é efeito aditivo dela.

## Verificação rápida

- Um contrato por fluxo real, consumido por quem dispara o fluxo, nunca a classe de infra direto?
- `ResendMailService` só monta e expõe o client, sem método próprio envolvendo a chamada?
- A composição do e-mail (viewer, assunto) mora dentro do sender, e quem chama entrega só dado de domínio, URL incluída?
- A falha que o SDK devolve como valor, em vez de lançar, está checada inline em cada sender?
- Registro e dublê seguem `infrastructure/services.md` (sender no `ServicesModule`, fake por contrato, sem dublê da classe de infra)?

**Pontos em aberto:** o vendor de e-mail segue aberto como delegação de projeto (`activation.md`, "Matriz de delegações"), resolvida com o primeiro fluxo real; até lá, `ResendMailService` e a checagem do campo `error` valem como ilustração da forma. Quando o vendor escolhido pede forma que este documento não tem, a forma entra aqui antes do código.
