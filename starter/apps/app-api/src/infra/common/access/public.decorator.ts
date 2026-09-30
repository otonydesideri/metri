import { SetMetadata } from '@nestjs/common';

/** SOURCE OF TRUTH: Public, IS_PUBLIC_ROUTE.
 * WHAT: marks a controller as having no data owner and needing no identity: `AccessGuard` lets it through.
 * WHY: every controller declares its access in the file, where review and the check see it (backend/access-scope, "Declaração por controller").
 * WHERE: on the class of each public controller (`HealthController`); `scripts/check-access-boundaries.sh` fails for a controller without it or the owner marker.
 */
export const IS_PUBLIC_ROUTE = 'isPublicRoute';

export const Public = () => SetMetadata(IS_PUBLIC_ROUTE, true);
