'use client';

import { ImageOff } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api/client';
import {
  ProductCardGridSkeleton,
  ProductCardSkeleton,
} from '@/components/ui/skeleton';
import type { Paginated, Product } from '@/lib/api/types';
import { excerpt, toPlainText } from '@/lib/utils/html';
import { mediaUrl } from '@/lib/utils/media';
import { formatMinor } from '@/lib/utils/money';

const PAGE_SIZE = 12;

export function CatalogView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [loadedCount, setLoadedCount] = useState(0);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback((): void => {
    if (loadingRef.current) {
      return;
    }
    const page = loadedCount + 1;
    if (page > totalPages) {
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    api
      .get<Paginated<Product>>(`/products?page=${page}&limit=${PAGE_SIZE}`)
      .then((result) => {
        setProducts((current) => [...current, ...result.items]);
        setTotalPages(result.totalPages);
        setLoadedCount(page);
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof ApiError ? cause.message : 'Failed to load products',
        );
      })
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
      });
  }, [loadedCount, totalPages]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadMore();
      }
    });
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  const hasMore = loadedCount < totalPages;

  if (error && products.length === 0) {
    return <p className="text-red-600">{error}</p>;
  }
  if (loading && products.length === 0) {
    return <ProductCardGridSkeleton count={6} />;
  }
  if (!loading && !hasMore && products.length === 0) {
    return <p>No products yet.</p>;
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const image = mediaUrl(product.primaryImageUrl);
          return (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="flex flex-col overflow-hidden rounded-lg border border-black/10 transition hover:shadow-md dark:border-white/15"
            >
              <div className="aspect-square w-full overflow-hidden bg-black/5 dark:bg-white/10">
                {image ? (
                  <img
                    src={image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-sm text-black/40 dark:text-white/40">
                    <ImageOff className="size-6" aria-hidden />
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="font-medium">{product.name}</h2>
                <p className="flex-1 text-sm text-black/60 dark:text-white/60">
                  {excerpt(toPlainText(product.description), 110)}
                </p>
                <p className="text-lg">{formatMinor(product.priceMinor)}</p>
              </div>
            </Link>
          );
        })}
      </div>
      {error && products.length > 0 ? (
        <p className="text-red-600">{error}</p>
      ) : null}
      {loading && products.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      ) : null}
      <div ref={sentinelRef} className="h-8" aria-hidden />
    </section>
  );
}
