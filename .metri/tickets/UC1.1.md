---
id: UC1.1
title: Abrir um projeto que já usa o método
feature: F1
actor: humano
status: draft
---

# UC1.1 · Abrir um projeto que já usa o método

Como humano, quero abrir no Metri um repositório que já usa o método, para conduzir o trabalho dele por lá.

## Regras de negócio

- BR1: Um projeto é um repositório git com branch padrão (a que o `origin/HEAD` aponta) e com o método instalado: o pacote `metri` em `node_modules` e a arquitetura do projeto em `.metri/`. A versão do método é a do pacote instalado.
- BR2: Abrir um projeto não copia, não cria e não altera nenhum arquivo do repositório.

## Critérios

- [ ] Dado um repositório git com branch padrão e com o método instalado, quando o humano o abre, então ele entra na lista de projetos com a pasta, a branch padrão e a versão do método.
- [ ] Uma pasta que não é repositório git é recusada, e o motivo aparece junto do campo da pasta.
- [ ] Um repositório sem branch padrão é recusado com o motivo.
- [ ] Um repositório sem o método instalado é recusado, e a mensagem diz que falta rodar o `metri init`.
- [ ] Um repositório com `.metri/` mas sem o pacote `metri` instalado é recusado, e a mensagem diz que falta instalar as dependências.
- [ ] Depois de abrir o projeto, o `git status` do repositório não mostra nenhuma mudança.
- [ ] Tela: sem projetos, a tela de Projetos diz que ainda não há projeto e oferece a ação de abrir um.

## Notas
