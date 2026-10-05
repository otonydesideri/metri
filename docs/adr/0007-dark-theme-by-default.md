# ADR-0007 O tema do Metri começa escuro

status: accepted
area: frontend
kind: exception

## Contexto

A regra `frontend/theming` define dois temas, claro e escuro, sem seguir o tema do sistema, e começa no claro para quem nunca escolheu. Para o Metri, o humano decidiu começar no escuro.

### Como o mercado faz

- Seguir o tema do sistema é o padrão dominante: Orca (`stablyai/orca`, `src/shared/default-global-settings.ts`, `theme: 'system'`), T3 Code (`pingdotgg/t3code`, `apps/web/src/hooks/useTheme.ts`), Vibe Kanban, Nimbalyst, os apps desktop do Claude e do Codex, Linear e cal.com.
- Começar no escuro aparece nos orquestradores mais próximos do Metri: Superset (`superset-sh/superset`, `DEFAULT_THEME_ID = "dark"`), Conductor (bundle 0.90.1) e Morphite (bundle 0.3.2, sem opção de seguir o sistema).

Fuga do padrão: o dominante é seguir o sistema, que o método proíbe. O humano decidiu começar no escuro, como Superset, Conductor e Morphite.

O kit cobre o tema escuro inteiro: o registry do coss dá valor escuro para cada uma das 41 cores do tema claro (`cssVars.dark` em https://coss.com/ui/r/style.json, conferido em 05/10/2026). O Metri não cria cor para o escuro.

## Decisão

Exceção a `frontend/theming`, "Tema: contrato de classe e provider no `@metri/ui`", no app web do Metri: quem nunca escolheu vê o tema escuro.

O resto da regra continua valendo: dois valores, sem `system`, a classe no `documentElement`, o script inline antes do primeiro paint e o fundo do `index.html` nos dois temas.

## Alternativas consideradas

- O padrão do método, claro para quem nunca escolheu.
- Seguir o tema do sistema: a regra proíbe, porque abre diferença entre o que a pessoa pediu e o que está na tela.

## Consequências

- O `ThemeProvider` do `@metri/ui` e o script inline do `index.html` caem no escuro quando não há escolha guardada.
- A exceção ganha uma linha em "Exceções e defaults trocados" do `.metri/ARCHITECTURE.md`, no Look across.

## Imposto por

Não imposto.
