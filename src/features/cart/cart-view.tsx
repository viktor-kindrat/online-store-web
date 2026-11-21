'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api/client';
import type { CartView as CartViewModel } from '@/lib/api/types';
import { formatMinor } from '@/lib/utils/money';

export function CartView() {
  const router = useRouter();
  const [cart, setCart] = useState<CartViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<CartViewModel>('/cart')
      .then((loaded) => {
        if (active) {
          setCart(loaded);
        }
      })
      .catch((cause: unknown) => {
        if (cause instanceof ApiError && cause.status === 401) {
          router.push('/login');
          return;
        }
        if (active) {
          setError(
            cause instanceof ApiError ? cause.message : 'Failed to load cart',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function changeQuantity(itemId: string, quantity: number): Promise<void> {
    if (quantity < 1) {
      return;
    }
    setCart(await api.patch<CartViewModel>(`/cart/items/${itemId}`, { quantity }));
  }

  async function removeItem(itemId: string): Promise<void> {
    setCart(await api.del<CartViewModel>(`/cart/items/${itemId}`));
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!cart) {
    return <p>Loading…</p>;
  }
  if (cart.items.length === 0) {
    return <p>Your cart is empty.</p>;
  }

  return (
    <section className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-black/10 dark:divide-white/15">
        {cart.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-3">
            <span className="flex-1">{item.name}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={item.quantity}
              onChange={(event) =>
                void changeQuantity(item.id, Number(event.target.value))
              }
              className="w-20 rounded-md border border-black/15 px-2 py-1 dark:border-white/20"
            />
            <span className="w-24 text-right">
              {formatMinor(item.lineTotalMinor)}
            </span>
            <button
              type="button"
              onClick={() => void removeItem(item.id)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">
          Subtotal: {formatMinor(cart.subtotalMinor)}
        </span>
        <Link
          href="/checkout"
          className="rounded-md bg-foreground px-4 py-2 text-background"
        >
          Checkout
        </Link>
      </div>
    </section>
  );
}
