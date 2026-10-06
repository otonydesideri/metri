import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/** SOURCE OF TRUTH: the Prisma config of the Postgres connector of @metri/db.
 * WHAT: points the Prisma CLI to the multi-file schema in `models/`, to `migrations/` and to the DATABASE_URL of the package's own `.env`.
 * WHY: one folder per data connector under `src/`, with its config, schema and migrations inside it (backend/persistence); in Prisma 7 the URL lives here, not in the schema, and a variable already in the environment wins over the `.env`.
 * WHERE: passed by `--config` to every `prisma` command of the package (`generate`, `migrate:dev`, `migrate:deploy`), run by hand and by the app-api e2e setup.
 */
export default defineConfig({
	schema: 'models',
	migrations: {
		path: 'migrations',
	},
	datasource: {
		url: env('DATABASE_URL'),
	},
});
