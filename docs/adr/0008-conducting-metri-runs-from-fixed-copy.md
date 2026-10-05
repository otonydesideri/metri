# ADR-0008 O Metri que conduz roda de uma cópia fixa

status: accepted
area: infrastructure
kind: decision

## Contexto

No primeiro marco, o Metri constrói o próprio repositório. Se o servidor que conduz o trabalho rodasse do checkout que está sendo construído, cada merge na branch padrão trocaria o código do servidor em execução, no meio dos Runs. É o mesmo problema do ADR-0001, com o app no lugar do método.

### Como o mercado faz

- O Superset diz que "is built in Superset" e manda rodar o desenvolvimento a partir de um Workspace do app instalado, com a pasta de dados isolada, "instead of the repository's main checkout" (`superset-sh/superset`, `DEVELOPMENT.md` e `.superset/setup.local.sh`).
- O T3 Code avisa que a instalação real é usada enquanto se trabalha e que nunca se sobe um servidor contra ela; cada worktree usa a própria pasta de dados (`pingdotgg/t3code`, `AGENTS.md` e `docs/operations/development.md`). O Orca dá ao build de desenvolvimento uma identidade e uma CLI separadas (`stablyai/orca`, `config/scripts/dev-electron-bundle-identity.mjs`).
- O Nimbalyst documenta os dois caminhos: desenvolver de dentro do próprio Nimbalyst que está sendo construído, com reinícios, ou rodar uma build a partir de um checkout enquanto se trabalha em outro (`Nimbalyst/nimbalyst`, `docs/DEVELOPING_NIMBALYST.md`).

O Metri segue o Superset e o T3 Code: a cópia que conduz fica separada do checkout que ela constrói.

## Decisão

O Metri que conduz roda de uma cópia fixa, um build ou uma instalação travada numa versão, separada do checkout que ele constrói. Atualizar essa cópia é um passo deliberado do humano.

O método que cada Run usa continua o do ADR-0001: a cópia fixa é só do app.

## Alternativas consideradas

- Rodar do checkout que está sendo construído: cada merge troca o servidor no meio do trabalho.
- Rodar de uma worktree da branch padrão que se atualiza sozinha: o mesmo problema, só que adiado para a próxima atualização.

## Consequências

- Uma correção no Metri só vale para quem conduz depois que o humano atualiza a cópia.
- Os testes que o builder roda no repositório do Metri não usam a pasta de dados nem as portas do Metri que conduz.
- Como a cópia é feita (pasta de build ou instalação numa tag) se decide no Look across, na slice da fundação.

## Imposto por

Não imposto.
