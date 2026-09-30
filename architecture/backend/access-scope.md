---
id: backend/access-scope
description: "o contrato genérico de escopo do dono — de onde o dono validado chega, a declaração de cada controller (`@Public()` ou `@<Dono>Owned()`) sob o guard global, como ele se propaga até a aplicação, o filtro de leitura, o uso na escrita e no storage quando pertinentes, o isolamento entre donos e a prova A/B."
use_when:
  - "expor, alterar ou assinar acesso a dado que pertence a um dono"
  - "escrever query, caso de uso ou contrato de asset que recebe identificador de dono"
  - "montar o e2e de um dado com dono"
  - "criar controller"
keywords: [escopo do dono, dono, APP_GUARD, fail-closed, "@Public()", "@CustomerOwned()", "@CurrentCustomerId()", createParamDecorator, customer-context, identificador de dono, isolamento, prova A/B, where, SQL cru, recurso filho, fronteira de request, asset, registro de upload, não-encontrado, businessId, organizationId, tenantId, customerId]
not_covered:
  - "a identidade concreta do dono (usuário, organização, tenant, entidade pai), a entidade que o representa e o nome do identificador (`businessId`, `organizationId`, `tenantId`), que são decisão de projeto (\"Delegações\") → project:ARCHITECTURE"
  - "o mecanismo padrão de autenticação: sessão no servidor, cookie e logout (\"Autenticação\") → defaults/stack"
  - "o provedor de login e o mecanismo que troca o padrão (\"Delegações\") → project:ARCHITECTURE"
  - "mascaramento de recurso de outro dono, anti-enumeração e status HTTP (\"Erros sensíveis\") → backend/errors"
  - "query de exibição, paginação, projeção e não-encontrado da leitura → backend/reading"
  - "storage → infrastructure/storage"
  - "a fronteira de request como peça do framework → infrastructure/runtime"
enforced_by: [access-boundaries]
examples: [starter/apps/app-api/src/infra/common/access/access.guard.ts, starter/scripts/check-access-boundaries.sh]
status: active
---
# Escopo de acesso

Este documento fixa a forma do contrato de escopo do dono, igual para qualquer projeto; quem é o dono em cada projeto é decisão daquele projeto. Os exemplos usam o domínio didático de pedidos (`order`, `customer`) de `skills/writing-for-agents/RULE-FORMAT.md`, "Domínio didático", com o cliente no papel de dono.

## Regras

### Contrato genérico, identidade de projeto

**Obrigatório.** A Source define só o contrato genérico de escopo; a identidade concreta do dono e a entidade que o representa são decisão de projeto, delegada na matriz de `skills/look-across/ACTIVATION.md`, "Delegation matrix", e registrada nas casas de `skills/writing-for-agents/RULE-FORMAT.md`, "Decisões específicas de projeto".

### De onde o dono chega

**Obrigatório.** O escopo do dono vem sempre de uma fonte que o backend validou na fronteira da request.

**Proibido.** Path, query, body ou header livre escolherem o escopo do dono.

**Obrigatório.** Quem resolve o escopo do dono é a fronteira de request (`infrastructure/runtime.md`, "Fronteiras de request"); a forma de extraí-lo pertence à fronteira HTTP e não muda o contrato de quem o consome.

### Declaração por controller

**Obrigatório.** Um guard global (`APP_GUARD`) exige a identidade validada em toda rota, fail-closed: rota sem declaração continua protegida.

**Obrigatório.** Todo controller declara, na classe, `@Public()` (sem dono) ou `@<Dono>Owned()` (dado do dono; `@CustomerOwned()` no domínio didático).

> **Por quê.** O guard protege o esquecimento em runtime, e a declaração deixa a intenção no arquivo, onde a revisão e o check a veem.

**Obrigatório.** O controller `@<Dono>Owned()` recebe o dono pelo param decorator `@Current<Dono>Id()`, que lê o contexto anexado pelo guard à request (`infra/common/<fronteira>/<dono>-context.ts`).

### Propagação

**Obrigatório.** Toda leitura de dado protegido declara o escopo do dono no input.

**Obrigatório.** A query recebe o escopo como primitivo já validado e não conhece a fonte dele.

> **Por quê.** Trocar a fonte do escopo um dia não toca nenhum arquivo de `queries/`.

### Leitura

**Obrigatório.** Toda leitura de dado protegido aplica o escopo do dono no `where`.

**Proibido.** ID em path, query ou body substituir o escopo do dono: ele identifica o alvo pedido pelo cliente.

Quando o ID existe: **Obrigatório.** Ele coincide com o escopo do dono ou o pedido é recusado, na forma de `backend/errors.md`, "Erros sensíveis".

**Obrigatório.** O filtro acompanha o dono real do dado, que pode ser um usuário, uma entidade pai ou outro vínculo.

**Proibido.** Escopo fictício em dado sem dono, só para seguir a forma.

**Obrigatório.** Recurso filho é localizado pelo id junto do dono na mesma consulta, nunca carregado globalmente para comparação posterior.

**Obrigatório.** O `WHERE` de escopo do dono vale igual em SQL cru.

**Proibido.** Remover o filtro de escopo porque existe proteção adicional na camada do banco: ela é backstop.

### Escrita

Quando uma escrita age sobre registro com dono: **Obrigatório.** Ela só age dentro do escopo validado: o registro é recarregado nesse escopo ou tem o dono conferido contra ele antes de qualquer mudança.

### Storage

**Obrigatório.** O identificador do dono de um asset vem do escopo que o backend validou.

**Obrigatório.** O backend só assina chave e recarrega registro de upload dentro desse mesmo escopo.

### Isolamento e prova A/B

Quando a leitura expõe dado com dono: **Obrigatório.** O e2e monta dados de dois donos com as factories e afirma que só os do escopo pedido aparecem.

Quando o primeiro asset pertence a uma entidade: **Obrigatório.** O e2e prova a barreira A/B: id ou registro de upload de B pedido sob o escopo de A volta como não-encontrado e nenhuma URL é assinada.

**Proibido.** Fixture universal de escopo antecipada: relação de parent, subescopo ou relação adicional ganha o próprio caso quando o domínio real a introduzir.

## Aplicação

- O filtro no `where` também entrega o mascaramento de `backend/errors.md`, "Erros sensíveis": dado fora do escopo simplesmente não existe na resposta, e pedido de outro dono e pedido inexistente produzem o mesmo não-encontrado (`backend/reading.md`, "O não-encontrado do detalhe").
- A leitura recebe o escopo no input e o repete no `where` de cada consulta, inclusive no detalhe (`where: { id: input.orderId, customerId: input.customerId }`) e no SQL cru (`WHERE o.customer_id = ${input.customerId}`), como nos exemplos de `backend/reading.md`.
- Na escrita, o caso de uso compara o dono do agregado com o identificador validado e devolve a classe de não-encontrado quando não coincide (`backend/application.md`, "Aplicação").
- No storage, o bucket privado não usa o prefixo da chave como mecanismo de segurança: a segurança é este escopo, aplicado na assinatura e na recarga do registro de upload (`infrastructure/storage.md`).
- O escopo de acesso não entra numa specification: continua no `where` da query, fora do `toWhere()` da regra (`domain/specification.md`).
- O param decorator lê só o contexto da request; sem ele, falha fechado:

```ts
// infra/common/session/current-customer-id.decorator.ts
export const CurrentCustomerId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const customerId = getCustomerId(context.switchToHttp().getRequest<FastifyRequest>());
  if (!customerId) {
    throw new UnauthorizedException();
  }
  return customerId;
});
```

## Verificação

- Todo controller declara `@Public()` ou `@<Dono>Owned()`? (check: access-boundaries, com o marcador do dono como argumento do script)
- Dado protegido carrega o escopo do dono no input, vindo da fronteira de request, e o `where` filtra por ele, também em SQL cru?
- ID vindo de path, query ou body coincide com o escopo ou é recusado, sem substituí-lo?
- Recurso filho é localizado junto do dono na mesma consulta?
- Escrita sobre registro com dono age só dentro do escopo validado?
- O identificador do dono do asset veio do escopo validado, e o primeiro asset com dono tem a prova A/B no e2e?
- O e2e de dado com dono cobre dois donos, sem fixture universal antecipada?

## Referências

- `backend/errors.md`: mascaramento de recurso de outro dono, anti-enumeração e status HTTP.
- `backend/reading.md`: query de exibição, não-encontrado do detalhe e SQL cru.
- `backend/application.md`: exemplo de escopo na escrita.
- `infrastructure/storage.md`: assinatura, chave e registro de upload.
- `infrastructure/runtime.md`: a fronteira de request que resolve o escopo.
- `domain/specification.md`: escopo fora do `toWhere()`.
- `skills/writing-for-agents/RULE-FORMAT.md`: casa da identidade concreta do dono.
