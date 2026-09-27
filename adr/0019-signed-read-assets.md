# ADR-0019 Asset com leitura assinada: redação de log, limite de `requestUpload` e bucket privado

status: proposed
area: infrastructure
kind: decision

## Contexto

A redação de logs que contenham URL assinada (a assinatura é bearer token em query string) entra na lista de `redact` de `infrastructure/logging.md` quando existir asset com leitura assinada: o bucket público deriva a URL da chave, sem assinatura. Um limite de taxa mais restrito no endpoint de `requestUpload` fecha junto, pelo mesmo motivo. Os métodos de URL assinada e o bucket privado da classe de infra nascem com o primeiro asset que precisar deles.

## Decisão

A decidir.
