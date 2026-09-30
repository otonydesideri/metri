import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** SOURCE OF TRUTH: HealthResponseDto, healthResponseSchema.
 * WHAT: the body of `GET /api/health`.
 * WHY: every endpoint declares its response in the API contract, validated on the way out and published in the OpenAPI under the class name (backend/http-api, "Contrato de API: o backend é a fonte").
 * WHERE: used by `HealthController` in `@ZodResponse`; generated for app-web as `HealthResponseDto` in src/api/model.zod.ts.
 */
export const healthResponseSchema = z.object({ status: z.literal('ok') });

export class HealthResponseDto extends createZodDto(healthResponseSchema, {
	codec: true,
}) {}
