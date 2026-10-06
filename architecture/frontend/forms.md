---
id: frontend/forms
description: "onde o formulário mora e como se compõe; o uso do React Hook Form (desestruturação, submit, commit por campo, campo como string); `defaultValues`; o schema de form e a diferença dele para o schema de API; o campo montado no app sobre o `InputGroup` do `@metri/ui` (dependência externa, comportamento próprio, máscara); rótulo, descrição e nome acessível do controle."
use_when:
  - "criar formulário"
  - "escrever schema de form"
  - "montar um campo que o `@metri/ui` não entrega"
  - "ligar rótulo, descrição e controle"
applies_to:
  - "apps/app-web/src/shared/schemas/**"
  - "apps/app-web/src/shared/components/inputs/**"
keywords: [formulário, React Hook Form, useForm, handleSubmit, handleFormSubmit, handleFieldCommit, trigger, getValues, defaultValues, values, reset, z.coerce, schema de form, schema de API, "<módulo>.schema.ts", InputGroup, InputGroupInput, InputGroupAddon, input-group-control, Textarea, react-phone-number-input, "react-phone-number-input/flags", key, CDN, use-mask-input, withMask, useHookFormMask, Inputmask, showMaskOnHover, showMaskOnFocus, aria-describedby, label, Label, FieldError, aria-label, "@metri/ui"]
not_covered:
  - "o modal de tarefa que contém o form e a regra de Esc e clique fora → frontend/routing"
  - "a mutation que o form dispara, o estado em voo e a notificação → frontend/data-fetching"
  - "o contrato com o backend → backend/http-api"
  - "o layout visual do formulário → project:DESIGN"
  - "a estrutura de pastas do frontend → frontend/structure"
  - "o tipo derivado de schema → frontend/helpers"
  - "a promoção de peça ao pacote → general/code-placement"
status: active
---
# Formulários do frontend

Formulário é a parte da tela que recebe entrada do usuário: ele valida no navegador, transforma o que precisa antes de enviar e entrega a escrita a um hook de mutation. Os exemplos usam o domínio didático de pedidos (`order`, `customer`).

## Ferramentas

| Ferramenta | Status | Decisão |
| --- | --- | --- |
| React Hook Form | DECIDIDA | `defaults/stack.md`, "Stack" |
| Zod | DECIDIDA | `defaults/stack.md`, "Stack" |
| `react-phone-number-input` | DECIDIDA | `defaults/stack.md`, "Quando precisar"; uso em "Campo montado no app", abaixo |
| `use-mask-input` (sobre o Inputmask) | DECIDIDA | `defaults/stack.md`, "Quando precisar"; uso em "Campo montado no app", abaixo |

## Regras

### Onde o formulário mora

**Obrigatório.** Formulário fica inline na página que o usa, ou dentro de um componente quando a UX é esse componente, um modal ou drawer, por exemplo.

**Proibido.** Camada de formulário à parte: um `<Nome>Form` intermediário ou o par "form genérico + wrapper".

**Proibido.** Componente extraído só para organizar condicionais que obrigue a atravessar `register`, `control`, `errors` ou o restante do React Hook Form por props.

### Submit e handlers

**Obrigatório.** A escrita segue `frontend/data-fetching.md`: hook de mutation em `hooks/<módulo>/` para rota REST do app-api ("Hooks de mutation") ou o comando do client externo direto no handler ("Comando de biblioteca externa fica no handler"), nunca embutida no form: o form monta os campos e chama o handler, que é da página ou do componente que o contém.

**Obrigatório.** O callback passado ao `handleSubmit` se chama `handleFormSubmit`.

Quando a linha se confirma sozinha, sem salvar em lote: **Obrigatório.** O handler não passa por `handleSubmit`: valida e manda um campo só, com `trigger` e `getValues`, e se chama `handleFieldCommit`.

> **Por quê.** O `handleSubmit` valida o formulário inteiro, e um campo inválido barraria a gravação de outro.

**Obrigatório.** O `useForm` é desestruturado no ponto de uso (`const { register, handleSubmit, formState } = useForm(...)`); o objeto inteiro só fica quando precisa ser passado adiante, a um subcomponente ou contexto.

**Obrigatório.** Campo de formulário é sempre string, com a conversão no submit (`Number`, `parseCurrencyToCents`).

**Proibido.** `z.coerce` no schema de form.

> **Por quê.** String é o que o `<input>` entrega e o que o `register` guarda. Um schema com `z.coerce` teria tipo de entrada diferente do de saída, e o `useForm` passaria a discordar do resolver, com o erro aparecendo como incompatibilidade de tipo no `resolver`, longe da causa.

### `defaultValues` estático fica fora; derivado fica dentro

**Obrigatório.** O `defaultValues` do `useForm` referencia uma const nomeada no mesmo arquivo, nunca um objeto literal inline.

Quando todos os valores são estáticos: **Obrigatório.** A const fica no escopo do módulo.

> **Por quê.** Declara que a configuração independe da renderização, mantém o corpo do componente focado no fluxo da tela e entrega uma referência estável. A estabilidade é consequência, não motivo para usar `useMemo`.

Quando ao menos um valor depende de dado disponível só durante a renderização (prop, parâmetro de rota, resultado já resolvido de query): **Obrigatório.** A const fica dentro do componente, depois da fonte da qual deriva.

**Proibido.** Transformar essa const em função para levá-la ao escopo do módulo.

> **Por quê.** Função passada a `defaultValues` é o loader assíncrono do React Hook Form, chamado sem os argumentos do componente.

Quando o dado chega depois da montagem: **Obrigatório.** A tela aguarda o dado antes de montar o formulário, ou usa `values` quando o formulário precisa acompanhar a fonte.

> **Por quê.** O React Hook Form já capturou os defaults iniciais; dado que chega depois não torna a const "dinâmica".

**Obrigatório.** `reset` fica para um evento explícito que substitui os valores depois da montagem, nunca como hidratação automática por reflexo.

Quando o mesmo formulário é reusado para outra fonte (o passo seguinte, outro item da lista): **Obrigatório.** Ele leva `key` com a identidade da fonte (`<DayForm key={day} ... />`), para montar do zero a cada troca.

> **Por quê.** Sem a `key`, o React reaproveita o componente, o formulário guarda os `defaultValues` da fonte anterior, e o submit falha na validação sem nenhum erro visível.

### Schema de form e schema de API são coisas diferentes

**Obrigatório.** Schema de form e schema de API são declarações separadas, mesmo quando coincidem campo a campo: o de form mora em `shared/schemas/<módulo>.schema.ts`, e o de API é o gerado em `api/model.zod.ts` (`backend/http-api.md`, "Contrato de API: o backend é a fonte").

**Obrigatório.** O schema de form carrega o que é da UI: mensagem de erro em português, campo que o form aceita vazio mas a API exige, transformação aplicada antes de enviar (normalizar e-mail, parsear data) e restrição mais estreita que o contrato do backend.

Schema de form mais estrito que o do backend não é divergência, é decisão de produto.

**Obrigatório.** A página conta com a transformação declarada no schema, sem repetir a normalização no handler.

**Obrigatório.** Restrição de entrada fica no schema de form e não desce para o domínio, que segue no formato geral.

> **Por quê.** O form pode aceitar só o recorte que a tela atende (um tamanho de código, um conjunto de países) enquanto o value object do backend aceita o formato geral: mudar a regra de entrada depois mexe num arquivo só.

**Obrigatório.** Depois do parse e da transformação do schema de form, a chamada recebe o input tipado pelo contrato gerado em `api/model.zod.ts`, nunca uma cópia local nem o tipo do form (`frontend/data-fetching.md`, "Funções de API").

> **Por quê.** O schema de form muda por requisito de tela, o de API muda por contrato do backend, e um não arrasta o outro.

### Campo montado no app

**Obrigatório.** Campo que o `@metri/ui` não entrega pronto mora em `shared/components/inputs/`, não no pacote, e continua montado com as peças dele.

**Obrigatório.** O campo de partida é o primitivo do pacote com a semântica certa, `Input` ou `Textarea`, não sempre o `Input`.

Quando o campo precisa de uma dependência externa que o pacote não tem: **Obrigatório.** A peça externa entra como filho comum de `InputGroup`, no lugar do `InputGroupInput`, com `data-slot="input-group-control"`.

> **Por quê.** É esse atributo que dá à peça externa o estado de foco do grupo, como o `InputGroupInput` tem.

Quando o campo precisa de um comportamento próprio sobre o campo do pacote: **Obrigatório.** O `InputGroup` entrega o campo e os afixos, e o app acrescenta o controle que falta num `InputGroupAddon`, ao lado do `InputGroupInput` (a senha, com o `InputGroupButton` que alterna o `type`).

Quando o campo tem semântica de domínio com lib dedicada: **Obrigatório.** Ele usa a lib dedicada, que entrega máscara, parsing e formato canônico numa peça só: o telefone sai do `react-phone-number-input` já em E.164, sem conversão no submit nem na hidratação do form, ligado ao React Hook Form pela entrada `react-phone-number-input/react-hook-form` (com o seletor de país) ou `react-phone-number-input/react-hook-form-input` (sem ele).

**Obrigatório.** Componente de terceiro traz os assets embutidos, sem buscar nada em CDN durante o uso: as bandeiras do seletor de país do telefone entram por `import flags from 'react-phone-number-input/flags'`, passadas em `flags`.

> **Por quê.** O asset de CDN falha offline e em rede restrita, sem erro na tela, e manda a quem usa o produto uma requisição a um terceiro que ninguém decidiu.

Quando a máscara é puramente sintática (documento, código postal, moeda): **Obrigatório.** Ela usa o `use-mask-input`, sobre o Inputmask, pelo `withMask`, que devolve um ref callback e compõe com o campo controlado.

**Proibido.** `useHookFormMask` em campo controlado: ele devolve os props de `register` e só serve a campo não controlado.

Quando a máscara varia com o comprimento: **Obrigatório.** Array de máscaras, sempre da mais curta para a mais longa.

> **Por quê.** A troca acontece só no sentido de crescer, e a ordem invertida prende o valor curto na máscara longa sem nada acusar.

**Obrigatório.** `showMaskOnHover` e `showMaskOnFocus` ficam desligados.

> **Por quê.** Senão a prévia do Inputmask cobre o `placeholder` do campo.

### Rótulo, descrição e o nome acessível do controle

**Obrigatório.** A descrição fica fora do `<label>`, ligada ao controle por `aria-describedby`.

> **Por quê.** Dentro do rótulo ela entra no nome acessível, e o controle passa a se chamar "Observação Aparece no comprovante enviado ao cliente". Errar não produz erro nenhum: a tela fica igual, o teste passa, e só o nome falado sai errado.

Enquanto o `@metri/ui` não tem uma raiz de campo que feche a ligação sozinha: **Obrigatório.** Cada linha amarra o `aria-describedby` à mão.

**Obrigatório.** O `<label>` só entra quando o controle não tem texto próprio: `input`, `SelectTrigger`, `Switch` e `Checkbox`.

Quando o controle da linha é botão: **Obrigatório.** O título é `div` com a mesma tipografia do `Label`, e o botão se nomeia sozinho ("Alterar foto", "Gerar códigos").

> **Por quê.** Botão já carrega o nome no conteúdo, e o `<label>` nativo vence esse conteúdo: um rótulo "Foto de perfil" apontando para o botão o faz anunciar "Foto de perfil", sem verbo nenhum.

Quando um botão se repete em várias linhas da mesma lista: **Obrigatório.** Ele leva `aria-label` com o alvo junto, começando pelo rótulo visível.

**Obrigatório.** O qualificador de rótulo é texto `text-muted-foreground` dentro do `FieldLabel`, o "(Opcional)" ao lado do nome do campo; parágrafo de apoio é a descrição.

## Aplicação

- Base UI e MUI resolvem a ligação de descrição com uma raiz de campo; o `Field` do shadcn não faz essa ligação, e é essa peça que falta no `@metri/ui`.
- Campo reusado por mais de um app tem a casa reavaliada pela colocação de `general/code-placement.md`, "Código pode nascer no pacote dono quando nada nele é do app".

## Verificação

- Formulário fica inline na página (ou dentro do componente-modal), sem camada "form genérico + wrapper", e a escrita vem de hook de mutation ou de comando de client externo no handler, não embutida no form?
- O submit usa `handleFormSubmit`, commit por campo usa `handleFieldCommit` com `trigger`/`getValues`, e o campo é string com a conversão no submit?
- O `defaultValues` referencia const nomeada, fora do componente quando estática e dentro quando deriva de dado disponível na montagem?
- Formulário reusado para outra fonte leva `key` com a identidade dela?
- Componente de terceiro usa assets embutidos, sem CDN?
- Schema de form em `shared/schemas/<módulo>.schema.ts`, separado do schema de API, que vem de `api/model.zod.ts` sem cópia local?
- Campo que o pacote não entrega mora em `shared/components/inputs/`, montado sobre as peças do `InputGroup`?
- Campo mascarado monta o `use-mask-input` por `withMask`, com o array da máscara mais curta para a mais longa e `showMaskOn*` desligado?
- Descrição fica fora do `<label>`, ligada por `aria-describedby`, e botão se nomeia sozinho?

## Referências

- `frontend/routing.md`: o modal de tarefa que contém o formulário.
- `frontend/data-fetching.md`: hook de mutation, estado em voo e notificação.
- `backend/http-api.md`: o contrato de API que a chamada usa.
- `docs/DESIGN.md`: o layout visual do formulário.
- `frontend/structure.md`: a casa de `shared/schemas/` e `shared/components/`.
- `frontend/helpers.md`: tipo derivado do schema.
- `general/code-placement.md`: a promoção de peça ao pacote.
