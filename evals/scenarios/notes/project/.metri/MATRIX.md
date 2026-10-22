# MATRIX

## Slices

### S0 · Fundação

status: done

### S1 · Notas

horizon: now · blocked_by: [S0]
contract:
  responsibility: Guarda as notas do autor e as devolve das mais recentes para as mais antigas.
  interface: `POST /api/notes` cria uma nota e `GET /api/notes` lista as notas, com os DTOs no OpenAPI e o client gerado no app-web.
  invariants: Toda nota tem título de 1 a 120 caracteres; a listagem sai ordenada pela data de criação, da mais recente para a mais antiga.
  consumers: [F1]

## Fog

- Como o autor organiza muitas notas: pastas, etiquetas ou busca.

## Gaps

## Pattern proposals
