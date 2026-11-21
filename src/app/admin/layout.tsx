import Link from 'next/link';
import type { ReactNode } from 'react';

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
