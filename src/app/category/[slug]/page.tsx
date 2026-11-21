import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogView } from '@/features/catalog/catalog-view';
import {
  ProductCardGridSkeleton,
  Skeleton,
} from '@/components/ui/skeleton';

interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

async function fetchCategory(slug: string): Promise<CategorySummary | null> {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
  try {
    const response = await fetch(`${base}/categories`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      return null;
    }
    const categories = (await response.json()) as CategorySummary[];
    return categories.find((category) => category.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps<'/category/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  return { title: category ? `${category.name} — M&H` : 'Каталог — M&H' };
}

function CatalogFallback() {
  return (
    <section className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <ProductCardGridSkeleton count={6} />
    </section>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogView />
    </Suspense>
  );
}
