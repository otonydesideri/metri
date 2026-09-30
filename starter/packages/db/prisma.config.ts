import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/** SOURCE OF TRUTH: the Prisma config of @metri/db.
 * WHAT: points the Prisma CLI to the multi-file schema in `prisma/`, to the migrations and to the DATABASE_URL.
 * WHY: in Prisma 7 the URL lives here, not in the schema (backend/persistence, "@metri/db e PrismaService").
 * WHERE: read by every `prisma` command of the package (`generate`, `migrate:dev`, `migrate:deploy`), run by `pnpm db:up` and by the app-api e2e setup.
 * The URL comes from the package `.env` (modeled by `.env.example`) or from the environment, which wins.
 */
export default defineConfig({
	schema: 'prisma',
	migrations: { path: 'prisma/migrations' },
	datasource: { url: process.env.DATABASE_URL },
});
