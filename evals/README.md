# Evals

Ferramenta do Source para julgar um corte de regra, skill ou gate pelo efeito, e não pela impressão. Fica fora do pacote (`files` do `package.json` não tem `evals/`).

## `pnpm stats`: o peso do método

Estático, determinístico, sem rede. Imprime a tabela e grava `evals/stats.json` (`--json` só imprime).

- `architecture/`: número de regras, KB de prosa das regras e dos exemplos, as 10 maiores regras, itens de verificação (lista sob título que começa com "Verifica") e quantos levam `(check: <id>)`.
- `skills/` e `agents/`: KB total e por skill ou agent.
- Contexto do builder: para cada ticket de `cli/__fixtures__/project`, os KB das regras completas que o `rules-for --ticket` lista e os KB da saída dele.

`pnpm stats --baseline evals/baseline.json` imprime o delta por métrica: as principais sempre, as outras só quando mudam. `evals/baseline.json` é o 7f71156 (v1.8.0). Tire outro baseline com `pnpm stats --json --label "<o quê>" > <arquivo>`.

Rode antes e depois de cada enxugamento de regras ou skills. Um corte é bom quando o peso cai sem tirar o que o agente usa.

## Parado: o método rodado por agente

`run.mjs` e `scenarios/notes/` rodam um `/build` com `claude -p` num projeto temporário do starter e gravam duração, turnos, custo e o `verify` final. Ficam guardados para quando o corte das regras pedir comparar comportamento, e não só peso: `node evals/run.mjs notes --dry-run` só prepara; `--yes` chama o `claude`, gasta até US$ 15 e precisa de Postgres em `localhost:5432`.
