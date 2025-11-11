'use client';

import { useMemo } from 'react';

import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  const fullName = useMemo(() => {
    if (!user) return '';
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ');
    }
    return user.email;
  }, [user]);

  const roleLabel = useMemo(() => {
    if (!user) return '';
    switch (user.role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Tenant Admin';
      default:
        return 'Member';
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl py-10">
        <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-64 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome back, {fullName || 'there'}!
        </h1>
        {roleLabel && (
          <p className="text-sm font-medium uppercase tracking-wide text-indigo-500">
            {roleLabel}
          </p>
        )}
        <p className="text-sm text-slate-600">
          This workspace will soon surface plan usage, template analytics, and
          onboarding tasks. Use the navigation above to start exploring modules.
        </p>
      </header>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Quick Tips
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>
            Connect the frontend to the backend running at http://localhost:3000 to
            access live data.
          </li>
          <li>
            Configure subscription plans and templates from the admin menu to unlock
            more dashboards.
          </li>
          <li>
            Replace this placeholder content with analytics once endpoints are ready.
          </li>
        </ul>
      </section>
    </div>
  );
}
