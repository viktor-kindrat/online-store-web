'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { OrderView } from '@/lib/api/types';
import { formatMinor } from '@/lib/utils/money';

export function OrdersView() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<OrderView[]>('/orders')
      .then((loaded) => {
        if (active) {
          setOrders(loaded);
        }
      })
      .catch((cause: unknown) => {
        if (cause instanceof ApiError && cause.status === 401) {
          router.push('/login');
          return;
        }
        if (active) {
          setError(cause instanceof ApiError ? cause.message : 'Failed to load');
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
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col divide-y divide-black/10 dark:divide-white/15">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center justify-between py-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (orders.length === 0) {
    return <p>No orders yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-black/10 dark:divide-white/15">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center justify-between py-3">
          <div>
            <p className="font-mono text-sm">{order.id}</p>
            <p className="text-sm text-black/60 dark:text-white/60">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">{order.status}</p>
            <p>{formatMinor(order.totalMinor)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
