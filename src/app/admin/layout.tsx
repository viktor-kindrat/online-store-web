'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useSession } from '@/features/auth/session';
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_LINKS = [
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/inventory', label: 'Inventory' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/promotions', label: 'Promotions' },
  { href: '/admin/reports', label: 'Reports' },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 sm:flex-row">
        <aside className="flex w-full shrink-0 flex-col gap-2 sm:w-44">
          <Skeleton className="mb-1 h-4 w-16" />
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-28" />
          ))}
        </aside>
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex flex-col gap-8 sm:flex-row">
      <aside className="w-full shrink-0 sm:w-44">
        <h2 className="mb-3 text-sm font-semibold uppercase text-black/50 dark:text-white/50">
          Admin
        </h2>
        <nav className="flex flex-wrap gap-3 text-sm sm:flex-col sm:gap-2">
          {ADMIN_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
