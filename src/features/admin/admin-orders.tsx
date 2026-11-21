'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import type { OrderStatus, OrderView } from '@/lib/api/types';
import { formatMinor } from '@/lib/utils/money';
import { messageOf } from './use-async-message';

const NEXT_STATUSES: OrderStatus[] = [
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload(): Promise<void> {
    try {
      setOrders(await api.get<OrderView[]>('/admin/orders'));
    } catch (cause) {
      setError(messageOf(cause, 'Failed to load orders'));
    }
  }

  useEffect(() => {
    let active = true;
    api
      .get<OrderView[]>('/admin/orders')
      .then((loaded) => {
        if (active) {
          setOrders(loaded);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(messageOf(cause, 'Failed to load orders'));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function changeStatus(id: string, status: OrderStatus): Promise<void> {
    setError(null);
    try {
      await api.patch<OrderView>(`/admin/orders/${id}/status`, { status });
      await reload();
    } catch (cause) {
      setError(messageOf(cause, 'Failed to change status'));
    }
  }

  return (
    <section className="flex flex-col gap-4">
      {error ? <p className="text-red-600">{error}</p> : null}
      <table className="w-full text-left text-sm">
        <thead className="text-black/60 dark:text-white/60">
          <tr>
            <th className="py-2">Order</th>
            <th>Status</th>
            <th>Total</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10 dark:divide-white/15">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="py-2 font-mono text-xs">{order.id.slice(0, 8)}</td>
              <td>{order.status}</td>
              <td>{formatMinor(order.totalMinor)}</td>
              <td>
                <select
                  defaultValue=""
                  onChange={(event) => {
                    if (event.target.value) {
                      void changeStatus(order.id, event.target.value as OrderStatus);
                    }
                  }}
                  className="rounded-md border border-black/15 px-2 py-1 dark:border-white/20"
                >
                  <option value="">—</option>
                  {NEXT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
