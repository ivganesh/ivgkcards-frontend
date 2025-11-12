'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  RefreshCw,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PlanForm } from '@/components/plans/plan-form';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import type {
  PlanFeatureDefinition,
  PlanFormValues,
  PlanSummary,
} from '@/types/plan';

interface TemplateSummary {
  id: number;
  name: string;
  category?: string | null;
}

interface CurrencySummary {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
}

type LoadState = 'idle' | 'loading' | 'error';

export default function SuperAdminPlansPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [currencies, setCurrencies] = useState<CurrencySummary[]>([]);
  const [featureCatalog, setFeatureCatalog] = useState<PlanFeatureDefinition[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const fetchPlans = useCallback(async () => {
    const response = await api.get<PlanSummary[]>('/plans', {
      params: {
        includeInactive: true,
      },
    });
    return response.data;
  }, []);

  const fetchTemplates = useCallback(async () => {
    const response = await api.get<
      Array<{
        id: number;
        name: string;
        category?: string | null;
      }>
    >('/templates', {
      params: { includeInactive: true },
    });
    return response.data;
  }, []);

  const fetchCurrencies = useCallback(async () => {
    const response = await api.get<CurrencySummary[]>('/plans/currencies');
    return response.data;
  }, []);

  const fetchFeatureCatalog = useCallback(async () => {
    const response = await api.get<PlanFeatureDefinition[]>('/plans/features');
    return response.data;
  }, []);

  const loadAllData = useCallback(async () => {
    setLoadState('loading');
    setError(null);
    try {
      const [plansData, templatesData, currenciesData, featureCatalogData] =
        await Promise.all([
          fetchPlans(),
          fetchTemplates(),
          fetchCurrencies(),
          fetchFeatureCatalog(),
        ]);
      setPlans(plansData);
      setTemplates(templatesData);
      setCurrencies(currenciesData);
      setFeatureCatalog(featureCatalogData);
      setLoadState('idle');
    } catch (err) {
      console.error('Failed to load plan management data', err);
      setError('Unable to load plans. Please try again or check the API status.');
      setLoadState('error');
    }
  }, [fetchPlans, fetchTemplates, fetchCurrencies, fetchFeatureCatalog]);

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) return;
    void loadAllData();
  }, [authLoading, isSuperAdmin, loadAllData]);

  const handleCreateNew = () => {
    setEditingPlan(null);
    setIsFormVisible(true);
  };

  const handleEdit = (plan: PlanSummary) => {
    setEditingPlan(plan);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setEditingPlan(null);
    setIsFormVisible(false);
  };

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const plansData = await fetchPlans();
      setPlans(plansData);
    } catch (err) {
      console.error('Failed to refresh plans', err);
      setError('Unable to refresh plans.');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPlans]);

  const handleSubmit = async (values: PlanFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingPlan) {
        await api.patch(`/plans/${editingPlan.id}`, values);
      } else {
        await api.post('/plans', values);
      }
      await loadAllData();
      setIsFormVisible(false);
      setEditingPlan(null);
    } catch (err) {
      console.error('Failed to save plan', err);
      setError('Unable to save plan. Please review the data and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan: PlanSummary) => {
    try {
      await api.patch(`/plans/${plan.id}`, {
        status: !plan.status,
      });
      await refreshData();
    } catch (err) {
      console.error('Failed to toggle plan status', err);
      setError('Unable to update plan status.');
    }
  };

  const handleDelete = async (plan: PlanSummary) => {
    if (
      !window.confirm(
        `Delete plan "${plan.name}"? This action cannot be undone. Ensure no active subscriptions rely on it.`,
      )
    ) {
      return;
    }

    try {
      await api.delete(`/plans/${plan.id}`);
      await loadAllData();
    } catch (err) {
      console.error('Failed to delete plan', err);
      setError('Unable to delete plan. Check if subscriptions are linked to it.');
    }
  };

  const enrichedPlans = useMemo(() => {
    return plans.map((plan) => {
      const numericPrice =
        typeof plan.price === 'number'
          ? plan.price
          : plan.price
            ? Number(plan.price)
            : 0;

      return {
        ...plan,
        price: numericPrice,
        currencyLabel: plan.currency
          ? `${plan.currency.code} ${plan.currency.symbol ?? ''}`.trim()
          : '—',
      };
    });
  }, [plans]);

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
            Plan management is available to super admin accounts only. If you believe
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
          <h1 className="text-2xl font-semibold text-slate-900">Plan Management</h1>
          <p className="text-sm text-slate-600">
            Create, update, and retire subscription plans. Plans control pricing,
            feature access, and template availability for tenants.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => void refreshData()} isLoading={isRefreshing}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New plan
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isFormVisible ? (
        <PlanForm
          mode={editingPlan ? 'edit' : 'create'}
          initialValues={editingPlan ?? undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
          isSubmitting={isSubmitting}
          availableTemplates={templates}
          currencies={currencies}
          featureCatalog={featureCatalog}
        />
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Plans overview
            </h2>
            <p className="text-xs text-slate-400">
              {enrichedPlans.length} plan{enrichedPlans.length === 1 ? '' : 's'} total
            </p>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Frequency</th>
                <th className="px-6 py-3">vCards</th>
                <th className="px-6 py-3">Storage</th>
                <th className="px-6 py-3">Trial</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Default</th>
                <th className="px-6 py-3">Subscriptions</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {enrichedPlans.map((plan) => (
                <tr key={plan.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{plan.name}</div>
                    <div className="text-xs text-slate-500">
                      Templates: {plan.planTemplates.length} • Features:{' '}
                      {plan.features.length}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">
                      {plan.currency?.symbol ?? ''} {plan.price.toFixed(2)}
                    </span>
                    <div className="text-xs text-slate-500">{plan.currency?.code ?? 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">{plan.frequency.toLowerCase()}</td>
                  <td className="px-6 py-4">{plan.noOfVcards}</td>
                  <td className="px-6 py-4">{plan.storageLimit} MB</td>
                  <td className="px-6 py-4">
                    {plan.trialDays > 0 ? `${plan.trialDays} days` : 'None'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        plan.status
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {plan.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {plan.isDefault ? (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                        Default
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {plan._count?.subscriptions ?? 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        className="text-xs"
                        onClick={() => handleEdit(plan)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs"
                        onClick={() => handleToggleStatus(plan)}
                      >
                        {plan.status ? (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(plan)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {enrichedPlans.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-sm text-slate-500">
                    {loadState === 'loading'
                      ? 'Loading plans...'
                      : 'No plans found yet. Use the button above to create your first plan.'}
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

