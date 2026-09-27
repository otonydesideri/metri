# Autoria da Architecture Source

Dono de: como a Architecture Source é escrita e mantida — ownership de decisão, anatomia de documento, modalidades normativas, exceções, rationale, exemplos, formas canônicas e implementações de referência, status de ferramenta, verificação, pontos em aberto, regra de transição, emendar ou criar, organização física da Source e casa das decisões específicas de projeto.

Consultar antes de: criar, editar, mover ou reorganizar qualquer documento de `docs/architecture/`; registrar ou fechar uma decisão; decidir onde uma decisão específica de projeto é registrada.

Não cobre: decisão técnica de arquitetura, que tem dono no documento da área (índice do `architecture/INDEX.md`); autoridade da Source, precedência e navegação (`architecture/INDEX.md`); a ativação num projeto e a matriz das decisões delegadas a ele (`methodology/templates/architecture-INDEX.md`); a regra de escape (`AGENTS.md`, "How to work here").

Este documento é o contrato de escrita da Source: onde cada decisão mora, que forma um documento tem e como uma regra se distingue de explicação, exemplo e verificação. Não decide nada sobre o sistema; decide como o que foi decidido fica escrito.

## Regras

### Alcance

**Obrigatório.** Documento novo, e texto novo ou refatorado em documento existente, segue este contrato.

**Permitido.** Texto escrito antes deste contrato continuar na forma anterior até ser refatorado, valendo como está escrito.

> **Por quê.** A forma nova entra pelo trecho que já está sendo mudado, sem reescrever a Source inteira de uma vez. A cópia da regra de escape na abertura dos documentos anteriores, por exemplo, continua lá até o documento ser refatorado.

### Ownership de decisão

Um documento se relaciona com uma decisão arquitetural de uma destas formas:

| Relação | O documento |
| --- | --- |
| DEFINED | É o owner: a decisão normativa pertence a ele |
| APPLIED | Aplica localmente uma decisão definida por outro owner |
| REFERENCED | Só aponta para o owner |
| VERIFIED | Verifica uma regra, sem criar regra nova |
| EXAMPLE | Ilustra uma regra existente |

**Obrigatório.** Toda decisão arquitetural tem exatamente um owner, o documento que a define (DEFINED).

Onde a decisão entra no arquivo do owner: METHODOLOGY 4.3 (frontmatter) e 7 (corpo).

**Obrigatório.** Documento que não é owner de uma decisão se relaciona com ela só como APPLIED, REFERENCED, VERIFIED ou EXAMPLE.

**Proibido.** Documento que não é owner redefinir a modalidade ou a regra de uma decisão.

**Obrigatório.** Aplicação local de regra de outro documento cita o owner da regra aplicada.

### Anatomia do documento

O formato do arquivo de regra está na METHODOLOGY: frontmatter em 4.3, corpo em 7.

**Permitido.** Heading de subseção afirmar o princípio ("Retornando erro: sempre `Either`, nunca `throw`") em vez de rótulo neutro.

### Modalidades

| Marcador | Modalidade |
| --- | --- |
| `**Obrigatório.**` | REQUIRED |
| `**Proibido.**` | PROHIBITED |
| `**Padrão.**` | DEFAULT |
| `**Recomendado.**` | RECOMMENDED |
| `**Permitido.**` | PERMITTED |

**Obrigatório.** Toda norma nova fica em `## Regras`, marcada por um dos marcadores da tabela.

**Obrigatório.** Uma regra tem uma modalidade e um assunto.

Quando a regra é condicionada: **Obrigatório.** A condição vem antes da modalidade, na forma `Quando X: **Obrigatório.** Y.`

**Proibido.** Regra escondida em rationale ou exemplo.

Em texto novo ou refatorado: **Proibido.** Inferir obrigação de trecho sem modalidade.

### Exceções

Forma canônica:

```text
- **Exceção.** <condição>: <efeito>.
```

**Obrigatório.** Exceção fica vinculada à regra que excepciona, logo abaixo dela, na forma acima.

**Proibido.** Exceção sem a regra original: ela não cria regra sozinha.

**Proibido.** Inferir exceção de exemplo.

### Rationale

Forma canônica:

```text
> **Por quê.** <explicação>
```

**Obrigatório.** Rationale na forma acima, curto.

**Proibido.** Rationale prescrever ou introduzir exceção.

### Exemplos, formas canônicas e implementações de referência

| Categoria | O que é |
| --- | --- |
| Exemplo | Didático. A forma literal não é normativa além da regra que ilustra |
| Forma canônica | A forma textual ou estrutural em si faz parte do contrato: formato de erro, formato de chave, naming, path, comando com resultado esperado |
| Implementação de referência | Implementação concreta de uma arquitetura neutra, como o Cloudflare R2 de `infrastructure/storage.md` |

**Obrigatório.** Exemplo ilustra uma regra existente.

**Proibido.** Exemplo como fonte única de norma.

**Obrigatório.** Forma canônica e implementação de referência são declaradas como tais no texto que as apresenta.

**Proibido.** Promover exemplo a forma canônica ou a implementação de referência por inferência.

**Proibido.** Implementação de referência tornar a ferramenta requisito arquitetural.

**Padrão.** Exemplo de código usa o domínio didático de pedidos (`order`, `invoice`, `customer`).

> **Por quê.** Módulo real raramente contém todos os casos que um padrão precisa mostrar, e exemplo espelhando código real convida a tratar o arquivo atual como canônico.

**Proibido.** Nome real em exemplo.

- **Exceção.** Ferramenta escolhida do monorepo, ou ferramenta que o documento classifica na seção "Ferramentas": entra pelo nome real.

### Domínio didático

Nomes que os exemplos da Source usam.

| Termo | Identificadores |
| --- | --- |
| Pedido (agregado de referência) | `Order`, `OrderItem`, `OrderStatus`, `OrderConfirmedEvent` |
| Valor monetário | `Money` |
| Cliente (o dono no escopo de acesso) | `Customer`, `CustomerTier` |
| Fatura | `Invoice`, `InvoiceLine`, `InvoiceDocument` |
| Notificação | `OrderNotifier`, `NotificationChannel`, `SendOrderConfirmationUseCase` |
| Produto | `Product`, `ProductPhoto`, `ProductTagIds` |
| Frete | `ShippingCostCalculator`, `DeliveryMethod` |
| Desconto | `calculateLoyaltyDiscount` |
| Reembolso | `RefundableOrderSpecification` |
| Relatório de pedidos | `OrderReportStorage` |
| Carrinho | `CartItem`, `useCartStore` |
| Pagamento | `PaymentReceivedEvent` |

### Ferramentas

| Status | Significado |
| --- | --- |
| DECIDIDA | Escolhida pela Source |
| REFERÊNCIA | Implementação de referência de uma forma neutra; não é requisito |
| ILUSTRATIVA | Aparece para tornar o exemplo concreto; não é decisão |
| CANDIDATA | Em avaliação, sem decisão |
| REJEITADA | Avaliada e descartada |

Quando uma ferramenta é relevante para uma decisão do próprio documento: **Obrigatório.** O status dela, um dos da tabela, aparece em `## Ferramentas`.

Ferramenta que só aparece em exemplo, ou cuja decisão tem outro owner, não ganha linha só por ser citada: a seção é opcional e não nasce por simetria.

**Proibido.** Atribuir a uma ferramenta status que nenhuma decisão da Source sustenta.

### Verificação de regra

**Obrigatório.** Verificação comprova regra existente, do próprio documento ou do owner que ele aplica.

**Proibido.** Norma nova em `## Verificação`.

**Permitido.** Checklist, inspeção, teste, compilador ou comando como forma de verificação.

Quando a verificação é comando: **Obrigatório.** O resultado esperado é declarado junto; comando sem resultado esperado não é verificação completa.

Quando a regra é checável mecanicamente: **Padrão.** Verificação por comando executável, como em `backend/boundaries.md`.

Quando a regra não é checável mecanicamente: **Padrão.** Verificação por checklist de perguntas de sim/não.

### Ponto em aberto

Ponto em aberto vira ADR `proposed`, e a regra aponta para ele: METHODOLOGY 6.5 e 7.2.

### Regra de transição

É o regime que vale enquanto um ponto em aberto não fecha, e é o que os documentos citam como "a regra de transição".

Quando existe forma arquitetural escrita para uma capacidade ainda sem instância no código: **Obrigatório.** A primeira implementação segue essa forma até a Source ser alterada.

**Proibido.** Tratar ferramenta ilustrativa como decisão por causa da regra de transição: a forma está decidida, a ferramenta não.

Enquanto um ponto está aberto: **Proibido.** Código introduzir mecanismo próprio para contorná-lo.

> **Por quê.** O documento já é a decisão da forma, mesmo quando a ferramenta ainda é ilustração; o que falta decidir fica nomeado como ponto em aberto.

### Emendar ou criar

Antes de escrever: **Obrigatório.** Achar o trecho que já é dono do assunto.

Quando o assunto já pertence a um documento: **Obrigatório.** Editar o owner existente.

Quando não existe responsabilidade arquitetural independente: **Proibido.** Criar documento ou seção nova.

Quando o caso novo é refinamento, limite ou exceção de uma regra já escrita: **Obrigatório.** Emendar a regra no lugar.

Quando o assunto não tem dono no documento e traz decisão própria, com contexto e consequência que não cabem numa frase: **Obrigatório.** Abrir seção que se sustenta sozinha.

**Padrão.** Na dúvida entre emendar e abrir seção, emendar.

> **Por quê.** Camada empilhada a cada evolução faz o documento crescer sem fim e reparte a mesma regra em trechos que passam a divergir; espremer assunto novo dentro de parágrafo alheio esconde a regra de quem procura por ela.

Quando a emenda contradiz o texto em volta: **Obrigatório.** Corrigir o texto em volta junto, no mesmo lugar.

**Proibido.** Regra repartida em dois trechos do mesmo documento.

**Permitido.** Regras parecidas em documentos diferentes, quando são decisões distintas, cada uma com seu owner.

**Proibido.** Changelog, histórico ou documento paralelo de decisão dentro da Source: o histórico pertence ao Git.

### Organização física

A árvore do source está na METHODOLOGY 5.3.

**Obrigatório.** A localização do documento reflete o ownership: o documento mora na pasta da área dona do assunto.

**Proibido.** Pasta `system/` ou `cross-cutting/`.

**Obrigatório.** Um documento cobre um assunto só: um padrão de construção (`domain/strategy.md`), uma capacidade de infra (`infrastructure/mail.md`), uma área do sistema (`backend/errors.md`).

Quando um assunto acumula partes independentes: **Obrigatório.** Cada parte vira documento próprio.

O índice de cada área é gerado do frontmatter (METHODOLOGY 6.11).

### Decisões específicas de projeto

| Casa | Guarda |
| --- | --- |
| Architecture Source (`docs/architecture/`) | Decisão global e reutilizável |
| ADR (`docs/adr/`) | Decisão específica do projeto que é estrutural, significativa, com trade-off, difícil de reverter e cujo rationale precisa ser preservado, incluindo a exceção deliberada a uma regra da Source |
| Project Architecture | Estado e configuração vigentes do projeto: módulos existentes, owner/tenant escolhido, apps e packages existentes, ativações, decisões operacionais vigentes |
| Project Brain | Índice do projeto: ponteiros para a Project Architecture, o ADR e os demais documentos vigentes do projeto |
| `AGENTS.md`, `CLAUDE.md` e instruções locais | Ponteiros para a Source, o ADR e o Project Brain, e orientação operacional local: armadilha viva, contrato entre partes que envelhecem separadas |

**Obrigatório.** Decisão global e reutilizável fica na Architecture Source.

Quando a decisão específica do projeto é estrutural, significativa, tem trade-off, é difícil de reverter e o rationale precisa ser preservado: **Obrigatório.** Registrá-la como ADR em `docs/adr/`.

Quando um projeto precisa divergir deliberadamente de uma regra da Source: **Obrigatório.** A exceção é explícita e registrada em ADR, com a regra da Source que ela excepciona, o escopo em que vale e o rationale.

Quando uma decisão de projeto, exceção incluída, muda o estado vigente do projeto: **Obrigatório.** A Project Architecture registra o estado resultante.

**Obrigatório.** Estado e configuração vigentes do projeto ficam na Project Architecture.

**Proibido.** O Project Brain copiar decisão da Project Architecture ou do ADR: ele aponta para eles.

A localização e o formato físico da Project Architecture e do Project Brain pertencem ao workflow/tooling do projeto.

**Proibido.** Documento da Source registrar o resultado de decisão por app, como a divisão de módulos e a forma de cada agregado: ele ensina o procedimento de decidir, e o resultado fica nas casas de projeto.

**Proibido.** `AGENTS.md`, `CLAUDE.md` ou instrução local criar exceção arquitetural, redefinir regra da Source ou substituir o ADR, a Project Architecture ou o Project Brain.

**Permitido.** `AGENTS.md`, `CLAUDE.md` e instruções locais apontarem para a Architecture Source, o ADR e o Project Brain e darem orientação operacional local.

Quando um assunto ganha documento na Source: **Obrigatório.** Ele sai das instruções de projeto na mesma sessão em que o documento é escrito ou revisado.

Quando uma instrução local contradiz a Source sem ADR explícito que a sustente: **Obrigatório.** Tratar a contradição como inconsistência a corrigir, nunca como exceção válida.

## Verificação

- Cada decisão nova tem exatamente um owner que a define?
- Os demais documentos só aplicam, referenciam, verificam ou exemplificam a decisão, sem redefinir modalidade nem regra, citando o owner quando aplicam?
- Toda norma nova tem um marcador de modalidade, uma modalidade e um assunto, com a condição antes da modalidade?
- Toda exceção está logo abaixo da regra que excepciona, na forma `**Exceção.**`?
- Todo rationale está em `> **Por quê.**`, curto, sem prescrever nem excepcionar?
- Forma canônica e implementação de referência estão declaradas como tais, e nenhum exemplo é fonte única de norma?
- Ferramenta relevante para uma decisão do documento tem status, sustentado por decisão da Source, sem ferramenta de exemplo parecendo obrigatória?
- A verificação só comprova regra existente, e todo comando declara o resultado esperado?
- Caso novo editou o owner existente, e a seção nova sobreviveria sem o parágrafo acima dela? Se não sobreviveria, era emenda.
- Nenhum changelog nem documento paralelo de decisão dentro da Source?
- O documento está na pasta da área dona e cobre um assunto só?
- Decisão específica de projeto registrada fora da Source, na casa certa, e toda exceção a uma regra da Source em ADR que nomeia a regra, o escopo e o rationale?
- Nenhuma instrução local cria exceção, redefine regra da Source ou faz o papel de ADR, Project Architecture ou Project Brain?

## Referências

- `architecture/INDEX.md`: autoridade e precedência da Source, navegação, decisões transversais e índice.
- `backend/boundaries.md`: verificação por comando executável.
- `infrastructure/storage.md`: implementação de referência declarada.
- `docs/adr/`: casa dos ADRs do projeto.
- `methodology/templates/architecture-INDEX.md`: ativação num projeto e decisões delegadas a ele.
