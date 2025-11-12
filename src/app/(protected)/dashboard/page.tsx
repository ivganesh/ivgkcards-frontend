'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Copy, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import type { PlanSummary } from '@/types/plan';
import type { SubscriptionSummary } from '@/types/subscription';
import type { TemplateSummary } from '@/types/template';
import type { UserStatsResponse } from '@/types/user';
import type { VcardDetail, VcardSummary } from '@/types/vcard';
import { CardEditor } from '@/components/cards/card-editor';

interface CardFormState {
  urlAlias: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  templateId?: number;
  website: string;
  address: string;
  bio: string;
}

const defaultCardForm: CardFormState = {
  urlAlias: '',
  firstName: '',
  lastName: '',
  displayName: '',
  email: '',
  phone: '',
  company: '',
  jobTitle: '',
  website: '',
  address: '',
  bio: '',
};

const frequencyLabel: Record<string, string> = {
  MONTHLY: 'per month',
  YEARLY: 'per year',
};

function formatPlanPrice(plan: PlanSummary) {
  const priceNumber =
    typeof plan.price === 'number' ? plan.price : Number(plan.price ?? 0);
  const symbol = plan.currency?.symbol ?? '';
  const formatted = priceNumber.toFixed(2);
  const period = frequencyLabel[plan.frequency] ?? plan.frequency.toLowerCase();
  return `${symbol ? `${symbol} ` : ''}${formatted} ${period}`;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [cards, setCards] = useState<VcardSummary[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);

  const [planChangeLoading, setPlanChangeLoading] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>();
  const [templateApplyLoading, setTemplateApplyLoading] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState<CardFormState>(defaultCardForm);
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [cardSuccess, setCardSuccess] = useState<string | null>(null);
  const [cardSuccessAlias, setCardSuccessAlias] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [templateSuccess, setTemplateSuccess] = useState<string | null>(null);
  const [editorCard, setEditorCard] = useState<VcardDetail | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const fullName = useMemo(() => {
    if (!user) return '';
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ');
    }
    return user?.email ?? '';
  }, [user]);

  useEffect(() => {
    if (cardForm.templateId && selectedTemplateId !== cardForm.templateId) {
      setSelectedTemplateId(cardForm.templateId);
    }
  }, [cardForm.templateId, selectedTemplateId]);

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

  const loadPlatformStats = useCallback(async () => {
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
  }, [user]);

  const loadWorkspaceData = useCallback(async () => {
    if (!user) return;
    setResourceLoading(true);
    setResourceError(null);
    try {
      const [subscriptionRes, plansRes, templatesRes, cardsRes] = await Promise.all([
        api.get<SubscriptionSummary | null>('/subscriptions/active'),
        api.get<PlanSummary[]>('/plans', {
          params: { isActive: true },
        }),
        api.get<TemplateSummary[]>('/templates/accessible'),
        api.get<VcardSummary[]>('/vcards'),
      ]);

      setSubscription(subscriptionRes.data);
      setPlans(plansRes.data);
      setTemplates(templatesRes.data);
      setCards(cardsRes.data);
      setSelectedTemplateId((prev) => {
        if (prev) {
          return prev;
        }
        const firstCardTemplate = cardsRes.data.find((card) => card.template?.id)
          ?.template?.id;
        return firstCardTemplate ?? prev;
      });
    } catch (error) {
      console.error('Failed to load workspace data', error);
      setResourceError('Unable to load your workspace. Please try again later.');
    } finally {
      setResourceLoading(false);
    }
  }, [user]);

  const openCardEditor = useCallback(
    async (cardId: string) => {
      setEditorLoading(true);
      setEditorError(null);
      try {
        const response = await api.get<VcardDetail>(`/vcards/${cardId}`);
        setEditorCard(response.data);
      } catch (error) {
        console.error('Failed to load card editor', error);
        setEditorError('Unable to load card details. Please try again.');
        setEditorCard(null);
      } finally {
        setEditorLoading(false);
      }
    },
    [],
  );

  const closeEditor = useCallback(() => {
    setEditorCard(null);
    setEditorError(null);
    setEditorLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadPlatformStats();
    void loadWorkspaceData();
  }, [user, loadPlatformStats, loadWorkspaceData]);

  useEffect(() => {
    if (!user) return;
    setCardForm((prev) => ({
      ...prev,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      displayName:
        prev.displayName ||
        [user.firstName, user.lastName].filter(Boolean).join(' '),
    }));
  }, [user]);

  const handlePlanChange = async (planId: string) => {
    if (!planId) return;
    setPlanChangeLoading(planId);
    setResourceError(null);
    try {
      if (subscription) {
        await api.patch(`/subscriptions/${subscription.id}/upgrade`, {
          planId,
        });
      } else {
        await api.post('/subscriptions', {
          planId,
        });
      }
      await loadWorkspaceData();
    } catch (error) {
      console.error('Failed to change subscription', error);
      setResourceError('Unable to update subscription. Please try again.');
    } finally {
      setPlanChangeLoading(null);
    }
  };

  const handleTemplateSelect = (templateId: number) => {
    setSelectedTemplateId(templateId);
    handleCardFormChange('templateId', templateId);
    setTemplateSuccess(null);
  };

  const handleCardFormChange = (field: keyof CardFormState, value: string | number) => {
    setCardForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyTemplateToCard = async (cardId: string) => {
    if (!selectedTemplateId) {
      setResourceError('Select a template from the gallery before applying it.');
      return;
    }

    setTemplateApplyLoading(cardId);
    setResourceError(null);
    setTemplateSuccess(null);

    try {
      await api.patch(`/vcards/${cardId}`, {
        templateId: selectedTemplateId,
      });
      await loadWorkspaceData();
      const appliedTemplate = templates.find((tpl) => tpl.id === selectedTemplateId);
      setTemplateSuccess(
        `Template ${appliedTemplate ? `"${appliedTemplate.name}"` : ''} applied successfully.`,
      );
    } catch (error) {
      console.error('Failed to update card template', error);
      setResourceError('Unable to apply template to the selected card. Please try again.');
    } finally {
      setTemplateApplyLoading(null);
    }
  };

  const buildPublicLink = (alias: string) => {
    let base =
      origin || (typeof window !== 'undefined' ? window.location.origin : '');
    if (!base) {
      base = 'http://localhost:3001';
    }
    if (!base.startsWith('http')) {
      base = `http://${base}`;
    }
    const normalizedBase = base.replace(/\/$/, '');
    return `${normalizedBase}/cards/${alias}`;
  };

  const handleCopyLink = async (alias: string) => {
    const link = buildPublicLink(alias);
    try {
      await navigator.clipboard.writeText(link);
      setCardSuccess(`Link copied: ${link}`);
      setCardSuccessAlias(alias);
    } catch (error) {
      console.error('Failed to copy card link', error);
      setResourceError('Unable to copy the link. Please copy manually.');
    }
  };

  const handleCreateCard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCardSubmitting(true);
    setCardSuccess(null);
    setResourceError(null);
    try {
      const name =
        cardForm.displayName ||
        [cardForm.firstName, cardForm.lastName].filter(Boolean).join(' ');

      await api.post('/vcards', {
        urlAlias: cardForm.urlAlias,
        firstName: cardForm.firstName,
        lastName: cardForm.lastName,
        name,
        email: cardForm.email || undefined,
        phone: cardForm.phone || undefined,
        company: cardForm.company || undefined,
        jobTitle: cardForm.jobTitle || undefined,
      description: cardForm.bio || undefined,
      location: cardForm.address || undefined,
      locationUrl: cardForm.website || undefined,
        templateId: cardForm.templateId,
      });

      setCardSuccess('Digital card created successfully.');
    setCardSuccessAlias(cardForm.urlAlias);
      setCardForm((prev) => ({
        ...prev,
        urlAlias: '',
        displayName: name,
      bio: prev.bio,
      }));
      await loadWorkspaceData();
    } catch (error) {
      console.error('Failed to create vCard', error);
      setResourceError('Unable to create digital card. Please verify the details.');
    } finally {
      setCardSubmitting(false);
    }
  };

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

  const currentPlanId = subscription?.planId;

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

      {resourceError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {resourceError}
        </div>
      )}

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

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Subscription
            </h2>
            <p className="text-xs text-slate-400">
              Manage your current plan and available upgrades.
            </p>
          </div>
          {resourceLoading && (
            <span className="text-xs text-slate-400">Checking plan…</span>
          )}
        </div>

        {subscription ? (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-xs uppercase tracking-wide text-indigo-600">
              Current plan
            </p>
            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-indigo-900">
                  {subscription.plan.name}
                </p>
                <p className="text-xs text-indigo-700">
                  {formatPlanPrice(subscription.plan)}
                </p>
              </div>
              <div className="text-xs text-indigo-700">
                {subscription.status === 'TRIAL'
                  ? subscription.trialEndsAt
                    ? `Trial active until ${new Date(
                        subscription.trialEndsAt,
                      ).toLocaleDateString()}`
                    : 'Trial active'
                  : `Renewed ${new Date(subscription.startDate).toLocaleDateString()}`}
              </div>
            </div>
            <div className="mt-3 text-xs text-indigo-700">
              Features included:{' '}
              {subscription.plan.features
                ?.filter((feature) => feature.enabled)
                .map((feature) =>
                  feature.limit
                    ? `${feature.feature.replace('_', ' ')} (${feature.limit})`
                    : feature.feature.replace('_', ' '),
                )
                .join(', ') || 'Default features'}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            No active subscription yet. Choose a plan below to unlock templates and
            digital card creation.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const priceNumber =
              typeof plan.price === 'number' ? plan.price : Number(plan.price ?? 0);
            const isCurrent = plan.id === currentPlanId;
            return (
              <div
                key={plan.id}
                className={`flex h-full flex-col rounded-xl border p-5 shadow-sm transition ${
                  isCurrent ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {plan.name}
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {plan.currency?.symbol ?? ''} {priceNumber.toFixed(2)}
                      <span className="text-sm font-medium text-slate-500">
                        {' '}
                        {frequencyLabel[plan.frequency] ?? plan.frequency.toLowerCase()}
                      </span>
                    </p>
                  </div>
                </div>

                <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                  {plan.features
                    ?.filter((feature) => feature.enabled)
                    .map((feature) => (
                      <li key={feature.feature}>
                        •{' '}
                        {feature.limit
                          ? `${feature.feature.replace('_', ' ')} (${feature.limit})`
                          : feature.feature.replace('_', ' ')}
                      </li>
                    ))}
                  {(plan.features?.filter((feature) => feature.enabled).length ?? 0) ===
                    0 && <li>• Core features</li>}
                </ul>

                <Button
                  className="mt-4"
                  variant={isCurrent ? 'secondary' : 'primary'}
                  disabled={isCurrent || !!planChangeLoading}
                  isLoading={planChangeLoading === plan.id}
                  onClick={() => void handlePlanChange(plan.id)}
                >
                  {isCurrent ? 'Current plan' : subscription ? 'Change plan' : 'Select plan'}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Templates
            </h2>
            <p className="text-xs text-slate-400">
              Choose a template to personalize your next digital card.
            </p>
          </div>
        </div>

        {templateSuccess && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {templateSuccess}
          </div>
        )}
        {!selectedTemplateId && templates.length > 0 && (
          <p className="text-xs text-slate-400">
            Select a template below to use it for new cards or apply it to an existing one.
          </p>
        )}

        {templates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            No templates available for your current plan yet. Upgrade your subscription
            or check back later.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template.id)}
                className={`flex flex-col overflow-hidden rounded-xl border text-left transition hover:shadow ${
                  selectedTemplateId === template.id
                    ? 'border-indigo-500 shadow-lg'
                    : 'border-slate-200'
                }`}
              >
                <div className="relative h-36 bg-slate-100">
                  {template.previewUrl ? (
                    <Image
                      src={template.previewUrl}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No preview
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-4">
                  <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                  <p className="text-xs text-slate-500">
                    {template.category || 'Uncategorized'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Used in {template._count?.vcards ?? 0} cards
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Create digital card
            </h2>
            <p className="text-xs text-slate-400">
              Provide the essentials and we will combine them with the selected template.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateCard} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                URL alias
              </label>
              <Input
                value={cardForm.urlAlias}
                onChange={(event) =>
                  handleCardFormChange('urlAlias', event.target.value.trim())
                }
                placeholder="your-brand"
                required
              />
              <p className="pt-1 text-xs text-slate-400">
                Accessible at /cards/&lt;alias&gt; once published.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Display name
              </label>
              <Input
                value={cardForm.displayName}
                onChange={(event) =>
                  handleCardFormChange('displayName', event.target.value)
                }
                placeholder="Display name on the card"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                First name
              </label>
              <Input
                value={cardForm.firstName}
                onChange={(event) =>
                  handleCardFormChange('firstName', event.target.value)
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last name
              </label>
              <Input
                value={cardForm.lastName}
                onChange={(event) =>
                  handleCardFormChange('lastName', event.target.value)
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </label>
              <Input
                type="email"
                value={cardForm.email}
                onChange={(event) =>
                  handleCardFormChange('email', event.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </label>
              <Input
                value={cardForm.phone}
                onChange={(event) =>
                  handleCardFormChange('phone', event.target.value)
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Company
              </label>
              <Input
                value={cardForm.company}
                onChange={(event) =>
                  handleCardFormChange('company', event.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Job title
              </label>
              <Input
                value={cardForm.jobTitle}
                onChange={(event) =>
                  handleCardFormChange('jobTitle', event.target.value)
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Website
              </label>
              <Input
                value={cardForm.website}
                onChange={(event) =>
                  handleCardFormChange('website', event.target.value)
                }
                placeholder="https://yourdomain.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Address
              </label>
              <Input
                value={cardForm.address}
                onChange={(event) =>
                  handleCardFormChange('address', event.target.value)
                }
                placeholder="City, Country"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Bio
            </label>
            <textarea
              value={cardForm.bio}
              onChange={(event) =>
                handleCardFormChange('bio', event.target.value)
              }
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Tell your visitors a little about yourself."
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Template selected:{' '}
              {cardForm.templateId
                ? templates.find((tpl) => tpl.id === cardForm.templateId)?.name ??
                  `#${cardForm.templateId}`
                : 'None yet'}
            </p>
            <Button
              type="submit"
              isLoading={cardSubmitting}
              disabled={!cardForm.templateId}
            >
              {cardForm.templateId ? 'Generate card' : 'Select a template first'}
            </Button>
          </div>

          {cardSuccess && (
            <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <p>{cardSuccess}</p>
              {cardSuccessAlias && origin && (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/cards/${cardSuccessAlias}`}
                    target="_blank"
                    className="text-indigo-700 underline"
                  >
                    View card
                  </Link>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void handleCopyLink(cardSuccessAlias)}
                    className="px-3 py-1 text-xs"
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Copy link
                  </Button>
                </div>
              )}
            </div>
          )}
        </form>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Your digital cards
            </h2>
            <p className="text-xs text-slate-400">Review recently created cards.</p>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            You have not created any cards yet. Use the form above to generate your first
            IVGK digital card.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <div key={card.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{card.name}</p>
                <p className="text-xs text-slate-500">/{card.urlAlias}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Updated {new Date(card.updatedAt).toLocaleDateString()}
                </p>
                {card.template?.name ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Template: {card.template.name}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    className="px-3 py-1 text-xs"
                    disabled={!selectedTemplateId || !!templateApplyLoading}
                    isLoading={templateApplyLoading === card.id}
                    onClick={() => void handleApplyTemplateToCard(card.id)}
                  >
                    Apply template
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-3 py-1 text-xs"
                    onClick={() => void openCardEditor(card.id)}
                  >
                    Manage content
                  </Button>
                  <Link href={`/cards/${card.urlAlias}`} target="_blank">
                    <Button variant="secondary" className="px-3 py-1 text-xs">
                      <ExternalLink className="mr-2 h-3 w-3" />
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => void handleCopyLink(card.urlAlias)}
                    className="px-3 py-1 text-xs"
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Copy link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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

      {editorLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60">
          <div className="rounded-lg bg-white px-4 py-3 text-sm text-slate-700 shadow-lg">
            Loading card editor…
          </div>
        </div>
      )}

      {editorError && !editorLoading && !editorCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60">
          <div className="space-y-3 rounded-lg bg-white px-5 py-4 text-sm text-slate-700 shadow-xl">
            <p>{editorError}</p>
            <div className="flex justify-end">
              <Button onClick={() => setEditorError(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {editorCard && (
        <CardEditor
          card={editorCard}
          onClose={() => {
            closeEditor();
            void loadWorkspaceData();
          }}
          onUpdated={(updatedCard) => {
            setEditorCard(updatedCard);
            void loadWorkspaceData();
          }}
        />
      )}
    </div>
  );
}
