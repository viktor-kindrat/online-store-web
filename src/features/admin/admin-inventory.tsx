'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import type { Paginated, Product, StockBalanceView } from '@/lib/api/types';
import { messageOf } from './use-async-message';

export function AdminInventory() {
  const [balances, setBalances] = useState<StockBalanceView[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [onHand, setOnHand] = useState('0');
  const [error, setError] = useState<string | null>(null);

  async function reload(): Promise<void> {
    try {
      const [loadedBalances, page] = await Promise.all([
        api.get<StockBalanceView[]>('/admin/inventory'),
        api.get<Paginated<Product>>('/products?page=1&limit=100'),
      ]);
      setBalances(loadedBalances);
      setProducts(page.items);
      if (!productId && page.items[0]) {
        setProductId(page.items[0].id);
      }
    } catch (cause) {
      setError(messageOf(cause, 'Failed to load inventory'));
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<StockBalanceView[]>('/admin/inventory'),
      api.get<Paginated<Product>>('/products?page=1&limit=100'),
    ])
      .then(([loadedBalances, page]) => {
        if (!active) {
          return;
        }
        setBalances(loadedBalances);
        setProducts(page.items);
        if (page.items[0]) {
          setProductId(page.items[0].id);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(messageOf(cause, 'Failed to load inventory'));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function nameOf(id: string): string {
    return products.find((product) => product.id === id)?.name ?? id;
  }

  async function adjust(): Promise<void> {
    setError(null);
    try {
      await api.post<void>('/admin/inventory/adjustments', {
        productId,
        onHand: Number(onHand),
      });
      await reload();
    } catch (cause) {
      setError(messageOf(cause, 'Failed to adjust stock'));
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex max-w-xl flex-wrap items-end gap-3">
        <select
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={onHand}
          onChange={(event) => setOnHand(event.target.value)}
          className="w-32 rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <button
          type="button"
          onClick={() => void adjust()}
          className="rounded-md bg-foreground px-4 py-2 text-background"
        >
          Set on hand
        </button>
      </div>
      {error ? <p className="text-red-600">{error}</p> : null}
      <table className="w-full text-left text-sm">
        <thead className="text-black/60 dark:text-white/60">
          <tr>
            <th className="py-2">Product</th>
            <th>On hand</th>
            <th>Reserved</th>
            <th>Available</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10 dark:divide-white/15">
          {balances.map((balance) => (
            <tr key={balance.productId}>
              <td className="py-2">{nameOf(balance.productId)}</td>
              <td>{balance.onHand}</td>
              <td>{balance.reserved}</td>
              <td>{balance.available}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
