# Vocabulário da metodologia (chaves canônicas)

Estes termos são usados literalmente nas skills, na matriz e nos frontmatters. Funcionam como âncoras de comportamento para o agente.

| Conversa (PT)                             | Chave canônica (EN)                              | Significado                                                                                   |
| ----------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| look across                               | `look across`                                    | Olhar transversalmente todas as features (atuais e futuras) para descobrir o que têm em comum |
| slice                                     | `slice`, id `S<n>`                               | Capacidade compartilhada, fonte da verdade, na qual várias features se conectam               |
| contrato                                  | `contract`                                       | O que uma slice garante: `responsibility`, `interface`, `invariants`, `consumers` e `planned`. Bloco da slice na matriz enquanto ela é plano; depois do primeiro ticket construído, cabeçalho do `entry` no código |
| feature                                   | `feature`, id `F<n>`                             | Resultado de valor para o usuário. Atravessa uma ou mais slices                               |
| resultado                                 | `outcome`                                        | O resultado de valor da feature, em prosa                                                     |
| slices da feature                         | `slices`                                         | Slices em que a feature se conecta                                                            |
| caso de uso                               | `use case`, id `UC<f>.<n>`                       | Unidade de definição de uma feature e o próprio ticket tracer: o título, as BRs e os critérios são o que ele entrega e quando está pronto. Tem o mesmo nome do caso de uso no código |
| slice do UC                               | `slice`                                          | Só no UC: a slice principal dele, obrigatória fora de `draft`; as outras slices que ele atravessa aparecem em `areas` e `touches` |
| ator                                      | `actor`                                          | Quem executa o caso de uso                                                                    |
| regra de negócio                          | `business rule`, id `BR<n>`                      | Regra do domínio dentro de um UC                                                              |
| horizonte agora / prevista / névoa / fora | `horizon: now \| planned \| fog \| out`          | Estado de uma feature ou slice                                                                |
| marco                                     | `milestone`                                      | Versão do produto a que a feature pertence (`v1`, `v2`...)                                    |
| campos reservados                         | `tech_design`, `evidence`, `metrics`, `notes`    | Opcionais em qualquer bloco da matriz; só escritos quando têm valor                           |
| ticket                                    | `ticket`: o UC ou um ticket `T<s>.<n>`           | Unidade de entrega e de aceite: o UC (o tracer) ou um ticket T, que só existe para trabalho sem UC |
| entrega                                   | `what`                                           | Só no ticket T: o que ele entrega, em 1 a 3 linhas                                            |
| critérios                                 | `criteria`                                       | Só no ticket T: os critérios de pronto, um item `- [ ]` por linha abaixo da chave             |
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
| SOT keyword                               | `keywords`                                       | Palavra-chave que torna um arquivo encontrável por grep                                       |
| descrição                                 | `description`                                    | O texto do "Dono de" da regra (`skills/writing-for-agents/RULE-FORMAT.md`, "Refinar uma regra existente (sem reescrever)"); é a linha do `INDEX.md` gerado e do `rules-for` |
| usar quando                               | `use_when`                                       | Situações em que o agente lê a regra (o gatilho do arquivo); uma entrada por situação         |
| ativação                                  | `activation`                                     | Pergunta de ativação de uma capacidade condicional, na regra dona; é a linha da tabela gerada "Capacidades condicionais" do `architecture/INDEX.md` |
| ler antes                                 | `read_first`                                     | Ids das regras que o agente lê antes desta; só quando esta regra exige ler outra antes        |
| não cobre                                 | `not_covered`                                    | Tema vizinho e o id da regra dona dele (`<tema> → <id>`; com seção, `<tema> ("<Seção>") → <id>`) |
| ponto de entrada                          | `entry`                                          | Caminho do arquivo de entrada de uma slice, que leva o cabeçalho de contrato; campo da slice na matriz que o roteamento lê |
| id da regra                               | `id`                                             | Caminho da regra sem extensão (`<área>/<tema>`)                                               |
| ADRs citados                              | `adr`                                            | Ids dos ADRs que a regra cita                                                                 |
| status da regra                           | `status: active \| draft \| deprecated`          | Estado de uma regra                                                                           |
| marca de check                            | `(check: <id>)`                                  | Opcional, no item de verificação automatizado por um check; o id vai em `enforced_by`         |
| tracer                                    | `tracer`                                         | O UC: o ticket que corta um caminho fino e completo, demonstrável                             |
| portão                                    | `gate`                                           | Ponto em que o trabalho só avança com checks verdes ou aprovação humana                       |

**Frontmatter de regra.** Obrigatórias: `id`, `description`, `use_when` e `status`. As demais só aparecem quando têm valor: chave vazia não é escrita, como nos campos reservados da matriz (`skills/look-across/MATRIX-FORMAT.md`). Regra sem `applies_to` é válida: o `rules-for` não a devolve por caminho, e ela é encontrada pela `use_when` no `INDEX.md`. `read_first` e `not_covered` aceitam, além de ids de regra, destinos do projeto com o prefixo `project:`, só desta lista fechada: `project:AGENTS`, `project:CONTEXT`, `project:PRODUCT`, `project:DESIGN` e `project:architecture/INDEX`.

Modalidades do corpo de uma regra (**Obrigatório.**, **Proibido.** e as demais): `skills/writing-for-agents/RULE-FORMAT.md`, "Modalidades".
