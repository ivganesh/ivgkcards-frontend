'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, RefreshCw, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserForm, type UserFormValues } from '@/components/users/user-form';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import type { UserSummary, UsersListResponse } from '@/types/user';

type LoadState = 'idle' | 'loading' | 'error';

export default function SuperAdminUsersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalPages = useMemo(() => {
    if (totalUsers === 0) return 1;
    return Math.ceil(totalUsers / pageSize);
  }, [totalUsers, pageSize]);

  const fetchUsers = useCallback(
    async (currentPage: number, currentSearch: string) => {
      setLoadState('loading');
      setError(null);
      try {
        const response = await api.get<UsersListResponse>('/users', {
          params: {
            page: currentPage,
            pageSize,
            search: currentSearch || undefined,
          },
        });
        setUsers(response.data.items);
        setTotalUsers(response.data.total);
        setLoadState('idle');
      } catch (err) {
        console.error('Failed to load users', err);
        setError('Unable to load users. Please try again later.');
        setLoadState('error');
      }
    },
    [pageSize],
  );

  const handleInitialLoad = useCallback(async () => {
    await fetchUsers(page, search);
  }, [fetchUsers, page, search]);

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) return;
    void handleInitialLoad();
  }, [authLoading, isSuperAdmin, handleInitialLoad]);

  const handleSearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    await fetchUsers(1, searchInput.trim());
  };

  const handleCreate = () => {
    setEditingUser(null);
    setIsFormVisible(true);
  };

  const handleEdit = (selected: UserSummary) => {
    setEditingUser(selected);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setEditingUser(null);
    setIsFormVisible(false);
  };

  const refreshData = useCallback(
    async (targetPage: number = page, targetSearch: string = search) => {
      setIsRefreshing(true);
      try {
        await fetchUsers(targetPage, targetSearch);
      } finally {
        setIsRefreshing(false);
      }
    },
    [fetchUsers, page, search],
  );

  const handleSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, {
          ...values,
        });
      } else {
        await api.post('/users', values);
      }
      await refreshData(1);
      setPage(1);
      setIsFormVisible(false);
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to save user', err);
      setError('Unable to save user. Please check the data and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = async (nextPage: number) => {
    setPage(nextPage);
    await fetchUsers(nextPage, search);
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl py-10">
        <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-72 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-4xl py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-amber-900">Access restricted</h1>
          <p className="mt-2 text-sm text-amber-800">
            User management is available to super admin accounts only. If you believe
            this is an error, please contact the platform owner.
          </p>
          <Button className="mt-4" variant="primary" onClick={() => router.push('/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">User Directory</h1>
          <p className="text-sm text-slate-600">
            Manage platform members, invite new accounts, and adjust permissions across
            tenants.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => void refreshData()} isLoading={isRefreshing}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New user
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-1 items-center gap-3">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or email"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </div>
        <div className="text-xs text-slate-500">
          Showing {users.length} of {totalUsers} users
        </div>
      </form>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isFormVisible ? (
        <UserForm
          mode={editingUser ? 'edit' : 'create'}
          initialUser={editingUser ?? undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
          isSubmitting={isSubmitting}
        />
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Members
            </h2>
            <p className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </p>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Email verified</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Updated</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {[item.firstName, item.lastName].filter(Boolean).join(' ') || '—'}
                    </div>
                    <div className="text-xs text-slate-400">
                      vCards: {item._count?.vcards ?? 0} • Tenants:{' '}
                      {item._count?.tenantUsers ?? 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{item.email}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
                      {item.role.toLowerCase().replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.isEmailVerified ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                        Verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="secondary"
                      className="text-xs"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    {loadState === 'loading'
                      ? 'Loading users...'
                      : 'No users found. Try adjusting your search or create a new user.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm text-slate-600">
          <span>
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, totalUsers)} of {totalUsers}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => void handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-500">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => void handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}

