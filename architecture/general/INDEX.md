Gerado por rules-index. Não edite.

| id | description | use_when |
| --- | --- | --- |
| general/code-placement | o monorepo, com o layout e os nomes padrão dos apps e pacotes, e a colocação de código entre app e pacote pelo ownership: o que fica no app, o que pode nascer no pacote dono do conceito e a reavaliação da casa quando aparece um segundo consumidor real. | decidir em que app ou pacote um código novo mora; criar app ou pacote no monorepo; promover código de um app para um pacote compartilhado |
| general/http-surface | a superfície HTTP same-origin sob `/api`: SPA em `/` e a API em `/api/*`, sem CORS nem URL de API em variável de ambiente, e a decisão explícita antes de expor o backend num host próprio. | expor o backend fora de `/api` ou num host próprio; criar endpoint novo |
| general/principles | os princípios não negociáveis gerais: abstração só onde paga o custo; default silencioso só onde a ausência é caso real. | criar contrato ou abstração; escrever `?? valor`, `\|\| valor` ou parâmetro default |
