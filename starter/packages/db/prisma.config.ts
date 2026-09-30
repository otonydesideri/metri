import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// The project's one DATABASE_URL is in the root .env; a variable already in the environment wins.
const ENV_FILE = new URL('../../.env', import.meta.url);
if (existsSync(ENV_FILE)) {
	process.loadEnvFile(ENV_FILE);
}

/** SOURCE OF TRUTH: the Prisma config of @metri/db.
 * WHAT: points the Prisma CLI to the multi-file schema in `prisma/`, to the migrations and to the DATABASE_URL.
 * WHY: in Prisma 7 the URL lives here, not in the schema (backend/persistence, "Aplicação").
 * WHERE: read by every `prisma` command of the package (`generate`, `migrate:dev`, `migrate:deploy`), run by `pnpm db:up` and by the app-api e2e setup.
 */
export default defineConfig({
	schema: 'prisma',
	migrations: { path: 'prisma/migrations' },
	datasource: { url: process.env.DATABASE_URL },
});
