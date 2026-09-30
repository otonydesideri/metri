/** SOURCE OF TRUTH: ValueObject.
 * WHAT: the value object base: protected constructor, read-only props and structural equality.
 * WHY: a value object has no id and is compared by value (domain/model, "Value objects").
 * WHERE: extended by the value objects of apps/app-api/src/domain/enterprise/value-objects.
 */
export abstract class ValueObject<Props> {
	protected readonly props: Props;

	protected constructor(props: Props) {
		this.props = props;
	}

	equals(vo?: ValueObject<Props>): boolean {
		if (vo === null || vo === undefined) {
			return false;
		}

		if (vo.props === undefined) {
			return false;
		}

		return JSON.stringify(this.props) === JSON.stringify(vo.props);
	}
}
