'use client';

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'store.cart.v1';
export const MAX_LINE_QUANTITY = 99;

export interface CartLine {
  productId: string;
  name: string;
  unitPriceMinor: number;
  quantity: number;
  imageUrl: string | null;
}

export interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalMinor: number;
  ready: boolean;
  addItem: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const SERVER_SNAPSHOT: CartLine[] = [];
const listeners = new Set<() => void>();
let currentLines: CartLine[] = SERVER_SNAPSHOT;
let hydrated = false;

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return 1;
  }
  return Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.floor(quantity)));
}

function parseLines(raw: string | null): CartLine[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((entry): entry is Record<string, unknown> => {
        if (typeof entry !== 'object' || entry === null) {
          return false;
        }
        const line = entry as Record<string, unknown>;
        return (
          typeof line.productId === 'string' &&
          typeof line.name === 'string' &&
          typeof line.unitPriceMinor === 'number' &&
          typeof line.quantity === 'number'
        );
      })
      .map((line) => ({
        productId: line.productId as string,
        name: line.name as string,
        unitPriceMinor: line.unitPriceMinor as number,
        quantity: clampQuantity(line.quantity as number),
        imageUrl: typeof line.imageUrl === 'string' ? line.imageUrl : null,
      }));
  } catch {
    return [];
  }
}

function ensureHydrated(): void {
  if (hydrated || typeof window === 'undefined') {
    return;
  }
  currentLines = parseLines(window.localStorage.getItem(STORAGE_KEY));
  hydrated = true;
}

function persist(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLines));
  } catch {
    // storage unavailable (private mode) — cart stays in memory for this session
  }
}

function commit(next: CartLine[]): void {
  currentLines = next;
  hydrated = true;
  persist();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY) {
      currentLines = parseLines(event.newValue);
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): CartLine[] {
  ensureHydrated();
  return currentLines;
}

function getServerSnapshot(): CartLine[] {
  return SERVER_SNAPSHOT;
}

export function addItem(
  line: Omit<CartLine, 'quantity'>,
  quantity = 1,
): void {
  ensureHydrated();
  const existing = currentLines.find((l) => l.productId === line.productId);
  if (existing) {
    commit(
      currentLines.map((l) =>
        l.productId === line.productId
          ? { ...l, quantity: clampQuantity(l.quantity + quantity) }
          : l,
      ),
    );
    return;
  }
  commit([...currentLines, { ...line, quantity: clampQuantity(quantity) }]);
}

export function setQuantity(productId: string, quantity: number): void {
  ensureHydrated();
  commit(
    currentLines.map((l) =>
      l.productId === productId
        ? { ...l, quantity: clampQuantity(quantity) }
        : l,
    ),
  );
}

export function removeItem(productId: string): void {
  ensureHydrated();
  commit(currentLines.filter((l) => l.productId !== productId));
}

export function clearCart(): void {
  commit([]);
}

export function useCart(): CartContextValue {
  const lines = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotalMinor = lines.reduce(
    (sum, l) => sum + l.unitPriceMinor * l.quantity,
    0,
  );
  return {
    lines,
    count,
    subtotalMinor,
    ready,
    addItem,
    setQuantity,
    removeItem,
    clear: clearCart,
  };
}
