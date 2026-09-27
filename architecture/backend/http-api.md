---
id: backend/http-api
description: "a porta HTTP de um módulo — controller por ação, DTO Zod de request, validação de params, query e body na fronteira, presenter e corpo de resposta — e o contrato de API compartilhado com o frontend: a representação canônica única do schema de request e response, da união fechada e do limite que os dois lados consomem."
use_when:
  - "criar endpoint ou controller"
  - "escrever DTO ou schema de API"
  - "mudar a forma de uma resposta"
  - "expor um contrato ao frontend"
  - "levar ao frontend uma união fechada ou um limite que a API impõe"
applies_to:
  - "apps/app-api/src/infra/http/controllers/**"
  - "apps/app-api/src/infra/http/dtos/**"
  - "apps/app-api/src/infra/http/presenters/**"
keywords: [controller, endpoint, DTO, createZodDto, ZodValidationPipe, "@Param", z.uuid, z.uuidv4, presenter, toHTTP, toHttpException, PaginatedResult, contrato de API, contrato canônico, união fechada, sortBy, sortDirection, ApiErrorType, "@metri/contracts"]
not_covered:
  - "`DomainError`, tipos e codes, `Either`, tabela de tradução, formato da resposta de erro, mascaramento e erro inesperado → backend/errors"
  - "o adaptador fino em geral → backend/application"
  - "o registro global do pipe de validação → infrastructure/runtime"
  - "a superfície `/api` e same-origin → overview"
  - "query de exibição e paginação → backend/reading"
  - "o escopo do dono → backend/access-scope"
  - "o consumo do contrato no frontend — cliente HTTP, funções de `api/` → frontend/data-fetching"
  - "o consumo do contrato no frontend — casa de tipos e constantes → frontend/helpers"
  - "o schema de form → frontend/forms"
  - "a colocação de código entre app e pacote → overview"
status: active
---
# API HTTP

A porta HTTP é o adaptador que o mundo mais usa: traduz request em input de caso de uso e resultado em resposta, sem decidir nada. Quando o frontend consome o mesmo contrato, a porta passa a ter dois lados, e o que precisa coincidir entre eles é decidido aqui. Os exemplos usam o domínio didático de pedidos (`order`, `customer`).

## Regras

### Controller por ação

**Obrigatório.** Todo comportamento que um módulo expõe por HTTP entra por um controller por ação (`<ação>.controller.ts`), nunca um por módulo.

> **Por quê.** O arquivo diz o que ele faz, e o diff de uma feature nova não toca o arquivo de nenhuma outra.

**Obrigatório.** O controller recebe o DTO Zod (`createZodDto`), chama o caso de uso e traduz `failure` com `toHttpException` (`backend/errors.md`).

### Validação na fronteira

**Obrigatório.** Body, query e path param entram tipados como classe `createZodDto`, validados pelo `ZodValidationPipe` global.

**Obrigatório.** Path param entra como objeto (`@Param() params: <Nome>Dto`).

**Proibido.** `@Param('campo') campo: string`.

> **Por quê.** Param solto não passa por validação nenhuma.

**Obrigatório.** Campo de texto tem `.max()` além do `.min()`.

> **Por quê.** Sem ele a porta aceita payload de qualquer tamanho antes da primeira checagem.

**Obrigatório.** Id de entidade é `z.uuid()`.

**Proibido.** `z.uuidv4()` em id de entidade.

> **Por quê.** A versão v4 recusa o uuid nil, que rota de consulta pública recebe como id inexistente.

### Presenter e corpo de resposta

**Obrigatório.** O sucesso de uma escrita devolve o agregado escrito, e quem o transforma em corpo serializável é um presenter, `infra/http/presenters/<agregado>.presenter.ts`, com `static toHTTP`.

> **Por quê.** Entidade não é JSON e não é contrato de API.

**Obrigatório.** O corpo da resposta nomeia o que carrega: `{ order }`, `{ order, invoice }`.

**Proibido.** Chave genérica (`data`) no corpo da resposta.

- **Exceção.** Listagem paginada: usa o `PaginatedResult<T>` de `backend/reading.md`.

### Contrato de API compartilhado

**Obrigatório.** Schema consumido só pelo backend vive em `infra/http/dtos/<módulo>/`.

Quando frontend e backend consomem o mesmo contrato de API (schema de request ou response, união fechada que a API aceita ou devolve, limite que ela impõe): **Obrigatório.** Ele tem uma representação canônica única, no pacote dono do conceito, e o controller e o frontend importam de lá.

> **Por quê.** O contrato é a fronteira entre os dois lados, e é isso que dá a ele ownership compartilhado inequívoco: a casa no pacote é o caso permitido de `overview.md`, "Código pode nascer no pacote dono quando nada nele é do app", não promoção pela contagem de consumidores.

**Proibido.** Duas cópias do mesmo contrato, uma em cada lado, mantidas em sincronia à mão.

**Proibido.** Tratar como contrato de API o que não é: o schema de form é do frontend (`frontend/forms.md`), e tipo local de tela não sobe para o pacote por se parecer com um do contrato.

### União fechada e limite do contrato

Quando um parâmetro varia num conjunto fechado (coluna de ordenação, direção, status): **Obrigatório.** Ele nasce como união fechada no contrato canônico, e o frontend usa essa mesma união, sem redeclarar os valores.

**Proibido.** `z.string()` livre no frontend para parâmetro de conjunto fechado.

> **Por quê.** Aceitaria valor que a API vai recusar.

**Obrigatório.** O search param que guarda o valor na URL do app usa o mesmo nome do query param da API (`sortBy`, `sortDirection`): o caminho do valor — URL, hook, função de `api/` — não renomeia nada no meio.

Quando o frontend precisa de um limite que a API impõe (comprimento, quantidade): **Obrigatório.** O limite é exportado pelo contrato canônico e importado pelo frontend, nunca redeclarado numa constante do app.

## Aplicação

- Toda resposta de erro da porta sai no envelope único de `backend/errors.md`, "O formato de resposta de erro", com o `type` no `ApiErrorType`.
- Controller e caso de uso entram nas listas de `http.module.ts`, agrupados por comentário de área (`backend/modules.md`).
- O controller é o adaptador fino de `backend/application.md` para HTTP: a tradução do `failure` acontece nele, pela tabela de `backend/errors.md`.
- Endpoint de leitura de exibição injeta o contrato de query, e o DTO da query é o corpo quando essa é a única porta (`backend/reading.md`).
- O envelope de erro e o `ApiErrorType` cruzam a fronteira pelo `@metri/core/errors`, como parte do contrato de API; o frontend consome o `ApiErrorType`, não o `DomainErrorType` (`backend/errors.md`).
- O contrato compartilhado nunca vai para um pacote de contratos que junte domínios diferentes (`@metri/contracts`): é o catch-all que `overview.md` proíbe.
- Qual pacote é dono de cada contrato é decisão de projeto (`activation.md`, "Matriz de delegações").
- O limite que a API impõe sai do contrato canônico, e o schema de request o usa; o schema de form do frontend importa o mesmo valor, e pode ser mais estrito que ele (`frontend/helpers.md`, "Constantes"; `frontend/forms.md`):

```ts
// no contrato canônico, no pacote dono do conceito
export const ORDER_NOTE_MIN_LENGTH = 8;
export const ORDER_NOTE_MAX_LENGTH = 128;

export const createOrderBodySchema = z.object({
  note: z.string().min(ORDER_NOTE_MIN_LENGTH).max(ORDER_NOTE_MAX_LENGTH),
});
```

- Com uma representação só, não há espelho a manter; cada lado continua provando o limite onde o consome (`frontend/testing.md`, "Limite do contrato compartilhado").

## Verificação

- O comportamento entrou por um controller por ação, com DTO `createZodDto` na fronteira e a tradução de erro na porta?
- Toda resposta de erro, inclusive a recusa nativa do framework, sai no envelope único com `type` no `ApiErrorType`?
- Path param entra como objeto, texto tem `.max()`, e id é `z.uuid()`?
- A resposta nomeia o que carrega, com o agregado passado por presenter, e sem chave genérica fora do envelope de paginação?
- Contrato que frontend e backend consomem tem uma representação canônica só, no pacote dono do conceito, sem `@metri/contracts` e sem cópia mantida à mão em nenhum lado?
- Parâmetro de conjunto fechado usa a união do contrato canônico, com o mesmo nome do query param na URL do app?
- Limite que a API impõe vem do contrato canônico, sem constante redeclarada no frontend?

## Referências

- `backend/errors.md`: taxonomia, tradução e envelope de erro.
- `backend/application.md`: o adaptador fino.
- `infrastructure/runtime.md`: registro global do pipe.
- `backend/reading.md`: query de exibição e paginação.
- `backend/modules.md`: registro no `http.module.ts`.
- `overview.md`: colocação entre app e pacote.
- `frontend/data-fetching.md`: o consumo do contrato no frontend.
- `frontend/helpers.md`: casa de constantes e tipos no frontend.
- `frontend/forms.md`: o schema de form, separado do contrato.
- `frontend/testing.md`: prova do limite do contrato em cada lado.
