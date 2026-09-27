# Vocabulário da metodologia (chaves canônicas)

Estes termos são usados literalmente nas skills, na matriz e nos frontmatters. Funcionam como âncoras de comportamento para o agente.

| Conversa (PT)                             | Chave canônica (EN)                              | Significado                                                                                   |
| ----------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| look across                               | `look across`                                    | Olhar transversalmente todas as features (atuais e futuras) para descobrir o que têm em comum |
| slice                                     | `slice`, id `S<n>`                               | Capacidade compartilhada, fonte da verdade, na qual várias features se conectam               |
| contrato                                  | `contract`                                       | O que uma slice garante: interface, invariantes, consumidores                                 |
| feature                                   | `feature`, id `F<n>`                             | Resultado de valor para o usuário. Atravessa uma ou mais slices                               |
| caso de uso                               | `use case`, id `UC<f>.<n>`                       | Unidade de definição de uma feature. Tem o mesmo nome do caso de uso no código                |
| regra de negócio                          | `business rule`, id `BR<n>`                      | Regra do domínio dentro de um UC                                                              |
| horizonte agora / prevista / névoa / fora | `horizon: now \| planned \| fog \| out`          | Estado de uma feature ou slice                                                                |
| marco                                     | `milestone`                                      | Versão do produto a que a feature pertence (`v1`, `v2`...)                                    |
| ticket                                    | `ticket`, id `T<s>.<n>`                          | Unidade de entrega e de aceite                                                                |
| tipo padrão / tracer / tarefa / release   | `type: pattern \| tracer \| task \| release`     | Tipo do ticket                                                                                |
| modo                                      | `mode: afk \| hitl`                              | Se o agente faz sozinho ou com humano                                                         |
| status                                    | `status: open \| in_progress \| blocked \| done` | Estado do ticket ou UC                                                                        |
| bloqueado por                             | `blocked_by`                                     | Tickets ou slices que precisam terminar antes                                                 |
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
| descrição                                 | `description`                                    | O texto do "Dono de" da regra (METHODOLOGY 7.2); é a linha do `INDEX.md` gerado e do `rules-for`   |
| usar quando                               | `use_when`                                       | Situações em que o agente lê a regra (o gatilho do arquivo); uma entrada por situação         |
| ler antes                                 | `read_first`                                     | Ids das regras que o agente lê antes desta; só quando esta regra exige ler outra antes        |
| não cobre                                 | `not_covered`                                    | Tema vizinho e o id da regra dona dele (`<tema> → <id>`; com seção, `<tema> ("<Seção>") → <id>`) |
| id da regra                               | `id`                                             | Caminho da regra sem extensão (`<área>/<tema>`)                                               |
| ADRs citados                              | `adr`                                            | Ids dos ADRs que a regra cita                                                                 |
| status da regra                           | `status: active \| draft \| deprecated`          | Estado de uma regra                                                                           |
| marca de check                            | `(check: <id>)`                                  | Opcional, no item de verificação automatizado por um check; o id vai em `enforced_by`         |
| tracer                                    | `tracer`                                         | Ticket que corta um caminho fino e completo, demonstrável                                     |
| portão                                    | `gate`                                           | Ponto em que o trabalho só avança com checks verdes ou aprovação humana                       |

**Frontmatter de regra.** Obrigatórias: `id`, `description`, `use_when` e `status`. As demais só aparecem quando têm valor: chave vazia não é escrita, como nos campos reservados da matriz (METHODOLOGY 9.1). Regra sem `applies_to` é válida: o `rules-for` não a devolve por caminho, e ela é encontrada pela `use_when` no `INDEX.md`. `read_first` e `not_covered` aceitam, além de ids de regra, destinos do projeto com o prefixo `project:`, só desta lista fechada: `project:AGENTS`, `project:CONTEXT`, `project:PRODUCT`, `project:DESIGN` e `project:architecture/INDEX`.

Modalidades do corpo de uma regra (**Obrigatório.**, **Proibido.** e as demais): `methodology/authoring.md`, "Modalidades".
