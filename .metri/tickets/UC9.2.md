---
id: UC9.2
title: Resolver um portão
feature: F9
actor: humano
status: draft
---

# UC9.2 · Resolver um portão

Como humano, quero ver cada portão com o que está definido, o que foi inferido e o que está em aberto, para decidir sem reconstruir o contexto.

## Regras de negócio

- BR27: Todo portão mostra os três blocos: definido (com a fonte), inferido (com o motivo) e perguntas.
- BR28: Toda resolução grava quem resolveu, quando e o quê.

## Critérios

- [ ] Tela: qualquer portão abre com os três blocos.
- [ ] Tela: a Inbox mostra os itens em três grupos, nesta ordem: aprovações de ferramenta, portões e perguntas, avisos. Aprovação de ferramenta e pergunta se resolvem no próprio card; os portões de direção, de plano e de aceite abrem no painel de detalhe.
- [ ] Num ticket `pattern` verificado com 3 variantes de tela, aprovar escolhendo uma registra a escolha nas notas, e o Run do ticket, que esperava o portão, apaga as outras variantes e registra a tela escolhida no documento de design antes de concluir e de o ticket seguir para a fila; os tickets que ele bloqueava entram na frontier depois do merge.
- [ ] Recusar com motivo o portão de padrão de um ticket devolve o ticket a `open`, com o motivo nas notas, e o Run seguinte começa só com o id do ticket.
- [ ] Aprovar o portão de direção abre o Run de Look across no mesmo `plan/<n>`.
- [ ] Pedir ajuste no portão de direção ou no de plano vira uma mensagem, com o motivo, ao Run de Moldar ou de Look across; recusar encerra a iniciativa, com o motivo registrado.
- [ ] No portão de uma proposta de padrão, virar lacuna ou descartar devolve o ticket a `open`, com a resposta nas notas, para um Run novo; levar ao próximo Look across o mantém bloqueado até o novo portão de plano.
- [ ] No portão de um ticket `hitl`, confirmar que os passos humanos foram feitos fecha o ticket, passando pela fila quando ele tem diff; recusar o devolve a `open`, com o motivo.
- [ ] Os avisos de Goal bloqueado e de Run falho ou travado se resolvem devolvendo o ticket a `open`, com a opção de trocar o modelo ou o orçamento do próximo Run, ou cancelando; nenhum devolve o ticket a `in_progress` sem Run.
- [ ] A pergunta de um agente é respondida no próprio item, e a resposta volta ao Run que perguntou.
- [ ] "Resolvidos" mostra o histórico, com quem resolveu, quando e o quê.

## Notas
