# ADR-0019 Limite de taxa de `requestUpload`

status: proposed
area: infrastructure
kind: decision

## Contexto

O endpoint de `requestUpload` emite permissão de escrita no storage e pode pedir um limite de taxa mais restrito que o do throttler global. O resto do que este ADR juntava já está decidido no texto: a URL assinada fica fora de log manual e o `location` da resposta entra no `redact` (`infrastructure/logging.md`, "Redação de campo sensível"); o bucket privado e a leitura por URL assinada estão em `infrastructure/storage.md`, "Por que dois buckets" e "Contrato por asset: dois eixos".

## Decisão

A decidir.
