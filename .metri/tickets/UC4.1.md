---
id: UC4.1
title: Moldar uma iniciativa
feature: F4
slice: S10
actor: humano
status: open
mode: afk
blocked_by: [T10.2, T10.3]
areas: [backend/application, infrastructure/services, frontend/components]
touches: [runs, workspaces:plan]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/initiatives`", "`pnpm --filter app-web test:e2e e2e/initiatives/`"]
---

# UC4.1 · Moldar uma iniciativa

Como humano, quero que uma ideia vire produto, linguagem, design e specs numa entrevista que o Metri conduz, para chegar ao portão de direção com tudo escrito e revisável.

## Regras de negócio

- BR45: O Moldar escreve só no Workspace `plan/<n>` e só cria UCs em rascunho.
- BR46: Enquanto espera a resposta do humano, o Run não gasta tokens.

## Critérios

- [ ] Com uma ideia descrita pelo humano, quando o Moldar termina, o `plan/<n>` tem PRODUCT, CONTEXT e a spec de cada feature passando no `docs-lint`, os UCs existem em rascunho, e a Inbox tem o portão de direção.
- [ ] Num projeto com interface e sem documento de design, o `plan/<n>` termina com o documento de design, com os tokens, as referências, o que evitar e os princípios.
- [ ] Um ADR só entra no `plan/<n>` depois de uma pergunta do Run que o humano respondeu com sim.
- [ ] Com uma pergunta do agente pendente, o Run fica esperando o humano sem consumir tokens.
- [ ] Antes do portão de direção, o crítico sem contexto roda, e os achados dele aparecem no portão; se ele falhar, o portão diz que a crítica não foi feita.
- [ ] Tela: no Run de Moldar, um painel mostra os arquivos do `plan/<n>` mudando e as propostas feitas.

## Notas

- Esperando o humano, o Run não chama o modelo, mas o cache do prompt expira: retomar depois de uma espera longa relê o contexto e custa tokens. O tamanho desse custo não está confirmado; este ticket mede.
