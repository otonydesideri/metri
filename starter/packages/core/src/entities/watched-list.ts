/** SOURCE OF TRUTH: WatchedList.
 * WHAT: a child collection that tracks its delta: `getNewItems()` and `getRemovedItems()` against the initial items.
 * WHY: the repository saves only what changed in the collection, without rewriting it on every `save()` (domain/watched-list).
 * WHERE: extended by the aggregate's collection, which implements `compareItems` (identity by id or structural).
 * An operation uses `update()` or `add()`/`remove()`, never both.
 */
export abstract class WatchedList<T> {
	private currentItems: T[];
	private readonly initial: T[];
	private newItems: T[];
	private removedItems: T[];

	constructor(initialItems: T[] = []) {
		this.currentItems = initialItems;
		this.initial = initialItems;
		this.newItems = [];
		this.removedItems = [];
	}

	abstract compareItems(a: T, b: T): boolean;

	getItems(): T[] {
		return this.currentItems;
	}

	getNewItems(): T[] {
		return this.newItems;
	}

	getRemovedItems(): T[] {
		return this.removedItems;
	}

	exists(item: T): boolean {
		return this.isCurrentItem(item);
	}

	add(item: T): void {
		if (this.isRemovedItem(item)) {
			this.removeFromRemoved(item);
		}

		if (!this.isNewItem(item) && !this.wasInitialItem(item)) {
			this.newItems.push(item);
		}

		if (!this.isCurrentItem(item)) {
			this.currentItems.push(item);
		}
	}

	remove(item: T): void {
		this.removeFromCurrent(item);

		if (this.isNewItem(item)) {
			this.removeFromNew(item);
			return;
		}

		if (!this.isRemovedItem(item)) {
			this.removedItems.push(item);
		}
	}

	// Full replacement: receives the whole final set, never only the additions; a current item missing from
	// the argument becomes a removal (domain/watched-list).
	update(items: T[]): void {
		const newItems = items.filter(
			(item) =>
				!this.currentItems.some((current) => this.compareItems(item, current)),
		);
		const removedItems = this.currentItems.filter(
			(current) => !items.some((item) => this.compareItems(current, item)),
		);

		this.currentItems = items;
		this.newItems = newItems;
		this.removedItems = removedItems;
	}

	private isCurrentItem(item: T): boolean {
		return this.currentItems.some((current) =>
			this.compareItems(item, current),
		);
	}

	private isNewItem(item: T): boolean {
		return this.newItems.some((current) => this.compareItems(item, current));
	}

	private isRemovedItem(item: T): boolean {
		return this.removedItems.some((current) =>
			this.compareItems(item, current),
		);
	}

	private wasInitialItem(item: T): boolean {
		return this.initial.some((current) => this.compareItems(item, current));
	}

	private removeFromNew(item: T): void {
		this.newItems = this.newItems.filter(
			(current) => !this.compareItems(current, item),
		);
	}

	private removeFromCurrent(item: T): void {
		this.currentItems = this.currentItems.filter(
			(current) => !this.compareItems(current, item),
		);
	}

	private removeFromRemoved(item: T): void {
		this.removedItems = this.removedItems.filter(
			(current) => !this.compareItems(current, item),
		);
	}
}
