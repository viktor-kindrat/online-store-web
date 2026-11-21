'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import type { Category } from '@/lib/api/types';
import { messageOf } from './use-async-message';

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function reload(): Promise<void> {
    try {
      setCategories(await api.get<Category[]>('/categories'));
    } catch (cause) {
      setError(messageOf(cause, 'Failed to load categories'));
    }
  }

  useEffect(() => {
    let active = true;
    api
      .get<Category[]>('/categories')
      .then((loaded) => {
        if (active) {
          setCategories(loaded);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(messageOf(cause, 'Failed to load categories'));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function create(): Promise<void> {
    setError(null);
    try {
      await api.post<Category>('/admin/categories', { name, slug });
      setName('');
      setSlug('');
      await reload();
    } catch (cause) {
      setError(messageOf(cause, 'Failed to create category'));
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex max-w-md flex-wrap items-end gap-3">
        <input
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <input
          placeholder="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <button
          type="button"
          onClick={() => void create()}
          className="rounded-md bg-foreground px-4 py-2 text-background"
        >
          Add
        </button>
      </div>
      {error ? <p className="text-red-600">{error}</p> : null}
      <ul className="divide-y divide-black/10 dark:divide-white/15">
        {categories.map((category) => (
          <li key={category.id} className="flex justify-between py-2">
            <span>{category.name}</span>
            <span className="text-black/60 dark:text-white/60">
              {category.slug}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
