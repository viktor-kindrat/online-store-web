'use client';

import { CheckCircle2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api/client';
import { useSession } from '@/features/auth/session';
import { useCart } from '@/features/cart/cart-store';
import type {
  DeliveryMethod,
  DeliveryMethodCode,
  OrderView,
  PaymentInitiatedView,
} from '@/lib/api/types';
import { formatMinor } from '@/lib/utils/money';

type AuthMode = 'login' | 'register';

function submitWayForPay(payment: PaymentInitiatedView): void {
  if (!payment.formFields) {
    return;
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payment.redirectUrl;
  for (const [key, raw] of Object.entries(payment.formFields)) {
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }
  }
  document.body.appendChild(form);
  form.submit();
}

export function CheckoutView() {
  const { user, loading, refresh } = useSession();
  const { lines, subtotalMinor, ready, clear } = useCart();

  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethodCode>('COURIER');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [order, setOrder] = useState<OrderView | null>(null);
  const [payment, setPayment] = useState<PaymentInitiatedView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

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

  async function authenticate(): Promise<void> {
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      await api.post(`/auth/${authMode}`, {
        email: authEmail,
        password: authPassword,
      });
      await refresh();
    } catch (cause) {
      setAuthError(
        cause instanceof ApiError ? cause.message : 'Authentication failed',
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function placeOrder(): Promise<void> {
    setError(null);
    setPlacing(true);
    try {
      for (const line of lines) {
        await api.post('/cart/items', {
          productId: line.productId,
          quantity: line.quantity,
        });
      }
      const placed = await api.post<OrderView>('/orders', {
        deliveryMethod,
        shippingAddress: { city, street, postalCode },
      });
      clear();
      setOrder(placed);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        await refresh();
        setError('Your session expired — please sign in again.');
        return;
      }
      setError(
        cause instanceof ApiError ? cause.message : 'Failed to place order',
      );
    } finally {
      setPlacing(false);
    }
  }

  async function pay(): Promise<void> {
    if (!order) {
      return;
    }
    setError(null);
    try {
      const initiated = await api.post<PaymentInitiatedView>(
        `/orders/${order.id}/payments`,
      );
      setPayment(initiated);
      if (initiated.method === 'POST' && initiated.formFields) {
        submitWayForPay(initiated);
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Payment failed');
    }
  }

  if (loading || !ready) {
    return (
      <section className="flex max-w-md flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </section>
    );
  }

  if (order) {
    return (
      <section className="flex flex-col gap-4">
        <p className="inline-flex items-center gap-2 text-green-700">
          <CheckCircle2 className="size-5" aria-hidden />
          Order {order.id} created — {order.status}
        </p>
        <p className="text-lg">Total: {formatMinor(order.totalMinor)}</p>
        {payment ? (
          <div className="rounded-md border border-black/10 p-4 dark:border-white/15">
            {payment.method === 'POST' ? (
              <p>Redirecting to the payment provider…</p>
            ) : (
              <>
                <p>Payment reference: {payment.providerReference}</p>
                <p className="break-all text-sm text-black/60 dark:text-white/60">
                  Redirect: {payment.redirectUrl}
                </p>
              </>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void pay()}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-foreground px-4 py-2 text-background"
          >
            <CreditCard className="size-4" aria-hidden />
            Pay now
          </button>
        )}
        {error ? <p className="text-red-600">{error}</p> : null}
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p>Your cart is empty.</p>
        <Link href="/" className="w-fit text-sm hover:underline">
          Browse catalog
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <section className="flex max-w-md flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Checkout</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Create an account or log in to complete your order.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`rounded-md border px-3 py-1 ${
              authMode === 'register'
                ? 'border-foreground bg-foreground text-background'
                : 'border-black/15 dark:border-white/20'
            }`}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`rounded-md border px-3 py-1 ${
              authMode === 'login'
                ? 'border-foreground bg-foreground text-background'
                : 'border-black/15 dark:border-white/20'
            }`}
          >
            Log in
          </button>
        </div>
        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={authEmail}
          maxLength={254}
          onChange={(event) => setAuthEmail(event.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <input
          type="password"
          autoComplete={
            authMode === 'login' ? 'current-password' : 'new-password'
          }
          placeholder="Password"
          value={authPassword}
          maxLength={100}
          onChange={(event) => setAuthPassword(event.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
        />
        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
        <button
          type="button"
          disabled={authSubmitting}
          onClick={() => void authenticate()}
          className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-60"
        >
          {authMode === 'login' ? 'Log in & continue' : 'Create account & continue'}
        </button>
      </section>
    );
  }

  return (
    <section className="flex max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Checkout</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Signed in as {user.email}
      </p>
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
        maxLength={200}
        onChange={(event) => setCity(event.target.value)}
        className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
      />
      <input
        placeholder="Street"
        value={street}
        maxLength={200}
        onChange={(event) => setStreet(event.target.value)}
        className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
      />
      <input
        placeholder="Postal code"
        value={postalCode}
        maxLength={20}
        onChange={(event) => setPostalCode(event.target.value)}
        className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
      />
      <div className="flex items-center justify-between text-sm">
        <span className="text-black/60 dark:text-white/60">Subtotal</span>
        <span>{formatMinor(subtotalMinor)}</span>
      </div>
      {error ? <p className="text-red-600">{error}</p> : null}
      <button
        type="button"
        disabled={placing}
        onClick={() => void placeOrder()}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-60"
      >
        <CheckCircle2 className="size-4" aria-hidden />
        {placing ? 'Placing…' : 'Place order'}
      </button>
    </section>
  );
}
