# ADR-0001 Lista de pedidos pagina no servidor

status: accepted
area: frontend
kind: exception

## Contexto

- A organização tem dezenas de milhares de pedidos.

## Decisão

- Exceção a `frontend/components`, "Estados de leitura", só na lista de pedidos: ela pagina no servidor.

## Alternativas consideradas

- Paginar no cliente: carrega a lista inteira.

## Consequências

- O estado vazio depende da página pedida.

## Imposto por

não imposto
