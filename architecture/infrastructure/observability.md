---
id: infrastructure/observability
description: "métrica, alerta e reconciliação operacional como capacidades condicionais — a diferença entre log, métrica, alerta e reconciliação, quando uma métrica existe e o que ela declara, a cardinalidade das dimensões, onde a métrica é emitida, quando um alerta existe e o que ele declara, e quando e como uma reconciliação funciona."
use_when:
  - "criar métrica ou alerta"
  - "desenhar uma reconciliação, processo que confere o estado esperado contra o estado real"
  - "vigiar um risco aceito"
  - "escolher ferramenta de observabilidade"
keywords: [observabilidade, métrica, alerta, reconciliação, sinal, pergunta operacional, dimensão, cardinalidade, threshold, severidade, janela, dono operacional, dead letter, redrive, requestId, fonte de verdade, estado esperado, estado real, divergência, cadência, idempotente, órfão de storage, risco aceito]
not_covered:
  - "log, o mecanismo e o que entra nele → infrastructure/logging"
  - "captura de erro inesperado → backend/errors"
  - "retry, dead letter e tarefa agendada → backend/async-jobs"
  - "a divergência possível de cada capacidade, declarada pelo dono dela — o órfão de storage → infrastructure/storage"
  - "a divergência possível de cada capacidade, declarada pelo dono dela — o risco aceito de consistência → backend/transactions"
  - "ferramenta, métricas concretas, thresholds, destinos e reconciliações concretas, que são delegação de projeto (\"Matriz de delegações\") → project:architecture/INDEX"
status: active
---
# Observabilidade

Métrica, alerta e reconciliação são capacidades condicionais: um projeto pode não ter nenhuma, e cada uma nasce de uma pergunta operacional real. Quando nasce, a forma dela já está decidida aqui. Nenhuma ferramenta é escolhida neste documento (coleta, armazenamento de série, destino de alerta). Os exemplos usam o domínio didático de pedidos e as capacidades que a Source já desenha.

## Regras

### Quatro sinais, quatro perguntas

| Sinal | Pergunta que responde | Owner |
| --- | --- | --- |
| Log | O que aconteceu neste evento individual? | `infrastructure/logging.md` |
| Métrica | Como um comportamento se comporta, agregado ao longo do tempo? Vazão, latência, falhas, retries, profundidade de fila, duração de job | Este documento |
| Alerta | Alguém precisa agir agora? | Este documento |
| Reconciliação | O estado real diverge do esperado onde o caminho síncrono não garante? | Este documento |

**Obrigatório.** Cada sinal responde à própria pergunta; um não substitui o outro.

**Proibido.** Log reproduzido como métrica, uma série por evento individual com o detalhe do log nas dimensões.

### Métrica

Quando existe uma pergunta operacional que só um comportamento agregado responde, como "os jobs estão acumulando?": **Permitido.** A métrica que a responde.

**Proibido.** Métrica sem pergunta operacional, criada por completude ou para o futuro.

**Obrigatório.** Toda métrica declara significado, unidade, dimensões e dono operacional.

**Obrigatório.** Toda dimensão tem cardinalidade controlada: um conjunto de valores fechado e pequeno, como fila, status, resultado ou o template da rota.

**Proibido.** Identificador como dimensão: `userId`, `requestId`, id de entidade, escopo do dono, URL crua.

- **Exceção.** Dimensão de identificador com cardinalidade comprovadamente limitada, decidida em ADR (`methodology/authoring.md`, "Decisões específicas de projeto"): permitida no escopo que o ADR registra.

> **Por quê.** Cada valor distinto vira uma série própria, e custo e consulta crescem com ele; o identificador que localiza um caso já está no log, com o `requestId` da request.

**Obrigatório.** Métrica é emitida em infraestrutura: fronteira de request, worker, implementação de contrato ou reconciliação.

Quando o fato medido só existe dentro do caso de uso: **Obrigatório.** Ele sai por um contrato neutro de framework, injetável como os demais (`backend/application.md`, "Contratos são `abstract class`"), e a biblioteca de métrica fica fora de `src/domain` (`backend/boundaries.md`).

### Alerta

Quando uma condição operacional exige ação humana ou operacional: **Permitido.** Alerta.

**Proibido.** Alerta sem ação esperada, inclusive o disparado por um erro isolado.

**Obrigatório.** Todo alerta declara a condição, a janela, a regra ou o threshold, a severidade e a ação esperada, com quem age.

**Obrigatório.** A condição é sobre comportamento agregado numa janela (taxa, contagem, idade, profundidade) ou sobre o resultado de uma reconciliação, nunca sobre uma ocorrência isolada.

### Reconciliação

Quando o caminho síncrono não garante a consistência — operação distribuída que pode terminar pela metade, ação externa que falha depois do estado local, recurso físico sem registro, registro sem recurso, consistência eventual que precisa de conferência posterior: **Permitido.** Reconciliação.

**Obrigatório.** A divergência que uma reconciliação vigia é declarada pelo documento dono da capacidade; este documento define como a reconciliação funciona.

**Obrigatório.** Toda reconciliação declara o estado esperado, que é a fonte de verdade; o estado real que ela confere; o critério de divergência; a ação para cada divergência (corrigir, registrar ou alertar); e a cadência.

**Obrigatório.** A ação corretiva parte da fonte de verdade: o que diverge dela é corrigido ou sinalizado, nunca a fonte a partir da cópia.

**Proibido.** Ação destrutiva sobre divergência que o critério não distingue de um estado ainda em curso.

**Obrigatório.** A reconciliação computa por estado e é idempotente: rodar de novo sobre o mesmo estado não repete efeito.

**Obrigatório.** O resultado da reconciliação é observável: as divergências encontradas são contadas como métrica, e a que exige ação humana vira alerta.

## Aplicação

- Dead letter: a pergunta "algum job falhou de vez?" é respondida pela profundidade da dead letter por fila (unidade: jobs; dimensão: fila) e pela idade do job mais antigo nela. Como profundidade maior que zero é incidente a investigar (`backend/async-jobs.md`, "Falha, retry e dead letter"), o alerta é profundidade maior que zero sustentada na janela, com a ação de investigar a causa e fazer o redrive. Janela, severidade e destino são do projeto.
- Log e métrica da mesma request: a linha automática de `infrastructure/logging.md` localiza a request pelo `requestId`; a latência por rota é métrica com o template da rota (`/orders/:orderId`) como dimensão, nunca a URL crua, que carrega o id.
- Órfão de storage: o binário que sobra quando a remoção física falha depois da escrita é risco aceito de `infrastructure/storage.md`, "Arquivo físico segue o destino do registro". A reconciliação que o elimina tem como estado esperado as chaves referenciadas pelos registros, a fonte de verdade; como estado real, os objetos do bucket sob o prefixo do asset; como divergência, o objeto sem registro fora da janela em que um registro pendente ainda pode consumi-lo; como ação, remover o objeto e contar a remoção; como cadência, uma tarefa agendada que computa por estado. Registro sem objeto é a divergência inversa: vira alerta, nunca remoção do registro. O job concreto é delegação de projeto (`docs/architecture/INDEX.md`).
- Reconciliação que roda por tempo é tarefa agendada, pela árvore de `backend/operation-routing.md`, com worker fino e caso de uso (`backend/async-jobs.md`, "Tarefas agendadas").
- Risco aceito de consistência (`backend/transactions.md`, "Concorrência e locking"): a condição de revisita registrada com ele pode ser uma métrica, como a contagem de conflitos por operação.

## Verificação

- Cada métrica responde a uma pergunta operacional nomeada, com significado, unidade, dimensões e dono?
- As dimensões têm cardinalidade controlada, sem identificador fora de exceção registrada em ADR?
- A métrica é emitida em infraestrutura ou por contrato neutro, sem biblioteca de métrica em `src/domain`?
- Nenhum log foi reproduzido como métrica?
- Todo alerta tem condição agregada numa janela, threshold, severidade e ação esperada com quem age?
- Toda reconciliação declara estado esperado, estado real, critério de divergência, ação e cadência, com a correção partindo da fonte de verdade?
- A reconciliação é idempotente, computa por estado, e não destrói o que o critério não distingue de estado em curso?
- O resultado da reconciliação é contado como métrica, com alerta para o que exige ação?

## Referências

- `infrastructure/logging.md`: o log, sinal de evento individual.
- `backend/async-jobs.md`: dead letter, tarefa agendada e worker.
- `backend/operation-routing.md`: tarefa agendada como mecanismo.
- `infrastructure/storage.md`: o órfão de storage e o registro pendente.
- `backend/transactions.md`: o risco aceito e a condição de revisita.
- `backend/application.md`: contrato neutro para fato do caso de uso.
- `backend/boundaries.md`: o que `src/domain` importa.
- `methodology/authoring.md`: casa do ADR de exceção.
- `docs/architecture/INDEX.md`: ferramenta e valores concretos como decisão de projeto.
