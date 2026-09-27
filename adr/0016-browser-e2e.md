# ADR-0016 E2e de browser

status: proposed
area: frontend
kind: decision

## Contexto

Não existe runner de browser no monorepo. O nível 5 já prova as sequências multi-tela pela árvore real de rotas, e o backend já prova o servidor com banco real, então o que falta é só o que exige um browser de verdade: cookie entre origens, redirect real de serviço externo, propagação de estado entre abas. Adotar isso é decisão maior que qualquer feature, porque traz seed de banco, provisionamento de usuário de teste e execução em CI. Enquanto não fechar, comportamento que só um browser prova fica sem teste automatizado e é verificado à mão.

## Decisão

A decidir.
