'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import type { DiscountType, Promotion } from '@/lib/api/types';
import { formatMinor } from '@/lib/utils/money';
import { messageOf } from './use-async-message';

export function AdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [value, setValue] = useState('10');
  const [minOrderMinor, setMinOrderMinor] = useState('0');
  const [usageLimit, setUsageLimit] = useState('100');
  const [expiresAt, setExpiresAt] = useState('2030-01-01');
  const [error, setError] = useState<string | null>(null);

  async function reload(): Promise<void> {
    try {
      setPromotions(await api.get<Promotion[]>('/admin/promotions'));
    } catch (cause) {
      setError(messageOf(cause, 'Failed to load promotions'));
    }
  }

  useEffect(() => {
    let active = true;
    api
      .get<Promotion[]>('/admin/promotions')
      .then((loaded) => {
        if (active) {
          setPromotions(loaded);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(messageOf(cause, 'Failed to load promotions'));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function create(): Promise<void> {
    setError(null);
    try {
      await api.post<Promotion>('/admin/promotions', {
        code,
        discountType,
        value: Number(value),
        minOrderMinor: Number(minOrderMinor),
        usageLimit: Number(usageLimit),
        expiresAt: new Date(expiresAt).toISOString(),
      });
      setCode('');
      await reload();
    } catch (cause) {
      setError(messageOf(cause, 'Failed to create promotion'));
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex max-w-4xl flex-wrap items-end gap-3">
        <input
          placeholder="CODE"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="w-32 rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <select
          value={discountType}
          onChange={(event) => setDiscountType(event.target.value as DiscountType)}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        >
          <option value="PERCENTAGE">PERCENTAGE</option>
          <option value="FIXED_AMOUNT">FIXED_AMOUNT</option>
        </select>
        <input
          type="number"
          placeholder="value"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-24 rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <input
          type="number"
          placeholder="min order (minor)"
          value={minOrderMinor}
          onChange={(event) => setMinOrderMinor(event.target.value)}
          className="w-32 rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <input
          type="number"
          placeholder="usage limit"
          value={usageLimit}
          onChange={(event) => setUsageLimit(event.target.value)}
          className="w-28 rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <input
          type="date"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
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
            <th className="py-2">Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Min order</th>
            <th>Limit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10 dark:divide-white/15">
          {promotions.map((promotion) => (
            <tr key={promotion.id}>
              <td className="py-2 font-mono">{promotion.code}</td>
              <td>{promotion.discountType}</td>
              <td>
                {promotion.discountType === 'PERCENTAGE'
                  ? `${promotion.value}%`
                  : formatMinor(promotion.value)}
              </td>
              <td>{formatMinor(promotion.minOrderMinor)}</td>
              <td>{promotion.usageLimit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
