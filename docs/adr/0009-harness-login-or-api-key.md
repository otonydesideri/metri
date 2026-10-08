# ADR-0009 O harness usa o login do usuário ou a chave de API

status: accepted
area: backend
kind: decision

## Contexto

O Metri é vendido e roda na máquina do usuário. Cada agente trabalha com o login que a pessoa já fez nele (a assinatura do Claude no Claude Code, a conta do ChatGPT no Codex) ou com uma chave de API. Os termos dos dois fornecedores tratam esse caso de formas diferentes, e a Anthropic tem dois textos que não batem. Conferido em 04/10/2026:

- Anthropic, a favor: a página legal do Claude Code (https://code.claude.com/docs/en/legal-and-compliance, alterada por volta de 21/08/2026) diz "Nor does it prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription, including where a platform hosts Claude Code". Ela exige o binário sem modificação, que não se restrinja nenhum método de login, que cada usuário pague o próprio uso e que o produto não colete nem repasse credencial ou token. O Agent SDK é descrito como "A library that runs the Claude Code binary" (https://code.claude.com/docs/en/agent-sdk/overview).
- Anthropic, contra: a mesma página do Agent SDK mantém "Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK". O artigo de suporte https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account (19/05/2026) diz "If you're building a product, application, or tool for others, use API key authentication". Não há formulário nem lista pública de apps aprovados; o caminho indicado é o contato com vendas.
- OpenAI: a página do app-server (https://learn.chatgpt.com/docs/app-server) diz "App-server authentication has never been permitted for commercial or hosted services". O uso do plano do ChatGPT é liberado para projetos de código aberto e projetos pessoais que rodam localmente. App pago precisa entrar no programa "Sign in with ChatGPT", que tem lista pública de parceiros (o Conductor está nela desde 29/09/2026).
- Anthropic, conferido em 05/10/2026 na página legal: rodar o Claude Code num produto exige aceitar os Commercial Terms, e "Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK". O produto pode dizer em texto que "runs Claude Code", mas não usa os nomes nem os logos da Anthropic no nome de produto ou de recurso. As diretrizes de marca do Agent SDK não permitem "Claude Code" nem "Claude Code Agent" e preferem "Claude Agent" em menus (https://code.claude.com/docs/en/agent-sdk/overview, "Branding guidelines").
- Claude Agent SDK 0.3.289, conferido em 05/10/2026: a mensagem de início da sessão traz `apiKeySource` (`ANTHROPIC_API_KEY`, `apiKeyHelper`, `/login managed key` ou `none`), e `query.accountInfo()` devolve `subscriptionType`, `tokenSource` e `apiProvider` (`sdk.d.ts`). O login com a conta do Console pode guardar um perfil sem chave. No modo não interativo, a credencial segue esta ordem: provedor de nuvem, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, `apiKeyHelper`, `CLAUDE_CODE_OAUTH_TOKEN`, perfis e `/login` (https://code.claude.com/docs/en/authentication).
- A condição sobre os métodos de login, conferida em 07/10/2026, está na seção "Can customers offer Claude Code in their products?" da página legal, que abre assim: "Unless we've mutually agreed otherwise, preinstalling or running Claude Code in your products or services (e.g. in hosted sandboxes or other agent infrastructure) requires agreeing to our Commercial Terms of Service and complying with the conditions below". A primeira condição: "The Claude Code binary must not be modified. Claude Code must be installed and run as published by Anthropic, and customers may not remove, disable, or restrict any authentication method built into it (including methods that permit signing in with a Claude account or the user's own API key)." A segunda: "Customers may not pay for, resell, or intermediate Claude usage on their end users' behalf. Each end user must authenticate with their own Anthropic API key, Claude subscription plan credentials, or 3P inference provider credential (Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry)." Lida nesse contexto, a regra trata do binário publicado e dos métodos de login que ele traz: o produto não tira da pessoa nenhum deles. A palavra "restrict" é ampla, e só a Anthropic confirmaria essa leitura.

### Como o mercado faz

- O Conductor roda o Claude pelo Agent SDK com o login do usuário e entrou no programa "Sign in with ChatGPT" da OpenAI em 29/09/2026 (https://www.conductor.build/docs/faq; https://learn.chatgpt.com/docs/sign-in-with-chatgpt#partners).
- A JetBrains não aceita a assinatura do Claude no Claude Agent e exige chave de API, citando a mesma regra da Anthropic (YouTrack da JetBrains, artigo SUPPORT-A-4751).
- O Zed roda o Claude pelo adaptador ACP e deixa o login e a cobrança com o fornecedor: "Billing, legal terms, retention, and data handling are between you and the agent provider" (https://zed.dev/docs/ai/external-agents).

- As configurações pessoais do Claude Code (instruções, regras de permissão, hooks e servidores MCP) entram nas sessões que esses produtos abrem, conferido em 07/10/2026. O Conductor passa `settingSources: ["user", "project", "local"]` (app 0.90.1, `conductor-runtime`). O Orca usa as mesmas três fontes (`stablyai/orca@726eaf1:src/main/claude/claude-structured-launch-resolution.ts:50,78-84`). O Morphite também, mas com `managedSettings: { allowManagedPermissionRulesOnly: true }`, que anula as regras de permissão de usuário, projeto e local (app 0.3.2, `out/main/backend.js:30889-30904`; https://code.claude.com/docs/en/settings-reference). T3 Code, Nimbalyst, Vibe Kanban e o agente de terminal do Superset também carregam essas configurações. No SDK, omitir o `settingSources` carrega todas as fontes (`@anthropic-ai/claude-agent-sdk@0.3.293:sdk.d.ts:2243-2253`).
- Com a chave de API no ambiente, conferido em 07/10/2026:
  - o Conductor oferece a escolha "CLI" ou "API key" e tira sempre o `ANTHROPIC_API_KEY` e o `ANTHROPIC_AUTH_TOKEN` herdados; no modo "API key", usa a chave guardada nas configurações dele, que ele pode importar do ambiente (app 0.90.1, `conductor-runtime` @73099715, `assets/index-CZ-vbwL9.js` @3103651);
  - o Orca repassa a chave quando a pessoa usa o login padrão, porque removê-la "signs them out of a CLI that would otherwise have worked", e tira as variáveis de autenticação quando ela escolhe uma conta gerenciada (`stablyai/orca@726eaf1:src/main/claude-accounts/environment.ts:62-79`);
  - o chat do Superset e o Nimbalyst tiram sempre a chave herdada (`superset-sh/superset@0482268:packages/host-service/src/chat-v3/agentEnv.ts:39-44`; `Nimbalyst/nimbalyst@69c456d:packages/electron/src/main/bootstrap.ts:40-49`);
  - o Morphite passa só uma lista fixa de variáveis, sem nenhuma `ANTHROPIC_*` (app 0.3.2, `out/main/backend.js:1261-1292`);
  - o Vibe Kanban repassa, avisa na partida e tem a opção `disable_api_key` (`BloopAI/vibe-kanban@d5cbb53:crates/executors/src/executors/claude.rs:644-648,911-928`).

- O CI mascara pelo valor: o GitHub Actions redige os segredos que conhece quando aparecem no log e avisa que, como o valor pode ser transformado, "automatic redaction is not guaranteed" (https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions, "Use secrets for sensitive information"). O Metri não conhece o valor, porque nunca lê a credencial, então mascara por padrão. O tema volta no Look across da F19, com a chave de outro fornecedor.
- Nas ferramentas de agentes, mascarar por padrão no evento não foi encontrado em nenhuma das sete pesquisadas (não confirmado). O T3 Code evita o problema por referência: o segredo pedido ao humano entra como `SecretRef` de uso único e nunca chega ao transcript (`pingdotgg/t3code@a4c9494b:apps/server/src/secrets/SecretRequests.ts:1-9`). O Metri não pede segredo ao humano; a chave chega pelo ambiente, então mascara por padrão.

O Metri segue o Zed e o Conductor: o login fica com o harness, e o Metri nunca toca a credencial. Nas configurações pessoais, segue o Morphite. Na chave do ambiente, segue o Conductor e o Orca: a escolha da pessoa decide.

## Decisão

O Metri nunca oferece login próprio de Claude ou de ChatGPT. Cada harness usa o login que a pessoa fez nele, pelo fluxo do próprio fornecedor, ou uma chave de API. O Metri roda o binário oficial sem modificação, não lê nem guarda credencial ou token, e mantém disponíveis os dois métodos de login do Claude Code, a conta Claude e a API.

O modo escolhido na tela de Harnesses decide a chave de API no ambiente do Run. Em "conta Claude", o Metri não repassa o `ANTHROPIC_API_KEY` nem o `ANTHROPIC_AUTH_TOKEN` ao processo do Run, como Conductor, Superset e Orca; em "API", repassa os dois. Com um deles no ambiente e nenhum modo escolhido, o Metri pergunta antes do primeiro Run. Quem escolhe o método é a pessoa, e nenhum deles deixa de existir.

Antes de gravar um evento, um log ou a saída de um check, o Metri mascara os padrões conhecidos de chave e de token da Anthropic, sem ler o ambiente.

Os Runs carregam as configurações e as instruções pessoais do Claude Code, como o harness faz por padrão, e anulam as regras de permissão de todas as fontes, como o Morphite: só as aprovações do Metri decidem o que roda. Um interruptor do projeto exclui as instruções e os hooks pessoais, e ele começa desligado. Se a anulação não funcionar no SDK, a decisão volta ao humano.

Como os termos da Anthropic são ambíguos, o caminho por chave de API entra já no primeiro marco (UC2.3), com a credencial no próprio Claude Code: login com uma conta do Console, com ou sem chave, ou a variável no ambiente. O Metri mostra a origem da credencial que o SDK informa, testa com uma sessão curta e avisa quando a cobrança vai para a API, sem depender de uma confirmação da Anthropic.

## Alternativas consideradas

- Só chave de API, desde o início: é o caminho que os dois fornecedores garantem, mas tira do usuário a assinatura que ele já paga e pede integração com o cofre antes do primeiro marco.
- Login próprio do Metri com as contas dos fornecedores: proibido pelos dois.
- O Metri guardar a chave de API no cofre do sistema: passaria a carregar um segredo, e o WSL normalmente não tem o serviço de segredos do Linux.
- Tirar sempre a chave de API do ambiente, como o chat do Superset, o Nimbalyst e o Morphite: quem só usa a API perderia esse método sem escolher.
- Nunca mexer na chave do ambiente: quem a esquecesse ali pagaria a API mesmo escolhendo a conta Claude.
- Contexto limpo nos Runs, só com as configurações do projeto, como a Anthropic recomenda para servidor com vários clientes (https://code.claude.com/docs/en/agent-sdk/claude-code-features): o login pelo `apiKeyHelper` pessoal deixaria de valer, e o Metri sairia do que o mercado faz.

## Consequências

- Antes do `beta`, o humano pede entrada no programa "Sign in with ChatGPT" da OpenAI.
- A chave de API é o caminho documentado, e o Metri não anuncia o uso da assinatura.
- O login no Claude Code se faz no terminal, porque o `/login` não roda no modo programático do SDK (não confirmado; o ticket do UC2.1 confere); a tela de Harnesses diz isso.
- No modo conta Claude, uma credencial que ainda vem antes do login (`apiKeyHelper`, provedor de nuvem) continua passando à frente. O Metri avisa e não a remove.
- Hooks e instruções pessoais agem dentro dos Runs. A aba Contexto do Run mostra o que veio deles.
- No SDK, a opção `env` substitui o ambiente inteiro do processo, sem somar ao `process.env` (`@anthropic-ai/claude-agent-sdk@0.3.293:sdk.d.ts:1645-1663`). O Metri monta o ambiente do Run a partir do ambiente da máquina, sem a chave no modo conta Claude.
- Uma chave posta no bloco `env` das configurações pessoais do Claude Code pode entrar no Run mesmo no modo conta Claude, porque os Runs carregam essas configurações (não confirmado). O ticket do UC2.3 confere, e, se ela entrar, a decisão volta ao humano.
- Nos menus, o harness se chama "Claude Agent"; o texto pode dizer que o Metri roda o Claude Code. "Claude Code" e "Anthropic" não entram em nome de recurso, no logo nem de forma que sugira endosso.
- Os limites do Pro e do Max supõem uso individual comum, e o despacho automático roda Runs em sequência sem o humano. Ligar o despacho automático com a conta Claude mostra esse aviso.

## Imposto por

O critério do UC2.1 que procura credencial e token em evento, log e banco. O resto não é imposto.
