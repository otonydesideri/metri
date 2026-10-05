# ADR-0003 O método atual é a base do produto

status: accepted
area: general
kind: decision

## Contexto

O Metri executa a metodologia Slices com Guardrails. O documento que descreveu o sistema foi escrito fora do método e diverge dele em vários pontos: tipos de ticket, status, quando o crítico roda, eixos do aceite e o limite de tentativas do Goal. Se o produto seguisse o documento nesses pontos, o agente leria um vocabulário nas skills e a interface mostraria outro.

### Como o mercado faz

Sem referência em fonte primária. O caso mais próximo é o Morphite, que também executa um método (a matriz de slices do WebProdigios), mas não publica como resolve uma divergência entre o produto e o método.

## Decisão

O método, na versão que o processo de construção usa (ADR-0001), é a base do produto. Onde o documento diverge do método, vale o método. Uma necessidade do produto que muda o método entra como mudança explícita do Source, na slice que entrega a peça do Metri que substitui o comportamento antigo.

As primeiras aplicações:

- Status do ticket: `draft | open | in_progress | blocked | done | cancelled`. `cancelled` entra no método (VOCABULARY, formato dos tickets e docs-lint) na mesma slice da migração que cria a tabela de tickets. Ele é final e exige um motivo. Não conta na entrega da feature nem para a slice ficar pronta. Um ticket que outro ticket aberto tem em `blocked_by` só pode ser cancelado depois que o plano tirar essa dependência.
- O motivo do bloqueio é `dependency`, `human` ou `external`. O ticket bloqueado guarda o estado anterior (`blocked_from`) e o item que o destrava (`blocked_ref`): o ticket bloqueador, em `dependency`; a proposta de padrão, o portão ou o aviso da Inbox, em `human`; o portão de passo humano com a ação pendente, em `external`. Quando esse item é resolvido, o ticket volta ao estado guardado. A tela do ticket mostra o link para ele.
- Verificar é estado do Run, não do ticket. O ticket fica `in_progress` enquanto o Run verifica, enquanto espera um portão e enquanto está na fila de integração.
- O tracer é o UC. Um ticket T tem o tipo `pattern`, `task` ou `release`.
- O crítico sem contexto roda sempre, no portão de direção e no portão de plano.
- O aceite tem quatro eixos: contrato, padrões, experiência e risco.
- O Goal fica bloqueado quando o mesmo check continua vermelho depois de 3 correções. O método não tem teto total de tentativas, e esse papel fica com o orçamento do Run.
- As conferências da fila de integração reaproveitam o `metri scope`.
- O ponto em que o humano decide se chama portão (`gate`) no método e no produto.

## Alternativas consideradas

- Seguir o documento: sete status de ticket com `verifying` e `ready`, `tracer` como tipo de T, crítico opcional, três revisores, quatro continuações do Goal e `gate` renomeado para `decision`. O produto se separaria do método que executa.
- Manter dois vocabulários, um no método e outro no produto, com uma tradução entre eles. Cada tradução seria um lugar a mais para divergir.

## Consequências

- O Board não tem coluna "Verificando": o card mostra o estado do Run. A spec da feature de Board decide os detalhes.
- Para a slice, vale o mesmo tratamento: "Em aceite" vem do portão de aceite aberto, e "Liberada" vem do ticket de release feito. A spec que criar a tabela de slices decide.
- Toda divergência nova entre o documento e o método segue esta decisão.

## Imposto por

Depois da mudança do Source, o docs-lint (valores de status) e o schema do banco. Até lá, não imposto.
