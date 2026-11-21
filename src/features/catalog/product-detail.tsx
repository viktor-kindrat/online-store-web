'use client';

import DOMPurify from 'isomorphic-dompurify';
import { Ban, Check, ShoppingCart } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api/client';
import { useCart } from '@/features/cart/cart-store';
import type { ProductDetail as ProductDetailModel } from '@/lib/api/types';
import { mediaUrl } from '@/lib/utils/media';
import { formatMinor } from '@/lib/utils/money';

const RICH_TEXT_CLASSES = [
  'max-w-none',
  'leading-relaxed',
  '[&_p]:my-2',
  '[&_h1]:text-2xl',
  '[&_h1]:font-semibold',
  '[&_h2]:text-xl',
  '[&_h2]:font-semibold',
  '[&_h3]:text-lg',
  '[&_h3]:font-semibold',
  '[&_strong]:font-semibold',
  '[&_em]:italic',
  '[&_u]:underline',
  '[&_a]:underline',
  '[&_a]:text-blue-600',
  'dark:[&_a]:text-blue-400',
  '[&_ul]:list-disc',
  '[&_ul]:pl-6',
  '[&_ol]:list-decimal',
  '[&_ol]:pl-6',
  '[&_img]:max-w-full',
  '[&_img]:h-auto',
  '[&_img]:rounded-md',
].join(' ');

export function ProductDetail() {
  const params = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductDetailModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .get<ProductDetailModel>(`/products/${params.id}`)
      .then((loaded) => {
        if (active) {
          setProduct(loaded);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof ApiError ? cause.message : 'Not found');
        }
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  const sanitizedDescription = useMemo(
    () => (product ? DOMPurify.sanitize(product.description) : ''),
    [product],
  );

  if (error && !product) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!product) {
    return <p>Loading…</p>;
  }

  const galleryUrls = product.images
    .map((image) => mediaUrl(image.url))
    .filter((url): url is string => url !== null);
  const fallbackImage = mediaUrl(product.primaryImageUrl);
  const mainImage = galleryUrls[selectedImage] ?? galleryUrls[0] ?? fallbackImage;
  const inStock = product.availableQuantity > 0;
  const maxQuantity = Math.min(product.availableQuantity, 99);

  function handleAddToCart(): void {
    if (!product || !inStock) {
      return;
    }
    addItem(
      {
        productId: product.id,
        name: product.name,
        unitPriceMinor: product.priceMinor,
        imageUrl: product.primaryImageUrl,
      },
      quantity,
    );
    setMessage('Додано в кошик');
  }

  return (
    <article className="flex flex-col gap-6">
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/5 dark:bg-white/10">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-black/40 dark:text-white/40">
            No image
          </div>
        )}
      </div>
      {galleryUrls.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {galleryUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelectedImage(index)}
              className={`h-16 w-16 overflow-hidden rounded-md border ${
                index === selectedImage
                  ? 'border-foreground'
                  : 'border-black/15 dark:border-white/20'
              }`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <h1 className="text-2xl font-semibold">{product.name}</h1>

      {inStock ? (
        <p className="inline-flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
          <Check className="size-4" aria-hidden />
          В наявності: {product.availableQuantity}
        </p>
      ) : (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
          <Ban className="size-4" aria-hidden />
          Немає в наявності
        </p>
      )}

      <p className="text-xl">{formatMinor(product.priceMinor)}</p>

      {product.attributes.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Характеристики</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            {product.attributes.map((attribute) => (
              <div
                key={`${attribute.name}:${attribute.value}`}
                className="flex justify-between gap-4 border-b border-black/5 py-1 dark:border-white/10"
              >
                <dt className="text-black/60 dark:text-white/60">
                  {attribute.name}
                </dt>
                <dd className="text-right font-medium">{attribute.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Опис</h2>
        <div
          className={RICH_TEXT_CLASSES}
          dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
        />
      </section>

      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          disabled={!inStock}
          onChange={(event) =>
            setQuantity(
              Math.min(maxQuantity, Math.max(1, Number(event.target.value))),
            )
          }
          className="w-20 rounded-md border border-black/15 px-3 py-2 disabled:opacity-50 dark:border-white/20"
        />
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="size-4" aria-hidden />
          {inStock ? 'Add to cart' : 'Unavailable'}
        </button>
      </div>
      {!inStock ? (
        <p className="text-sm text-red-600">
          Товар закінчився — замовлення наразі недоступне.
        </p>
      ) : null}
      {message ? <p className="text-green-700">{message}</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}
    </article>
  );
}
