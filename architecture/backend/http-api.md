---
id: backend/http-api
description: "API HTTP: controller por ação, validação na fronteira, presenter, corpo de resposta e contrato de API compartilhado com o frontend."
applies_to:
  - "apps/app-api/src/infra/http/**"
  - "apps/app-web/src/**/api/**"
keywords: [endpoint, controller, dto, presenter, toHTTP, response body, api contract, closed union, path param, uuid]
read_first: [backend/application, backend/errors]
not_covered:
  - "registro global do pipe de validação → infrastructure/runtime"
  - "superfície /api e same-origin → overview"
  - "colocação de código entre app e pacote → overview"
  - "pacote dono de cada contrato (decisão de projeto) → activation"
  - "registro de controller e caso de uso no módulo HTTP → backend/modules"
  - "query de exibição e paginação → backend/reading"
  - "escopo do dono → backend/access-scope"
  - "consumo do contrato no frontend (cliente HTTP, funções de api/) → frontend/data-fetching"
  - "casa de tipos e constantes no frontend → frontend/helpers"
  - "schema de form → frontend/forms"
  - "prova do limite do contrato em cada lado → frontend/testing"
enforced_by: []
examples: []
adr: []
status: active
---
# API HTTP

## Regras
- **Obrigatório.** Exponha cada comportamento HTTP por um controller por ação, em `src/infra/http/controllers/<módulo>/<ação>.controller.ts`; nunca um controller por módulo. — `manual`
  Por quê: o diff de uma feature nova não toca o arquivo de outra.
- **Obrigatório.** No controller, receba o DTO validado, chame o caso de uso e traduza o `failure` pela tabela de `backend/errors`. — `manual`
- **Obrigatório.** Tipe body, query e path param com DTO de schema, validado na fronteira antes do controller. — `manual`
- **Proibido.** Path param solto, fora de DTO; em vez disso, receba os params como um objeto tipado pelo DTO. — `manual`
- **Obrigatório.** Dê a todo campo de texto do schema de request um comprimento máximo, além do mínimo. — `manual`
- **Proibido.** Validar id de entidade como UUID v4; em vez disso, aceite UUID de qualquer versão. — `manual`
  Por quê: a v4 recusa o UUID nil, que rota de consulta pública recebe como id inexistente.
- **Obrigatório.** Envie toda resposta de erro da porta, inclusive recusa de validação e recusa nativa do framework (rota inexistente, rate limit), no envelope único de `backend/errors`. — `manual`
- **Obrigatório.** No sucesso de uma escrita, responda com o agregado escrito. — `manual`
- **Proibido.** Entidade no corpo da resposta; em vez disso, converta o agregado pelo presenter `src/infra/http/presenters/<agregado>.presenter.ts`, com `static toHTTP`. — `manual`
- **Proibido.** Chave genérica (`data`) no corpo da resposta; em vez disso, nomeie o que ele carrega (`{ order }`, `{ order, invoice }`). — `manual`
  Exceção: listagem paginada usa o `PaginatedResult<T>` de `backend/reading`.
- **Obrigatório.** Coloque o schema consumido só pelo backend em `src/infra/http/dtos/<módulo>/<nome>.dto.ts`. — `manual`
- **Obrigatório.** Quando frontend e backend consomem o mesmo contrato de API (schema de request ou response, união fechada, limite), mantenha uma representação canônica única no pacote dono do conceito, importada pelo controller e pelo frontend. — `manual`
  Por quê: o contrato é a fronteira dos dois lados; nasce no pacote dono (`overview`), não por contagem de consumidores.
- **Proibido.** Uma cópia do contrato em cada lado, sincronizada à mão; em vez disso, importe a representação canônica. — `manual`
- **Proibido.** Pacote de contratos que junta domínios diferentes; em vez disso, o pacote dono de cada conceito. — `manual`
- **Proibido.** Subir para o pacote schema de form ou tipo local de tela por se parecer com o contrato; em vez disso, mantenha-os no app. — `manual`
- **Obrigatório.** Declare parâmetro de conjunto fechado (coluna de ordenação, direção, status) como união fechada no contrato canônico. — `manual`
- **Proibido.** String livre ou valores redeclarados no frontend para parâmetro de conjunto fechado; em vez disso, importe a união do contrato. — `manual`
- **Obrigatório.** Dê ao search param da URL do app o mesmo nome do query param da API (`sortBy`, `sortDirection`); URL, hook e função de `api/` não renomeiam no meio. — `manual`
- **Proibido.** Redeclarar no app um limite que a API impõe (comprimento, quantidade); em vez disso, exporte-o do contrato canônico e importe-o no schema de request e no frontend. — `manual`

## Stack padrão
- DTO: classe `createZodDto` (nestjs-zod) sobre schema Zod, validada pelo `ZodValidationPipe` global.
- Path param: `@Param() params: <Nome>Dto`; nunca `@Param('campo') campo: string`.
- Texto: `.min()` e `.max()`; id de entidade: `z.uuid()`, nunca `z.uuidv4()`.
- Tradução do `failure` no controller: `toHttpException`.
- Erro de validação: `ZodValidationPipe` composto com `toInvalidRequestException`; o filtro global normaliza no mesmo envelope a `HttpException` nativa (rota inexistente, throttler).
- Envelope de erro e `ApiErrorType` cruzam a fronteira por `@metri/core/errors`; o frontend consome o `ApiErrorType`, nunca o `DomainErrorType`.
- Contrato compartilhado: no pacote `@metri/*` dono do conceito; nunca num `@metri/contracts`.
- Limite no contrato canônico, usado pelo schema de request e importado pelo schema de form:

  ```ts
  export const ORDER_NOTE_MIN_LENGTH = 8;
  export const ORDER_NOTE_MAX_LENGTH = 128;

  export const createOrderBodySchema = z.object({
    note: z.string().min(ORDER_NOTE_MIN_LENGTH).max(ORDER_NOTE_MAX_LENGTH),
  });
  ```
