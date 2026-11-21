'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import type {
  RevenueReport,
  SalesByCategoryRow,
  TopProductRow,
} from '@/lib/api/types';
import { formatMinor } from '@/lib/utils/money';
import { messageOf } from './use-async-message';

export function AdminReports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [byCategory, setByCategory] = useState<SalesByCategoryRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<SalesByCategoryRow[]>('/admin/reports/sales-by-category'),
      api.get<TopProductRow[]>('/admin/reports/top-products?limit=10'),
    ])
      .then(([categories, products]) => {
        if (!active) {
          return;
        }
        setByCategory(categories);
        setTopProducts(products);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(messageOf(cause, 'Failed to load reports'));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function loadRevenue(): Promise<void> {
    setError(null);
    const query = new URLSearchParams();
    if (from) {
      query.set('from', new Date(from).toISOString());
    }
    if (to) {
      query.set('to', new Date(to).toISOString());
    }
    try {
      setRevenue(
        await api.get<RevenueReport>(
          `/admin/reports/revenue?${query.toString()}`,
        ),
      );
    } catch (cause) {
      setError(messageOf(cause, 'Failed to load revenue'));
    }
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="font-medium">Revenue</h2>
        <div className="flex flex-wrap items-end gap-3">
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
          />
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
          />
          <button
            type="button"
            onClick={() => void loadRevenue()}
            className="rounded-md bg-foreground px-4 py-2 text-background"
          >
            Load
          </button>
        </div>
        {revenue ? (
          <p className="text-lg">
            {formatMinor(revenue.totalMinor)} over {revenue.orderCount} orders
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-medium">Sales by category</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-black/60 dark:text-white/60">
            <tr>
              <th className="py-2">Category</th>
              <th>Units</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-white/15">
            {byCategory.map((row) => (
              <tr key={row.categoryId}>
                <td className="py-2">{row.categoryName}</td>
                <td>{row.unitsSold}</td>
                <td>{formatMinor(row.revenueMinor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-medium">Top products</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-black/60 dark:text-white/60">
            <tr>
              <th className="py-2">Product</th>
              <th>Units</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-white/15">
            {topProducts.map((row) => (
              <tr key={row.productId}>
                <td className="py-2">{row.productName}</td>
                <td>{row.unitsSold}</td>
                <td>{formatMinor(row.revenueMinor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? <p className="text-red-600">{error}</p> : null}
    </section>
  );
}
