---
id: UC8.1
title: Construir um ticket
feature: F8
slice: S8
actor: humano
status: open
mode: afk
blocked_by: [T8.1, S5, S7, S9]
areas: [backend/application, domain/domain-services, infrastructure/services, frontend/components]
touches: [runs, workspaces, scheduler, schema:runs]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/build`", "`pnpm --filter app-api test:e2e controllers/build`", "`pnpm --filter app-web test:e2e e2e/board/`"]
---

# UC8.1 · Construir um ticket

Como humano, quero despachar um ticket e receber o trabalho só quando os checks provarem que ele está pronto, para não depender da palavra do agente.

## Regras de negócio

- BR8: Só o verificador declara o Goal atingido.
- BR9: O builder não altera checks, não remove testes, só escreve regras num ticket `pattern` e não escreve no plano. O verificador roda o `metri scope`, que acusa o que sair disso.
- BR83: Um ticket por vez no projeto: o despacho, automático ou pedido pelo humano, só acontece quando nenhum ticket do projeto está `in_progress`, e o pedido do humano fora disso é recusado com o motivo.
- BR61: O custo de um Run é estimado pelo Metri a partir dos tokens e de uma tabela de preços, e aparece sempre como estimativa; o valor que o harness informa é só referência.

## Critérios

- [ ] Tela: o card de um ticket da frontier no Board tem a ação de despachar.
- [ ] Ao despachar, o Workspace existe em `ticket/<id>`, o setup do projeto rodou, as skills do papel estão na pasta do harness, o ticket está `in_progress` e o evento de contexto guarda a lista do que entrou no contexto (arquivos, regras e o commit de base).
- [ ] Com um ticket `in_progress` no projeto, despachar outro é recusado, com o motivo junto da ação.
- [ ] Todo fim de turno do builder dispara o verificador. Vermelho volta ao builder; verde sem `report` pede o `report` uma vez, e o ticket só fica `blocked` com o motivo `human` se o pedido for ignorado.
- [ ] Quando o builder entrega com um check vermelho, a saída volta para ele na mesma sessão do harness, e o Run continua.
- [ ] Com os checks, o `metri verify` e o `metri scope` verdes e a evidência completa, o Run fica concluído, e o ticket entra na fila de integração.
- [ ] Tela: o card mostra o estado do Run, os checks verdes sobre o total e o custo estimado, marcado como estimativa.

## Notas

- Até a UC8.2, a lacuna e a proposta de padrão seguem o método: o builder escreve a linha delas na MATRIX, o que o `metri scope` já aceita.
- A tabela de preços é do driver do Claude, com a data e a fonte de cada preço, e muda por ticket.
