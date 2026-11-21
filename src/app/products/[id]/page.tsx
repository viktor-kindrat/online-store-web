import { Suspense } from 'react';
import { ProductDetail } from '@/features/catalog/product-detail';

export default function ProductPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <ProductDetail />
    </Suspense>
  );
}
