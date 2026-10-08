# ADR-0017 Todo processo filho passa por um supervisor, e a partida limpa os órfãos

status: accepted
area: infrastructure
kind: decision

## Contexto

O servidor local inicia o harness, os scripts do projeto, o Preview e os checks. Um servidor de desenvolvimento se separa do grupo, e um encerramento à força do servidor deixa filhos rodando, com portas presas. O ADR-0002, ponto 6, pede encerrar limpo os agentes e os processos filhos.

### Como o mercado faz

Conferido em 08/10/2026:

- Grupo de processos próprio e parada em dois tempos (término, espera, morte): T3 Code (`pingdotgg/t3code@a4c9494b:apps/server/src/process/processGroup.ts:1-16`), OpenCode (`anomalyco/opencode@5d9cd9b2:packages/core/src/shell.ts:12,31-58`), Orca, Vibe Kanban e Morphite.
- Contra órfãos depois de um crash, um registro com o grupo, o horário de início e o comando, e na partida seguinte a parada só do grupo cuja identidade confere: T3 Code (`apps/server/src/provider/OpenCodeServerLedger.ts:15-47,271-333`) e Morphite, com o registro no SQLite (app 0.3.2, `out/main/backend.js:38-56,199-279`).
- O Orca põe um supervisor entre o app e cada agente, que mata o grupo assim que o dono morre (`stablyai/orca@e3639ef8:src/main/provider-process/provider-process-supervisor.ts:4-31,93-108,150-160`).
- Instância única num servidor Node: o Superset cria um lock exclusivo, rouba o lock de um processo morto e grava um manifesto com pid e porta (`superset-sh/superset@44d2a8ad:apps/desktop/src/main/lib/host-service-lock.ts:85-140`).

Num teste de 08/10/2026, com o SDK 0.3.293 e o Claude Code 2.1.292 no WSL2, um processo no papel do servidor abriu uma sessão e morreu com SIGKILL. Ociosa, a sessão morreu junto. No meio de um turno com um comando longo, o Claude Code e o comando, num grupo de processos próprio, seguiram vivos por pelo menos 130 s, em duas rodadas de duas; numa terceira rodada, com um comando de 40 s, os dois terminaram antes de 15 s.

Por isso o Metri segue o Orca para o harness, com um supervisor desde o tracer, e o T3 Code e o Morphite para o resto: registro e limpeza na partida.

## Decisão

- Todo processo filho passa por um supervisor único, num grupo de processos próprio, com o ambiente por lista e sem a credencial da partida.
- O processo do harness roda sob um processo supervisor, como o do Orca, que confere o servidor dono a cada 100 ms e, quando ele morre, para o harness e os descendentes dele, inclusive os que o harness pôs em outro grupo de processos.
- Parar um grupo manda o sinal de término, espera (3 s para agente, 5 s para script e Preview), manda o de morte e alcança os descendentes que se separaram do grupo, do mesmo usuário.
- Cada grupo iniciado fica numa tabela do SQLite com o pid, o horário de início, o comando, o tipo, o Run e o dono; a linha sai quando o grupo termina.
- O Preview, os scripts do projeto e os checks ficam no registro: na partida, antes do Scheduler e de qualquer Preview, o servidor para os grupos registrados cujo dono morreu, conferindo a identidade, e só então reconcilia os Runs.
- A instância única segue o ADR-0002, ponto 7: a trava vem antes de abrir o banco, e a identidade do dono confere o horário de início, não só o pid.
- No encerramento, o servidor para o Scheduler, recusa processo novo, para todos os grupos em paralelo e fecha o HTTP, com prazo total de 10 s.

## Alternativas consideradas

- Só o registro, como o T3 Code e o Morphite: o agente seguiria trabalhando, com ferramentas e gastando, depois de o servidor morrer, como o teste mostrou.
- O supervisor também para o Preview e os scripts: um processo a mais para cada um, sem ganho, porque eles não gastam nem escrevem sozinhos fora do Workspace.
- Só a parada no encerramento, sem registro: um crash deixaria os filhos rodando para sempre.

## Consequências

- No Windows (F25), a parada da árvore usa `taskkill /T /F`.

## Imposto por

O check da regra do projeto escrita no T4.1, que acusa processo filho iniciado fora do supervisor. Até ele, não imposto.
