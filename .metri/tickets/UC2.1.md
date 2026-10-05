---
id: UC2.1
title: Conferir o Claude Code
feature: F2
actor: humano
status: draft
---

# UC2.1 · Conferir o Claude Code

Como humano, quero ver se o Claude Code está pronto para o Metri usar, para não despachar trabalho para um agente que não vai rodar.

## Regras de negócio

- BR3: O Metri nunca oferece login de Claude; usa o login que a pessoa fez no próprio Claude Code.
- BR4 (sensitive): O Metri nunca lê nem guarda credencial ou token do harness, e nunca os põe no ambiente do harness: o processo do harness herda o ambiente da máquina como está. O teste do login é uma sessão curta do harness, nunca a leitura dos arquivos de credencial.
- BR5: O Metri não remove nem bloqueia nenhum método de login do Claude Code. Uma credencial que passa à frente do login da conta (chave ou token no ambiente, `apiKeyHelper` ou provedor de nuvem) gera aviso; o Metri se baseia na origem que o SDK informa, nunca no valor.

## Critérios

- [ ] Com o Claude Code logado na máquina, o teste abre uma sessão curta do harness, e a tela mostra a resposta, a versão e o modelo.
- [ ] Com outro caminho do binário configurado, o teste usa esse caminho e mostra a versão dele.
- [ ] Sem login, o teste falha, e a tela diz que o login se faz no próprio Claude Code.
- [ ] Com `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, um `apiKeyHelper` ou um provedor de nuvem ligado, a tela mostra a origem da credencial que o SDK informa e avisa que a cobrança não vai para a conta Claude.
- [ ] Com a versão do binário diferente da suportada, a tela avisa e mostra a versão suportada.
- [ ] Nenhum evento, log ou linha do banco contém credencial ou token do harness depois do teste.
- [ ] Tela: nos menus, o harness aparece como "Claude Agent".
- [ ] Tela: o estado do Claude Code aparece em texto (pronto, sem login, versão diferente), nunca só por cor.

## Notas

- No WSL2, o login do Claude Code pode pedir para colar um código mostrado no navegador (https://code.claude.com/docs/en/authentication); a tela de Harnesses explica isso.
