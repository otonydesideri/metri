---
id: backend/errors
description: "o erro de domínio — `DomainError`, `DomainErrorType`, `type`, `code` e os erros de cada módulo; o retorno por `Either`, nunca `throw`; a tradução para HTTP por tabela e o envelope único da resposta de erro, com `ApiErrorType`, o erro de formato HTTP e o erro inesperado do filtro global; os erros sensíveis, o que uma resposta de erro não vaza."
use_when:
  - "criar uma classe de erro nova ou reusar uma existente"
  - "adicionar valor em `DomainErrorType` ou em `ApiErrorType`"
  - "ajustar a tradução de erro na porta HTTP ou o formato da resposta de erro"
  - "mudar a resposta a uma requisição que falha na validação de formato (corpo ou param fora do schema)"
  - "decidir o que uma recusa revela sobre recurso de outro dono"
applies_to:
  - "apps/app-api/src/domain/enterprise/errors/**"
  - "packages/core/src/errors/**"
keywords: [DomainError, DomainErrorType, ApiErrorType, type, code, Either, failure, throw, toHttpException, STATUS_MAP, "Record<DomainErrorType, number>", toInvalidRequestException, ZodValidationPipe, APP_PIPE, UnexpectedErrorFilter, APP_FILTER, envelope, INVALID_REQUEST, INTERNAL_ERROR, REQUEST_REJECTED, erros sensíveis, anti-enumeração, "@metri/core/errors"]
examples: [backend/errors.examples.md]
status: active
---
# Erros

Como erro de domínio é modelado, retornado e traduzido em resposta HTTP, e o envelope único que toda resposta de erro da API usa, com a taxonomia de protocolo dele (`ApiErrorType`).

Os exemplos usam o domínio didático de pedidos (`order`, `invoice`) de `backend/modules.md`.

## Os três tipos de erro que existem no sistema

**Erro de formato HTTP.** Corpo ou path param fora do schema Zod (`createZodDto`): campo obrigatório ausente, tipo errado, string acima do `.max()` declarado. Capturado pelo `ZodValidationPipe` global (`APP_PIPE`, `app.module.ts`) antes do controller rodar; não vira `DomainError`, mas a resposta segue o mesmo formato único, ver "Erro de formato HTTP: `toInvalidRequestException`" adiante.

**Erro de domínio.** Regra de negócio violada ou invariante inválido: recurso que já existe, recurso que não existe, transição de estado proibida. Previsível, faz parte do vocabulário do negócio, e o cliente da API precisa discriminar qual aconteceu para reagir. Nunca lançado como exceção: todo caso de uso retorna `Either<Erro, Sucesso>`. É o assunto deste documento.

**Erro inesperado.** Falha técnica: queda de conexão com banco, bug que escapou de teste. O cliente nunca recebe detalhe interno disso, apenas uma resposta genérica de 500; o detalhe completo vai para o log. A captura é um filtro global ("Erro inesperado: filtro global" adiante); o log em si é mecanismo transversal, com desenho próprio em `infrastructure/logging.md`.

A recusa nativa do framework (rota inexistente, throttler) não é um quarto tipo com desenho próprio: o mesmo filtro global só a normaliza para o envelope único ("O formato de resposta de erro").

## A base: `DomainError` e `DomainErrorType`

Vivem em `packages/core/src/errors`. Com o `ApiErrorType` do protocolo ("O formato de resposta de erro", adiante), são a única coisa que o core define sobre erros; as classes concretas pertencem aos módulos.

```ts
export enum DomainErrorType {
  BUSINESS_RULE = "BUSINESS_RULE",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  CONFLICT = "CONFLICT",
  AUTHORIZATION = "AUTHORIZATION",
  VALIDATION = "VALIDATION",
}

export abstract class DomainError extends Error {
  abstract readonly type: DomainErrorType;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

### O significado de `type`

`type` é a categoria semântica do erro, não o status HTTP. O domínio pronuncia categorias do negócio; a tradução para HTTP é responsabilidade da infra (ver adiante).

- **BUSINESS_RULE**: regra de negócio violada. Transição de estado proibida, operação inválida no estado atual.
- **RESOURCE_NOT_FOUND**: o recurso solicitado não existe (ou não deve parecer existir, ver "Erros sensíveis").
- **CONFLICT**: a operação conflita com o estado atual. Criar algo que já existe, número de pedido duplicado.
- **AUTHORIZATION**: o chamador é conhecido, mas não pode executar esta ação. Distinto de "não identificado", que a fronteira de request resolve antes de o caso de uso rodar. Usar apenas quando a existência do recurso já é conhecida do chamador (ver "Erros sensíveis").
- **VALIDATION**: valor viola invariante de domínio. Não é validação de formato HTTP, que é papel do Zod; é regra do modelo, como "data de nascimento não pode ser futura".

O enum é pequeno, fechado e cresce raro. Valor novo entra só quando nenhuma categoria existente descreve o caso; valor já usado nunca é reatribuído nem removido.

### O significado de `code`

`code` é o identificador único do erro específico, em `UPPER_SNAKE_CASE`, prefixado pelo conceito quando o erro é de um módulo (`ORDER_NOT_FOUND`, `ORDER_NUMBER_ALREADY_USED`). É o que o cliente da API usa para tratar um erro específico sem comparar mensagem em texto livre, que muda e não é contrato.

Unicidade de `code` é convenção, não checagem de compilador: duas classes podem colidir no mesmo valor sem erro de build. O arquivo único de erros por módulo torna a auditoria grepável; é a única perna do desenho sem guarda automática.

## Definindo os erros de um módulo

Um arquivo `<módulo>.errors.ts` em `enterprise/errors/`, ao lado dos outros arquivos de classe de erro do app (`backend/modules.md`), com uma classe por falha observável. Value object usado por mais de um módulo é a exceção, e os erros dele vão num `<value-object>.errors.ts`: não há módulo dono a escolher, e repetir as classes em cada arquivo de módulo colocaria o mesmo `code` em dois lugares.

Exemplo completo: errors.examples.md#ordererrorsts

Pontos-chave:

- `type` e `code` declarados como `readonly`, fixos na classe, nunca parâmetro de construtor.
- Construtor recebe os dados úteis (id, número) e monta a mensagem parametrizada. Erro sem dado variável fixa a mensagem num construtor sem parâmetros; quem instancia nunca escolhe o texto.
- Sem dependência de NestJS, HTTP ou qualquer infraestrutura.
- Toda falha distinta observável ganha classe, mecanicamente, sem discutir se "merece". A regra é uniforme de propósito: todo comportamento observável tem identificador estável, e discutir caso a caso produz um conjunto de erros que só o autor de cada um entende.

## Retornando erro: sempre `Either`, nunca `throw`

Erro de domínio é valor de retorno, via `failure(...)`. `throw` fica reservado para bug de programação. A união de classes no tipo de resposta declara exatamente o que pode falhar, e o compilador força quem chama a tratar.

**No value object**, para invariante de criação:

```ts
static create(amountInCents: number): Either<InvalidMoneyAmountError, Money> {
  if (!Number.isInteger(amountInCents) || amountInCents < 0) {
    return failure(new InvalidMoneyAmountError(amountInCents));
  }

  const money = new Money({ amountInCents });
  return success(money);
}
```

**Na entidade**, para invariante de transição de estado:

```ts
cancel(): Either<OrderAlreadyCanceledError, void> {
  if (this.props.canceledAt) {
    return failure(new OrderAlreadyCanceledError(this.id.toValue()));
  }

  this.props.canceledAt = new Date();
  this.touch();
  return success(undefined);
}
```

**No caso de uso**, para regra que depende de estado consultado:

```ts
type ConfirmOrderOutput = Either<
  OrderNotFoundError | InvalidOrderStatusTransitionError,
  { order: Order }
>;

async execute({ orderId }: ConfirmOrderInput): Promise<ConfirmOrderOutput> {
  const order = await this.orderRepository.findById(orderId);
  if (!order) {
    return failure(new OrderNotFoundError(orderId));
  }
  // ...
}
```

Em teste, a asserção sobre a falha é `instanceof`, sem comparar string:

```ts
expect(result.isFailure()).toBe(true);
expect(result.value).toBeInstanceOf(OrderNotFoundError);
```

## Tradução para HTTP: tabela, não `switch`

Nenhum controller escreve `switch` por erro. A tradução é uma tabela declarativa mais uma função, na infra do app.

```ts
import { HttpException, HttpStatus } from "@nestjs/common";
import { DomainError, DomainErrorType } from "@metri/core/errors";

const STATUS_MAP: Record<DomainErrorType, number> = {
  [DomainErrorType.BUSINESS_RULE]: HttpStatus.UNPROCESSABLE_ENTITY,
  [DomainErrorType.RESOURCE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [DomainErrorType.CONFLICT]: HttpStatus.CONFLICT,
  [DomainErrorType.AUTHORIZATION]: HttpStatus.FORBIDDEN,
  [DomainErrorType.VALIDATION]: HttpStatus.BAD_REQUEST,
};

export function toHttpException(error: DomainError): HttpException {
  const body = { code: error.code, message: error.message, type: error.type };
  const exception = new HttpException(body, STATUS_MAP[error.type]);
  return exception;
}
```

O handler vira uma linha:

```ts
const result = await this.confirmOrderUseCase.execute({ orderId });
if (result.isFailure()) {
  throw toHttpException(result.value);
}

const { order } = result.value;

return { order: OrderPresenter.toHTTP(order) };
```

Duas regras não negociáveis aqui:

- **A anotação `Record<DomainErrorType, number>` é obrigatória, não estilo.** É ela que faz o compilador exigir toda categoria na tabela; esquecer uma vira erro de build. Sem a anotação, o TypeScript infere um tipo solto e a garantia some em silêncio.
- **A tabela mora na infra, nunca no core.** `DomainError` não conhece status HTTP; se cada classe carregasse o próprio status, o domínio estaria pronunciando vocabulário de infraestrutura.

Por ser exaustiva por compilação, a tabela dispensa `default`, `console.error` de categoria não mapeada e checagem de `instanceof` por caso especial.

### O formato de resposta de erro

O corpo produzido por `toHttpException` é o formato único de erro da API, o envelope que toda resposta HTTP de erro usa, venha de onde vier: domínio, formato, framework ou erro inesperado.

```json
{
  "code": "ORDER_NOT_FOUND",
  "message": "Pedido abc-123 não encontrado",
  "type": "RESOURCE_NOT_FOUND"
}
```

O cliente discrimina por `code`; `type` e o status HTTP dão a categoria. O `type` do envelope é o `ApiErrorType`, a taxonomia do protocolo HTTP, distinta da do domínio: ela contém os valores do `DomainErrorType` e as categorias que só a porta HTTP produz.

```ts
// packages/core/src/errors
export type ApiErrorType =
  | `${DomainErrorType}`
  | "INVALID_REQUEST"
  | "INTERNAL_ERROR"
  | "REQUEST_REJECTED";
```

- `INVALID_REQUEST`: erro de formato HTTP (`toInvalidRequestException`, adiante).
- `INTERNAL_ERROR`: erro inesperado (o filtro global, adiante).
- `REQUEST_REJECTED`: `HttpException` nativa do framework, como a rota inexistente e o throttler (o filtro global, adiante).

O `ApiErrorType` vive ao lado do `DomainErrorType`, em `packages/core/src/errors`, TypeScript puro, sem dependência de NestJS, Prisma ou qualquer infra, com export próprio (`@metri/core/errors`). O frontend consome o contrato HTTP, não o domínio: tipa o campo `type` com o `ApiErrorType`, importado direto do pacote como dependência de workspace, sem redeclarar os valores à mão e sem usar o `DomainErrorType` como tipo do campo. `code` e `message` continuam string livre: não há vocabulário fechado do lado do frontend pra eles, cada um é valor de runtime tratado como tal (`code` via comparação direta, `message` só exibido).

### Erro de formato HTTP: `toInvalidRequestException`

O erro de formato não passa pelas tabelas acima (não é `DomainError`), mas o corpo da resposta fala o mesmo formato único. A tradução é a `createValidationException` do `ZodValidationPipe`, composta em `app.module.ts` e registrada via `APP_PIPE`, pela regra de registro global de `infrastructure/runtime.md`:

```ts
export function toInvalidRequestException(error: unknown): HttpException {
  const zodError = error as ZodError;
  const message = zodError.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  const body = {
    code: 'INVALID_REQUEST_FORMAT',
    message,
    type: 'INVALID_REQUEST',
  };
  const exception = new HttpException(body, HttpStatus.BAD_REQUEST);
  return exception;
}
```

```ts
const ZodValidationPipe = createZodValidationPipe({
  createValidationException: toInvalidRequestException,
});

providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }];
```

Pontos-chave:

- `code` e `type` são fixos (`INVALID_REQUEST_FORMAT`/`INVALID_REQUEST`), fora de `DomainErrorType` pelo mesmo critério do `'INTERNAL_ERROR'` e dentro do `ApiErrorType`: erro de formato não pronuncia vocabulário de negócio. O detalhe por campo vai em `message`, agregando cada issue do Zod como `caminho.do.campo: mensagem`.
- A mensagem de cada campo é escrita em português no próprio schema (`.min(8, 'A senha deve ter no mínimo 8 caracteres.')`); o default do Zod é em inglês, então campo sem mensagem própria vaza inglês pro cliente.
- O pipe só chama a função com o `ZodError` do schema; não há branch de erro não classificado aqui, esse papel é do `UnexpectedErrorFilter`.

## Erro inesperado: filtro global

Erro inesperado não passa pela tabela de tradução acima: não é um `DomainError`, é uma exceção lançada por acidente de programação ou por falha de infraestrutura externa. A captura é um filtro global do Nest, registrado via `APP_FILTER` (`infrastructure/runtime.md`):

Exemplo completo: errors.examples.md#unexpectederrorfilter

```ts
providers: [{ provide: APP_FILTER, useClass: UnexpectedErrorFilter }];
```

`FastifyReply` é tipado direto no filtro, sem passar por `HttpAdapterHost`. O projeto já decidiu Fastify como única plataforma HTTP (`defaults/stack.md`, "Stack"); a portabilidade entre adapters que `HttpAdapterHost` existe pra dar não tem uso real aqui.

O filtro não recebe logger nenhum e não loga por conta própria: log é assunto de `infrastructure/logging.md`, não deste documento.

Pontos-chave:

- `HttpException` cujo corpo já é o envelope (produzida por `toHttpException` ou pelo `ZodValidationPipe` global) atravessa o filtro sem alteração de corpo nem de status.
- `HttpException` nativa do framework (a 404 de rota inexistente, a 429 do throttler, qualquer outra do pipeline do Nest) mantém o status e tem o corpo trocado pelo envelope: `type: 'REQUEST_REJECTED'`, `code` com o nome do status (`NOT_FOUND`, `TOO_MANY_REQUESTS`) e mensagem genérica. O corpo nativo carrega detalhe técnico (o path pedido, o nome da classe) e nunca chega ao cliente.
- Exceção que não é `HttpException` é, por definição, não classificada. O cliente recebe sempre o mesmo corpo genérico com status 500; a mensagem original e o stack ficam só no log (`infrastructure/logging.md`), nunca no corpo da resposta.
- `code: 'INTERNAL_SERVER_ERROR'` e `type: 'INTERNAL_ERROR'` reaproveitam as mesmas três chaves do formato de erro de domínio (`code`, `message`, `type`), mantendo um único formato de erro na API. `'INTERNAL_ERROR'` é valor do `ApiErrorType` e não entra em `DomainErrorType`: esse enum é reservado a categorias do vocabulário de negócio, e um erro inesperado não pronuncia vocabulário de negócio nenhum.
- Erro do Prisma que escapa da persistência cai no mesmo filtro, sem tratamento especial por código do driver (`P2002`, `P2025`...). Condição esperada que o banco só revela na gravação (violação de unicidade, registro não encontrado) não chega aqui: a implementação do contrato de persistência reconhece o código e devolve o outcome declarado da operação, e o caso de uso é quem o traduz na classe de `DomainError` (`backend/persistence.md`, "Outcome de persistência"). Um erro de Prisma chegando aqui já é, por definição, um caso que nenhum contrato declarou, então tratá-lo como qualquer outro erro inesperado é o comportamento certo, não uma lacuna a preencher com uma tabela de status por código de driver.

## Erros sensíveis: o que não vazar

**Acesso negado a recurso de outro dono retorna a mesma classe do não-encontrado genuíno.** Nunca uma classe própria com `type` divergente: o `code` vai no corpo da resposta, então um `code: 'UNAUTHORIZED_ORDER_ACCESS'` com status 404 vazaria a existência do recurso do mesmo jeito. O caso de uso, ao detectar que o recurso pertence a outro dono, retorna `new OrderNotFoundError(id)`, indistinguível para o cliente em status, `code` e mensagem.

**`AUTHORIZATION` fica reservado para negação onde a existência já é conhecida do chamador.** Um operador sem permissão de faturar um pedido já sabe que o pedido existe; aí 403 com `code` específico é correto e útil.

**Mensagem não expõe detalhe interno.** `message` é texto para humano: sem id interno de infraestrutura, path de arquivo, query SQL ou stack. Esses detalhes ficam só em log.

**Busca por identificador informado pelo usuário não confirma existência.** Endpoint que recebe e-mail, documento ou código de convite e responde diferente para "existe" e "não existe" vira um oráculo de enumeração. A resposta é a mesma nos dois casos, e a diferença fica só no log.

## Quando criar o quê

**Classe nova**: toda falha distinta que o cliente pode observar. Regra mecânica, sem julgamento caso a caso.

**Reusar classe existente**: quando o fato observável é o mesmo. O mascaramento de autorização acima é o exemplo canônico; criar classe nova ali seria vazamento, não clareza.

**Valor novo em `DomainErrorType`**: raro. Só quando nenhuma das cinco categorias descreve a semântica, o que também significa que nenhuma linha de `STATUS_MAP` serve; a tabela quebra o build até o valor novo ser mapeado, que é o comportamento desejado. O `ApiErrorType` acompanha sozinho, pelo template literal.

**Valor novo em `ApiErrorType` fora do domínio**: só quando a porta HTTP passa a produzir uma categoria de erro que nenhum valor existente descreve.

## Verificação rápida

- Erro de domínio é classe nomeada estendendo `DomainError`, com `type` e `code` fixos como `readonly`?
- É retornado via `failure(...)`, nunca lançado? `throw` só para bug de programação?
- O tipo de resposta do caso de uso declara a união exata das classes que ele pode retornar?
- Controller usa `throw toHttpException(result.value)`, sem `switch` nem `instanceof` por caso?
- Erro de formato Zod responde no formato único via `toInvalidRequestException`, com mensagem por campo escrita em português no schema?
- A tabela de tradução tem anotação `Record<DomainErrorType, ...>` explícita, para que valor novo no enum quebre o build?
- Acesso negado a recurso de outro dono reusa a classe de não-encontrado?
- Mensagem não expõe id interno, path, query ou stack?
- Teste afirma a falha com `instanceof`, não comparando `message`?
- Erro que chega ao `UnexpectedErrorFilter` sem ser `HttpException` vira sempre o mesmo corpo genérico e status 500, sem o filtro logar nada por conta própria (`infrastructure/logging.md`)?
- `HttpException` nativa do framework (rota inexistente, throttler) sai com o status dela e o corpo no envelope, `type: 'REQUEST_REJECTED'`, sem o corpo nativo?
- Frontend tipa o `type` do envelope com o `ApiErrorType` de `@metri/core/errors`, sem redeclarar os valores à mão nem usar o `DomainErrorType` como tipo do campo?

O envelope e o `ApiErrorType` cruzam a fronteira como parte do contrato de API e moram no core por serem vocabulário de erro. O resto do contrato (schema de request/response, união fechada que a API aceita ou devolve) segue o contrato compartilhado de `backend/http-api.md`, "Contrato de API compartilhado", e o caso de tipos em `frontend/helpers.md` ("Tipos compartilhados").
