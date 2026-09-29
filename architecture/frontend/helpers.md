---
id: frontend/helpers
description: "o código auxiliar do `app-web` que não é componente nem página — a hierarquia pelo que a função conhece (inline, helper do módulo, casa fora do módulo); as rules de UI por domínio; as constantes; os tipos compartilhados e a escolha entre Zod schema e type plain."
use_when:
  - "criar um helper, uma rule, uma constante ou um tipo compartilhado no `app-web`"
  - "tirar um valor inline para arquivo próprio"
  - "escolher entre Zod schema e type plain"
applies_to:
  - "apps/app-web/src/pages/**/*.helpers.ts"
  - "apps/app-web/src/shared/utils/**"
  - "apps/app-web/src/shared/rules/**"
  - "apps/app-web/src/shared/constants/**"
  - "apps/app-web/src/shared/types/**"
  - "packages/utils/src/**"
  - "packages/ui/src/hooks/**"
  - "packages/ui/src/lib/**"
keywords: [helper, "<módulo>.helpers.ts", util.ts, rule, orderRules, constante, PER_PAGE, tipo compartilhado, z.infer, Pick, type plain, Zod schema, formatBRL, parseBRLToCents, Intl, "@metri/utils", "@metri/ui", "@metri/core", ApiErrorType, "@metri/core/errors"]
status: active
---
# Código auxiliar do frontend

Como o `app-web` organiza o que não é componente nem página: helper, rule, constante e tipo compartilhado. Onde cada um mora, e quando um valor sai de inline pra arquivo próprio. A estrutura de pastas em si é canônica em `frontend/structure.md`, "Estrutura de pastas"; aqui está o detalhe de cada casa auxiliar (`shared/utils`, `shared/rules`, `shared/constants`, `shared/types`).

Os exemplos usam o domínio didático de pedidos (`order`, `customer`) de `skills/writing-for-agents/RULE-FORMAT.md`, "Domínio didático".

## A hierarquia de código auxiliar

Uma função auxiliar nasce na casa que corresponde ao que ela conhece, da mais estreita pra mais ampla. O eixo não é quantos consumidores ela tem hoje: é o conhecimento embutido nela — quem conhece um módulo mora com o módulo, quem conhece algo deste app mora no app, quem não conhece nem um nem outro pode nascer já no pacote dono do conceito, pela colocação de `general/code-placement.md`; esperar um segundo consumidor pra "promover" esse caso só cria a migração que a primeira casa certa evita.

```mermaid
flowchart TD
    start[Preciso de uma função auxiliar] --> q1{É trivial e usada num arquivo só?}
    q1 -- sim --> inline[Inline no arquivo]
    q1 -- não --> q2{Conhece um módulo do app?}
    q2 -- sim --> local["&lt;módulo&gt;.helpers.ts na pasta do módulo"]
    q2 -- não --> q3{Conhece algo deste app<br/>(uma regra, um formato só dele)?}
    q3 -- sim --> shared["shared/utils/&lt;categoria&gt;.util.ts"]
    q3 -- não --> q4{Já existe em pacote?}
    q4 -- sim --> reuse[Usa o que existe; estende se faltar caso]
    q4 -- não --> pkg["Pode nascer no pacote dono do conceito, general/code-placement.md:<br/>@metri/utils puro, @metri/ui de UI"]
```

O tamanho decide só o degrau mais estreito, entre continuar inline e sair pro arquivo do módulo.

## Nível 1: inline

Função trivial, usada num lugar só, fica inline. Não nomear função separada pra uso único.

```tsx
// certo — inline é a escolha
function OrderCard({ order }: Props) {
  const itemCount = order.items.length;
  const itemsLabel = itemCount === 1 ? '1 item' : `${itemCount} itens`;

  return <Card>{itemsLabel}</Card>;
}

// evitar — função nomeada pra uso único
function getItemsLabel(count: number): string {
  return count === 1 ? '1 item' : `${count} itens`;
}
```

## Nível 2: helper do módulo

Função específica de um módulo, grande demais pra ficar inline ou usada por mais de um arquivo dele, vai num `<módulo>.helpers.ts` na pasta do módulo. É um arquivo por módulo, nunca um por componente: o helper de uma página, o de outra página do mesmo módulo e o de um componente de qualquer uma delas moram no mesmo arquivo, mesmo agrupamento de `shared/rules/<módulo>.rule.ts` e `shared/constants/<módulo>.constant.ts`.

```
pages/order/
├── list/
│   └── list-page.tsx
├── detail/
│   └── detail-page.tsx
└── order.helpers.ts
```

```ts
// pages/order/order.helpers.ts
import { formatBRL } from '@metri/utils/currency';
import type { Order } from '@/api/model.zod';

export function buildOrderSummary(
  order: Pick<Order, 'items' | 'totalInCents'>,
): string {
  const itemCount = order.items.length;
  const itemsLabel = itemCount === 1 ? '1 item' : `${itemCount} itens`;
  return `${itemsLabel} · ${formatBRL(order.totalInCents)}`;
}
```

O arquivo é companion do módulo e não sai dele: todo consumidor está na mesma pasta, mesma forma do `keys.ts` de `hooks/<módulo>/` (`frontend/data-fetching.md`, "A key factory"). Um consumidor de fora do módulo é o gatilho pra subir pro nível 3, não pra importar atravessando a fronteira.

O helper do módulo usa `.helpers.ts` pra explicitar o vínculo com os arquivos irmãos. O helper transversal segue a casa técnica e usa `.util.ts`.

## Nível 3: fora do módulo, a casa é o que a função conhece

Função que não é de um módulo sai de `pages/`, e a casa sai do que ela conhece:

- **Conhece algo deste app** — uma regra local, um formato que só ele usa — sem conhecer domínio: `shared/utils/<categoria>.util.ts`. A categoria é o tipo de operação (formatar, parsear, validar), nunca o domínio. Essa casa tende a ficar pequena ou vazia: a maior parte do que é puro e sem domínio também não conhece o app, e então não é daqui.
- **Existe só por causa do comportamento de uma biblioteca** e não teria sentido fora dela: `lib/<integração>/`, junto do client daquela integração.
- **Pura e agnóstica de app e de domínio** (formatar moeda ou data, encurtar um identificador): pode nascer em `@metri/utils`, mesmo com um consumidor só: não é antecipação de reuso, é a casa certa — nada nela é deste app. Helper agnóstico **de UI** (hook React genérico como um debounce, helper de classe como o `cn`) pode nascer em `@metri/ui` (`hooks/` ou `lib/`), dono do conceito de UI compartilhada. A regra geral é a de `general/code-placement.md`, "Código pode nascer no pacote dono quando nada nele é do app".

```ts
// @metri/utils — src/currency.ts
export function formatBRL(amountInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountInCents / 100);
}
```

**O par de conversão mora junto.** O format e o parse do mesmo conceito (`formatBRL` e `parseBRLToCents`) ficam no mesmo arquivo: o dono da conversão é um só, e separá-los é o que deixa os dois lados divergirem sem nada acusar.

**Formatação de data usa `Intl`, sem biblioteca externa**, em `@metri/utils` (`date.ts`): o runtime já entrega locale e timezone. A conta que cruza fuso é do backend (`general/date-time.md`).

**O dia de calendário local sai dos componentes locais da data** (`getFullYear()`, `getMonth() + 1`, `getDate()`), no fuso de quem olha, nunca de `toISOString().slice(0, 10)`: esse devolve o dia em UTC e erra o "hoje" à noite, em fuso negativo.

A pasta do app é plana, pela nomeação de `frontend/structure.md`: `shared/utils/<categoria>.util.ts`, não `shared/utils/format/<categoria>.util.ts`. O mesmo critério vale para `shared/schemas/<módulo>.schema.ts` e `shared/constants/<módulo>.constant.ts`: um arquivo por categoria ou módulo, sem subpasta. Subpasta por categoria só entra se um dia a lista crescer a ponto de justificar, decidido quando o caso real aparecer.

## Consultar antes de criar

Antes de criar um helper fora do módulo, procurar nos pacotes (`@metri/utils`, `@metri/ui`, `@metri/core`) e em `shared/utils/` por equivalente. Se já existe, usar; se cobre quase o caso, estender em vez de duplicar. Helper duplicado com nomes diferentes é o problema que essa checagem evita.

A busca começa pelos pacotes de propósito: `@metri/utils` é onde o helper puro agnóstico já mora, e `@metri/ui` (`hooks/`, `lib/`) é onde mora o de UI. Reimplementar no app um que já existe no pacote é a duplicação mais fácil de cometer, porque o nome novo não colide com nada.

## Rules: lógica de UI por domínio

Diferente de helper (agnóstico de domínio), rule é função específica de domínio que decide comportamento de UI: "esse botão aparece?", "esse campo é exigido nesse estado?". Vive em `shared/rules/<módulo>.rule.ts`.

```ts
// shared/rules/order.rule.ts
import type { Order } from '@/api/model.zod';

export const orderRules = {
  canEdit(order: Pick<Order, 'status'>): boolean {
    return order.status === 'DRAFT';
  },

  canCancel(order: Pick<Order, 'status'>): boolean {
    return order.status === 'DRAFT' || order.status === 'CONFIRMED';
  },
};
```

Características:

- **Função pura.** Rule não chama hook, não faz fetch, não usa estado. Recebe dado, devolve decisão. Testável sem montar componente.
- **Tipo reduzido por `Pick`.** Cada função declara só os campos que usa, aceitando qualquer forma que os tenha.
- **Mais permissiva que o backend, nunca mais restritiva.** Rule decide o que mostrar; a autorização real é do backend. Mostrar um botão e deixar o backend recusar é melhor que esconder e impedir uma ação válida.
- **Não duplica regra de negócio do backend.** Rule é regra de UI ("mostrar esse botão?"), não regra de negócio ("permitir essa operação?"). A segunda é do backend, e a resposta de erro dele (`backend/errors.md`) é a fonte da verdade.

Não criar rule pra condição trivial de uso único: `{order.status === 'DRAFT' && <EditButton />}` inline é mais claro que `orderRules.isDraft(order)`. Rule nasce quando há combinação de condições ou um nome semântico que a expressão crua não entrega.

## Constantes

Valor usado num arquivo só fica inline nele. Só vai pra `shared/constants/<módulo>.constant.ts` o valor que se repetiria em mais de um arquivo do app.

Limite que a API impõe não vira constante do app: vem da constante gerada em `api/model.zod.ts` (`backend/http-api.md`, "União fechada e limite do contrato").

O agrupamento é por módulo, um arquivo por módulo, nunca um arquivo por constante (`shared/constants/<módulo>.constant.ts` reúne as constantes do módulo), mesmo critério de `shared/schemas/<módulo>.schema.ts`. Isso evita a proliferação de arquivo de uma linha só.

Valor genuinamente genérico e repetido entre módulos usa nome genérico, não um por domínio:

```ts
// certo — um valor genérico
export const PER_PAGE = 20;

// evitar — mesmo valor sob nomes por domínio
export const ORDERS_PER_PAGE = 20;
export const CUSTOMERS_PER_PAGE = 20;
```

Se um módulo precisar de tamanho diferente, o override é local àquele caso.

## Tipos compartilhados

Tipo do contrato de API vem do client gerado, `api/model.zod.ts` (fim desta seção). Tipo do app com pelo menos um consumidor fica em `shared/types/<módulo>.type.ts`, nomeado, e é importado de lá. O limiar é um, não dois: esperar o segundo consumidor significa que o primeiro já declarou o tipo inline, e o segundo declara outro igual em vez de achar o que existe. Antes de escrever um tipo novo, ler o arquivo do módulo em `shared/types/` e reusar o que já estiver lá.

A exceção é o tipo de formulário (`<Nome>Values`), que continua exportado no próprio `shared/schemas/<módulo>.schema.ts`: ele é companion do schema de form (`frontend/forms.md`), nasce e morre com ele, e nenhum outro schema deriva dele. A outra exceção é o tipo que só descreve a forma de um mock, que mora no próprio arquivo de `shared/mocks/` (`frontend/structure.md`, "Casa com fronteira").

A fonte do tipo depende de onde o dado vem:

- Dado da API tem o tipo gerado em `api/model.zod.ts`; dado que o app valida em runtime (input de form, parâmetro de URL) tem o tipo derivado do schema Zod por `z.infer`, não redeclarado à mão.
- Dado que chega pelo client de uma integração externa, sem passar por schema do app, deriva do próprio client (`Awaited<ReturnType<typeof client.<método>>>`), reduzido com `Pick` pros campos que o app consome. Redeclarar à mão criaria uma segunda descrição da mesma linha, que diverge sem nada acusar quando o pacote renomeia um campo. A derivação depende do formato exato da chamada: opção que muda o tipo de retorno (um `throw` que troca a união `{ data, error }` pelo dado) entra na derivação, senão ela colapsa pra `any` em silêncio, e o `Pick` não acusa isso.
- Categoria de erro da API é o `ApiErrorType` de `@metri/core/errors`, importado direto do pacote, nunca recriado no app nem trocado pelo `DomainErrorType` (`backend/errors.md`, "O formato de resposta de erro").
- Tipo interno ao frontend, sem validação em runtime, é `type` puro.

Variação de um tipo existente estende com `&` ou `Pick`, não duplica os campos. O mesmo vale pra parte de um tipo: o item de uma lista deriva do envelope (`OrderList['items'][number]`), não repete os campos num tipo paralelo, senão os dois passam a poder divergir sem nada acusar:

```ts
// shared/types/order.type.ts
export type OrderWithCustomer = Order & { customer: Customer };

export type OrderListItem = Pick<
  Order,
  'id' | 'status' | 'totalInCents' | 'createdAt'
>;
```

Tipo que cruza a fronteira com o backend é o gerado em `api/model.zod.ts` (`backend/http-api.md`, "Contrato de API: o backend é a fonte"); tipo local de tela continua em `shared/types/`, mesmo quando se parece com um do contrato.

## Zod schema vs. type plain

`z.infer` de um schema Zod quando o app precisa validar o valor em runtime: input de form, parsing de parâmetro de URL. O parse tem custo, então não se paga por ele onde não há validação.

`type` puro quando o tipo é interno ao frontend e só existe em tempo de compilação, sem nada pra validar em runtime.

## Verificação rápida

- Função trivial de uso único está inline, não numa função nomeada à parte?
- Função específica de um módulo está no `<módulo>.helpers.ts` da pasta do módulo, um arquivo por módulo, nunca um por componente?
- Helper consumido de fora do módulo subiu de nível, em vez de ser importado atravessando a fronteira?
- Função fora do módulo foi pra casa pelo que conhece: algo do app em `shared/utils/`, nada do app no pacote dono (`@metri/utils` puro, `@metri/ui` UI) pela colocação de `general/code-placement.md`, comportamento de lib em `lib/<integração>/`?
- Format e parse do mesmo conceito moram no mesmo arquivo?
- Antes de criar helper, checou os pacotes e `shared/utils/` por equivalente?
- Rule está em `shared/rules/<módulo>.rule.ts`, é função pura e usa `Pick` do tipo?
- Rule é mais permissiva que o backend, nunca mais restritiva, e não duplica regra de negócio?
- Condição trivial de uso único ficou inline, sem virar rule?
- Constante só subiu pra `shared/constants/<módulo>.constant.ts` por repetição entre arquivos, e limite da API vem da constante gerada?
- Valor genérico repetido usa nome genérico, não um por domínio?
- Tipo do contrato de API vem de `api/model.zod.ts`, e tipo do app compartilhado está em `shared/types/<módulo>.type.ts`, derivado de schema (`z.infer`) quando há validação em runtime, e estendido com `&`/`Pick` em vez de duplicado?
- `ApiErrorType` vem de `@metri/core/errors`, não redeclarado no app nem substituído pelo `DomainErrorType`?
- O dia de calendário local vem dos componentes locais da data? `grep -rnE "toISOString\(\)\.(slice\(0, ?10\)|split\(['\"]T)" apps/app-web/src packages/*/src --include='*.ts' --include='*.tsx'` devolve vazio.
