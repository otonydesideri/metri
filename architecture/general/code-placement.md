---
id: general/code-placement
description: "o monorepo e a colocação de código entre app e pacote pelo ownership: o que fica no app, o que pode nascer no pacote dono do conceito e a reavaliação da casa quando aparece um segundo consumidor real."
use_when:
  - "decidir em que app ou pacote um código novo mora"
  - "promover código de um app para um pacote compartilhado"
status: active
---
# Colocação de código

## Monorepo: apps e pacotes

`apps/` contém aplicações executáveis; `packages/` contém código compartilhado. A lista de apps e pacotes, com o papel de cada um, é decisão de projeto (`docs/architecture/INDEX.md`, "Matriz de delegações").

### Código pode nascer no pacote dono quando nada nele é do app

O critério de colocação é ownership — o que o código conhece e de quem ele é —, não quantos apps o consomem hoje: quem conhece um módulo mora com o módulo, e quem conhece este app (uma regra, um formato, uma tela dele) mora nas casas do app.

Quando o ownership compartilhado do artefato não é inequívoco: **Padrão.** Ele permanece no app que é dono dele.

Quando o artefato é uma capacidade claramente compartilhada, com ownership próprio e independente do app (função pura agnóstica em `@metri/utils`; helper, hook e componente de UI em `@metri/ui`; vocabulário de erro em `@metri/core/errors`; contrato de API que frontend e backend consomem, `backend/http-api.md`): **Permitido.** Ele nascer no pacote dono do conceito, mesmo com um consumidor atual só.

**Proibido.** Promover porque talvez seja reutilizado no futuro.

**Proibido.** Pacote catch-all que junte domínios diferentes, inclusive `@metri/contracts` como agregador global de contratos.

Quando aparece um segundo consumidor real: **Obrigatório.** Reavaliar a casa pelo critério de ownership. O segundo consumidor é gatilho de reavaliação, não promoção automática; o que sobe leva a decisão registrada na casa de `methodology/authoring.md`, "Decisões específicas de projeto".

A reavaliação percorre esta árvore, sempre pelo ownership:

```txt
1. O artefato conhece este app (uma regra, um formato, uma tela) ou um módulo dele?
   ├─ SIM → fica no app
   └─ NÃO → passo 2

2. Os apps que o consomem usam a MESMA coisa?
   (mesma assinatura, mesmo comportamento esperado)
   ├─ NÃO → cada app implementa o seu; não é compartilhado de fato
   └─ SIM → passo 3

3. Existe uma capacidade compartilhada com dono claro, independente do app?
   (contrato entre apps; infraestrutura técnica reutilizável; componente de UI;
   helper puro agnóstico de domínio; config de tooling)
   ├─ SIM → packages/, no pacote dono do conceito
   └─ NÃO → fica no app; parar e perguntar se parece compartilhado
```
