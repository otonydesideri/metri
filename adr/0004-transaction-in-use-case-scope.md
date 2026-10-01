# ADR-0004 Transação no escopo do caso de uso

status: accepted
area: backend
kind: decision

## Contexto

- `backend/transactions.md` (até a v1.4.2) exigia três coisas ao mesmo tempo: toda decisão de domínio acontece antes da chamada ao contrato de transação; `SELECT FOR UPDATE` — recomendado justamente para contador de vagas e saldo — vive dentro da implementação do contrato, invisível nele; e nenhum contrato de aplicação carrega um `ctx` opcional, então o caso de uso nunca vê a transação.
- Quando a decisão depende do estado lido sob trava, as três não podem valer juntas: não sobra caminho para decidir depois de travar sem esconder regra de negócio na infra.
- Um teste com cinco cenários de concorrência (reserva de estoque, verificação de PIN, fechamento de turno e dois cenários fora do domínio de origem) comparou três braços de regra, com agentes desenhando às cegas e juízes avaliando sem saber qual braço geraram: **A**, as regras atuais sem alteração; **B**, as atuais com 13 correções pontuais; **C**, uma reescrita enxuta de princípios no lugar dos documentos de transação e domain service.
- Nos cinco cenários, dois agentes com as regras **A** tropeçaram na mesma contradição sem terem visto o código de origem do diagnóstico — confirmando que o defeito é da regra, não de um projeto específico.

## Decisão

- O contrato de transação vira `UnitOfWork` (`domain/application/transactions/unit-of-work.contract.ts`): uma porta genérica, `run<L, R>(work)`, que o caso de uso abre quando precisa gravar mais de um agregado junto ou decidir sobre estado lido dentro do escopo. A implementação publica o `tx` por contexto assíncrono; os repositórios chamados dentro do escopo o usam sem o caso de uso precisar vê-lo.
- **O caso de uso decide dentro do escopo.** Leitura, decisão e gravação acontecem no mesmo `work`; `failure(...)` desfaz tudo e os eventos de uma tentativa desfeita são descartados, nunca despachados.
- **`version` (locking otimista) é o padrão de proteção**, não a exceção: raiz com escrita concorrente tem coluna `version`, conferida e incrementada no `save()` do repositório. Trava pessimista (`FOR UPDATE`) fica reservada para linha disputada de fato, com gatilho medido — nunca como ferramenta de decisão de domínio escondida na infra.
- **O "pai que fecha" volta**: quando um pai fecha e o fechamento depende dos filhos, a entrada de filho confere o pai aberto com trava compartilhada (`FOR SHARE`) e o fechamento trava para escrita (`FOR UPDATE`) antes de ler os filhos — os dois dentro do mesmo escopo.
- **"Policy" sai do vocabulário; "domain service" entra no lugar dela.** Mesmo artefato (regra de domínio sem estado e sem IO), um nome só, sem a ambiguidade com política de autorização.
- Repositório recusa escrita fora de um `UnitOfWork` ativo; leitura continua livre fora dele. A condição de `version` é mecânica — uma gravação que precise de condição de negócio no SQL é sinal de que a decisão saiu do domínio.

## Alternativas consideradas

- **A — manter as regras atuais sem alteração.** Perdeu em nota de desenho nos cinco cenários (média 18,2 de 27, contra 22,7 de B e 22,4 de C) e concentrou toda a regra de negócio fora do domínio: de 4 a 9 fluxos vizinhos repetindo a mesma revalidação em SQL, a escrita condicional incapaz de caber no repositório, e o dublê em memória repetindo regra de negócio. Na prova executável, foi o único braço com falha real de domínio no cenário de estresse (e-mail de estorno perdido em 2 de 3 seeds) — regra de negócio faltando, não borda aceita.
- **B — as regras atuais com 13 correções pontuais** (degrau `version` como padrão, retentativa com descarte de evento, "pai que fecha" de volta, fronteira nova no check de limites, critérios de exclusão em domain service). Empatou com C em qualidade de desenho (22,7 contra 22,4, diferença de 0,35 ponto, dentro da margem de ruído do júri) mas cresceu ~5% em volume de texto sobre A, e mesmo assim um dos desenhos ainda deixou regra de negócio vazar para o caso de uso (divisão por tipo de produto, no cenário de venda). Fica como evidência de que o conserto pontual também funcionaria, caso C se mostre insuficiente na prática.
- **C — reescrita enxuta, adotada.** Mesma nota de B, ~8% menos texto que A (a maior parte da redução em `backend/operation-routing.md` e `domain/domain-services.md`, reescritos como princípio). Depende mais da competência do agente para preencher o que o princípio não escreve por extenso (nível de isolamento, ordem de travas, descarte de evento) — a rodada às cegas mostrou isso como atrito relatado pelos próprios agentes, nunca como erro grave; eles acertaram por conta própria em praticamente todos os casos.

## Evidência do teste

**Placar às cegas** (27 pontos possíveis, 8 critérios, média de 2–3 juízes por desenho, cinco cenários): A 18,2 · B 22,7 · C 22,4.

**Prova executável**: das implementações de maior nota de cada braço, traduzidas fielmente para TypeScript contra Postgres real (sem UI), três seeds por implementação. Nos dois cenários centrais (reserva sob concorrência, carga normal), zero deadlock e zero violação de invariante nas 27 execuções oficiais, nos três braços. Sob carga de estresse desenhada para forçar estorno e esgotar retentativa, A e C expuseram a mesma classe de lacuna — borda de retentativa esgotada aceita como risco, não resolvida — e A teve o único defeito de regra de negócio real (e-mail de estorno perdido). B não apresentou violação na rodada oficial, mas uma rodada exploratória anterior tinha mostrado o mesmo tipo de corrida intermitente nele; o resultado não muda o ranking, mas pesa contra tirar conclusão definitiva só da contagem de violações.

## Consequências

- `backend/transactions.md` e as regras que ele toca mudam para refletir `UnitOfWork`, `version` por padrão, o "pai que fecha" e "domain service"; o diff completo está no histórico do Git.
- `metri check boundaries` ganha a fronteira `infra/` não importa `domain/enterprise/domain-services/`.
- O repositório que recebe escrita fora de um `UnitOfWork` ativo recusa, mecanicamente; a condição de `version` nunca carrega regra de negócio no SQL.
- O starter ganha a implementação de referência do `UnitOfWork` (contrato, Prisma, `version` por padrão em `AggregateRoot`), sem domínio nenhum nela; o exemplo com agregado e caso de uso continua didático, em `backend/transactions.examples.md`.
- Toda regra de negócio com estado disputado ganha prova por teste de requisições simultâneas contra Postgres real, repetido, conferindo o estado final do banco — não só as respostas — e contando deadlock.

## Imposto por

Não imposto mecanicamente, além do `metri check boundaries` para a fronteira `infra/ → domain-services/`. O restante — caso de uso decidindo dentro do `UnitOfWork`, `version` como padrão, recusa de escrita fora do escopo — é revisão de código, com a implementação de referência do starter como forma canônica.
