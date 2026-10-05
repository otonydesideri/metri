---
id: frontend/structure
description: "a estrutura de pastas do `app-web` — as casas por função, a nomeação de arquivo, a pasta do dono e a fronteira de casa, que faz o que não encaixa abrir casa nova."
use_when:
  - "decidir em que pasta (casa) do `app-web` um arquivo de código novo entra"
  - "nomear um arquivo do frontend"
  - "abrir uma casa nova no `app-web`"
keywords: [estrutura de pastas, casa, app/, pages/, hooks/, api/, lib/, shared/, shared/components, shared/mocks, nomeação de arquivo, kebab-case, pasta do dono, arquivo de entrada, "<tela>-page.tsx", "<área>-layout.tsx", casa nova, "@metri/utils", "@metri/ui"]
status: active
---
# Visão geral do frontend

O frontend numa página: onde cada arquivo do `app-web` mora.

Os exemplos usam o domínio didático de pedidos (`order`, `customer`).

Este documento cobre a estrutura de pastas. Cliente HTTP e hooks de React Query estão em `frontend/data-fetching.md`, estado cliente em `frontend/state.md`, rotas em `frontend/routing.md`, página e componente em `frontend/components.md`, formulário em `frontend/forms.md`, design system em `docs/DESIGN.md`, código auxiliar em `frontend/helpers.md`.

## Stack

A stack do `app-web` é a de `defaults/stack.md`, "Stack".

## Estrutura de pastas

```
apps/app-web/src/
├── app/                    # composição: providers, router, guards, layouts
├── pages/<módulo>/         # um módulo de rota
│   ├── <tela>/             # uma pasta por rota, com as peças dela
│   └── components/         # peça de mais de uma página do módulo
├── hooks/<módulo>/         # hook React (um arquivo por hook)
├── api/                    # gerado do OpenAPI do app-api: funções por módulo e model.zod.ts
├── lib/<integração>/       # facade de biblioteca/serviço externo
└── shared/
    ├── components/         # componente React reutilizado entre áreas
    ├── config/             # configuração compartilhada do app
    ├── schemas/            # schema Zod (form/validação)
    ├── rules/              # regra de decisão de UI por domínio
    ├── constants/          # constante
    ├── stores/             # estado cliente transversal a telas
    ├── contexts/           # estado cliente de uma árvore de componentes
    ├── mocks/              # dado de montagem de tela, anterior à integração
    ├── utils/              # função pura que conhece algo deste app
    └── types/              # tipo TS compartilhado no app
```

Propósito e fronteira de cada casa:

| Casa | Propósito | Fronteira |
| --- | --- | --- |
| `app/` | providers, router, guards, layouts | composição da aplicação |
| `pages/<módulo>/` | uma pasta por rota, mais as peças de cada uma | monta a tela; delega lógica às casas abaixo |
| `hooks/<módulo>/` | hook React | React (estado, efeito, hook de lib) |
| `api/` | gerado do OpenAPI do app-api: funções por módulo e `model.zod.ts` | só o gerador escreve; chama o client de `lib/http/` |
| `lib/<integração>/` | facade de biblioteca ou serviço externo | só o wrapper da dependência; uma subpasta por integração |
| `shared/components/` | componente React reutilizado entre áreas | UI, sem chamada de rede direta |
| `shared/config/` | configuração compartilhada do app | composição de configuração, não valor fixo isolado |
| `shared/schemas/` | schema Zod do app, como o de form | valida em runtime; o schema de API é o gerado em `api/model.zod.ts` (`backend/http-api.md`) |
| `shared/rules/` | decisão de UI por domínio (`orderRules.canEdit`) | função pura, sem React nem fetch |
| `shared/constants/` | valor fixo | constante |
| `shared/stores/` | estado cliente lido por telas diferentes | store Zustand, sem Provider |
| `shared/contexts/` | estado cliente de uma árvore específica | Provider montado local à árvore |
| `shared/mocks/` | dado que monta uma tela antes de o backend responder | conteúdo de exemplo, apagável inteiro |
| `shared/utils/` | função pura que conhece algo deste app | sem domínio, sem React; o agnóstico de app pode nascer em `@metri/utils` (`general/code-placement.md`) |
| `shared/types/` | tipo TS compartilhado entre arquivos do app | sem runtime |

`shared/` não é um catch-all: cada arquivo entra numa das casas listadas e mantém a fronteira dela. Código específico de página, hook ou facade de dependência continua na casa top-level correspondente.

`lib/` é reservada ao wrapper de dependência externa, como o cliente HTTP ou o client de um serviço de terceiro. Cada integração tem uma subpasta mesmo quando começa com um arquivo, porque seus clients, adapters e tradutores evoluem juntos. Detalhe das casas auxiliares (`shared/utils`, `shared/rules`, `shared/constants`, `shared/types`) está em `frontend/helpers.md`.

## Nomeação de arquivo

- As casas auxiliares `schemas/`, `rules/`, `constants/`, `types/`, `utils/`, `mocks/` e `config/` são planas e usam o sufixo da função: `<módulo>.schema.ts`, `<módulo>.rule.ts`, `<módulo>.constant.ts`, `<módulo>.type.ts`, `<categoria>.util.ts`, `<módulo>.mock.ts` e `<módulo>.config.ts`.
- `api/`, `stores/` e `contexts/` são planas por módulo, sem sufixo: `api/<módulo>.ts`, `stores/<módulo>.ts`, `contexts/<módulo>.tsx`.
- Casa que rende vários arquivos por módulo ou integração usa subpasta: `hooks/<módulo>/` e `lib/<integração>/`.
- `app/router/guards/` é plana: `<nome>-guard.tsx`, com o spec ao lado. Guard não acumula peça, é um componente e a decisão que ele toma, então a pasta não teria o que agrupar.
- Pasta e arquivo não repetem o módulo que já os contém: em `pages/<módulo>/`, a tela é `<tela>/<tela>-page.tsx`. Quem carrega o módulo é o nome do componente (`OrderDetailPage`, em `pages/order/detail/detail-page.tsx`), que no router convive com os de todos os outros módulos.
- Tudo em kebab-case.
- O filtro de um check do ticket (`pnpm test <nome>`) casa com o caminho do arquivo, então o `<nome>` de uma tela leva a pasta do módulo: `pnpm test order/detail` acha `pages/order/detail/detail-page.spec.tsx`.
- Segmento e parâmetro de rota seguem `frontend/routing.md`, "Segmento de rota".

## A pasta do dono: quem some junto com quem

Página e layout são sempre pasta, mesmo quando têm um arquivo só. A pasta leva o nome da coisa, e o sufixo de papel fica no arquivo de entrada, que é o único que alguém de fora importa:

| Casa | Pasta | Arquivo de entrada |
| --- | --- | --- |
| `pages/<módulo>/` | `<tela>/` | `<tela>-page.tsx` |
| `app/layouts/` | `<área>/` | `<área>-layout.tsx` |
| componente, em qualquer lugar | `<componente>/` | `<componente>.tsx` |

Composição é sempre pasta porque é onde peça aparece: a tela ganha esqueleto de carregamento, item de lista e estado de tela conforme o fluxo cresce, e o layout ganha cabeçalho e carrossel. Com a pasta pronta desde o começo, a primeira peça é um arquivo novo ao lado, não uma migração de arquivo pra pasta no meio de outra tarefa. Componente de catálogo (`shared/components/`) começa como arquivo solto e vira pasta se ganhar peça própria.

A pasta de dono é reconhecida pelo arquivo de entrada, não por sufixo no nome dela: é a pasta que contém `<nome-da-pasta>` mais o sufixo da casa. `icons/` não tem `icons.tsx` e `pages/order/` não tem `order-page.tsx`, então as duas são casa, não dono. Componente aninhado dentro de uma casa de papel não herda o sufixo dela: um carrossel dentro de um layout é componente, não layout, e a entrada dele é homônima.

### O que decide a casa de uma peça

A pergunta é sobre identidade, não sobre quantos consomem hoje: se o dono some, isso some junto?

- Some junto, porque só existe pra montar a tela dele e o nome só faz sentido perto dele (o esqueleto da lista de pedidos, as bolinhas do carrossel): pasta do dono.
- Sobrevive, porque a identidade não vem de quem usa (um ícone, um campo de form com dependência externa, o estado de erro de leitura): casa de papel, com o critério de pertença escrito nela.

Um campo de form com dependência externa pode ter um consumidor só e mesmo assim não ser peça de ninguém, porque continuaria existindo se a tela que o usa sumisse. Um segundo consumidor de fora não é a regra, é o sintoma: quando ele aparece, quase sempre a identidade nunca foi do dono, e a peça muda de casa.

Peça com identidade própria vai pra casa mais estreita que cobre os donos dela: `pages/<módulo>/components/` quando serve páginas de um módulo só, `shared/components/` quando cruza módulos, e o pacote quando a colocação de `general/code-placement.md` o admite. `components/` do módulo nasce no primeiro caso real, não antes.

Peça privada inclui hook: um hook acoplado a um componente específico (o das bolinhas do carrossel) fica na pasta desse componente, não em `hooks/<módulo>/`, que é organizado por módulo de domínio.

A pasta do dono é a unidade que se lê, refatora e apaga inteira, e a fronteira é o que garante isso: nada dentro dela é importado de fora, exceto o arquivo de entrada. Quem atravessa é barrado pelo spec estrutural (`frontend/testing.md`, "Spec de estrutura"), que diz de quem é a peça.

## Casa com fronteira: o que não encaixa abre casa nova

Cada casa tem um propósito único e não abraça o mundo. Quando um código não encaixa em nenhuma casa existente, a resposta é **abrir uma casa nova**, com propósito próprio, não alargar uma casa existente pra caber. Cada abertura de casa é uma decisão registrada, não um reflexo.

A casa é o propósito, não a pasta: ela pode estar declarada aqui sem ter caso real. `shared/contexts/` (estado de uma árvore, propósito definido em `frontend/state.md`) tem o propósito fechado antes do primeiro arquivo, que entra sem decidir nada de novo.

`shared/mocks/` guarda o dado que monta uma tela enquanto a integração com o backend não existe: a lista que o switcher apresenta, o conteúdo do painel de notificações. Ele existe pra ser apagado inteiro quando a leitura real entrar, e é isso que o separa de `shared/constants/`, onde mora valor fixo que o app mantém. Tipo que só descreve a forma desse dado mora no mesmo arquivo, não em `shared/types/`, pelo mesmo motivo: ele some junto.

## O que sobe pro pacote

A colocação entre app e pacote segue `general/code-placement.md`, "Código pode nascer no pacote dono quando nada nele é do app". No frontend, o pacote dono é o `@metri/utils` para função pura agnóstica, o `@metri/ui` para UI compartilhável (helper, hook, componente, provider) e o `@metri/core/errors` para vocabulário de erro. O detalhe da escolha de casa está em `frontend/helpers.md`, "Nível 3".

## Verificação rápida

- O arquivo entrou na casa cujo propósito bate com a função dele (função pura do app em `shared/utils/`, agnóstica de app no pacote dono quando a colocação de `general/code-placement.md` o admite, chamada ao app-api pela função gerada em `api/`, facade de SDK externo em `lib/<integração>/`, validação em `shared/schemas/`)?
- Página e layout nasceram como pasta, com a pasta nomeada pela coisa e o sufixo de papel só no arquivo de entrada?
- A peça foi pra pasta do dono ou pra casa de papel pela pergunta certa (se o dono some, ela some junto?), sem decidir por contagem de consumidor?
- Arquivo técnico de `shared/` está na pasta plana e com o sufixo correspondente?
- Hook e facade de integração estão na subpasta do módulo ou integração?
- O nome está em kebab-case?
- Código que não encaixa em nenhuma casa abriu casa nova, com decisão registrada, em vez de inchar uma existente?
- A escolha entre app e pacote seguiu a colocação de `general/code-placement.md`, sem pacote catch-all?

## Delegado ao projeto

- **Taxonomia de `shared/components/`.** O projeto decide a divisão interna de `shared/components/` em pastas de papel, além de `inputs/` (`frontend/forms.md`, "Campo montado no app").
