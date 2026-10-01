/** SOURCE OF TRUTH: EventHandler.
 * WHAT: the contract a subscriber class implements: `setupSubscriptions()`, called once, that registers the subscriber's callback on `DomainEvents`.
 * WHY: construction and subscription are the same step — the Nest DI instantiates the subscriber once, at boot (backend/events, "Subscriber").
 * WHERE: implemented by each `On<Evento>Subscriber` of apps/app-api/src/infra/events.
 */
export interface EventHandler {
	setupSubscriptions(): void;
}
