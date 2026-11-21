'use client';

import { ArrowRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMinor } from '@/lib/utils/money';
import { mediaUrl } from '@/lib/utils/media';
import { useCart, MAX_LINE_QUANTITY } from './cart-store';

export function CartView() {
  const { lines, subtotalMinor, ready, setQuantity, removeItem } = useCart();

  if (!ready) {
    return (
      <div className="flex flex-col divide-y divide-black/10 dark:divide-white/15">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 py-3">
            <Skeleton className="h-12 w-12" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
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

  return (
    <section className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-black/10 dark:divide-white/15">
        {lines.map((line) => {
          const src = mediaUrl(line.imageUrl);
          return (
            <li key={line.productId} className="flex items-center gap-4 py-3">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={line.name}
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <span className="h-12 w-12 rounded bg-black/5 dark:bg-white/10" />
              )}
              <span className="flex-1">{line.name}</span>
              <input
                type="number"
                min={1}
                max={MAX_LINE_QUANTITY}
                value={line.quantity}
                onChange={(event) =>
                  setQuantity(line.productId, Number(event.target.value))
                }
                className="w-20 rounded-md border border-black/15 px-2 py-1 dark:border-white/20"
              />
              <span className="w-24 text-right">
                {formatMinor(line.unitPriceMinor * line.quantity)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(line.productId)}
                aria-label="Remove item"
                title="Remove item"
                className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
              >
                <Trash2 className="size-4" aria-hidden />
                Remove
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">
          Subtotal: {formatMinor(subtotalMinor)}
        </span>
        <Link
          href="/checkout"
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-background"
        >
          Checkout
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
