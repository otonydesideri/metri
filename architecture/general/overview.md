---
id: general/overview
description: "o sistema numa página: o mapa do monorepo, das camadas do backend e do caminho de uma request, e onde vivem o como construir cada artefato, a observabilidade e os testes."
use_when:
  - "procurar o documento correspondente ao como construir um artefato, à observabilidade ou aos testes"
status: active
---
# Visão geral

O sistema numa página: o que existe no monorepo (`general/code-placement.md`), as camadas do backend (`backend/layers.md`) e o caminho que uma request percorre (`docs/architecture/INDEX.md`, "Caminho linear").

O como construir cada artefato vive no documento correspondente (`backend/layers.md`, "Onde cada arquivo mora"); o que não é decisão da Source segue `methodology/authoring.md`, "Decisões específicas de projeto". Fronteiras de import vivem em `backend/boundaries.md`; estrutura de módulo e comunicação entre módulos, em `backend/modules.md`.

## Observabilidade

O log estruturado (`nestjs-pino`) tem desenho em `infrastructure/logging.md`, e a captura de erro inesperado (filtro global, corpo padronizado), em `backend/errors.md`. Métrica, alerta e reconciliação são capacidades condicionais, com desenho em `infrastructure/observability.md`; ferramenta e valores concretos são decisão de projeto (`docs/architecture/INDEX.md`).

## Testes

O desenho transversal de testes (pirâmide, factories, repositórios em memória, e2e) está em `backend/testing.md`, para o backend, e em `frontend/testing.md`, para o frontend.
