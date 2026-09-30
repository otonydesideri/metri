import { Entity } from './entity';

/** SOURCE OF TRUTH: AggregateRoot.
 * WHAT: the aggregate root, an `Entity` the repository loads and saves as a whole.
 * WHY: the aggregate is the unit of consistency and of mutation (domain/model, "Agregado e mutação interna").
 * WHERE: extended by each aggregate of apps/app-api/src/domain/enterprise.
 */
export abstract class AggregateRoot<Props> extends Entity<Props> {}
