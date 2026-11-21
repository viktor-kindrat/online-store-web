'use client';

import { ImageOff, Search } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api/client';
import {
  ProductCardGridSkeleton,
  ProductCardSkeleton,
} from '@/components/ui/skeleton';
import type { Category, Paginated, Product } from '@/lib/api/types';
import { excerpt, toPlainText } from '@/lib/utils/html';
import { mediaUrl } from '@/lib/utils/media';
import { formatMinor } from '@/lib/utils/money';

const PAGE_SIZE = 12;

type SortField = 'name' | 'price';
type SortOrder = 'asc' | 'desc';

const SORT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'name-asc', label: 'Назва: А–Я' },
  { value: 'name-desc', label: 'Назва: Я–А' },
  { value: 'price-asc', label: 'Ціна: від дешевих' },
  { value: 'price-desc', label: 'Ціна: від дорогих' },
];

export function CatalogView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name-asc');

  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [loadedCount, setLoadedCount] = useState(0);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [sortBy, sortOrder] = sort.split('-') as [SortField, SortOrder];

  const buildUrl = useCallback(
    (page: number): string => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy,
        sortOrder,
      });
      if (categoryId) {
        params.set('categoryId', categoryId);
      }
      if (search) {
        params.set('search', search);
      }
      return `/products?${params.toString()}`;
    },
    [categoryId, search, sortBy, sortOrder],
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    api
      .get<Category[]>('/categories')
      .then((loaded) => {
        if (active) {
          setCategories(loaded);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    loadingRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .get<Paginated<Product>>(buildUrl(1))
      .then((result) => {
        if (!active) {
          return;
        }
        setProducts(result.items);
        setTotalPages(result.totalPages);
        setLoadedCount(1);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }
        setProducts([]);
        setLoadedCount(0);
        setTotalPages(1);
        setError(
          cause instanceof ApiError ? cause.message : 'Failed to load products',
        );
      })
      .finally(() => {
        if (!active) {
          return;
        }
        loadingRef.current = false;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [buildUrl]);

  const loadMore = useCallback((): void => {
    if (loadingRef.current || loadedCount === 0) {
      return;
    }
    const page = loadedCount + 1;
    if (page > totalPages) {
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    api
      .get<Paginated<Product>>(buildUrl(page))
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
  }, [loadedCount, totalPages, buildUrl]);

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
  const firstLoading = loading && loadedCount === 0;

  const pillClass = (active: boolean): string =>
    `whitespace-nowrap rounded-full border px-3 py-1 text-sm transition ${
      active
        ? 'border-foreground bg-foreground text-background'
        : 'border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10'
    }`;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-white/40"
              aria-hidden
            />
            <input
              type="search"
              value={searchInput}
              maxLength={200}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Пошук за назвою…"
              aria-label="Пошук товарів"
              className="w-full rounded-md border border-black/15 py-2 pl-9 pr-3 dark:border-white/20"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-black/60 dark:text-white/60">Сортування</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Сортування"
              className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className={pillClass(categoryId === null)}
          >
            Усі товари
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={pillClass(categoryId === category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {error && products.length === 0 ? (
        <p className="text-red-600">{error}</p>
      ) : firstLoading ? (
        <ProductCardGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          Нічого не знайдено за заданими умовами.
        </p>
      ) : (
        <>
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
          {error ? <p className="text-red-600">{error}</p> : null}
          {loading && hasMore ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          ) : null}
          <div ref={sentinelRef} className="h-8" aria-hidden />
        </>
      )}
    </section>
  );
}
