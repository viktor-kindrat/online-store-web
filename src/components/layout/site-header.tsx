'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api/client';
import { useSession } from '@/features/auth/session';
import { useCart } from '@/features/cart/cart-store';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export function SiteHeader() {
  const router = useRouter();
  const { user, loading, refresh } = useSession();
  const { count } = useCart();

  async function logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }
    }
    await refresh();
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
          <Link href="/" className="hover:underline">
            Catalog
          </Link>
          <Link href="/cart" className="hover:underline">
            Cart
            {count > 0 ? (
              <span className="ml-1 rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
                {count}
              </span>
            ) : null}
          </Link>
          {user ? (
            <Link href="/orders" className="hover:underline">
              Orders
            </Link>
          ) : null}
          {user?.role === 'ADMIN' ? (
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <ThemeToggle />
          {loading ? null : user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-black/15 px-3 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Login
              </Link>
              <Link href="/register" className="hover:underline">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
