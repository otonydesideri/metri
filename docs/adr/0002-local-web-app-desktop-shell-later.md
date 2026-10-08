# ADR-0002 O Metri é um app local no navegador, e a casca desktop se decide antes do beta

status: accepted
area: infrastructure
kind: decision

## Contexto

O Metri roda na máquina de quem o usa, para que cada agente trabalhe com o login que a pessoa já fez nele. Os concorrentes que orquestram agentes entregam, quase todos, um app desktop em Electron: Orca, Superset, Nimbalyst, Sculptor, OpenCode, Morphite e os apps desktop do Claude e do Codex. Por dentro, o padrão é o mesmo: um servidor local em processo separado, escutando só em `127.0.0.1` e protegido por um segredo, com a janela apontando para ele. O Vibe Kanban e o T3 Code entregam os dois modos com o mesmo servidor, e o T3 Code tem a mesma stack do Metri.

O desktop tem um custo recorrente: o módulo nativo do SQLite recompilado para o Electron, um build por arquitetura por causa dos binários dos agentes, a assinatura e a notarização no macOS (exigidas para a atualização automática), o certificado no Windows e a matriz de CI. No primeiro marco, o único usuário é quem constrói o Metri.

### Como o mercado faz

- Orca, Superset, Nimbalyst, Morphite e os apps desktop do Claude e do Codex entregam um app desktop em Electron desde o início, com o servidor num processo separado (`stablyai/orca`, `config/electron-builder.config.cjs`; `superset-sh/superset`, `apps/desktop/electron-builder.ts`; pacote do Morphite 0.3.2).
- O T3 Code entrega os dois modos com o mesmo servidor: o comando `t3` sobe o servidor e abre o navegador, e o app Electron embute esse servidor (`pingdotgg/t3code`, `docs/user/install.md` e `docs/internals/overview.md`). O Vibe Kanban faz o mesmo, com `npx vibe-kanban` e a opção `--desktop` (`BloopAI/vibe-kanban`, `npx-cli/src/cli.ts`).
- O próprio servidor entrega a interface empacotada: o Vibe Kanban embute o build do frontend e o serve em `127.0.0.1` (`BloopAI/vibe-kanban@d5cbb53:crates/server/src/routes/frontend.rs:9-19,39-40`, `crates/server/src/main.rs:78`), e o runtime do Orca serve o cliente web empacotado, `web-index.html` e `/assets`, aos navegadores pareados (`stablyai/orca@0f9f1993:src/main/runtime/rpc/static-web-client-handler.ts:6,20,123-124`).
- A pasta de dados fica no home de quem usa: o Superset guarda o banco em `~/.superset` (`superset-sh/superset@a6de0c84:apps/desktop/src/main/lib/local-db/index.ts:18`), e o T3 Code, em `~/.t3/userdata` (`pingdotgg/t3code@4dbc0129:apps/server/src/os-jank.ts:105-108`).
- O token é novo a cada partida, conferido em 08/10/2026. O Jupyter gera um token por partida e o grava, com a URL, num arquivo de execução em modo 0600, apagado ao sair, que o `jupyter server list` lê; na primeira chamada o token vira cookie, e o segredo que assina o cookie fica num arquivo 0600 que sobrevive ao reinício. Ele também recusa `Host` fora de loopback, contra DNS rebinding (`jupyter-server/jupyter_server@f8169d72:jupyter_server/serverapp.py:1355-1366,1761-1766,3202-3207`; `jupyter_server/auth/identity.py:209-223`). O T3 Code gera uma credencial de pareamento de uso único por partida, troca-a por um cookie `httpOnly` e recusa uma segunda instância com "A T3 Code server is already running" (`pingdotgg/t3code@a4c9494b:apps/server/src/cli/config.ts:333-342`). Vibe Kanban e o OpenCode estável não usam token por partida.

Fuga do padrão: a maioria começa no desktop. O Metri começa local, no navegador, como o modo web do T3 Code e do Vibe Kanban, porque no primeiro marco o único usuário é quem o constrói. A escolha foi do humano.

## Decisão

O Metri é um servidor local mais uma interface React com Vite no navegador, entregue pelo próprio servidor. No primeiro marco, ele roda de uma cópia fixa do repositório (ADR-0008), sem instalador nem comando publicado.

O servidor nasce pronto para ser embrulhado:

1. escuta só em `127.0.0.1`, numa porta livre, e informa a porta escolhida a quem o iniciou;
2. gera um segredo a cada inicialização e o exige nas chamadas HTTP e na abertura do WebSocket, conferindo também o `Host` e a origem, que precisam ser exatamente os do servidor, com a porta: `localhost:<porta>` ou `127.0.0.1:<porta>` (no WSL, o navegador do Windows chega ao servidor por `localhost`, https://learn.microsoft.com/en-us/windows/wsl/networking). A porta conta porque o Preview roda noutra porta do mesmo host: para o navegador, porta não separa site, e cookie não separa porta (HTML, §7.1.1.1; RFC 6265, §8.5);
3. entrega ele mesmo os arquivos gerados pelo Vite, na mesma origem da API;
4. parte de uma função única, que recebe endereço, porta, segredo, pasta de dados e pasta de recursos, sem depender da pasta de onde foi chamado;
5. guarda banco, logs e configuração na pasta de dados do app, `~/.metri`, que a variável `METRI_HOME` troca para separar o Metri que conduz do que está em teste, e roda as migrações na partida;
6. encerra limpo os agentes e os processos filhos e percebe quando o processo que o iniciou morreu;
7. tem checagem de saúde e roda uma instância só: grava o endereço e o token num arquivo de execução 0600 na pasta de dados, apagado ao sair, como o `jpserver-<pid>.json` do Jupyter, e uma segunda partida lê esse arquivo, não sobe outra instância e abre o navegador no endereço atual, com o token;
8. não depende do PATH do terminal: os caminhos de `claude` e `codex` são configuráveis.

O ponto 3 é exceção a `general/http-surface`, "Superfície HTTP same-origin" (em produção, a mesma origem vem do edge e do proxy do IaC): um app local não tem edge nem proxy, então o próprio servidor entrega o build do Vite em `/`, com a API em `/api`, como o Vibe Kanban e o Orca.

A casca desktop, se houver, e o nome do comando se decidem antes do `beta`; o nome não é `metri`, que é o CLI do método. No `dogfood`, a cópia fixa tem o próprio script de partida. Se for desktop, o caminho é o Electron.

## Alternativas consideradas

- Electron desde a fundação: dá instalador e atualização automática desde o início, mas paga assinatura, builds por arquitetura e matriz de CI antes de existir um usuário de fora.
- Tauri: o servidor Node teria de ir empacotado à parte, com limites para módulos nativos e para Mac Intel, e a interface rodaria no WebKit do sistema, sem ganho no servidor. O OpenCode saiu do Tauri para o Electron.

## Consequências

- Os oito pontos entram como critérios nos tickets da slice de fundação, no Look across.
- Instalador e atualização automática ficam para a casca.
- Sem os oito pontos, a casca vira uma reescrita do servidor; com eles, ela é um processo principal que sobe o servidor, uma janela, o atualizador e a configuração de build.

## Imposto por

Os critérios dos oito pontos nos tickets da fundação. Não há check que os imponha.
