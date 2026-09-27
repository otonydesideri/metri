Gerado por rules-index. Não edite.

| id | description | use_when |
| --- | --- | --- |
| catalog/async-jobs | fila e jobs como capacidade: operação executada fora da request, por job ou tarefa agendada, com contrato de fila, worker, idempotência e dead letter. | uma operação vai para job ou tarefa agendada |
| catalog/cache | cache do backend como capacidade: leitura servida de um mecanismo fora da fonte de verdade, com escopo do dono na chave e falha que degrada para a fonte. | uma leitura do backend tem necessidade medida de cache |
| catalog/design-system | o design system como capacidade: o kit de UI do `@metri/ui` estilizado pelos tokens do `DESIGN.md`, com tema claro e escuro; entra na slice 0 de todo projeto com interface. | o projeto tem interface; montar a slice 0 de um projeto com interface |
| catalog/mail | e-mail como capacidade: envio de e-mail do produto por um vendor, com a classe de infra única e um sender por fluxo. | o projeto envia e-mail |
| catalog/observability | observabilidade operacional como capacidade: métrica, alerta e reconciliação, cada um com a pergunta operacional que o justifica. | uma pergunta operacional pede métrica, alerta ou reconciliação |
| catalog/storage | storage de objetos como capacidade: arquivos e assets do produto em dois buckets por visibilidade, com contrato por asset. | o projeto guarda arquivos ou assets |
