'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import { authStorage } from '@/lib/auth-storage';

type NavigationMode = 'marketing' | 'dashboard';

interface NavigationProps {
  mode: NavigationMode;
}

export function Navigation({ mode }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAuthenticated = useMemo(
    () => Boolean(user) && Boolean(authStorage.getAccessToken()),
    [user],
  );

  const handleLogout = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const refreshToken = authStorage.getRefreshToken();
      if (refreshToken) {
        try {
          await api.post(
            '/auth/logout',
            { refreshToken },
            {
              headers: {
                Authorization: `Bearer ${authStorage.getAccessToken() ?? ''}`,
              },
            },
          );
        } catch (error) {
          // Ignore logout API errors; we'll still clear local storage
          console.warn('Logout request failed', error);
        }
      }
    } finally {
      authStorage.clear();
      setIsSigningOut(false);
      router.replace('/login');
    }
  }, [isSigningOut, router]);

  const brand = (
    <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
      <Image
        src="/ivgk512by512.png"
        alt="IVGK Digital Cards"
        width={32}
        height={32}
        className="h-8 w-8 rounded-lg"
        priority
      />
      <span className="text-sm font-semibold text-slate-900 lg:text-base">
        IVGK Digital Cards
      </span>
    </Link>
  );

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const marketingLinks =
    mode === 'marketing' ? (
      <div className="hidden items-center gap-4 text-sm text-slate-600 md:flex">
        <Link href="#features" className="transition hover:text-slate-900">
          Features
        </Link>
        <Link href="#plans" className="transition hover:text-slate-900">
          Plans
        </Link>
        <Link href="#templates" className="transition hover:text-slate-900">
          Templates
        </Link>
        <Link href="/docs" className="transition hover:text-slate-900">
          Docs
        </Link>
      </div>
    ) : null;

  const dashboardLinks =
    mode === 'dashboard' ? (
      <div className="hidden items-center gap-4 text-sm text-slate-600 md:flex">
        <Link
          href="/dashboard"
          className={`transition hover:text-slate-900 ${
            pathname === '/dashboard' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          Overview
        </Link>
        {isSuperAdmin ? (
          <Link
            href="/dashboard/super-admin/plans"
            className={`transition hover:text-slate-900 ${
              pathname?.startsWith('/dashboard/super-admin/plans')
                ? 'text-slate-900 font-semibold'
                : ''
            }`}
          >
            Plans
          </Link>
        ) : null}
      </div>
    ) : null;

  return (
    <header
      className={`sticky top-0 z-40 border-b border-slate-200 ${
        mode === 'marketing'
          ? 'bg-white/80 backdrop-blur'
          : 'bg-white shadow-sm'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        {brand}
        <div className="flex items-center gap-4">
          {marketingLinks}
          {dashboardLinks}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <span className="text-xs text-slate-400">Checking session…</span>
            ) : isAuthenticated ? (
              <>
                {mode === 'marketing' && (
                  <Link
                    href="/dashboard"
                    className="text-sm text-slate-600 transition hover:text-slate-900"
                  >
                    Dashboard
                  </Link>
                )}
                <span className="hidden text-xs text-slate-500 md:inline">
                  Hi, {user?.firstName || user?.email}
                </span>
                <Button variant="ghost" onClick={handleLogout} isLoading={isSigningOut}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-slate-600 transition hover:text-slate-900"
                >
                  Login
                </Link>
                <Link href="/register">
                  <Button variant="primary">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

