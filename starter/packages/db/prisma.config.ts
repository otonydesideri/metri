import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/** SOURCE OF TRUTH: the Prisma config of @metri/db.
 * WHAT: points the Prisma CLI to the multi-file schema in `prisma/`, to the migrations and to the DATABASE_URL of the package's own `.env`.
 * WHY: in Prisma 7 the URL lives here, not in the schema (backend/persistence); a variable already in the environment wins over the `.env`.
 * WHERE: read by every `prisma` command of the package (`generate`, `migrate:dev`, `migrate:deploy`), run by hand and by the app-api e2e setup.
 */
export default defineConfig({
	schema: 'prisma',
	migrations: { path: 'prisma/migrations' },
	datasource: { url: env('DATABASE_URL') },
});
