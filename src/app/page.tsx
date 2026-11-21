import { Suspense } from 'react';
import { CatalogView } from '@/features/catalog/catalog-view';
import {
  ProductCardGridSkeleton,
  Skeleton,
} from '@/components/ui/skeleton';

function CatalogFallback() {
  return (
    <section className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <ProductCardGridSkeleton count={6} />
    </section>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogView />
    </Suspense>
  );
}
