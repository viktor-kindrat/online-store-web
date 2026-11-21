'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api/client';
import type { CartView, Product } from '@/lib/api/types';
import { formatMinor } from '@/lib/utils/money';

export function ProductDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let active = true;
    api
      .get<Product>(`/products/${params.id}`)
      .then((loaded) => {
        if (active) {
          setProduct(loaded);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof ApiError ? cause.message : 'Not found');
        }
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  async function addToCart(): Promise<void> {
    setMessage(null);
    setError(null);
    try {
      await api.post<CartView>('/cart/items', {
        productId: params.id,
        quantity,
      });
      setMessage('Added to cart');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.push('/login');
        return;
      }
      setError(cause instanceof ApiError ? cause.message : 'Failed to add');
    }
  }

  if (error && !product) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!product) {
    return <p>Loading…</p>;
  }

  return (
    <article className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{product.name}</h1>
      <p className="text-black/70 dark:text-white/70">{product.description}</p>
      <p className="text-xl">{formatMinor(product.priceMinor)}</p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={100}
          value={quantity}
          onChange={(event) =>
            setQuantity(Math.max(1, Number(event.target.value)))
          }
          className="w-20 rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <button
          type="button"
          onClick={() => void addToCart()}
          className="rounded-md bg-foreground px-4 py-2 text-background"
        >
          Add to cart
        </button>
      </div>
      {message ? <p className="text-green-700">{message}</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}
    </article>
  );
}
