import type { ReactNode } from 'react';

export function Skeleton({ className = '' }: { className?: string }): ReactNode {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded bg-black/10 dark:bg-white/10 ${className}`}
    />
  );
}

export function ProductCardSkeleton(): ReactNode {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="mt-1 h-5 w-20" />
      </div>
    </div>
  );
}

export function ProductCardGridSkeleton({
  count = 6,
}: {
  count?: number;
}): ReactNode {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </section>
  );
}

export function TableRowsSkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}): ReactNode {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-4">
          {Array.from({ length: cols }, (_, col) => (
            <Skeleton
              key={col}
              className={`h-5 ${col === 0 ? 'flex-1' : 'w-20'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
