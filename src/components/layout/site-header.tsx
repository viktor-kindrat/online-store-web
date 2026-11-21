'use client';

import {
  ClipboardList,
  LayoutGrid,
  LogIn,
  LogOut,
  Shield,
  ShoppingCart,
  UserPlus,
} from 'lucide-react';
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
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="M&amp;H" className="h-9 w-auto" />
          <span className="sr-only">M&amp;H</span>
        </Link>
        <div className="flex flex-1 items-center gap-5 text-sm">
          <Link href="/" className="flex items-center gap-1.5 hover:underline">
            <LayoutGrid className="size-4" aria-hidden />
            Catalog
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-1.5 hover:underline"
          >
            <ShoppingCart className="size-4" aria-hidden />
            Cart
            {count > 0 ? (
              <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 py-0.5 text-xs text-background">
                {count}
              </span>
            ) : null}
          </Link>
          {user ? (
            <Link
              href="/orders"
              className="flex items-center gap-1.5 hover:underline"
            >
              <ClipboardList className="size-4" aria-hidden />
              Orders
            </Link>
          ) : null}
          {user?.role === 'ADMIN' ? (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 hover:underline"
            >
              <Shield className="size-4" aria-hidden />
              Admin
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <ThemeToggle />
          {loading ? null : user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              <LogOut className="size-4" aria-hidden />
              Logout
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 hover:underline"
              >
                <LogIn className="size-4" aria-hidden />
                Login
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 hover:underline"
              >
                <UserPlus className="size-4" aria-hidden />
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
