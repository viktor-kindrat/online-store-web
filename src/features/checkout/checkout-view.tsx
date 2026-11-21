'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api/client';
import type {
  DeliveryMethod,
  DeliveryMethodCode,
  OrderView,
  PaymentInitiatedView,
} from '@/lib/api/types';
import { formatMinor } from '@/lib/utils/money';

export function CheckoutView() {
  const router = useRouter();
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethodCode>('COURIER');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [order, setOrder] = useState<OrderView | null>(null);
  const [payment, setPayment] = useState<PaymentInitiatedView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<DeliveryMethod[]>('/delivery-methods')
      .then((loaded) => {
        if (active) {
          setMethods(loaded);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function placeOrder(): Promise<void> {
    setError(null);
    try {
      const placed = await api.post<OrderView>('/orders', {
        deliveryMethod,
        shippingAddress: { city, street, postalCode },
      });
      setOrder(placed);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.push('/login');
        return;
      }
      setError(cause instanceof ApiError ? cause.message : 'Failed to place order');
    }
  }

  async function pay(): Promise<void> {
    if (!order) {
      return;
    }
    setError(null);
    try {
      setPayment(
        await api.post<PaymentInitiatedView>(`/orders/${order.id}/payments`),
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Payment failed');
    }
  }

  if (order) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-green-700">
          Order {order.id} created — {order.status}
        </p>
        <p className="text-lg">Total: {formatMinor(order.totalMinor)}</p>
        {payment ? (
          <div className="rounded-md border border-black/10 p-4 dark:border-white/15">
            <p>Payment reference: {payment.providerReference}</p>
            <p className="break-all text-sm text-black/60 dark:text-white/60">
              Redirect: {payment.redirectUrl}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void pay()}
            className="w-fit rounded-md bg-foreground px-4 py-2 text-background"
          >
            Pay now
          </button>
        )}
        {error ? <p className="text-red-600">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Delivery method
        <select
          value={deliveryMethod}
          onChange={(event) =>
            setDeliveryMethod(event.target.value as DeliveryMethodCode)
          }
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        >
          {methods.map((method) => (
            <option key={method.code} value={method.code}>
              {method.name} ({formatMinor(method.feeMinor)})
            </option>
          ))}
        </select>
      </label>
      <input
        placeholder="City"
        value={city}
        onChange={(event) => setCity(event.target.value)}
        className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
      />
      <input
        placeholder="Street"
        value={street}
        onChange={(event) => setStreet(event.target.value)}
        className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
      />
      <input
        placeholder="Postal code"
        value={postalCode}
        onChange={(event) => setPostalCode(event.target.value)}
        className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
      />
      {error ? <p className="text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={() => void placeOrder()}
        className="rounded-md bg-foreground px-4 py-2 text-background"
      >
        Place order
      </button>
    </section>
  );
}
