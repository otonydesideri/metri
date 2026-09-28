# ADR-0002 O backend é a fonte do contrato de API

status: accepted
area: backend
kind: decision

## Contexto

- O contrato de API morava num pacote do workspace, com os schemas Zod que o app-api e o app-web importavam; o projeto escolhia o pacote dono de cada contrato (delegação "Pacote do contrato de API").
- No piloto 1, a escolha do pacote foi uma pergunta sem resposta boa, e URL, método e forma da resposta continuavam escritos à mão dos dois lados, sem tipo que acusasse a deriva.
- O `nestjs-zod` já é o validador da porta HTTP (`architecture/defaults/stack.md`).

## Decisão

- Os DTOs Zod do app-api, de request e de response (`@ZodResponse`), são a fonte do contrato.
- O app-api gera o `openapi.json` (`@nestjs/swagger` + `cleanupOpenApiDoc`), e o app-web gera dele, pelo Orval, as funções de `api/<módulo>.ts` e os schemas, tipos e limites de `api/model.zod.ts`.
- O código gerado não é editado; o `verify` roda o `api:generate` e falha quando algo muda (`api:drift`).
- A regra: `architecture/backend/http-api.md`, "Contrato de API: o backend é a fonte"; o consumo: `architecture/frontend/data-fetching.md`, "Funções de API".

## Alternativas consideradas

- Pacote de contrato compartilhado (o modelo anterior): sem geração, e os dois lados usam o mesmo schema, com `.refine` e mensagens. Mas URL, método e mapeamento da resposta ficam à mão, sem checagem de tipo entre rota e chamada; não há OpenAPI; os dois apps ficam presos à mesma versão do Zod; e código só do servidor pode vazar para o bundle do web.
- tRPC (11.19): a melhor inferência de ponta a ponta, sem geração. Não tem adaptador oficial para NestJS, então roda ao lado dos pipes, guards e Swagger do Nest, ou no lugar deles; a chamada é RPC, não REST; e o OpenAPI dele ainda é alfa.
- ts-rest (3.52): contrato REST escrito primeiro, com handler para Nest e client com React Query. O estável ainda pede Zod 3 (o Zod 4 só em release candidate), o último estável é de março de 2025, ele ignora o prefixo global do Nest, e o contrato dele substitui os DTOs do nestjs-zod.

## Consequências

- O contrato é o que o servidor valida e serializa de fato; o client desatualizado quebra o `verify`, não a produção.
- O `openapi.json` serve também a documentação, mocks e outros consumidores.
- A ida Zod → JSON Schema → Zod perde `.refine`, `.transform` e mensagem de erro: essa regra mora no schema de form do app-web.
- O app-web não valida a resposta em runtime: quem garante a forma é o `@ZodResponse` do servidor.
- A geração pesa: o script roda a partir do build do app-api (o tsx descarta o metadata dos decorators), e todo controller leva `@ApiTags`.
- O nestjs-zod 5.5 declara o NestJS até o 11: a stack fica no 11 até ele declarar o 12.
- A delegação "Pacote do contrato de API" sai; o `@metri/core/errors` continua como vocabulário de erro.

## Imposto por

`api:drift` no `verify`: o `api:generate` não pode mudar nenhum arquivo.
