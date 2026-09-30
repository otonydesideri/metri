import { useQuery } from '@tanstack/react-query';
import { health } from '@/api/health';
import { healthKeys } from './keys';

/** SOURCE OF TRUTH: useHealth.
 * WHAT: reads the API health, binding the key factory to the generated `health()` (`GET /api/health`).
 * WHY: a page reads server data through a query hook, never by calling the function itself (frontend/data-fetching, "Hooks de query").
 * WHERE: used by `HomeStartPage`.
 */
export function useHealth() {
	return useQuery({
		queryKey: healthKeys.all,
		queryFn: () => health(),
	});
}
