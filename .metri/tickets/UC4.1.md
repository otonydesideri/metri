---
id: UC4.1
title: Moldar uma iniciativa
feature: F4
actor: humano
status: draft
---

# UC4.1 · Moldar uma iniciativa

Como humano, quero que uma ideia vire produto, linguagem, design e specs numa entrevista que o Metri conduz, para chegar ao portão de direção com tudo escrito e revisável.

## Regras de negócio

- BR45: O Moldar escreve só no Workspace `plan/<n>` e só cria UCs em rascunho.
- BR46: Enquanto espera a resposta do humano, o Run não gasta tokens.

## Critérios

- [ ] Com uma ideia descrita pelo humano, quando o Moldar termina, o `plan/<n>` tem PRODUCT, CONTEXT e a spec de cada feature passando no `docs-lint`, os UCs existem em rascunho, e a Inbox tem o portão de direção.
- [ ] Num projeto com interface e sem documento de design, o `plan/<n>` termina com o documento de design, com os tokens, as referências, o que evitar e os princípios.
- [ ] Uma decisão difícil de reverter tomada na entrevista sai como ADR no `plan/<n>`, e nenhum ADR é escrito sem o sim do humano.
- [ ] Com uma pergunta do agente pendente, o Run fica esperando o humano sem consumir tokens.
- [ ] Antes do portão de direção, o crítico sem contexto roda, e os achados dele aparecem no portão; se ele falhar, o portão diz que a crítica não foi feita.
- [ ] Tela: no Run de Moldar, um painel mostra os arquivos do `plan/<n>` mudando e as propostas feitas.
- [ ] Tela: o portão de direção mostra os três blocos e o diff dos documentos.

## Notas

- Esperando o humano, o Run não chama o modelo, mas o cache do prompt expira: retomar depois de uma espera longa relê o contexto e custa tokens. O tamanho desse custo não está confirmado; este ticket mede.
