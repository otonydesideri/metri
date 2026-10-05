---
id: backend/application
description: "o contrato injetável como `abstract class` e o mecanismo de injeção dele; o caso de uso (arquivo, `execute()`, `Input`/`Output`, responsabilidade, ordem de leitura, regra e gravação, proibição de chamar outro caso de uso, papel de leitura ao vivo ou de confirmação); o caso de uso agnóstico de quem o chama; o log do caso de uso por contrato neutro de framework; o adaptador de entrada fino e a fronteira entre a aplicação e os adaptadores."
use_when:
  - "criar caso de uso ou contrato de aplicação"
  - "criar adaptador de entrada (controller, subscriber, worker, webhook, router de biblioteca)"
  - "decidir se uma decisão mora no adaptador ou no caso de uso"
applies_to:
  - "apps/app-api/src/domain/application/**"
keywords: [caso de uso, use case, execute(), Input, Output, abstract class, contrato, injeção de dependência, useClass, Symbol token, "@Inject", "@Injectable", método especulativo, leitura ao vivo, confirmação, adaptador de entrada, adaptador fino, controller, subscriber, worker, webhook, failure, Either]
not_covered:
  - "a regra de domínio que o caso de uso orquestra → domain/model"
  - "a regra de domínio que o caso de uso orquestra → domain/domain-services"
  - "repositório, mapper e escrita → backend/persistence"
  - "a forma da porta HTTP → backend/http-api"
  - "subscriber e worker no que têm de específico → backend/events"
  - "subscriber e worker no que têm de específico → backend/async-jobs"
  - "classe de erro, `Either` e tradução → backend/errors"
  - "a regra dos níveis para service de infra → infrastructure/services"
  - "query de exibição → backend/reading"
  - "a escolha do mecanismo de uma operação → backend/operation-routing"
  - "o escopo do dono → backend/access-scope"
  - "o spec de caso de uso → backend/testing"
examples: [backend/application.examples.md]
status: active
---
# Aplicação

A camada `domain/application` orquestra o domínio: casos de uso que carregam, decidem pela entidade e gravam, falando com o mundo só por contratos. Tudo que escuta o mundo (HTTP, bus, fila, webhook) é adaptador, e adaptador não decide nada. Os exemplos usam o domínio didático de pedidos (`order`, `invoice`).

## Regras

### Contratos são `abstract class`

Quando o contrato é injetável, usado como token de injeção de dependência (repositório, service, query, fila, transação, log): **Obrigatório.** Ele é uma `abstract class` em `domain/application`, implementada em `infra/` e registrada com `{ provide: <Contrato>, useClass: <Impl> }`.

A regra não alcança tipo sem injeção: `Input`, `Output`, DTO, união discriminada, outcome, tipo auxiliar e value object seguem a forma dos próprios documentos.

**Obrigatório.** A classe abstrata é o próprio token de DI: quem injeta declara o tipo do contrato no construtor e o Nest resolve.

**Proibido.** `interface` + Symbol token + `@Inject(TOKEN)`.

**Obrigatório.** Quem injeta pede o contrato, nunca a implementação concreta.

**Proibido.** Método especulativo: um contrato declara só os métodos que algum consumidor já chama (caso de uso, controller de leitura, subscriber).

### Casos de uso

**Obrigatório.** Um caso de uso por arquivo, em `use-cases/<módulo>/<ação>.use-case.ts`, com um único método público `execute()`.

**Obrigatório.** Os tipos do caso de uso são `interface <CasoDeUso>Input` e `type <CasoDeUso>Output`, locais ao arquivo; o `Output` é `type` porque carrega a união do `Either`.

**Permitido.** Exportar `Input` ou `Output` quando outro arquivo precisa de fato do tipo.

**Obrigatório.** `execute()` desestrutura o input na assinatura.

**Obrigatório.** O input é tipo próprio, mesmo quando estruturalmente idêntico ao schema da porta; Zod e DTO de HTTP não entram no caso de uso (`backend/boundaries.md`).

**Obrigatório.** Leitura, regra, gravação, nessa ordem: o caso de uso orquestra, e regra que depende só do estado do agregado mora na entidade ou no value object (`domain/model.md`), com o caso de uso propagando a falha dela.

**Proibido.** Caso de uso chamar outro caso de uso: o que dois fluxos compartilham vira método de entidade, de value object ou de contrato.

> **Por quê.** Composição de casos de uso esconde uma segunda leitura e uma segunda decisão dentro de uma chamada só.

Quando a leitura é "ao vivo", disparada a cada interação (checagem de disponibilidade, autocomplete): **Obrigatório.** Entrada inválida volta como payload de sucesso (`{ available: false }`); a confirmação ou escrita devolve a mesma validação como `failure`.

**Obrigatório.** O papel do caso de uso, leitura ao vivo ou confirmação, é decidido antes de escrevê-lo.

**Obrigatório.** Todo caso de uso nasce com spec unitário colocado, na forma de `backend/testing.md`.

### O caso de uso não sabe quem o chama

**Obrigatório.** O caso de uso é agnóstico de quem o invoca: controller, subscriber, worker ou teste chamam o mesmo `execute()`, e ele não sabe a diferença.

### Adaptador de entrada fino

**Obrigatório.** Controller, subscriber, worker, webhook e router de biblioteca são adaptadores de entrada: escutam o mundo e disparam a aplicação.

**Obrigatório.** O adaptador é fino: extrai do que recebeu o input e chama a aplicação — o `execute()` do caso de uso, ou o contrato que a própria aplicação expõe para aquela entrada (a query de exibição de `backend/reading.md`, o contrato de fila que o subscriber alimenta em `backend/async-jobs.md`).

**Proibido.** Regra de negócio no adaptador: adaptador que valida, decide ou calcula está fazendo o trabalho do caso de uso.

**Obrigatório.** O destino do `failure` é decidido no adaptador, nunca dentro do caso de uso: a porta adapta, o caso de uso decide.

Quando um módulo precisa de uma porta nova (o router de uma biblioteca que traz as próprias rotas, uma fila que entrega mensagem, um webhook de terceiro): **Obrigatório.** O desenho dela entra na Source antes de virar código.

## Aplicação

O contrato de referência, um repositório (`backend/persistence.md`):

```ts
import type { Order } from '../../enterprise/order.entity';

export abstract class OrderRepository {
  abstract findById(id: string): Promise<Order | null>;

  abstract findManyByIds(ids: string[]): Promise<Order[]>;

  abstract save(order: Order): Promise<void>;
}
```

O caso de uso de referência:

Exemplo completo: application.examples.md#confirmorderusecase

- O segundo `if` aplica o escopo do dono na escrita (`backend/access-scope.md`) e devolve a mesma classe do não-encontrado para recurso de outro dono (`backend/errors.md`, "Erros sensíveis").
- A regra da transição é de `order.confirm()`; o caso de uso só propaga a falha.
- A pasta de contratos é única e do app: qualquer caso de uso injeta qualquer contrato, inclusive de agregado de outro módulo (`backend/modules.md`, "Comunicação entre módulos").
- O mesmo mecanismo vale para os contratos de service (`infrastructure/services.md`), de query (`backend/reading.md`), de fila (`backend/async-jobs.md`) e de transação (`backend/transactions.md`); cada documento define onde o seu mora e o que ele declara.
- Cada adaptador aplica este documento no que tem de específico: o controller e a tradução com `toHttpException` em `backend/http-api.md`; o subscriber, que loga e engole o `failure`, em `backend/events.md`; o worker, que loga e conclui o job no `failure`, em `backend/async-jobs.md`.

## Verificação

- O contrato é `abstract class` injetada pelo tipo, sem Symbol token, e só com métodos que algum consumidor já chama?
- O caso de uso tem um `execute()` só, com `Input`/`Output` locais e sem Zod?
- A ordem é leitura, regra, gravação, com a regra na entidade ou no value object?
- Nenhum caso de uso chama outro caso de uso?
- Leitura ao vivo devolve entrada inválida como sucesso, e confirmação a devolve como `failure`?
- O adaptador é fino, sem regra de negócio, e o destino do `failure` é decidido nele?
- A porta nova teve o desenho registrado na Source antes do código?

## Referências

- `domain/model.md`: entidade, value object e agregado que o caso de uso orquestra.
- `backend/persistence.md`: o repositório e a escrita.
- `backend/http-api.md`: o controller como adaptador HTTP.
- `backend/events.md`: o subscriber como adaptador do bus.
- `backend/async-jobs.md`: o worker como adaptador da fila.
- `backend/errors.md`: `Either`, classes de erro e a tradução na porta.
- `backend/boundaries.md`: o que `domain/application` pode importar.
- `infrastructure/logging.md`: quem loga; o caso de uso não loga.
- `backend/testing.md`: o spec de caso de uso.
- `backend/modules.md`: a pasta de contratos única e a comunicação entre módulos.
