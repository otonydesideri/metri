import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_ROUTE } from './public.decorator';

/** SOURCE OF TRUTH: AccessGuard.
 * WHAT: the global access guard, fail-closed: a route of a `@Public()` controller passes, and every other route is refused with the native 401.
 * WHY: a route without a declaration stays protected; an unidentified request is a native `UnauthorizedException`, never a `DomainError` (backend/access-scope, "Declaração por controller"; backend/errors).
 * WHERE: registered by `APP_GUARD` in `AppModule`, after the throttler.
 * Only the class declaration counts: a handler never opts out of the controller's access.
 * Until the project resolves the "Autenticação" and "Identidade do dono" delegations, no identity exists and only `@Public()` passes; then this guard validates the identity and attaches the owner to the request, and the owner marker enters beside `@Public()`.
 */
@Injectable()
export class AccessGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const isPublic = this.reflector.get<boolean>(
			IS_PUBLIC_ROUTE,
			context.getClass(),
		);

		if (isPublic) {
			return true;
		}

		throw new UnauthorizedException();
	}
}
