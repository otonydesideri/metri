---
id: <área>/<tema>
description: <o texto do "Dono de": o que a regra decide (METHODOLOGY 7.2)>
use_when: [<situação em que o agente lê a regra>]
applies_to: [<globs>]                  # opcional
keywords: [<SOT keywords>]             # opcional
read_first: [<ids>]                    # opcional
not_covered: ["<tema> → <id>"]         # opcional
enforced_by: [<ids dos checks>]        # opcional
examples: [<arquivos>]                 # opcional
adr: [<ids>]                           # opcional
status: active
---
# <Tema>

<Uma frase de propósito.>

## <Seção temática>

**Obrigatório.** <Norma.>

> **Por quê.** <Motivo, quando não for óbvio.>

- **Exceção.** <Condição>: <efeito> (ADR-NNNN).

## Árvore de decisão

```mermaid
flowchart TD
  Q1{<Pergunta 1>} -->|sim| A[<Caminho A>]
  Q1 -->|não| Q2{<Pergunta 2>}
  Q2 -->|sim| B[<Caminho B>]
  Q2 -->|não| C[<Caminho C>]
```

## Verificação

- <Pergunta de sim ou não que confere a norma>? (check: <id>)

<!-- Exemplo de regra de projeto: .metri/methodology/templates/examples/design-system.md -->
