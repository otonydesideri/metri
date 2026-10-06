/** SOURCE OF TRUTH: the Postgres connector of @metri/db.
 * WHAT: the generated Prisma client and its types, exported as `@metri/db/postgres`.
 * WHY: consumers import the connector, never the generated folder (backend/persistence).
 * WHERE: imported by the `PrismaService` of app-api and by its e2e setup.
 */
export * from './generated/client/client';
