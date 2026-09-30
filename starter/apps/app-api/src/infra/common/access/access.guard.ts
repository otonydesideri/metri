import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_ROUTE } from './public.decorator';

/** SOURCE OF TRUTH: AccessGuard.
 * WHAT: the global access guard, fail-closed: a `@Public()` route passes, and every other route is refused with the native 401.
 * WHY: a route without a declaration stays protected; an unidentified request is a native `UnauthorizedException`, never a `DomainError` (backend/access-scope, "Declaração por controller"; backend/errors).
 * WHERE: registered by `APP_GUARD` in `AppModule`, after the throttler.
 * Until the project decides its authentication (the "Autenticação" delegation), no identity exists and only `@Public()` passes; then this guard validates the identity, attaches the owner to the request and the owner marker enters beside `@Public()`.
 */
@Injectable()
export class AccessGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const isPublic = this.reflector.getAllAndOverride<boolean>(
			IS_PUBLIC_ROUTE,
			[context.getHandler(), context.getClass()],
		);

		if (isPublic) {
			return true;
		}

		throw new UnauthorizedException();
	}
}
