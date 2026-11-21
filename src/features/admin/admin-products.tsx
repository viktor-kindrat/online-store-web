'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import type { Category, Paginated, Product } from '@/lib/api/types';
import { formatMinor } from '@/lib/utils/money';
import { messageOf } from './use-async-message';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceMinor, setPriceMinor] = useState('0');
  const [error, setError] = useState<string | null>(null);

  async function reload(): Promise<void> {
    try {
      const [page, loadedCategories] = await Promise.all([
        api.get<Paginated<Product>>('/products?page=1&limit=100'),
        api.get<Category[]>('/categories'),
      ]);
      setProducts(page.items);
      setCategories(loadedCategories);
      if (!categoryId && loadedCategories[0]) {
        setCategoryId(loadedCategories[0].id);
      }
    } catch (cause) {
      setError(messageOf(cause, 'Failed to load products'));
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<Paginated<Product>>('/products?page=1&limit=100'),
      api.get<Category[]>('/categories'),
    ])
      .then(([page, loadedCategories]) => {
        if (!active) {
          return;
        }
        setProducts(page.items);
        setCategories(loadedCategories);
        if (loadedCategories[0]) {
          setCategoryId(loadedCategories[0].id);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(messageOf(cause, 'Failed to load products'));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function create(): Promise<void> {
    setError(null);
    try {
      await api.post<Product>('/admin/products', {
        categoryId,
        name,
        description,
        priceMinor: Number(priceMinor),
      });
      setName('');
      setDescription('');
      setPriceMinor('0');
      await reload();
    } catch (cause) {
      setError(messageOf(cause, 'Failed to create product'));
    }
  }

  async function archive(id: string): Promise<void> {
    setError(null);
    try {
      await api.del<void>(`/admin/products/${id}`);
      await reload();
    } catch (cause) {
      setError(messageOf(cause, 'Failed to archive product'));
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex max-w-3xl flex-wrap items-end gap-3">
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <input
          type="number"
          placeholder="Price (minor)"
          value={priceMinor}
          onChange={(event) => setPriceMinor(event.target.value)}
          className="w-36 rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <button
          type="button"
          onClick={() => void create()}
          className="rounded-md bg-foreground px-4 py-2 text-background"
        >
          Create
        </button>
      </div>
      {error ? <p className="text-red-600">{error}</p> : null}
      <table className="w-full text-left text-sm">
        <thead className="text-black/60 dark:text-white/60">
          <tr>
            <th className="py-2">Name</th>
            <th>Price</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10 dark:divide-white/15">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="py-2">{product.name}</td>
              <td>{formatMinor(product.priceMinor)}</td>
              <td>{product.status}</td>
              <td className="text-right">
                <button
                  type="button"
                  onClick={() => void archive(product.id)}
                  className="rounded-md border border-black/15 px-3 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  Archive
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
