---
id: domain/bounded-contexts
description: "o bounded context — o que ele não é, o contexto único como padrão, os sinais que justificam mais de um, a relação com módulo, app e pacote, e a interação entre contextos."
use_when:
  - "dividir o domínio em mais de um modelo"
  - "tratar um termo que passou a ter dois significados"
  - "fazer um módulo usar conceito que pertence a outro contexto"
  - "propor app, pacote ou serviço separado por motivo de domínio"
keywords: [bounded context, contexto, sinais de divisão, contrato publicado, read model, domain event, tradução, camada de anticorrupção, anticorrupção, layer-first, Customer, OrderConfirmedEvent, comando em linha]
not_covered:
  - "módulo, granularidade e comunicação entre módulos do mesmo contexto → backend/modules"
  - "agregado e fronteira de consistência → domain/model"
  - "join e composição de leitura entre contextos → backend/reading"
  - "colocação entre app e pacote → general/code-placement"
  - "o mecanismo de uma reação → backend/operation-routing"
  - "a divisão concreta de cada projeto (\"Capacidades ativas\") → project:ARCHITECTURE"
activation: "O domínio dos UCs mostra um dos sinais de `domain/bounded-contexts.md` para mais de um modelo, como o mesmo termo com dois significados?"
status: active
---
# Bounded context

Bounded context é a fronteira dentro da qual os termos do domínio têm um significado só, o modelo é coerente, a propriedade das regras é clara e as invariantes pertencem àquele modelo. É capacidade condicional. Os exemplos usam o domínio didático de pedidos (`order`, `invoice`, `customer`).

## Regras

### O que um contexto não é

**Proibido.** Usar bounded context como sinônimo de módulo, pasta, microserviço, app, pacote ou agregado.

> **Por quê.** Cada um desses já tem dono e critério próprio (`backend/modules.md`, `general/code-placement.md`, `domain/model.md`); o contexto separa modelos e linguagens, e confundi-lo com eles leva a dividir por estrutura o que não diverge em significado.

### Um contexto é o padrão

**Padrão.** O projeto tem um bounded context só.

Quando aparece qualquer um dos sinais abaixo: **Obrigatório.** Avaliar a separação em mais de um contexto.

- o mesmo termo com significados diferentes em partes do sistema;
- modelos diferentes para o mesmo conceito;
- regras e invariantes que mudam por motivos independentes;
- linguagem e modelo que evoluem separados;
- integração que já precisa ser explícita entre os modelos;
- fronteira de domínio real que um modelo único começa a distorcer.

**Proibido.** Dividir em contextos só porque há muitas tabelas, muitos módulos, times diferentes, vontade de microserviço ou projeto grande.

> **Por quê.** Divisão sem divergência real de modelo troca chamada direta por contrato e tradução entre contextos: custo sem ganho de coerência.

### Contexto, módulo, app e pacote

**Obrigatório.** Cada módulo de `backend/modules.md` pertence a um bounded context só; um contexto contém um ou mais módulos.

**Obrigatório.** A divisão em contextos mantém a estrutura layer-first de `backend/layers.md`: módulo continua pasta dentro de cada camada, e a pertença de cada módulo a um contexto é registro de projeto.

**Proibido.** Exigir um app ou um pacote por contexto: app e pacote seguem a colocação de `general/code-placement.md`, e contexto separado não obriga deploy nem pacote separado.

### Interação entre contextos

**Proibido.** Um contexto usar entidade, agregado ou contrato de repositório de outro.

**Proibido.** Um contexto decidir invariante que pertence ao modelo de outro.

Quando dois contextos interagem: **Obrigatório.** A interação passa por contrato explícito do contexto dono, com dados no vocabulário do contrato e nunca entidade: fato publicado como domain event, para reação (`backend/events.md`), e contrato publicado ou read model do contexto dono, para leitura (`backend/reading.md`).

Quando o mesmo conceito tem significados diferentes nos dois lados: **Obrigatório.** Quem consome traduz o que recebe para o próprio modelo.

**Permitido.** A tradução ganhar peça própria, uma camada de anticorrupção, quando o modelo do outro lado é externo, instável ou distorceria o do consumidor.

## Aplicação

- O cliente da venda (endereço de entrega, histórico de pedidos) e o cliente do faturamento (dados fiscais, condição de pagamento) são o sinal clássico: o mesmo termo, dois modelos. Com dois contextos, cada um tem o próprio `Customer`, e o faturamento reage ao `OrderConfirmedEvent` da venda, que carrega ids, montando a própria visão pelo próprio modelo.
- Dentro de um contexto, módulos se comunicam pelas regras de `backend/modules.md`, "Comunicação entre módulos"; as proibições de "Interação entre contextos" valem entre contextos.
- Comando em linha entre contextos, ou consumo de capacidade que não é evento nem leitura, é a integração além do contrato compartilhado, delegada ao projeto (`backend/modules.md`, "Delegado ao projeto"): nenhum mecanismo próprio nasce sem a decisão do projeto (`skills/writing-for-agents/RULE-FORMAT.md`, "Delegado ao projeto").
- Leitura entre contextos segue a regra de join de `backend/reading.md`, "Regras absolutas da query".
- A escolha do mecanismo de uma reação segue a árvore de `backend/operation-routing.md`. Escrita atômica que grava agregados de contextos diferentes esbarra na primeira proibição de "Interação entre contextos".
- A divisão concreta (quantos contextos, nomes, fronteiras, módulos de cada um e contratos entre eles) é decisão de projeto: o gatilho é a `activation` desta regra, e o registro, a linha dela em `.metri/ARCHITECTURE.md`, "Capacidades ativas".

## Verificação

- A divisão em contextos partiu de sinal de divergência de modelo, não de tamanho, tabelas, times ou vontade de microserviço?
- Cada módulo pertence a um contexto só, sem app ou pacote exigido por contexto e sem mudar a estrutura layer-first?
- Nenhum contexto usa entidade, agregado ou contrato de repositório de outro, nem decide invariante dele?
- A interação entre contextos passa por evento, contrato publicado ou read model, com tradução quando os significados diferem?
- Comando em linha entre contextos parou para decisão, sem mecanismo próprio?

## Referências

- `backend/modules.md`: módulo, comunicação entre módulos e a integração delegada ao projeto.
- `domain/model.md`: agregado e fronteira de consistência.
- `backend/events.md`: o fato publicado entre contextos.
- `backend/reading.md`: leitura e join entre contextos.
- `backend/operation-routing.md`: o mecanismo de uma reação.
- `backend/layers.md`, `general/code-placement.md`: estrutura layer-first e colocação entre app e pacote.
- `skills/writing-for-agents/RULE-FORMAT.md`: o ponto delegado ao projeto.
- `.metri/ARCHITECTURE.md`: a divisão concreta como decisão de projeto.
