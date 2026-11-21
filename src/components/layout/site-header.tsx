'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api/client';

const NAV_LINKS = [
  { href: '/', label: 'Catalog' },
  { href: '/cart', label: 'Cart' },
  { href: '/orders', label: 'Orders' },
];

export function SiteHeader() {
  const router = useRouter();

  async function logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
        <Link href="/" className="text-lg font-semibold">
          Online Store
        </Link>
        <div className="flex flex-1 items-center gap-4 text-sm">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="hover:underline">
            Login
          </Link>
          <Link href="/register" className="hover:underline">
            Register
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-md border border-black/15 px-3 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}
