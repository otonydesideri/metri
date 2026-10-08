---
id: UC9.1
title: Responder a uma aprovação de ferramenta
feature: F9
actor: humano
status: draft
---

# UC9.1 · Responder a uma aprovação de ferramenta

Como humano, quero responder ao pedido de um agente para usar uma ferramenta fora da Policy, para que ele siga sem eu precisar abrir a conversa dele.

## Regras de negócio

- BR25 (sensitive): A resposta vai só para o Run que pediu. "Permitir sempre" vale só para aquele Run e para o padrão de chamada que o harness propõe junto do pedido, guardado pelo Metri e reaplicado na sessão do harness, nunca gravado nas configurações do projeto ou nas pessoais.
- BR26: Com a entrada editada pelo humano, roda a entrada editada; o histórico guarda a original e a editada.

## Critérios

- [ ] Com um builder pedindo um comando fora da allowlist, "permitir uma vez" roda só aquela chamada, e o Run volta a rodar.
- [ ] "Permitir sempre neste Run" libera as próximas chamadas do mesmo padrão naquele Run, e em nenhum outro.
- [ ] Sem padrão proposto pelo harness, ou com `suppressAlwaysAllowRule`, "permitir sempre" fica desabilitado.
- [ ] Depois de retomar a sessão do harness, as liberações "permitir sempre neste Run" continuam valendo.
- [ ] Toda sessão do harness abre com o modo de permissão `default`, explícito, e nenhuma chamada fora da Policy roda sem passar pela aprovação.
- [ ] Recusar devolve a recusa ao agente, e o Run continua sem rodar a chamada.
- [ ] Com a entrada editada, roda a entrada editada, e o histórico guarda as duas.
- [ ] Com o Run encerrado antes da resposta, o item aparece expirado, em cinza e sem ações.
- [ ] Tela: o detalhe mostra a ferramenta, a entrada, o Run, o papel e a regra da Policy que pediu a aprovação.

## Notas

- No SDK 0.3.289, o `canUseTool` traz `suggestions` (`PermissionUpdate[]`) com um `destination` que pode ser de usuário, de projeto ou da sessão, e o `updatedInput` para a entrada editada; o pedido pode esperar sem prazo (`sdk.d.ts`). Desde a 0.3.286, omitir o `permissionMode` pode abrir a sessão no modo automático (https://code.claude.com/docs/en/agent-sdk/permissions). A liberação da sessão não sobrevive a um processo novo, por isso o Metri a guarda.
