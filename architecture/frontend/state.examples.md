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
import { orderStatusSchema } from '@metri/<pacote-dono>';
import { useSearchParams } from 'react-router';

export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // query string é entrada do usuário: valida antes de virar filtro
  const statusParam = orderStatusSchema.safeParse(searchParams.get('status'));
  const status = statusParam.success ? statusParam.data : undefined;
  const search = searchParams.get('q') ?? undefined;
  const page = Number(searchParams.get('page') ?? '1');

  // recorte novo invalida a página atual: todo setter de recorte passa aqui
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
