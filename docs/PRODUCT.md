# Metri

## Para quem e qual problema

Devs solo e times pequenos que constroem software com agentes de código, como Claude Code e Codex. A primeira pessoa a usar o Metri é quem o constrói.

Sozinho, o agente não segue um método. Ele esquece instruções, inventa arquitetura, afrouxa testes, cria peças que não se ligam a nada, perde o fio de uma conversa para outra e, quando roda junto com outro agente, os dois mexem no mesmo lugar. As ferramentas que existem resolvem partes disso: umas a execução em paralelo (worktree, terminal, board, fila de merge), outras o caminho de spec a tarefas, com aprovação entre as fases, como o Kiro e o Spec Kit.

Usada à mão com um agente, a metodologia Slices com Guardrails resolve boa parte disso. O preço é que o humano vira o scheduler, o quadro e o verificador, e esse preço sobe a cada agente que roda em paralelo. Falta um sistema que:

- guarde o estado do trabalho onde o agente não escreve;
- só despache juntos os trabalhos que não mexem no mesmo lugar;
- junte num lugar só tudo o que espera o humano;
- prove que o trabalho está pronto sem depender da palavra do agente;
- dê papéis diferentes a agentes de fornecedores diferentes.

## Resultado esperado

O Metri conduz a construção do próprio Metri com Claude Code, do pedido ao merge, e só para quando o método pede uma decisão humana: direção, plano, padrões e aceite. No primeiro marco, o release continua à mão. O humano deixa de fazer o papel de scheduler, de quadro e de verificador. Ele decide, e encontra num lugar só tudo o que espera por ele.

Esse é o primeiro marco. Depois vêm usuários de fora fazendo o mesmo nos próprios projetos, com Claude Code e Codex, e por fim o Metri vendido por assento.

## Escopo

O Metri roda na máquina de quem o usa, sobre os agentes que essa pessoa já tem: Claude Code e Codex. Cada um trabalha com o login que a pessoa já fez nele ou com uma chave de API. Os subagentes que eles disparam por conta própria também aparecem no Metri.

O Metri é vendido. Organização, membros e licença ficam no plano de controle, na nuvem, que não recebe nada do conteúdo do projeto.

Código, conhecimento e checks ficam no repositório do projeto. Sem o Metri, o projeto continua correto, e os guardrails continuam rodando no CI dele.

## Fora de escopo

- Loop de agente próprio: o Metri orquestra os agentes que já existem.
- Login de Claude ou de ChatGPT oferecido pelo Metri.
- Conteúdo do projeto (código, plano, conversa) no plano de controle.
