'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Navigation } from '@/components/layout/navigation';
import { authStorage } from '@/lib/auth-storage';
import { useAuth } from '@/hooks/use-auth';

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setHasToken(Boolean(authStorage.getAccessToken()));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!hasToken || !user) {
      router.replace('/login');
    }
  }, [hasToken, isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Loading your workspace…</div>
      </div>
    );
  }

  if (!hasToken || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Redirecting to sign in…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navigation mode="dashboard" />
      <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}

