import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ZodResponse } from 'nestjs-zod';
import { Public } from '../common/access/public.decorator';
import { HealthResponseDto } from '../http/dtos/health/health-response.dto';
import { DatabaseHealth } from './database-health';

/** SOURCE OF TRUTH: HealthController.
 * WHAT: `GET /api/health` answers 200 while the process serves requests, with `database` saying whether the Postgres answers.
 * WHY: an endpoint of external infra (probe, monitor): out of the rate limit and of the access guard, in its own module (infrastructure/runtime, "Composição no `AppModule`"). The database off is a state of the answer, not an error, so the probe and the start page still read it.
 * WHERE: registered by `HealthModule`; read by the probe, by the app-web start page and by the Playwright `webServer`.
 */
@ApiTags('health')
@SkipThrottle()
@Public()
@Controller('health')
export class HealthController {
	constructor(private readonly databaseHealth: DatabaseHealth) {}

	@Get()
	@ZodResponse({ status: 200, type: HealthResponseDto })
	async check(): Promise<HealthResponseDto> {
		const isDatabaseUp = await this.databaseHealth.isUp();
		return { status: 'ok', database: isDatabaseUp ? 'up' : 'down' };
	}
}
