# ADR-0010 O código nasce multiplataforma, e o Windows nativo entra no beta

status: accepted
area: infrastructure
kind: decision

## Contexto

O documento de construção deixava o Windows nativo fora da v1, coberto pelo WSL. O humano decidiu que o Metri também roda no Windows nativo. No primeiro marco, ele mesmo usa o WSL.

O que se sabe do Windows nativo, conferido em 05/10/2026:

- O Claude Code é suportado no Windows 10 1809 ou mais novo, em x64 e ARM64 (https://code.claude.com/docs/en/setup). A ferramenta Bash usa o Git for Windows; sem ele, o Claude Code usa a ferramenta PowerShell, ainda em preview. O Agent SDK 0.3.289 traz o `claude.exe` para `win32-x64` e `win32-arm64` nas dependências opcionais.
- O Claude Code não tem sandbox no Windows nativo: "On native Windows, Claude Code runs commands unsandboxed" (https://code.claude.com/docs/en/sandboxing). A orientação oficial é WSL2, container ou VM.
- O Codex tem sandbox nativo de Windows em dois modos (https://learn.chatgpt.com/docs/windows/windows-sandbox). O `elevated` usa usuários com menos privilégio e regras de firewall, e exige instalação com aprovação de administrador. O `unelevated` usa token restrito e ACL, com isolamento de rede fraco. A lista de domínios permitidos só funciona no `elevated`.
- Caminho acima de 260 caracteres exige o `LongPathsEnabled` do Windows e um programa que se declare preparado para isso, e iniciar um processo com pasta de trabalho acima desse limite falha (https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation). O Git for Windows vem com `core.longpaths` desligado, e até a versão 2.54 o `git worktree remove` atravessava junctions e apagava o que havia do outro lado. No Windows, o pnpm usa junctions e limita o nome das pastas internas a 60 caracteres.
- O `better-sqlite3` 12.11.1, a versão que o adapter do Prisma usa, publica binários prontos para Windows x64 e ARM64, para o Node 22 e 24 e para o Electron (https://github.com/WiseLibs/better-sqlite3/releases/tag/v12.11.1).
- No Windows, `subprocess.kill()` termina só o filho direto; os netos sobrevivem. Encerrar a árvore pede `taskkill /T /F` ou um job object. Um arquivo do SQLite aberto não pode ser apagado, e a pasta de trabalho de um processo fica travada enquanto ele roda.

### Como o mercado faz

- Quem roda o Claude Code no Windows nativo roda sem sandbox de sistema: Orca (`stablyai/orca`, `src/shared/tui-agent-permissions.ts`, que ainda pula as aprovações por padrão), T3 Code (`pingdotgg/t3code`, `packages/contracts/src/providerPolicy.ts`, acesso total por padrão), Nimbalyst (motor de permissões próprio, com aprovação), o app desktop do Claude ("Claude Code does not sandbox shell commands on Windows devices", https://claude.com/docs/third-party/claude-desktop/code) e o Morphite (notas da v0.3.0: "Agents are not sandboxed on Windows yet, and Morphite says so").
- Superset e Conductor não rodam no Windows (`superset-sh/superset`, README; https://www.conductor.build/docs/installation).
- Orca, Nimbalyst, Morphite e o app desktop do Claude saem para Windows, macOS e Linux a partir de um código só.

O Metri segue o app desktop do Claude, o Morphite e o Nimbalyst: sem sandbox no Windows, com as aprovações mantidas e o aviso na tela.

## Decisão

O Windows nativo entra no `beta`, numa feature própria (F25). No primeiro marco, o Metri roda no WSL.

Desde a slice de fundação, o código nasce multiplataforma:

- os scripts do método e do starter são em Node, não em bash, incluindo `metri:setup`, `metri:run`, `metri:archive`, os hooks e o `hitl-loop` do diagnóstico;
- os caminhos são montados com o `node:path`;
- as skills e os agents são materializados por cópia, não por link simbólico;
- um lint de portabilidade falha com script em bash no método e no starter, com caminho montado com separador fixo e com link simbólico na materialização;
- o CI roda em Linux desde o primeiro ticket; os jobs de macOS (F28) e de Windows (F25) entram no `beta`.

No Windows nativo, o Claude Code roda sem sandbox, como em todo produto que o roda ali. A Policy do Claude vale por aprovação e allowlist, nunca pelo sistema operacional: a tela de Harnesses e cada Run dizem isso, o humano aceita uma vez por projeto, e o Metri nunca pula as aprovações. A decisão é revista quando o Claude Code ganhar sandbox no Windows.

## Alternativas consideradas

- Windows só pelo WSL, como no documento de construção: deixaria de fora quem trabalha no Windows nativo.
- Windows nativo já no primeiro marco: o único usuário do primeiro marco usa o WSL.
- Rodar as Runs do Claude dentro do WSL2, a orientação oficial: a Policy ficaria igual à do Linux, mas Workspace, pnpm e caminhos passariam a viver no WSL, o que esvazia o Windows nativo.
- Deixar o Claude fora do Windows no `beta`: o Windows passaria a depender só do Codex, que também é `beta`.
- Os jobs de macOS e de Windows no CI desde o primeiro ticket: pegariam cedo o que quebra fora do Linux, mas atrasariam o começo, e no primeiro marco o Metri roda só no WSL.

## Consequências

- O `metri init` passa a copiar as skills e os agents para `.claude/` em vez de criar links, e o docs-lint deixa de exigir os links. É uma mudança do Source, num ticket do método (ADR-0001). A cópia tem de ser refeita quando a versão do método muda.
- O `hitl-loop.template.sh` do diagnóstico vira um script em Node.
- No Windows, o Metri usa uma raiz de dados curta e nomes curtos de Workspace, liga o `core.longpaths` em cada worktree, exige o Git for Windows 2.54 ou mais novo e nunca inicia um processo com pasta de trabalho acima de 260 caracteres.
- Arquivar um Workspace encerra a árvore inteira de processos, fecha as conexões do banco e apaga a pasta tentando de novo enquanto houver arquivo travado, sem nunca atravessar uma junction.
- Até o `beta`, o que quebra no macOS ou no Windows e o lint não pega passa sem aviso; os jobs da F28 e da F25 é que pegam.
- Ficam como risco os bugs de Windows ainda abertos no Agent SDK: fluxo fechado depois da primeira ferramenta (`anthropics/claude-agent-sdk-typescript#359`) e falha ao interromper (`#444`), abertos em 05/10/2026, e a mudança frequente do sandbox do Codex no Windows.

## Imposto por

O lint de portabilidade e o CI em Linux, desde a fundação (F18); os jobs de macOS e de Windows do CI, na F28 e na F25.
