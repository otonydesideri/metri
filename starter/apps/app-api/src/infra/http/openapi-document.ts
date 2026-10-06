import type { INestApplication } from '@nestjs/common';
import {
	DocumentBuilder,
	type OpenAPIObject,
	SwaggerModule,
} from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

// `CreateOrderController` → `createOrder`: the name of the generated function in app-web
function operationIdFactory(controllerKey: string): string {
	const name = controllerKey.replace(/Controller$/, '');
	return name.charAt(0).toLowerCase() + name.slice(1);
}

/** SOURCE OF TRUTH: createOpenApiDocument.
 * WHAT: the OpenAPI 3.1 document of app-api, read from the Zod DTOs of the mounted app, one operationId per controller.
 * WHY: the contract file and the docs page come from one document, so the page shows what `api:generate` writes (backend/http-api, "Contrato de API: o backend é a fonte"). OpenAPI 3.1: the `.nullable()` of Zod 4 comes out as `type: [..., "null"]`, valid only from 3.1 on, and Orval refuses it in 3.0.
 * WHERE: called by openapi.ts, which writes openapi.json, and by main.ts, which serves the page at `/api/docs` outside production.
 */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
	const config = new DocumentBuilder()
		.setTitle('__PROJECT__ API')
		.setVersion('1.0.0')
		.setOpenAPIVersion('3.1.0')
		.build();
	const document = SwaggerModule.createDocument(app, config, {
		operationIdFactory,
	});
	return cleanupOpenApiDoc(document);
}
