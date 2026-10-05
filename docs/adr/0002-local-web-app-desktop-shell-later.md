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

Fuga do padrão: a maioria começa no desktop. O Metri começa local, no navegador, como o modo web do T3 Code e do Vibe Kanban, porque no primeiro marco o único usuário é quem o constrói. A escolha foi do humano.

## Decisão

O Metri é um servidor local mais uma interface React com Vite no navegador, entregue pelo próprio servidor. No primeiro marco, ele roda de uma cópia fixa do repositório (ADR-0008), sem instalador nem comando publicado.

O servidor nasce pronto para ser embrulhado:

1. escuta só em `127.0.0.1`, numa porta livre, e informa a porta escolhida a quem o iniciou;
2. gera um segredo a cada inicialização e o exige nas chamadas HTTP e na abertura do WebSocket, conferindo também a origem, que aceita `localhost` e `127.0.0.1` (no WSL, o navegador do Windows chega ao servidor por `localhost`, https://learn.microsoft.com/en-us/windows/wsl/networking);
3. entrega ele mesmo os arquivos gerados pelo Vite, na mesma origem da API;
4. parte de uma função única, que recebe endereço, porta, segredo, pasta de dados e pasta de recursos, sem depender da pasta de onde foi chamado;
5. guarda banco, logs e configuração numa pasta de dados do app e roda as migrações na partida;
6. encerra limpo os agentes e os processos filhos e percebe quando o processo que o iniciou morreu;
7. tem checagem de saúde e roda uma instância só;
8. não depende do PATH do terminal: os caminhos de `claude` e `codex` são configuráveis.

A casca desktop, se houver, e o nome do comando se decidem antes do `beta`. Se for desktop, o caminho é o Electron.

## Alternativas consideradas

- Electron desde a fundação: dá instalador e atualização automática desde o início, mas paga assinatura, builds por arquitetura e matriz de CI antes de existir um usuário de fora.
- Tauri: o servidor Node teria de ir empacotado à parte, com limites para módulos nativos e para Mac Intel, e a interface rodaria no WebKit do sistema, sem ganho no servidor. O OpenCode saiu do Tauri para o Electron.

## Consequências

- Os oito pontos entram como critérios nos tickets da slice de fundação, no Look across.
- Instalador e atualização automática ficam para a casca.
- Sem os oito pontos, a casca vira uma reescrita do servidor; com eles, ela é um processo principal que sobe o servidor, uma janela, o atualizador e a configuração de build.

## Imposto por

Os critérios dos oito pontos nos tickets da fundação. Não há check que os imponha.
