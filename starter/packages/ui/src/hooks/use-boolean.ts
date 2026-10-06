import { useCallback, useState } from 'react';

/** SOURCE OF TRUTH: useBoolean.
 * WHAT: a UI boolean as one object: `value`, `onTrue`, `onFalse`, `onToggle` and `setValue`, with stable callbacks.
 * WHY: a UI boolean stays one name, never value and setter in two variables (frontend/state, "useState: estado de um único componente").
 * WHERE: imported by apps from `@metri/ui/hooks/use-boolean`, for the modal, the toggle and the panel a component opens and closes.
 */
export function useBoolean(initialValue = false) {
	const [value, setValue] = useState(initialValue);

	const onTrue = useCallback(() => setValue(true), []);
	const onFalse = useCallback(() => setValue(false), []);
	const onToggle = useCallback(() => setValue((current) => !current), []);

	return { value, onTrue, onFalse, onToggle, setValue };
}
