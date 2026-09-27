---
id: infrastructure/logging
description: "o log estruturado da aplicação — o mecanismo (`nestjs-pino`), o bootstrap e o nível e formato por ambiente; o contexto progressivo e o agrupamento das linhas por request; a redação de campo sensível e o que não entra em log; como um provider de `infra/` e uma biblioteca externa logam."
use_when:
  - "adicionar log a um provider, controller, subscriber, worker ou repositório"
  - "mudar o nível, o formato ou os campos de contexto da request no log"
  - "decidir que dado pode entrar num log e o que precisa de redação"
  - "ligar o logger de uma biblioteca externa ao log da aplicação"
  - "mandar as linhas de log para um coletor ou agregador"
applies_to:
  - "apps/app-api/src/main.ts"
  - "apps/app-api/src/app.module.ts"
keywords: [log, nestjs-pino, pino, pino-http, pino-pretty, PinoLogger, Logger, LoggerModule, forRootAsync, bufferLogs, useLogger, LoggerErrorInterceptor, RequestLogContextInterceptor, APP_INTERCEPTOR, genReqId, X-Request-Id, x-request-id, req.id, requestId, assign, assignResponse, setContext, messageFormat, LOG_LEVEL_BY_ENV, redact, censor, "[REDACTED]", audit log, auditoria, VendorLoggerConfig, disableColors, dado sensível]
not_covered:
  - "métrica, alerta e reconciliação → infrastructure/observability"
  - "o contrato de log do caso de uso (\"Log no caso de uso\") → backend/application"
  - "o registro global dos interceptors de log → infrastructure/runtime"
examples: [infrastructure/logging.examples.md]
status: active
---
# Log

Como a aplicação produz log estruturado: o mecanismo (`nestjs-pino`) e como qualquer provider loga por ele. Vale pra log de qualquer natureza, não só do caminho de erro; `backend/errors.md` cobre a tradução de erro em resposta HTTP e usa o mecanismo daqui para o detalhe de erro inesperado, sem duplicar o desenho.

## Por que `nestjs-pino`

O Fastify já embute pino como logger nativo. `nestjs-pino` reaproveita esse mecanismo em vez de introduzir um segundo formato de log no processo: expõe a mesma instância pino tanto pro logger interno do Nest (`Logger`) quanto pra log estruturado com contexto por request (`PinoLogger`), e loga automaticamente toda request/response via `pino-http`, sem precisar de nenhum código manual por rota.

`Logger`/`PinoLogger` é injetada direto, sem contrato, em qualquer provider de `infra/` que precise logar: é infraestrutura técnica pura, sem composição de domínio no meio, mesmo branch de decisão de `infrastructure/services.md` que já cobre `PrismaService`. `LoggerModule` é um módulo Nest próprio, configurado uma vez em `AppModule`; não entra no `ServicesModule` porque não é um client de vendor com contrato por fluxo, é o próprio mecanismo de log da aplicação. Caso de uso não recebe o `PinoLogger`: `domain/application` não importa `nestjs-pino` (`backend/boundaries.md`), e o log dele passa por um contrato neutro de framework, cuja implementação em `infra/` é um provider como os outros deste documento (`backend/application.md`, "Log no caso de uso").

Cobre qualquer request que passa pelo pipeline do Nest, então qualquer falha que se torne exceção nesse caminho, seja do `ZodValidationPipe`, de um repositório sobre o Prisma, ou de qualquer outro ponto (ver `backend/errors.md`, "Erro inesperado: filtro global"): a linha automática de log não distingue a origem, e não precisa de configuração extra por tipo de falha. Biblioteca que registre rotas próprias direto no adapter HTTP, fora do pipeline do Nest, não ganha essa linha automática: o log interno dela é redirecionado pra mesma instância de pino pela opção de logger que a própria biblioteca oferecer, e a config disso mora junto da composição dela.

## Bootstrap

```ts
// main.ts
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ genReqId: () => randomUUID() }),
    { bufferLogs: true, bodyParser: false },
  );

  app.useLogger(app.get(Logger));

  // ...
}
```

Os interceptors globais de log entram no `AppModule` via `APP_INTERCEPTOR`, pela regra de registro global de `infrastructure/runtime.md`:

```ts
// app.module.ts
providers: [
  { provide: APP_INTERCEPTOR, useClass: LoggerErrorInterceptor },
  { provide: APP_INTERCEPTOR, useClass: RequestLogContextInterceptor },
],
```

Pontos-chave:

- `bufferLogs: true` retém as linhas de log emitidas no boot, antes de `useLogger` trocar o logger padrão do Nest pelo do `nestjs-pino`, em vez de perdê-las.
- `app.useLogger(app.get(Logger))` faz todo `Logger`/`PinoLogger` do app sair em JSON, não só um ponto específico.
- `LoggerErrorInterceptor` é o que expõe o erro real (stack, classe) na linha automática de log de uma request que termina em exceção. Sem ele, essa linha carrega só um `err` genérico do Nest, mesmo com `nestjs-pino` já ligado. Registrado antes do `RequestLogContextInterceptor`: interceptor global roda na ordem de registro, o primeiro fica mais externo e captura exceção de qualquer interceptor interno.
- `FastifyAdapter` não recebe config própria de `logger` (nem `logger: true`, nem repassar essa config pro `nestjs-pino` via `useExisting: true`): isso cria duas instâncias de pino concorrentes, uma por request do Fastify e uma do `forRoot` do `nestjs-pino`, cenário que o próprio pacote desaconselha. Fonte única de configuração é o `LoggerModule` em `AppModule`, ver "Nível e formato por ambiente". `genReqId` no adapter é opção de servidor, não de logger, e não entra nessa proibição; o porquê de ele morar aí está em "Agrupamento por request".

## Nível e formato por ambiente

`LoggerModule` é configurado com `forRootAsync`, lendo o ambiente do `EnvService`. Nível por ambiente numa tabela declarativa: `info` em produção, `warn` em teste (erro continua visível, o `LoggerErrorInterceptor` loga em `error`, sem inundar a saída dos e2e com a linha automática de request), `debug` em `local`/`development`. Transport `pino-pretty` (devDependency) só onde um humano lê o terminal (`local`/`development`); em produção e teste a saída é o JSON do pino direto no stdout, e o destino das linhas (coletor, agregador) é decisão de projeto (`.metri/ARCHITECTURE.md`, "Delegações"), fora deste documento.

```ts
// app.module.ts
const LOG_LEVEL_BY_ENV: Record<NodeEnvironment, string> = {
  local: 'debug',
  development: 'debug',
  test: 'warn',
  production: 'info',
};

LoggerModule.forRootAsync({
  imports: [EnvModule],
  inject: [EnvService],
  useFactory: (env: EnvService) => {
    const nodeEnv = env.getOrThrow('NODE_ENV');
    const isHumanReadable = nodeEnv === 'local' || nodeEnv === 'development';
    const options: Params = {
      pinoHttp: {
        level: LOG_LEVEL_BY_ENV[nodeEnv],
        transport: isHumanReadable
          ? {
              target: 'pino-pretty',
              options: {
                messageFormat: '{if context}[{context}] {end}{msg}',
                ignore: 'pid,hostname,context',
              },
            }
          : undefined,
      },
      assignResponse: true,
    };
    return options;
  },
}),
```

`context` vem de `setContext` (ver "Como logar num provider") e, sem essa config, o `pino-pretty` imprime como propriedade solta numa linha abaixo da mensagem, pra qualquer log de qualquer provider que chame `setContext`. `messageFormat` funde o context na própria linha da mensagem (`[NomeDoContext] mensagem`); `ignore` tira o campo de aparecer de novo como propriedade abaixo, já que virou parte da mensagem. O `{if context}...{end}` é condicional: linha automática de request do `pino-http` não carrega `context` (não passa por `PinoLogger.call`), então cai no `{msg}` puro sem colchete vazio sobrando.

A seção "Redação de campo sensível" mostra a opção num `forRoot` isolado, pra leitura; a config real é uma só, este `forRootAsync`.

Com `level: 'info'`, chamada de `debug` em produção custa quase nada: o pino checa o nível antes de serializar qualquer argumento.

## Agrupamento por request

Toda linha logada durante uma request carrega o `req.id` dela: o `pino-http` cria um child logger por request e o `nestjs-pino` o propaga por AsyncLocalStorage, então `Logger`/`PinoLogger` em qualquer provider sai com o mesmo id, sem passar contexto na mão. Agrupar as linhas de uma request no agregador é filtrar por esse id.

O id default do Fastify é "req-N", incremental por processo, ambíguo com mais de uma instância ou depois de um restart: requests distintas aparecem no agregador com o mesmo id. A troca por UUID é no `genReqId` do `FastifyAdapter`, no snippet de "Bootstrap". Quem devolve o id na resposta é o primeiro hook `onRequest` da instância, escrevendo o header no response cru: assim alcança também quem responde fora do ciclo do Nest, incluindo a própria recusa de uma fronteira. O `genReqId` do `pinoHttp` não funciona neste stack e não é usado: o middie do `@nestjs/platform-fastify` copia o id do Fastify pro request cru antes de o `pino-http` rodar, e o `pino-http` só gera id quando o request ainda não carrega um.

Pontos-chave:

- O header `X-Request-Id` na resposta localiza no log a request exata que um cliente reportou, sem depender de timestamp.
- `x-request-id` vindo na request é ignorado: aceitar id de cliente arbitrário permite forjar o id de correlação no log. Aceitar só passa a fazer sentido com um proxy confiável na frente assinando o header, decisão que acompanha a topologia de deploy do projeto (`.metri/ARCHITECTURE.md`).

Os campos entram progressivamente, conforme cada fronteira produz o fato que ela resolve: um interceptor global (`APP_INTERCEPTOR` no `AppModule`, depois do `LoggerErrorInterceptor`, ver "Bootstrap") chama `logger.assign(...)` com o que já se sabe naquele ponto, e cada fronteira posterior acrescenta o que ela resolveu. `assignResponse: true` na config do `LoggerModule` (ao lado de `pinoHttp`, ver "Nível e formato por ambiente") estende os campos à linha automática de response.

```ts
// no interceptor global, com o que a fronteira já resolveu
this.logger.assign({
  callerId: requestScope?.callerId,
});
```

Três regras valem para qualquer campo que entre nesse contexto:

- **Um nome, um significado.** Campo que muda de sentido conforme o caminho da request torna o log impossível de agregar: quem filtra por ele passa a comparar coisas diferentes sem perceber. Quando dois momentos da request produzem fatos parecidos mas distintos (o identificador que a request afirma e o que o backend validou, por exemplo), são dois campos com nomes diferentes, nunca um campo com dois sentidos.
- **Só identificador.** Não se anexa entidade, lista de permissões ou catálogo inteiro a toda request. O contexto automático carrega identificadores; detalhe de decisão entra no log específico que realmente precisa dele.
- **Ausente é um valor válido.** Campo que só existe depois de uma fronteira simplesmente não aparece nas linhas anteriores a ela. Preencher com um valor sintético para "manter o formato" é pior que a ausência: transforma um fato conhecido (ainda não resolvido) num fato falso.

## Redação de campo sensível

A linha automática de request do `pino-http` inclui headers de request e de response por padrão. Sem redação, isso grava no log qualquer cookie e qualquer header `Authorization`. A lista de campos redigidos fica no `redact` do `pinoHttp`:

```ts
// app.module.ts
LoggerModule.forRoot({
  pinoHttp: {
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        'res.headers.location',
      ],
      censor: '[REDACTED]',
    },
  },
}),
```

Pontos-chave:

- `censor: '[REDACTED]'` deixa visível no log que a redação atuou. Remover o campo silenciosamente esconderia também a evidência de que a proteção está ativa.
- Path de `redact` é case-sensitive. Header de request chega minúsculo no Node, então os paths acima cobrem o caso real; um path novo em maiúsculo não protege o header minúsculo equivalente.
- Body de request não está na lista porque `pino-http` não loga body. Dado sensível passado como dado estruturado num log manual é responsabilidade de quem loga; não existe redação global que cubra objeto arbitrário.
- Senha, cookie, token de qualquer natureza, URL assinada e payload com dado pessoal não entram em log manual. O `redact` acima protege os headers conhecidos, não argumentos arbitrários.
- A linha automática inclui a URL. Segredo não pode ser transportado em path ou query que apareça em `req.url`; rota que fizer isso precisa mudar o transporte ou instalar serializer que remova o valor antes da primeira exposição externa. `res.headers.location` está no `redact` pelo mesmo motivo: um redirect pode carregar no `Location` um valor que não deveria aparecer no log.

## Como logar num provider

`PinoLogger` injetado no construtor, com `setContext` fixando o nome da classe; o resto é chamada direta do nível certo:

```ts
// recorte do subscriber de backend/events.md, um provider de infra/
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class OnOrderConfirmedSubscriber implements EventHandler {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(OnOrderConfirmedSubscriber.name);
  }

  private async handle(event: OrderConfirmedEvent): Promise<void> {
    this.logger.info({ orderId: event.orderId.toValue() }, 'Reagindo à confirmação do pedido');
    // ...
  }
}
```

Segundo argumento é a mensagem para humano; primeiro argumento, quando presente, é dado estruturado (objeto), nunca concatenado na própria mensagem. É o que torna o campo pesquisável no agregador de log, em vez de exigir parsing de string.

No dado estruturado vai identificador, não entidade: `{ orderId: order.id }`, nunca `{ order }`. Entidade inteira arrasta campo pessoal ou sensível pro log, e o `redact` global não cobre objeto arbitrário de log manual (ver "Redação de campo sensível").

Log operacional do pino não é audit log imutável. Ação que precisa registrar autor, decisão e mudança por obrigação de produto, segurança ou compliance ganha auditoria persistida junto do fluxo concreto; não se resolve com efeito colateral dentro de query de exibição (`backend/reading.md`) nem com uma mensagem `info` tratada como histórico definitivo.

Provider cobre qualquer classe de `infra/` no container do Nest: repositório, controller, subscriber, worker e a implementação do contrato de log que o caso de uso consome. Caso de uso loga por esse contrato (`backend/application.md`, "Log no caso de uso"), e o que ele passa ao contrato segue as mesmas regras de dado estruturado desta seção. Entidade e value object (`domain/enterprise/`, `packages/core`) não logam: fato de domínio que precisa ser observado vira domain event (ver `backend/events.md`), e o log sai do subscriber que o consome.

## Log de biblioteca externa

Biblioteca com logger próprio escreve, por padrão, direto no console, fora do JSON do processo: a linha dela não carrega `requestId`, não respeita o nível do ambiente e, num agregador, aparece como texto solto no meio de JSON. Quando a biblioteca aceita um logger custom, ele aponta pra mesma instância de pino, e a config disso é uma classe injetável que recebe o `PinoLogger` no construtor como qualquer provider:

Exemplo completo: logging.examples.md#vendorloggerconfig

Pontos-chave:

- `disableColors: true` evita código ANSI de cor dentro do JSON.
- O guard de `args.length === 0` evita logar `args: []` em toda linha: a maior parte das chamadas internas loga só mensagem, sem argumento extra, e um array sempre vazio na saída não carrega informação nenhuma, só ruído repetido.
- O nível passado pra biblioteca é o mais permissivo, não o do ambiente. O gate dela roda antes de `log()` ser chamado, então um nível restritivo ali descarta a mensagem antes de o pino ter chance de decidir. `'debug'` deixa tudo passar, e o nível do pino por ambiente continua sendo a régua única.

O logger da biblioteca não recebe o contexto progressivo do interceptor do Nest quando ela roda fora do pipeline. Fronteira que recusa uma request antes dos controllers registra, ela mesma, só `requestId` e um motivo estável; nunca ecoa header bruto, token, cookie ou body.

## Verificação rápida

- `Logger`/`PinoLogger` é injetado direto, sem contrato, só em provider de `infra/`, e caso de uso loga pelo contrato neutro de framework, sem importar `nestjs-pino`?
- Dado variável vai no primeiro argumento (objeto), nunca concatenado na mensagem?
- `FastifyAdapter` está sem config própria de `logger`?
- `LoggerErrorInterceptor` e o interceptor de contexto estão registrados via `APP_INTERCEPTOR` no `AppModule`, nessa ordem?
- Cada campo do contexto tem um significado só, sem valor sintético preenchendo o que ainda não foi resolvido?
- `redact` cobre `authorization` e `cookie` da request e `set-cookie`/`location` da response?
- Senhas, tokens, URL assinada, body e PII ficaram fora dos logs manuais e da URL registrada?
- `genReqId` do `FastifyAdapter` gera UUID, e o primeiro hook `onRequest` devolve `X-Request-Id` no response cru?
- Biblioteca com logger próprio aponta pro `PinoLogger`, sem cor no JSON e com o gate dela no nível mais permissivo?
