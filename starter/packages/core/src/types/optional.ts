/** SOURCE OF TRUTH: Optional.
 * WHAT: makes optional only the listed keys of a type, keeping the others required.
 * WHY: `create()` of an aggregate receives `Optional<Props, ...>`, with the props that have a default marked optional (domain/model).
 * WHERE: the `create()` signature of the aggregates in apps/app-api/src/domain/enterprise.
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
