/** SOURCE OF TRUTH: healthKeys.
 * WHAT: the query keys of the health module.
 * WHY: each module's keys come from one factory (frontend/data-fetching, "A key factory").
 * WHERE: read by `useHealth`.
 */
export const healthKeys = {
	all: ['health'] as const,
};
