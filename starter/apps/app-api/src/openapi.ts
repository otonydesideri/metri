// The OpenAPI generator of app-api (backend/http-api, "Contrato de API: o backend é a fonte"): mounts `AppModule`
// in `preview` (the module graph without instantiating providers, so no database and no env), with the same `/api`
// prefix as main.ts, and writes apps/app-api/openapi.json from the Zod DTOs. It runs from the build, because the
// decorator metadata comes from it, through the root `pnpm api:generate`, which then runs the app-web Orval on the
// file; `pnpm verify` runs the same command and fails when openapi.json or app-web's src/api change (`api:drift`).
// OpenAPI 3.1: the `.nullable()` of Zod 4 comes out as `type: [..., "null"]`, valid only from 3.1 on, and Orval
// refuses it in 3.0.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';

const OPENAPI_PATH = resolve(import.meta.dirname, '../openapi.json');

// `CreateOrderController` → `createOrder`: the name of the generated function in app-web
function operationIdFactory(controllerKey: string): string {
	const name = controllerKey.replace(/Controller$/, '');
	return name.charAt(0).toLowerCase() + name.slice(1);
}

async function generate(): Promise<void> {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
		{ preview: true, logger: false },
	);
	app.setGlobalPrefix('api');

	const config = new DocumentBuilder()
		.setTitle('__PROJECT__ API')
		.setVersion('1.0.0')
		.setOpenAPIVersion('3.1.0')
		.build();
	const document = SwaggerModule.createDocument(app, config, {
		operationIdFactory,
	});

	writeFileSync(
		OPENAPI_PATH,
		`${JSON.stringify(cleanupOpenApiDoc(document), null, 2)}\n`,
	);
	await app.close();
}

void generate();
