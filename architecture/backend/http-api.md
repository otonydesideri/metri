---
id: backend/http-api
description: "a porta HTTP de um módulo — controller por ação, DTO Zod de request e de response, validação de params, query e body na fronteira, presenter e corpo de resposta — e o contrato de API: os DTOs são a fonte, o OpenAPI é gerado deles e o app-web gera dele o client, com a união fechada e o limite que os dois lados usam."
use_when:
  - "criar endpoint ou controller"
  - "escrever DTO ou schema de API"
  - "mudar a forma de uma resposta"
  - "expor um contrato ao frontend"
  - "levar ao frontend uma união fechada ou um limite que a API impõe"
  - "gerar o OpenAPI ou o client do app-web"
applies_to:
  - "apps/app-api/src/infra/http/controllers/**"
  - "apps/app-api/src/infra/http/dtos/**"
  - "apps/app-api/src/infra/http/presenters/**"
  - "apps/app-api/src/openapi.ts"
keywords: [controller, endpoint, DTO, setOpenAPIVersion, createOpenApiDocument, /api/docs, SwaggerModule, ApiExcludeController, redirect, OAuth, createZodDto, ZodValidationPipe, ZodResponse, ApiTags, OpenAPI, cleanupOpenApiDoc, api:generate, api:drift, "@Param", z.uuid, z.uuidv4, presenter, toHTTP, toHttpException, PaginatedResult, contrato de API, união fechada, sortBy, sortDirection, ApiErrorType]
not_covered:
  - "`DomainError`, tipos e codes, `Either`, tabela de tradução, formato da resposta de erro, mascaramento e erro inesperado → backend/errors"
  - "o adaptador fino em geral → backend/application"
  - "o registro global do pipe de validação e do serializer → infrastructure/runtime"
  - "a superfície `/api` e same-origin → general/http-surface"
  - "query de exibição e paginação → backend/reading"
  - "o escopo do dono → backend/access-scope"
  - "o client gerado no frontend — `api/`, o Orval e o cliente HTTP → frontend/data-fetching"
  - "o consumo do contrato no frontend — casa de tipos e constantes → frontend/helpers"
  - "o schema de form → frontend/forms"
examples: [starter/apps/app-api/src/openapi.ts, starter/apps/app-api/src/infra/health/health.controller.ts, starter/apps/app-api/src/infra/http/dtos/health/health-response.dto.ts]
status: active
---
# API HTTP

A porta HTTP é o adaptador que o mundo mais usa: traduz request em input de caso de uso e resultado em resposta, sem decidir nada. Ela é também a fonte do contrato de API que o frontend consome. Os exemplos usam o domínio didático de pedidos (`order`, `customer`).

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

### Contrato de API: o backend é a fonte

**Obrigatório.** O contrato de API são os DTOs Zod do app-api, de request e de response, em `infra/http/dtos/<módulo>/`. O resto deriva deles: o app-api gera o OpenAPI (`apps/app-api/openapi.json`), e o app-web gera dele as funções de `api/<módulo>.ts` e os schemas e tipos de `api/model.zod.ts` (`frontend/data-fetching.md`, "Funções de API").

> **Por quê.** O contrato é o que o servidor valida e serializa de fato, e o client que ficou para trás aparece no `verify`.

**Obrigatório.** Todo endpoint declara a resposta com `@ZodResponse({ status, type })`, com o `status` explícito, e o controller leva `@ApiTags('<módulo>')`, que dá o arquivo `api/<módulo>.ts` do app-web.

- **Exceção.** Redirect de protocolo que roda antes da sessão (o início e o retorno do OAuth): responde 302 pelo `reply.redirect`, sem `@ZodResponse` e fora do OpenAPI (`@ApiExcludeController()`), com `@Public()` e o throttle global (`infrastructure/runtime.md`, "Composição no `AppModule`").

**Obrigatório.** O DTO de resposta é `createZodDto(<schema>, { codec: true })`, e data nele é um codec de string ISO para `Date` (`z.codec(z.iso.datetime(), z.date(), ...)`): a resposta sai pelo `encode`, e o JSON Schema do OpenAPI aceita a data.

**Obrigatório.** Código gerado leva o cabeçalho de gerado e muda só pelo gerador: mudar o contrato é mudar o DTO e rodar `pnpm api:generate`.

**Proibido.** Tratar como contrato de API o que não é: o schema de form é do frontend (`frontend/forms.md`), e a regra que o OpenAPI não carrega (`.refine`, `.transform`, mensagem de erro) mora nele.

### União fechada e limite do contrato

Quando um parâmetro varia num conjunto fechado (coluna de ordenação, direção, status): **Obrigatório.** Ele nasce como `z.enum` no DTO, nomeado com `.meta({ id: '<Nome>' })`, e o frontend usa o schema gerado com esse nome (`OrderStatus`), sem redeclarar os valores.

**Proibido.** `z.string()` livre no frontend para parâmetro de conjunto fechado.

> **Por quê.** Aceitaria valor que a API vai recusar.

**Obrigatório.** O search param que guarda o valor na URL do app usa o mesmo nome do query param da API (`sortBy`, `sortDirection`): o caminho do valor — URL, hook, função de `api/` — não renomeia nada no meio.

Quando o frontend precisa de um limite que a API impõe (comprimento, quantidade): **Obrigatório.** O limite é declarado no DTO, e o frontend importa a constante que o gerador exporta em `api/model.zod.ts`, nunca uma constante do app.

## Aplicação

- Toda resposta de erro da porta sai no envelope único de `backend/errors.md`, "O formato de resposta de erro", com o `type` no `ApiErrorType`.
- Controller e caso de uso entram nas listas de `http.module.ts`, agrupados por comentário de área (`backend/modules.md`).
- O controller é o adaptador fino de `backend/application.md` para HTTP: a tradução do `failure` acontece nele, pela tabela de `backend/errors.md`.
- Endpoint de leitura de exibição injeta o contrato de query, e o DTO da query é o corpo quando essa é a única porta (`backend/reading.md`).
- O envelope de erro e o `ApiErrorType` cruzam a fronteira pelo `@metri/core/errors`; o frontend consome o `ApiErrorType`, não o `DomainErrorType` (`backend/errors.md`).
- O `@ZodResponse` valida a resposta pelo `ZodSerializerInterceptor`, registrado como `APP_INTERCEPTOR` (`infrastructure/runtime.md`); a resposta fora do DTO sai 500, `INTERNAL_ERROR` (`backend/errors.md`, "Erro inesperado: filtro global").
- A geração: `starter/apps/app-api/src/openapi.ts`, que roda a partir do build do `tsdown` (`defaults/stack.md`, "Stack"). O `DocumentBuilder` fixa `.setOpenAPIVersion('3.1.0')`: o `.nullable()` do Zod 4 sai com `null` no `type` (`["string", "null"]`) ou no `anyOf`, JSON Schema que só o OpenAPI 3.1 aceita e que o Orval lê.
- O script `api:generate` da raiz roda os dois lados, o `openapi.json` e o Orval do app-web; o `verify` o roda e falha quando ele muda algum arquivo (`api:drift`).
- Fora de produção, o `main.ts` serve em `/api/docs` a documentação do mesmo documento (`createOpenApiDocument`).
- O limite nasce no DTO, e o schema de form do frontend importa a constante gerada, podendo ser mais estrito que ela (`frontend/helpers.md`, "Constantes"; `frontend/forms.md`):

```ts
// apps/app-api/src/infra/http/dtos/order/create-order.dto.ts
export const createOrderSchema = z.object({
  note: z.string().min(8).max(128),
});

export class CreateOrderDto extends createZodDto(createOrderSchema) {}

const isoDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (value) => new Date(value),
  encode: (date) => date.toISOString(),
});

export class OrderResponseDto extends createZodDto(
  z.object({ order: z.object({ id: z.uuid(), createdAt: isoDate }).meta({ id: 'Order' }) }),
  { codec: true },
) {}
```

```ts
// apps/app-web: the constant the generator exports from api/model.zod.ts
import { createOrderDtoNoteMax } from '@/api/model.zod';
```

- Com uma fonte só, não há espelho a manter; cada lado continua provando o limite onde o consome (`frontend/testing.md`, "Limite do contrato").

## Verificação

- O comportamento entrou por um controller por ação, com DTO `createZodDto` na fronteira e a tradução de erro na porta?
- Toda resposta de erro, inclusive a recusa nativa do framework, sai no envelope único com `type` no `ApiErrorType`?
- Path param entra como objeto, texto tem `.max()`, e id é `z.uuid()`?
- A resposta nomeia o que carrega, com o agregado passado por presenter, e sem chave genérica fora do envelope de paginação?
- O contrato mora nos DTOs, com `@ZodResponse` em todo endpoint e `@ApiTags` em todo controller, e o código gerado está atualizado e sem edição à mão (`api:drift`)?
- Parâmetro de conjunto fechado é `z.enum` no DTO e o frontend usa o schema gerado, com o mesmo nome do query param na URL do app?
- Limite que a API impõe vem da constante gerada, sem constante redeclarada no frontend?

## Referências

- `backend/errors.md`: taxonomia, tradução e envelope de erro.
- `backend/application.md`: o adaptador fino.
- `infrastructure/runtime.md`: registro global do pipe e do serializer.
- `backend/reading.md`: query de exibição e paginação.
- `backend/modules.md`: registro no `http.module.ts`.
- `frontend/data-fetching.md`: o client gerado no frontend.
- `frontend/helpers.md`: casa de constantes e tipos no frontend.
- `frontend/forms.md`: o schema de form, separado do contrato.
- `frontend/testing.md`: prova do limite do contrato em cada lado.
