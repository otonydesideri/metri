# Estado cliente no frontend: exemplos

## OrderDetailsTabs

```tsx
import { useSearchParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@metri/ui/components/ui/tabs';

export function OrderDetailsTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'details';

  function handleTabChange(value: string) {
    setSearchParams(
      (params) => {
        params.set('tab', value);
        return params;
      },
      { replace: true },
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="details">Detalhes</TabsTrigger>
        <TabsTrigger value="items">Itens</TabsTrigger>
        <TabsTrigger value="payments">Pagamentos</TabsTrigger>
      </TabsList>
      <TabsContent value="details">{/* ... */}</TabsContent>
      <TabsContent value="items">{/* ... */}</TabsContent>
      <TabsContent value="payments">{/* ... */}</TabsContent>
    </Tabs>
  );
}
```

## useListParams

```ts
// pages/order/list/use-list-params.ts
import { OrderStatus } from '@/api/model.zod';
import { useSearchParams } from 'react-router';

export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // the query string is user input: validate it before it becomes a filter
  const statusParam = OrderStatus.safeParse(searchParams.get('status'));
  const status = statusParam.success ? statusParam.data : undefined;
  const search = searchParams.get('q') ?? undefined;
  const pageParam = Number(searchParams.get('page'));
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 1;

  // a new filter invalidates the current page: every filter setter goes through here
  function updateResettingPage(mutate: (params: URLSearchParams) => void) {
    setSearchParams((params) => {
      mutate(params);
      params.delete('page');
      return params;
    });
  }

  function setStatus(value: string) {
    updateResettingPage((params) => {
      if (value === 'all') {
        params.delete('status');
      } else {
        params.set('status', value);
      }
    });
  }

  function setPage(nextPage: number) {
    setSearchParams((params) => {
      params.set('page', String(nextPage));
      return params;
    });
  }

  return { status, search, page, setStatus, setPage };
}
```

## OrderWizardProvider

```tsx
// shared/contexts/order-wizard.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

type WizardStep = 'customer' | 'items' | 'shipping' | 'review';

interface WizardData {
  customerId?: string;
  items?: Array<{ productId: string; quantity: number }>;
  shippingAddress?: { street: string; city: string; postalCode: string };
}

interface OrderWizardContextValue {
  currentStep: WizardStep;
  data: WizardData;
  goToStep: (step: WizardStep) => void;
  updateData: (partial: Partial<WizardData>) => void;
  reset: () => void;
}

const OrderWizardContext = createContext<OrderWizardContextValue | null>(null);

export function OrderWizardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('customer');
  const [data, setData] = useState<WizardData>({});

  function goToStep(step: WizardStep) {
    setCurrentStep(step);
  }

  function updateData(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function reset() {
    setCurrentStep('customer');
    setData({});
  }

  return (
    <OrderWizardContext.Provider value={{ currentStep, data, goToStep, updateData, reset }}>
      {children}
    </OrderWizardContext.Provider>
  );
}

export function useOrderWizard() {
  const context = useContext(OrderWizardContext);
  if (!context) {
    throw new Error('useOrderWizard precisa estar dentro de OrderWizardProvider');
  }
  return context;
}
```

## useCartStore

```ts
// shared/stores/cart.ts
import { create } from 'zustand';

interface CartItem {
  productId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
  clear: () => set({ items: [] }),
}));
```

## useBoolean

```ts title="packages/ui/src/hooks/use-boolean.ts"
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
```

## useLocalStorage

```ts title="packages/ui/src/hooks/use-local-storage.ts"
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
```
