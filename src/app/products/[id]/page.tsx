import { Suspense } from 'react';
import { ProductDetail } from '@/features/catalog/product-detail';
import { Skeleton } from '@/components/ui/skeleton';

function ProductDetailFallback() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<ProductDetailFallback />}>
      <ProductDetail />
    </Suspense>
  );
}
