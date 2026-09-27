Gerado por rules-index. Não edite.

| id | description | use_when |
| --- | --- | --- |
| defaults/stack | a stack e o idioma do código, lista única das ferramentas que as regras exigem: monorepo pnpm workspaces + Turborepo e Biome; no backend, NestJS sobre Fastify com Prisma/Postgres, Zod, log, rate limit, fila e e-mail; no frontend, React + Vite, roteamento, dado do servidor, cliente HTTP, formulário, UI, tema e estado global; nos testes, Vitest, supertest, dados de teste e o ambiente de interface. | escolher ferramenta de backend, frontend, validação, lint/format ou testes; decidir o idioma do código, da documentação, dos comentários ou das mensagens de erro |
| defaults/ui | o kit de UI padrão — shadcn/ui dentro do `@metri/ui`; como um componente entra (CLI do shadcn no pacote) e como ganha a forma compound (re-export, sem editar o arquivo gerado); o ajuste visual pelo token; os tokens como CSS variables de tema, em claro e escuro; o que é do projeto. | adicionar ou atualizar um componente do shadcn no `@metri/ui`; expor um primitivo do `@metri/ui` em compound; ajustar o visual de um componente do `@metri/ui`; mexer nas CSS variables de tema do `@metri/ui` |
