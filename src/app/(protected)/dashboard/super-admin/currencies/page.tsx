'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, PlusCircle, Pencil, Power, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CurrencyForm } from '@/components/currencies/currency-form';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import type { CurrencyFormValues, CurrencySummary } from '@/types/currency';

type LoadState = 'idle' | 'loading' | 'error';

export default function SuperAdminCurrenciesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [currencies, setCurrencies] = useState<CurrencySummary[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencySummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const fetchCurrencies = useCallback(async () => {
    const response = await api.get<CurrencySummary[]>('/currencies', {
      params: { includeInactive: true },
    });
    return response.data;
  }, []);

  const loadAllData = useCallback(async () => {
    setLoadState('loading');
    setError(null);
    try {
      const currenciesData = await fetchCurrencies();
      setCurrencies(currenciesData);
      setLoadState('idle');
    } catch (err) {
      console.error('Failed to load currencies', err);
      setError('Unable to load currencies. Please try again later.');
      setLoadState('error');
    }
  }, [fetchCurrencies]);

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) return;
    void loadAllData();
  }, [authLoading, isSuperAdmin, loadAllData]);

  const handleCreateNew = () => {
    setEditingCurrency(null);
    setIsFormVisible(true);
  };

  const handleEdit = (currency: CurrencySummary) => {
    setEditingCurrency(currency);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setEditingCurrency(null);
    setIsFormVisible(false);
  };

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const currenciesData = await fetchCurrencies();
      setCurrencies(currenciesData);
    } catch (err) {
      console.error('Unable to refresh currencies', err);
      setError('Unable to refresh currencies.');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchCurrencies]);

  const handleSubmit = async (values: CurrencyFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingCurrency) {
        await api.patch(`/currencies/${editingCurrency.id}`, values);
      } else {
        await api.post('/currencies', values);
      }
      await loadAllData();
      setIsFormVisible(false);
      setEditingCurrency(null);
    } catch (err) {
      console.error('Failed to save currency', err);
      setError('Unable to save currency. Please verify the details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (currency: CurrencySummary) => {
    try {
      await api.patch(`/currencies/${currency.id}`, {
        isActive: !currency.isActive,
      });
      await refreshData();
    } catch (err) {
      console.error('Failed to toggle currency status', err);
      setError('Unable to update currency status.');
    }
  };

  const handleDeactivate = async (currency: CurrencySummary) => {
    if (
      !window.confirm(
        `Deactivate currency ${currency.code}? Plans referencing this currency will retain it.`,
      )
    ) {
      return;
    }

    try {
      await api.delete(`/currencies/${currency.id}`);
      await refreshData();
    } catch (err) {
      console.error('Failed to deactivate currency', err);
      setError('Unable to deactivate currency.');
    }
  };

  const enrichedCurrencies = useMemo(() => {
    return currencies
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((currency) => ({
        ...currency,
        label: `${currency.code} ${currency.symbol ? `(${currency.symbol})` : ''}`.trim(),
      }));
  }, [currencies]);

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
            Currency management is available to super admin accounts only. If you believe
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
          <h1 className="text-2xl font-semibold text-slate-900">Currency Management</h1>
          <p className="text-sm text-slate-600">
            Maintain the set of currencies available for subscription plans and purchases.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => void refreshData()} isLoading={isRefreshing}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New currency
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isFormVisible ? (
        <CurrencyForm
          mode={editingCurrency ? 'edit' : 'create'}
          initialValues={
            editingCurrency
              ? {
                  code: editingCurrency.code,
                  name: editingCurrency.name,
                  symbol: editingCurrency.symbol,
                  isActive: editingCurrency.isActive,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
          isSubmitting={isSubmitting}
        />
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Configured currencies
            </h2>
            <p className="text-xs text-slate-400">
              {enrichedCurrencies.length} currency{enrichedCurrencies.length === 1 ? '' : 'ies'} total
            </p>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Symbol</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {enrichedCurrencies.map((currency) => (
                <tr key={currency.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">{currency.code}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{currency.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{currency.symbol}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        currency.isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {currency.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(currency.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        className="text-xs"
                        onClick={() => handleEdit(currency)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs"
                        onClick={() => handleToggleActive(currency)}
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {currency.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs text-red-600 hover:text-red-700"
                        onClick={() => handleDeactivate(currency)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Archive
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {enrichedCurrencies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    {loadState === 'loading'
                      ? 'Loading currencies...'
                      : 'No currencies configured yet. Use the button above to add one.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

