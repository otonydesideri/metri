# ADR-0011 O Metri só envia dados de uso com a escolha de quem usa

status: accepted
area: general
kind: decision

## Contexto

O Metri promete que nada do conteúdo do projeto sai da máquina. Depois do primeiro marco, com gente de fora usando, dados de uso e de falha ajudam a decidir o produto. No primeiro marco, a única pessoa que usa o Metri é quem o constrói.

### Como o mercado faz

Conferido em 05/10/2026:

- O comum é ligar por padrão, sem perguntar no primeiro uso. O Superset liga sempre, sem opção de desligar, e põe branch e caminho em eventos (`superset-sh/superset@a6de0c8:apps/desktop/src/shared/constants.ts:67`, `.../workspaces/procedures/create.ts:389-393`). O Conductor liga PostHog e Sentry e envia nome de repositório e valores de configuração (bundle 0.90.1, `index-CZ-vbwL9.js`).
- O Orca é o mais cuidadoso entre os que coletam: eventos de uma lista fechada, com schemas estritos, `DO_NOT_TRACK` respeitado e relatório de falha guardado na máquina, enviado só à mão (`stablyai/orca@d173514:src/shared/telemetry-event-registry.ts:104-206`, `src/main/telemetry/consent.ts:76-90`, `src/main/crash-reporting/crashpad-capture.ts:67-74`). Mesmo assim, liga por padrão e não avisa quem instala (`src/renderer/src/components/TelemetryFirstLaunchSurface.tsx:1-4`).
- O Morphite não coleta nada e só fala com o servidor de licença (app 0.3.2, `connect-src 'self'` em `out/renderer/index.html`).

O Claude Code tem telemetria própria: métricas ligadas por padrão, sem código, prompt nem caminho, e relatórios de erro redigidos no login Pro e Max (https://code.claude.com/docs/en/data-usage).

Fuga do padrão: o Metri pede a escolha antes de enviar, como nenhum dos que coletam faz, pela promessa de que nada do projeto sai da máquina.

## Decisão

No primeiro marco, o Metri não envia telemetria.

No `beta`, os dados de uso ficam desligados até a pessoa escolher, na primeira abertura:

- cada evento leva só campos de uma lista fechada e um id aleatório de instalação, nunca repositório, branch, caminho, prompt, valor de configuração, texto de erro ou email;
- `DO_NOT_TRACK`, `METRI_TELEMETRY_DISABLED` e um ambiente de CI desligam o envio.

O relatório de falha nunca sai sozinho: a pessoa o revisa e envia, com os caminhos redigidos.

O Metri não muda a telemetria do harness. A tela de Harnesses diz o que ele envia e como desligar.

## Alternativas consideradas

- Ligado por padrão, como Superset, Conductor e Orca: mais dados no `beta`, mas dado enviado não se recolhe, e a promessa fica quebrada.
- Nenhuma telemetria, como o Morphite: nenhum dado para decidir o produto depois do `beta`.
- Desligar a telemetria do harness pelo ambiente do Run: o Metri mexeria no harness da pessoa sem ela pedir.

## Consequências

- A F29 traz a escolha, os eventos e o relatório de falha.
- O fornecedor e a região dos dados se decidem no Look across da F29.

## Imposto por

Os critérios da F29 que descartam o evento com campo fora da lista e que conferem que nada sai sem a escolha. Até eles existirem, não imposto.
