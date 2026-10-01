// The OpenAPI generator of app-api (backend/http-api, "Contrato de API: o backend é a fonte"): mounts `AppModule`
// in `preview` (the module graph without instantiating providers, so no database and no env), with the same `/api`
// prefix as main.ts, and writes apps/app-api/openapi.json from `createOpenApiDocument`. It runs from the build,
// because the decorator metadata comes from it, through the root `pnpm api:generate`, which then runs the app-web
// Orval on the file; `pnpm verify` runs the same command and fails when openapi.json or app-web's src/api change
// (`api:drift`).

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { createOpenApiDocument } from './infra/http/openapi-document';

const OPENAPI_PATH = resolve(import.meta.dirname, '../openapi.json');

async function generate(): Promise<void> {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
		{ preview: true, logger: false },
	);
	app.setGlobalPrefix('api');

	writeFileSync(
		OPENAPI_PATH,
		`${JSON.stringify(createOpenApiDocument(app), null, 2)}\n`,
	);
	await app.close();
}

void generate();
