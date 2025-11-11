'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import type { UserStatsResponse } from '@/types/user';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fullName = useMemo(() => {
    if (!user) return '';
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ');
    }
    return user?.email ?? '';
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

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        setStats(null);
        setStatsError(null);
        return;
      }
      setStatsLoading(true);
      setStatsError(null);
      try {
        const response = await api.get<UserStatsResponse>('/users/stats/summary');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
        setStatsError('Unable to load user metrics.');
      } finally {
        setStatsLoading(false);
      }
    };

    void fetchStats();
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
          Use the navigation above to manage plans, templates, tenants, and digital cards.
          These insights update automatically as your team grows.
        </p>
      </header>

      {user?.role === 'SUPER_ADMIN' ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Platform health
            </h2>
            {statsLoading && (
              <span className="text-xs text-slate-400">Refreshing metrics…</span>
            )}
          </div>

          {statsError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {statsError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total users</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {stats?.totals.users ?? '—'}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-600">
                Active (verified)
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">
                {stats?.totals.activeUsers ?? '—'}
              </p>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-xs uppercase tracking-wide text-indigo-600">
                Super admins
              </p>
              <p className="mt-2 text-2xl font-semibold text-indigo-700">
                {stats?.totals.superAdmins ?? '—'}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                Latest registrations
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {(stats?.recentUsers ?? []).map((recent) => (
                  <li
                    key={recent.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {[recent.firstName, recent.lastName].filter(Boolean).join(' ') ||
                          recent.email}
                      </p>
                      <p className="text-xs text-slate-400">{recent.email}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(recent.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
                {stats && stats.recentUsers.length === 0 && (
                  <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                    No users registered yet.
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                Latest card updates
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {(stats?.recentCardEdits ?? []).map((entry) => (
                  <li
                    key={entry.vcardId}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{entry.cardName}</p>
                      <p className="text-xs text-slate-400">
                        {[entry.owner.firstName, entry.owner.lastName]
                          .filter(Boolean)
                          .join(' ') || entry.owner.email}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.updatedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
                {stats && stats.recentCardEdits.length === 0 && (
                  <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                    No recent card edits detected.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

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
