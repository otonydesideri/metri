---
id: domain/model
description: "entidade (construtor privado, `create()` × `reconstitute()`, id), value object, agregado e sua fronteira de consistência, propriedade do agregado (quem escreve a tabela), referência entre agregados por identidade, atualização parcial e a mutação interna do agregado por método de domínio."
use_when:
  - "criar agregado, entidade, value object ou enum de domínio"
  - "decidir quem escreve a tabela de um agregado"
  - "adicionar mudança de estado ou atualização parcial a uma entidade"
  - "fazer um agregado referenciar outro"
applies_to:
  - "apps/app-api/src/domain/enterprise/*.entity.ts"
  - "apps/app-api/src/domain/enterprise/value-objects/**"
  - "apps/app-api/src/domain/enterprise/enums/**"
keywords: [entidade, value object, agregado, enum de domínio, AggregateRoot, ValueObject, UniqueEntityID, "create()", "reconstitute()", "touch()", Optional, Either, setter, atualização parcial, propriedade do agregado, tabela externa, referência entre agregados, uuid, .entity.ts, .vo.ts, .enum.ts, "@metri/core/entities"]
not_covered:
  - "quando e como uma coleção usa `WatchedList` → domain/watched-list"
  - "classe de erro, `Either` e tradução → backend/errors"
  - "registro e despacho de evento → backend/events"
  - "repositório, mapper e escrita → backend/persistence"
  - "caso de uso e contrato → backend/application"
  - "Strategy → domain/strategy"
  - "Specification → domain/specification"
  - "Builder → domain/builder"
  - "a divisão real de agregados e a forma de cada um num app, que são decisão de projeto (\"Matriz de delegações\") → project:architecture/INDEX"
  - "Domain Service / Policy → domain/domain-services"
  - "bounded context → domain/bounded-contexts"
examples: [domain/model.examples.md]
status: active
---
# Modelo de domínio

O modelo de domínio é TypeScript puro em `domain/enterprise`: entidades e value objects que guardam as invariantes do negócio e só existem em estado válido. Os exemplos usam o domínio didático de pedidos (`order`, `invoice`), com o `Order` como agregado de referência.

## Regras

### Entidade: criação e reconstituição são caminhos separados

**Obrigatório.** Toda entidade tem construtor privado e no máximo dois caminhos de instância, `create()` e `reconstitute()`, com papéis que não se misturam.

**Obrigatório.** `create()` é o nascimento de um agregado novo: recebe `Optional<<Entidade>Props, ...>`, com as props que têm default marcadas como opcionais, e todo derivado (id, timestamps, defaults, valores gerados) nasce dentro dele.

**Proibido.** `create()` receber o id: o `UniqueEntityID` nasce na base `Entity`.

**Obrigatório.** `create()` valida invariante e devolve `Either` com a união exata das classes de erro possíveis; quando nenhuma invariante pode falhar, o tipo declara isso também, `Either<never, ...>` (`backend/errors.md`).

**Obrigatório.** `reconstitute()` é a volta do banco: recebe as props completas e o id da linha e confia no que está persistido, sem validação, sem `Either`, com retorno direto.

**Obrigatório.** `reconstitute()` é o único caminho de instância usado por mapper e por factory de teste.

**Obrigatório.** O id gerado por `UniqueEntityID` (`randomUUID()` de `node:crypto`) e a coluna `id` do schema usam sempre o mesmo formato, uuid v4 (`id String @id @default(uuid())`), em todo model.

> **Por quê.** Os dois lados divergindo (um gerador incremental ou ULID, por exemplo) criariam uma inconsistência silenciosa entre o id montado em memória antes do insert e o que o Postgres aceitaria depois, sem erro de tipo, porque o schema não tem constraint de formato para pegar isso.

**Obrigatório.** Mudança de estado é método com nome de intenção (`confirm()`, nunca `setStatus()`), devolvendo `Either` quando a transição pode falhar e chamando `touch()` no fim quando a entidade tem `updatedAt`.

**Obrigatório.** Getter por prop exposta.

**Proibido.** Setter público como mecanismo de alteração da entidade: mutação de domínio acontece pelo método que expressa o comportamento.

- **Exceção.** Campo simples que participa de atualização parcial, nos limites da seção "Atualização parcial": expõe setter próprio, só ele. A exceção não se estende a outros campos, não autoriza setter arbitrário e não dispensa invariante: o que precisa recusar valor continua em value object, na porta ou em método nomeado.

**Obrigatório.** Filho de agregado com linha própria no banco (`OrderItem`) é entidade, com `reconstitute()` próprio; conceito sem identidade é value object.

**Obrigatório.** Dado que participa das invariantes de um agregado tem a representação de domínio desta seção, entidade ou value object, inclusive quando a tabela é externa.

Tabela sem representação no modelo de domínio (estado técnico de persistência, tabela de suporte, dado só de leitura) não é parte modelada de agregado nenhum; a escrita e a leitura dela seguem `backend/persistence.md` e `backend/reading.md`.

**Proibido.** Entidade artificial criada só para uma tabela técnica caber num agregado.

### Agregado e mutação interna

Quando uma invariante de domínio precisa ser preservada atomicamente pelo próprio modelo durante uma mudança: **Obrigatório.** Os elementos responsáveis por ela pertencem à mesma fronteira de agregado, a raiz (`AggregateRoot`, de `@metri/core/entities`) e os filhos dela.

A regra não põe toda consistência do sistema, nem toda operação transacional, dentro de um agregado só: operação que envolve mais de uma fronteira é coordenada por `backend/transactions.md`, com transação entre agregados ou consistência eventual pela árvore de `backend/operation-routing.md`, e a leitura de exibição atravessa agregados sem redesenhá-los (`backend/reading.md`).

**Obrigatório.** Coleção interna do agregado preserva as invariantes por método de domínio: item entra e sai por método de intenção da entidade (`addItem()`), que aplica a regra antes de tocar a coleção.

**Proibido.** Mutar a coleção de fora da entidade (`order.items.add()` direto).

**Obrigatório.** Getter que devolve array devolve `readonly T[]`.

Quando a coleção precisa rastrear o que entrou e o que saiu: **Obrigatório.** A forma dela sai da árvore de `domain/watched-list.md`, dono da decisão de usar `WatchedList`.

### Referência entre agregados

**Obrigatório.** Um agregado guarda o id de outro agregado, nunca a entidade dele nas props.

> **Por quê.** O referenciado tem ciclo de vida próprio e não entra na fronteira de consistência de quem referencia.

### Propriedade do agregado: quem escreve a tabela

**Obrigatório.** A propriedade de cada agregado — quem insere linha na tabela dele — é decidida antes de escrever qualquer contrato.

**Padrão.** O agregado é do app: a entidade tem `create()` e `reconstitute()`, e o contrato do repositório tem escrita e leitura completas. É o que se assume enquanto ninguém decidir o contrário.

Quando a tabela é escrita por um sistema externo (um adapter de biblioteca que traz o próprio schema, uma integração que sincroniza a tabela de fora): **Obrigatório.** O agregado existe para ler e decidir, não para criar, e segue as regras abaixo.

**Proibido.** `create()` em agregado de tabela externa.

> **Por quê.** Criar a linha é operação de quem é dono dela. A ausência do método faz o compilador barrar o que, com um `create()` presente, dependeria de disciplina; todo agregado dessa forma chega ao domínio por `reconstitute()`, vindo de uma linha que já existe.

**Proibido.** Escrita do app inserir linha em tabela externa, inclusive por upsert.

> **Por quê.** Um upsert criaria pela porta lateral o que a ausência de `create()` fecha na entidade, já que `reconstitute()` é público.

**Obrigatório.** A entidade de tabela externa carrega a linha inteira.

> **Por quê.** Como a escrita grava a entidade inteira, coluna que existe na tabela e não existe nas props fica fora do alcance do domínio, e nada acusa isso.

**Obrigatório.** O formato do id de tabela externa é acordo explícito da integração, decidido antes da primeira linha gravada.

> **Por quê.** Quem gera o id é o sistema externo, e o formato dele raramente coincide com o `UniqueEntityID` (uuid v4) por default: sem o acordo, duas tabelas do mesmo banco guardam id de formatos diferentes sem nenhum erro, e qualquer validação que assuma uuid recusa a linha externa.

| Forma | Entidade e contrato |
| --- | --- |
| Do app | `create()`/`reconstitute()` na entidade, escrita e leitura completas no contrato |
| Externo, com escrita do domínio | Só `reconstitute()`; leitura + escrita que recebe o agregado, sem insert |
| Externo, leitura pura | Só `reconstitute()`; só leitura |

**Obrigatório.** A forma que cada agregado real assume é registrada como decisão de projeto do app antes do primeiro contrato (`methodology/authoring.md`, "Decisões específicas de projeto").

### Atualização parcial: setter por campo, e o que não cabe nele

Quando um endpoint atualiza alguns campos de uma vez, deixando os outros como estão: **Obrigatório.** A entidade muta por setter, um por campo.

**Obrigatório.** O caso de uso decide o que mexer pela presença do campo no input, com os três estados distinguidos pelo tipo: ausente (`undefined`) não toca no valor atual, `null` limpa, valor troca.

**Obrigatório.** O setter aceita só o que ele já pode aplicar; o que precisa recusar valor vai para onde consegue falhar:

- invariante do valor em si (formato, faixa) é value object, e o caso de uso cria o VO antes de atribuir, propagando o `failure` dele;
- restrição de entrada sem regra de domínio atrás (tamanho máximo de um texto livre) é `.max()` no schema Zod da porta (`backend/http-api.md`);
- regra que depende de outros campos do agregado, ou de uma transição de estado, não é atualização parcial: é método nomeado pela operação, devolvendo `Either`.

> **Por quê.** Setter não devolve nada, então não tem como recusar valor, e `throw` para erro esperado é proibido (`backend/errors.md`).

Quando a operação tem nome de negócio: **Obrigatório.** Método nomeado, mesmo mexendo num campo só: `cancel()` diz o que aconteceu, `set status` só diz o que mudou.

### Value objects

**Obrigatório.** Conceito sem identidade própria, definido pelos valores, é value object: igualdade por valor, imutável, sem id.

**Obrigatório.** Validação e normalização (trim, case, formato) acontecem dentro do `create()` do VO, nunca em quem chama.

> **Por quê.** Normalizar no caso de uso criaria um segundo lugar que pode divergir sobre o que é um valor válido.

**Obrigatório.** Entrada inválida é `failure(...)` com a classe de erro do módulo, nunca exceção (`backend/errors.md`).

**Obrigatório.** O comportamento do conceito mora no VO: operação devolve instância nova, caso conhecido ganha nome, e invariante de operação falha dentro do VO, não em quem chama.

## Aplicação

A entidade completa, com a coleção de itens e dois métodos de domínio:

Exemplo completo: model.examples.md#orderitemlist

Exemplo completo: model.examples.md#order

- `Order` usa `WatchedList` porque a coleção de itens passa pela árvore de `domain/watched-list.md` (limitada, mutada pelo domínio, com invariante da raiz sobre ela). O getter expõe a lista porque o repositório lê o delta dela (`backend/persistence.md`); a mutação continua passando por `addItem()`.
- Transição que interessa a outras partes do sistema registra o evento no próprio método (`addDomainEvent(...)`, de `AggregateRoot`); registro e despacho seguem `backend/events.md`.
- A coleção de vínculo a outro agregado (as tags de um produto) aplica a referência por identidade: a lista guarda os ids referenciados (`domain/watched-list.md`, "Coleção de vínculo").

A atualização parcial, com o setter e o uso no caso de uso:

```ts
// domain/enterprise/order.entity.ts (trecho)
public get note(): string | null {
  return this.props.note;
}

/** Observação em branco cai no mesmo estado de ausente. */
public set note(note: string | null) {
  const trimmed = note?.trim();
  this.props.note = trimmed ? trimmed : null;
  this.touch();
}
```

```ts
if (note !== undefined) {
  order.note = note;
}
```

O value object de referência:

Exemplo completo: model.examples.md#money

- `add()` devolve instância nova, `zero()` dá nome ao caso conhecido, e uma invariante de operação (somar moedas diferentes, por exemplo) falharia aqui dentro. Um VO que só valida e normaliza (um slug, por exemplo) é o mínimo do padrão, não o teto dele.

Os arquivos seguem a tabela "Onde cada arquivo mora" do `backend/layers.md`: `<entidade>.entity.ts` na raiz de `enterprise/`, value object em `enterprise/value-objects/<nome>.vo.ts`, enum de domínio no mesmo formato em `enterprise/enums/<nome>.enum.ts`, classes de erro do módulo em `enterprise/errors/<módulo>.errors.ts` (`backend/errors.md`), lista rastreada ao lado da entidade dona (`domain/watched-list.md`) e evento em `enterprise/events/` (`backend/events.md`).

## Verificação

- `create()` recebe só o que o chamador decide, nasce os derivados dentro e devolve `Either`; `reconstitute()` é o único caminho de mapper e factory?
- Mudança de estado é método com nome de intenção, sem setter público fora da atualização parcial?
- Coleção interna muda só por método de domínio, e a decisão de usar `WatchedList` saiu da árvore dela?
- Referência a outro agregado guarda o id, nunca a entidade?
- Dado que participa de invariante tem entidade ou value object, e nenhuma entidade artificial nasceu só para uma tabela técnica?
- A propriedade de cada agregado foi decidida e registrada como decisão de projeto antes do contrato?
- Agregado de tabela externa está sem `create()`, nenhuma escrita insere linha nela, a entidade carrega a linha inteira e o formato do id foi acordado?
- Atualização parcial usa setter por campo, com o que precisa recusar valor em value object ou na porta, e operação com nome de negócio como método próprio?
- Value object valida e normaliza dentro do `create()` e devolve instância nova em toda operação?

## Referências

- `domain/watched-list.md`: quando e como a coleção usa `WatchedList`.
- `domain/domain-services.md`: regra de domínio sem dono natural no modelo.
- `domain/bounded-contexts.md`: a fronteira do modelo.
- `backend/errors.md`: classe de erro, `Either` e a proibição de `throw` para erro esperado.
- `backend/events.md`: registro do fato na entidade e despacho depois de persistir.
- `backend/persistence.md`: repositório, mapper e a escrita que recebe o agregado.
- `backend/application.md`: o caso de uso que orquestra a entidade.
- `backend/http-api.md`: `.max()` na porta para restrição de entrada.
- `backend/layers.md`: onde cada arquivo mora.
- `methodology/authoring.md`: casa da decisão de projeto sobre a forma de cada agregado.
