// The isolated database of each e2e file (backend/testing, "Convenção de nome e execução"): before the file,
// creates on the Postgres server of DATABASE_URL a new database named after the project's one, never a schema in
// the same database, applies the @metri/db migrations to it and points the process DATABASE_URL at it, so the file's
// AppModule connects there (the ConfigModule never overrides a variable already in the environment); after the file, drops it. The only file outside infra/persistence/prisma that
// imports @metri/db (backend/boundaries).

import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@metri/db/postgres/app';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll } from 'vitest';

const serverUrl = process.env.DATABASE_URL;
if (!serverUrl) {
	throw new Error(
		'DATABASE_URL ausente: o e2e cria o banco de cada arquivo no Postgres dele (o .env do app-api, que o metri init cria do .env.example)',
	);
}

const databaseUrl = new URL(serverUrl);
const databaseName = `${databaseUrl.pathname.slice(1)}_e2e_${randomUUID().replaceAll('-', '')}`;
databaseUrl.pathname = `/${databaseName}`;
// the server's maintenance database: the project's one need not exist
const maintenanceUrl = new URL(serverUrl);
maintenanceUrl.pathname = '/postgres';

const server = new PrismaClient({
	adapter: new PrismaPg({ connectionString: maintenanceUrl.toString() }),
});

// an identifier is not a parameter: the name enters the SQL quoted
await server.$executeRaw`CREATE DATABASE ${Prisma.raw(`"${databaseName}"`)}`;

execFileSync('pnpm', ['--silent', '--filter', '@metri/db', 'migrate:deploy'], {
	env: {
		...process.env,
		DATABASE_URL: databaseUrl.toString(),
		PRISMA_HIDE_UPDATE_MESSAGE: '1',
	},
	stdio: 'pipe',
});

process.env.DATABASE_URL = databaseUrl.toString();

afterAll(async () => {
	await server.$executeRaw`DROP DATABASE IF EXISTS ${Prisma.raw(`"${databaseName}"`)} WITH (FORCE)`;
	await server.$disconnect();
});
