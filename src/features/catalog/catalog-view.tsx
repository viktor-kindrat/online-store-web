'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api/client';
import type { Paginated, Product } from '@/lib/api/types';
import { formatMinor } from '@/lib/utils/money';

export function CatalogView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<Paginated<Product>>('/products?page=1&limit=50')
      .then((page) => {
        if (active) {
          setProducts(page.items);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof ApiError ? cause.message : 'Failed to load products',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p>Loading…</p>;
  }
  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (products.length === 0) {
    return <p>No products yet.</p>;
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className="rounded-lg border border-black/10 p-4 transition hover:shadow-md dark:border-white/15"
        >
          <h2 className="font-medium">{product.name}</h2>
          <p className="mt-2 text-lg">{formatMinor(product.priceMinor)}</p>
        </Link>
      ))}
    </section>
  );
}
