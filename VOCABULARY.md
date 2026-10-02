# Vocabulário da metodologia (chaves canônicas)

Estes termos são usados literalmente nas skills, na matriz e nos frontmatters. Funcionam como âncoras de comportamento para o agente.

| Conversa (PT)                             | Chave canônica (EN)                              | Significado                                                                                   |
| ----------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| look across                               | `look across`                                    | Olhar transversalmente todas as features (atuais e futuras) para descobrir o que têm em comum |
| slice                                     | `slice`, id `S<n>`                               | Capacidade compartilhada, fonte da verdade, na qual várias features se conectam               |
| contrato                                  | `contract`                                       | O que uma slice garante: `responsibility`, `interface`, `invariants`, `consumers` e `planned`. Bloco da slice na matriz até a poda do /accept; construída, os cabeçalhos `SOURCE OF TRUTH` dos donos e o caminho linear do `.metri/ARCHITECTURE.md` |
| feature                                   | `feature`, id `F<n>`                             | Resultado de valor para o usuário. Atravessa uma ou mais slices                               |
| spec da feature                           | `spec`, arquivo `.metri/specs/<F-id>.md`         | O arquivo único da feature: Problema e Solução do ponto de vista de quem usa, Casos de uso (ids e títulos dos UCs), Decisões de implementação, Decisões de teste, Fora de escopo e Notas; `status: draft \| planned \| done` |
| caso de uso                               | `use case`, id `UC<f>.<n>`                       | Unidade de definição de uma feature e o próprio ticket tracer: o título, a história, as BRs e os critérios são o que ele entrega e quando está pronto. Tem o mesmo nome do caso de uso no código |
| slice do UC                               | `slice`                                          | Só no UC: a slice principal dele, obrigatória fora de `draft`; as outras slices que ele atravessa aparecem em `areas` e `touches` |
| ator                                      | `actor`                                          | Quem executa o caso de uso: o nome em português de um termo do `docs/CONTEXT.md`, em minúscula |
| história                                  | `story`                                          | Linha fixa logo abaixo do título do UC: `Como <ator>, quero <ação>, para <benefício>.`, com o ator igual à chave `actor`; linha do corpo, não chave; obrigatória em UC fora de `done`; T não tem |
| regra de negócio                          | `business rule`, id `BR<n>`                      | Regra do domínio dentro de um UC                                                              |
| horizonte agora / prevista / névoa / fora | `horizon: now \| planned \| fog \| out`          | Estado de uma feature ou slice                                                                |
| marco                                     | `milestone`                                      | Versão do produto a que a feature pertence (`v1`, `v2`...)                                    |
| campos reservados                         | `milestone` (spec); `metrics` (ticket)           | Opcionais no bloco que os leva; só escritos quando têm valor. `notes` não é campo: é a seção "Notas" do arquivo do ticket |
| ticket                                    | `ticket`: o UC ou um ticket `T<s>.<n>`           | Unidade de entrega e de aceite: o UC (o tracer) ou um ticket T, que só existe para trabalho sem UC. Cada um no seu arquivo, `.metri/tickets/<id>.md` |
| entrega                                   | `what` (seção "O que entrega")                   | Só no ticket T: o que ele entrega, em 1 a 3 linhas, na seção "O que entrega" do arquivo do ticket |
| critérios                                 | `criteria` (seção "Critérios")                   | Os critérios de pronto do ticket, um item `- [ ]` por linha, na seção "Critérios" do arquivo do ticket |
| tipo padrão / tarefa / release            | `type: pattern \| task \| release`               | Tipo do ticket T; o tracer é o UC e não é valor de `type`                                     |
| modo                                      | `mode: afk \| hitl`                              | Se o agente faz sozinho ou com humano                                                         |
| status                                    | `status: draft \| open \| in_progress \| blocked \| done` | Estado do UC, do ticket T ou da slice; `draft` só no UC, escrito pelo `/shape` até o `/look-across` planejá-lo |
| bloqueado por                             | `blocked_by`                                     | UCs, tickets T ou slices que precisam terminar antes                                          |
| áreas                                     | `areas`                                          | Áreas de arquitetura envolvidas (ex.: `backend/http-api`)                                     |
| toca                                      | `touches`                                        | Ponto central que o ticket altera (registry, schema, migrations)                              |
| sensível                                  | `sensitive`                                      | Exige revisão humana do diff                                                                  |
| checks                                    | `checks`                                         | Comandos executáveis que provam os critérios                                                  |
| subtarefas                                | `subtasks`                                       | Trabalho paralelo dentro de um ticket, com os mesmos checks                                   |
| lacuna                                    | `gap`, id `GAP-<n>`                              | Algo deixado de fora de propósito, sinalizado no código e na matriz                           |
| proposta de padrão                        | `pattern proposal`, id `PP-<n>`                  | Registro feito pelo builder quando uma regra não serve                                        |
| fronteira                                 | `frontier`                                       | Tickets desbloqueados e ainda não pegos                                                       |
| exemplo canônico                          | `examples`                                       | Código de referência de um padrão                                                             |
| aplica a                                  | `applies_to`                                     | Globs de caminho onde uma regra vale                                                          |
| imposto por                               | `enforced_by`                                    | Ids dos checks ou lints que automatizam a regra; ausente enquanto não houver                  |
| cabeçalho de dono                         | `SOURCE OF TRUTH`                                | Cabeçalho do dono canônico no código, acima do export que ele possui; a primeira linha nomeia os símbolos e é a SOT keyword do grep (skill `guardrail`, "While writing code", passo 5) |
| SOT keyword                               | `keywords`                                       | Na regra, os termos do tema que um grep acha: os símbolos das linhas `SOURCE OF TRUTH:` e as palavras do tema |
| descrição                                 | `description`                                    | O texto do "Dono de" da regra (`skills/writing-for-agents/RULE-FORMAT.md`, "Escrita da regra"); é a linha do `INDEX.md` gerado e do `rules-for` |
| usar quando                               | `use_when`                                       | Situações em que o agente lê a regra (o gatilho do arquivo); uma entrada por situação         |
| ativação                                  | `activation`                                     | Pergunta de ativação de uma capacidade condicional, na regra dona; é a linha da tabela gerada "Capacidades condicionais" do `architecture/INDEX.md` |
| ler antes                                 | `read_first`                                     | Ids das regras que o agente lê antes desta; só quando esta regra exige ler outra antes        |
| não cobre                                 | `not_covered`                                    | Tema vizinho e o id da regra dona dele (`<tema> → <id>`; com seção, `<tema> ("<Seção>") → <id>`) |
| donos da slice                            | `sot`                                            | Os símbolos que possuem uma slice construída, na linha dela na matriz (`status: done · sot: [..]`); cada um tem o cabeçalho `SOURCE OF TRUTH` |
| id da regra                               | `id`                                             | Caminho da regra sem extensão (`<área>/<tema>`)                                               |
| ADRs citados                              | `adr`                                            | Só na regra do projeto: os ids dos ADRs do projeto que ela cita (`ADR-NNNN`); a regra global não tem ADR |
| status da regra                           | `status: active \| draft \| deprecated`          | Estado de uma regra                                                                           |
| marca de check                            | `(check: <id>)`                                  | Opcional, no item de verificação automatizado por um check; o id vai em `enforced_by`         |
| tracer                                    | `tracer`                                         | O UC: o ticket que corta um caminho fino e completo, demonstrável                             |
| portão                                    | `gate`                                           | Ponto em que o trabalho só avança com checks verdes ou aprovação humana                       |
| definido / inferido / perguntar           | `defined \| inferred \| ask`                     | A classe de uma decisão aberta antes de perguntar; todo portão mostra os três blocos (skill `grilling`) |
| tela canônica                             | `canonical screen`                               | A tela de referência de um tipo, numa linha de "Telas canônicas" do `DESIGN.md`: a rota, o propósito, a variante descartada e o princípio que decidiu |
| variante                                  | `variant` (`?variant=`)                          | Uma das 2–3 versões radicalmente diferentes de uma tela nova, na mesma rota, até o portão de padrão |
| critério de tela                          | `Tela:`                                          | O critério julgado na tela: o único que leva evidência (`- [ ] Tela: <o que a tela mostra>`) |
| evidência                                 | `.metri/tickets/<id>/<n>-desktop.png`, `<n>-mobile.png` | O screenshot de cada critério `Tela:`, `<n>` na ordem do critério, gravado com `METRI_EVIDENCE=<id>`, até a poda da slice (`metri prune`) |

**Frontmatter de regra.** Obrigatórias: `id`, `description`, `use_when` e `status`. As demais só aparecem quando têm valor: chave vazia não é escrita, como nos campos reservados da matriz (`skills/look-across/MATRIX-FORMAT.md`). Regra sem `applies_to` é válida: o `rules-for` não a devolve por caminho, e ela é encontrada pela `use_when` no `INDEX.md`. `read_first` e `not_covered` aceitam, além de ids de regra, destinos do projeto com o prefixo `project:`, só desta lista fechada: `project:AGENTS`, `project:CONTEXT`, `project:PRODUCT`, `project:DESIGN` e `project:ARCHITECTURE`.

Modalidades do corpo de uma regra (**Obrigatório.**, **Proibido.** e as demais): `skills/writing-for-agents/RULE-FORMAT.md`, "Modalidades".
