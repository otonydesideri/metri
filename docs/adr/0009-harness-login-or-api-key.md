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

### Como o mercado faz

- O Conductor roda o Claude pelo Agent SDK com o login do usuário e entrou no programa "Sign in with ChatGPT" da OpenAI em 29/09/2026 (https://www.conductor.build/docs/faq; https://learn.chatgpt.com/docs/sign-in-with-chatgpt#partners).
- A JetBrains não aceita a assinatura do Claude no Claude Agent e exige chave de API, citando a mesma regra da Anthropic (YouTrack da JetBrains, artigo SUPPORT-A-4751).
- O Zed roda o Claude pelo adaptador ACP e deixa o login e a cobrança com o fornecedor: "Billing, legal terms, retention, and data handling are between you and the agent provider" (https://zed.dev/docs/ai/external-agents).

O Metri segue o Zed e o Conductor: o login fica com o harness, e o Metri nunca toca a credencial.

## Decisão

O Metri nunca oferece login próprio de Claude ou de ChatGPT. Cada harness usa o login que a pessoa fez nele, pelo fluxo do próprio fornecedor, ou uma chave de API. O Metri roda o binário oficial sem modificação, não lê, não guarda e não repassa credencial ou token, e não remove nem bloqueia nenhum método de login do harness.

Como os termos da Anthropic são ambíguos, o caminho por chave de API entra já no primeiro marco (UC2.3), com a credencial no próprio Claude Code: login com uma conta do Console, com ou sem chave, ou a variável no ambiente. O Metri mostra a origem da credencial que o SDK informa, testa com uma sessão curta e avisa quando a cobrança vai para a API, sem depender de uma confirmação da Anthropic.

## Alternativas consideradas

- Só chave de API, desde o início: é o caminho que os dois fornecedores garantem, mas tira do usuário a assinatura que ele já paga e pede integração com o cofre antes do primeiro marco.
- Login próprio do Metri com as contas dos fornecedores: proibido pelos dois.
- O Metri guardar a chave de API no cofre do sistema: passaria a carregar um segredo, e o WSL normalmente não tem o serviço de segredos do Linux.

## Consequências

- Antes do `beta`, o humano pede entrada no programa "Sign in with ChatGPT" da OpenAI.
- A chave de API é o caminho documentado, e o Metri não anuncia o uso da assinatura.
- O login no Claude Code se faz no terminal, porque o `/login` não roda no modo programático do SDK (não confirmado; o ticket do UC2.1 confere); a tela de Harnesses diz isso.
- Uma credencial que vem antes do login na ordem (chave ou token no ambiente, `apiKeyHelper`, provedor de nuvem) passa à frente da conta Claude. O Metri avisa e não a remove, porque remover seria restringir um método de login.
- Nos menus, o harness se chama "Claude Agent"; o texto pode dizer que o Metri roda o Claude Code. "Claude Code" e "Anthropic" não entram em nome de recurso, no logo nem de forma que sugira endosso.
- Os limites do Pro e do Max supõem uso individual comum, e o despacho automático roda Runs em sequência sem o humano. Ligar o despacho automático com a conta Claude mostra esse aviso.

## Imposto por

O critério do UC2.1 que procura credencial e token em evento, log e banco. O resto não é imposto.
