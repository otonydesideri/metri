---
id: UC1.1
title: Escrever e listar notas
feature: F1
slice: S1
actor: autor
status: open
mode: afk
areas: [backend/application, backend/persistence, backend/http-api, frontend/data-fetching, frontend/forms]
touches: [schema:note, router:notes]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test src/domain/application/use-cases/notes/`", "`pnpm --filter app-api test:e2e src/infra/http/controllers/notes/`", "`pnpm --filter app-web test:e2e e2e/notes/`"]
---

# UC1.1 · Escrever e listar notas

Como autor, quero escrever notas com título e corpo e vê-las numa lista, para reencontrar minhas ideias depois.

## Regras de negócio

- BR1: Uma nota tem título obrigatório, de 1 a 120 caracteres; o corpo é opcional, com até 5.000 caracteres.
- BR2: A lista mostra as notas da mais recente para a mais antiga, pela data de criação.

## Critérios

- [ ] Criar uma nota com título e corpo a grava e devolve a nota criada, com id e data de criação.
- [ ] Título vazio, título com mais de 120 caracteres ou corpo com mais de 5.000 é recusado, com a mensagem do campo, e nada é gravado.
- [ ] A listagem devolve todas as notas, da mais recente para a mais antiga.
- [ ] Tela: na tela de notas, o autor escreve título e corpo, salva, e a nota aparece no topo da lista sem recarregar a página; sem notas, a tela mostra o estado vazio com o formulário à vista.

## Notas
