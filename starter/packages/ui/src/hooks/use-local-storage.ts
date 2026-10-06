import { useCallback, useState } from 'react';

/** SOURCE OF TRUTH: useLocalStorage.
 * WHAT: a `useState` that survives refresh: reads the key once on mount and writes every change, serialized as JSON; `state`, `setState` and `resetState`.
 * WHY: a local preference of one component (a dismissed banner, a collapsed section) has one path to storage (frontend/state, "Persistência: o que sobrevive a refresh").
 * WHERE: imported by apps from `@metri/ui/hooks/use-local-storage`. Without `window`, or with storage blocked, it keeps the initial value in memory.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
	const [state, setStoredState] = useState<T>(() =>
		readValue(key, initialValue),
	);

	const setState = useCallback(
		(next: T | ((current: T) => T)) => {
			setStoredState((current) => {
				const value =
					typeof next === 'function'
						? (next as (current: T) => T)(current)
						: next;
				writeValue(key, value);
				return value;
			});
		},
		[key],
	);

	const resetState = useCallback(() => {
		setStoredState(initialValue);
		removeValue(key);
	}, [key, initialValue]);

	return { state, setState, resetState };
}

function readValue<T>(key: string, initialValue: T): T {
	if (typeof window === 'undefined') {
		return initialValue;
	}
	try {
		const raw = window.localStorage.getItem(key);
		return raw === null ? initialValue : (JSON.parse(raw) as T);
	} catch {
		return initialValue;
	}
}

function writeValue<T>(key: string, value: T) {
	if (typeof window === 'undefined') {
		return;
	}
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// storage full or blocked: the value stays in memory for this session
	}
}

function removeValue(key: string) {
	if (typeof window === 'undefined') {
		return;
	}
	try {
		window.localStorage.removeItem(key);
	} catch {
		// storage blocked: nothing was stored
	}
}
