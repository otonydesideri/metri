# ADR-0006 O kit de UI é o coss ui, com os tokens, as fontes e o toast dele

status: accepted
area: frontend
kind: default-change

## Contexto

O default do método é o shadcn/ui dentro do `@metri/ui`, com os tokens da base neutra e o toast do sonner. O Metri quer o visual do coss ui, o design system do cal.com: componentes feitos sobre Base UI, distribuídos por um registry compatível com o CLI do shadcn, com estilo, cores e fontes próprios.

No cal.com, o pacote `@coss/ui` tem os componentes numa pasta plana e é alimentado por um script próprio, que copia só os componentes. O CSS desse pacote é uma cópia adaptada da parte AGPL do repositório coss, não a saída do registry.

Licenças, conferidas em 04/10/2026 no commit `dd49ec9` de `cosscom/coss`: o registry (`apps/ui`) é MIT, e dele saem `@coss/style`, `@coss/colors-neutral`, `@coss/fonts`, `@coss/ui` e cada componente. O resto do repositório, incluindo o pacote `packages/ui`, é AGPL-3.0. As fontes, Inter e Geist Mono, são SIL OFL 1.1.

### Como o mercado faz

- A maioria usa shadcn/ui sobre Radix: Orca (`stablyai/orca`, `components.json`, estilo `new-york-v4`), Superset (`superset-sh/superset`, `packages/ui/components.json`) e Vibe Kanban (`BloopAI/vibe-kanban`, `packages/local-web/components.json`).
- As ferramentas mais novas migraram para Base UI: Conductor (bundle 0.90.1, `@base-ui/react`), Morphite (bundle 0.3.2) e o app desktop do Claude (bundle 2.19675.0). O T3 Code instala os componentes pelo próprio registry do coss ui (`pingdotgg/t3code`, `apps/web/components.json`, registry `@coss`).

O Metri segue as ferramentas mais novas, com o mesmo registry do T3 Code.

## Decisão

Troca três defaults, no `@metri/ui` e no app web do Metri:

- `defaults/ui`, "Kit": o kit é o coss ui, instalado pelo CLI do shadcn a partir do registry do coss: `@coss/style`, `@coss/colors-neutral`, `@coss/fonts` e os componentes. Os componentes ficam em `src/components/ui/`, como manda o layout do método; não se usam a pasta plana nem o script de cópia do cal.com.
- `defaults/ui`, "Tema e dark mode" e "Tipografia e espaçamento": os tokens, as cores, as fontes (Inter e Geist Mono) e o raio são os do coss. O DESIGN.md copia no frontmatter os valores do coss como estão e registra os desvios do Metri, e o `metri design-tokens` continua comparando o tema com ele.
- `defaults/stack`, "Stack" (notificação com o sonner): o toast é o do Base UI, que vem com o coss, e serve só para confirmar ações.

Continuam: react-hook-form com Zod nos formulários, com os campos do coss; o next-themes; e `Table` com TanStack Table para tabela de dados.

Nunca entra no Metri código da parte AGPL do coss (o pacote `packages/ui` de `cosscom/coss` e os imports `@coss/ui/*` que a documentação do coss sugere para as fontes), nem o CSS do cal.com.

## Alternativas consideradas

- shadcn/ui, o default: nenhuma troca de default, mas sem o visual escolhido.
- coss ui com os tokens do Metri por cima: dois vocabulários de token na mesma tela, e a documentação do coss avisa que tokens de outro estilo deixam bordas e sombras inconsistentes.
- A organização do cal.com, com pasta plana e script próprio de cópia: o script ignora as variáveis de tema do registry, e o `metri sot` e o Biome assumem a pasta `components/ui/` do método.
- O DESIGN.md só apontando para os tokens do coss: o `metri design-tokens` ficaria sem valores para comparar.

## Consequências

- O registry não tem versão nem release: é servido a partir do `main` do coss. A trava é a cópia no repositório, e cada atualização é deliberada, com a data e o commit do coss registrados.
- Quase todo o código do coss é de um mantenedor só, e o changelog tem mudanças incompatíveis frequentes.
- A Sidebar não tem página de documentação, e não há tabela de dados pronta.
- O `@coss/style` traz os 54 componentes de uma vez.
- Os componentes usam a escala padrão de tamanhos do Tailwind. Os níveis de texto do DESIGN.md se definem no ticket do design system, e o ajuste nos arquivos de `components/ui/` segue `defaults/ui`, "Ajuste visual".
- O ticket do design system entrega um arquivo de avisos de terceiros, com a licença MIT do coss e a OFL das duas fontes. Também confere se a Geist Mono do `@coss/fonts` (o pacote `geist`, feito para Next.js) funciona num app Vite; a alternativa é o `@fontsource-variable/geist-mono`.
- A regra do projeto em `.metri/rules/frontend/` nasce num ticket de padrão no Look across.

## Imposto por

`metri design-tokens` (o tema contra o DESIGN.md) e `metri sot` (a pasta de fornecedor). A ausência de código AGPL não é imposta por check.
