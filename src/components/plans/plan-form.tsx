'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  PlanFeatureDefinition,
  PlanFormFeature,
  PlanFormValues,
  PlanSummary,
} from '@/types/plan';

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z
    .number()
    .refine((value) => !Number.isNaN(value), 'Price must be a number')
    .min(0, 'Price must be at least 0'),
  currencyId: z.string().min(1, 'Currency is required'),
  frequency: z.enum(['MONTHLY', 'YEARLY']),
  noOfVcards: z
    .number()
    .refine((value) => !Number.isNaN(value), 'Number of vCards must be a number')
    .int()
    .min(1, 'Allow at least 1 vCard'),
  storageLimit: z
    .number()
    .refine((value) => !Number.isNaN(value), 'Storage limit must be a number')
    .min(0, 'Storage limit must be at least 0'),
  trialDays: z
    .number()
    .refine((value) => !Number.isNaN(value), 'Trial days must be a number')
    .min(0, 'Trial days cannot be negative'),
  isDefault: z.boolean(),
  status: z.boolean(),
  features: z
    .array(
      z.object({
        feature: z.string().min(1, 'Feature name is required'),
        enabled: z.boolean(),
        limit: z
          .union([
            z
              .number()
              .refine((value) => !Number.isNaN(value), 'Limit must be a number')
              .min(0, 'Limit cannot be negative'),
            z.nan(),
          ])
          .optional(),
      }),
    )
    .default([]),
  templateIds: z.array(z.number()).default([]),
});

export type PlanSchema = z.infer<typeof planSchema>;

interface PlanFormProps {
  mode: 'create' | 'edit';
  initialValues?: PlanSummary;
  onSubmit: (values: PlanFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  availableTemplates: Array<{
    id: number;
    name: string;
    category?: string | null;
  }>;
  currencies: Array<{
    id: string;
    code: string;
    name: string;
    symbol: string | null;
  }>;
  featureCatalog: PlanFeatureDefinition[];
}

const defaultValues: PlanFormValues = {
  name: '',
  price: 0,
  currencyId: '',
  frequency: 'MONTHLY',
  noOfVcards: 1,
  storageLimit: 1024,
  trialDays: 0,
  isDefault: false,
  status: true,
  features: [],
  templateIds: [],
};

export function PlanForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  availableTemplates,
  currencies,
  featureCatalog,
}: PlanFormProps) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues,
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  const featureCatalogMap = useMemo(
    () =>
      new Map(featureCatalog.map((definition) => [definition.key, definition])),
    [featureCatalog],
  );

  const catalogKeySet = useMemo(() => {
    const set = new Set<string>();
    featureCatalog.forEach((definition) => set.add(definition.key));
    return set;
  }, [featureCatalog]);

  useEffect(() => {
    const baseFeatures: PlanFormFeature[] = featureCatalog.map((definition) => ({
      feature: definition.key,
      enabled: false,
      ...(definition.supportsLimit && typeof definition.defaultLimit === 'number'
        ? { limit: definition.defaultLimit }
        : {}),
    }));

    if (mode === 'edit' && initialValues) {
      const existingFeatures = new Map(
        (initialValues.features ?? []).map((feature) => [
          feature.feature,
          {
            feature: feature.feature,
            enabled: feature.enabled,
            ...(typeof feature.limit === 'number' ? { limit: feature.limit } : {}),
          },
        ]),
      );

      const mergedCatalogFeatures = baseFeatures.map((entry) => {
        const existing = existingFeatures.get(entry.feature);
        if (!existing) {
          return entry;
        }

        return {
          feature: entry.feature,
          enabled: existing.enabled,
          ...(entry.limit !== undefined && existing.enabled
            ? { limit: existing.limit ?? entry.limit }
            : existing.enabled && typeof existing.limit === 'number'
              ? { limit: existing.limit }
              : {}),
        };
      });

      const customFeatures =
        (initialValues.features ?? [])
          .filter((feature) => !catalogKeySet.has(feature.feature))
          .map<PlanFormFeature>((feature) => ({
            feature: feature.feature,
            enabled: feature.enabled,
            ...(typeof feature.limit === 'number' ? { limit: feature.limit } : {}),
          })) ?? [];

      reset({
        name: initialValues.name,
        price:
          typeof initialValues.price === 'number'
            ? initialValues.price
            : Number(initialValues.price ?? 0),
        currencyId: initialValues.currencyId,
        frequency: initialValues.frequency,
        noOfVcards: initialValues.noOfVcards,
        storageLimit: initialValues.storageLimit,
        trialDays: initialValues.trialDays,
        isDefault: initialValues.isDefault,
        status: initialValues.status,
        features: [...mergedCatalogFeatures, ...customFeatures],
        templateIds:
          initialValues.planTemplates?.map((planTemplate) => planTemplate.templateId) ??
          [],
      });
    } else {
      reset({
        ...defaultValues,
        currencyId: currencies[0]?.id ?? '',
        features: baseFeatures,
      });
    }
  }, [
    featureCatalog,
    catalogKeySet,
    initialValues,
    mode,
    reset,
    currencies,
  ]);

  const selectedTemplateIds =
    useWatch({
      control,
      name: 'templateIds',
    }) || [];

  const featuresValue =
    (useWatch({
      control,
      name: 'features',
    }) as PlanFormFeature[] | undefined) ?? [];

  const features = featuresValue;

  const setFeatures = useCallback(
    (next: PlanFormFeature[]) => {
      form.setValue('features', next, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const featureStateMap = useMemo(() => {
    const map = new Map<string, PlanFormFeature>();
    features.forEach((feature) => {
      map.set(feature.feature, feature);
    });
    return map;
  }, [features]);

  const setFeatureState = useCallback(
    (
      featureKey: string,
      updater: (previous: PlanFormFeature | undefined) => PlanFormFeature,
    ) => {
      const current = form.getValues('features') ?? [];
      const index = current.findIndex((entry) => entry.feature === featureKey);
      const updatedEntry = updater(index >= 0 ? current[index] : undefined);
      const next = [...current];

      if (index >= 0) {
        next[index] = updatedEntry;
      } else {
        next.push(updatedEntry);
      }

      setFeatures(next);
    },
    [form, setFeatures],
  );

  const handleFeatureToggle = useCallback(
    (definition: PlanFeatureDefinition, enabled: boolean) => {
      setFeatureState(definition.key, (previous) => ({
        feature: definition.key,
        enabled,
        ...(definition.supportsLimit && enabled
          ? {
              limit:
                typeof previous?.limit === 'number'
                  ? previous.limit
                  : definition.defaultLimit,
            }
          : {}),
      }));
    },
    [setFeatureState],
  );

  const handleFeatureLimitChange = useCallback(
    (definition: PlanFeatureDefinition, value: number | '') => {
      const parsed =
        typeof value === 'number'
          ? value
          : value === ''
            ? undefined
            : Number(value);

      const normalizedLimit =
        typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0
          ? Math.floor(parsed)
          : undefined;

      setFeatureState(definition.key, (previous) => {
        const isEnabled = previous?.enabled ?? false;
        return {
          feature: definition.key,
          enabled: isEnabled,
          ...(definition.supportsLimit && isEnabled && normalizedLimit !== undefined
            ? { limit: normalizedLimit }
            : definition.supportsLimit && isEnabled && normalizedLimit === undefined
              ? {}
              : {}),
        };
      });
    },
    [setFeatureState],
  );

  const addCustomFeature = useCallback(() => {
    setFeatures([
      ...features,
      {
        feature: '',
        enabled: true,
      },
    ]);
  }, [features, setFeatures]);

  const updateFeatureAtIndex = useCallback(
    (index: number, update: Partial<PlanFormFeature>) => {
      const current = form.getValues('features') ?? [];
      if (!current[index]) {
        return;
      }

      const next = [...current];
      next[index] = {
        ...next[index],
        ...update,
      };
      setFeatures(next);
    },
    [form, setFeatures],
  );

  const removeFeatureAtIndex = useCallback(
    (index: number) => {
      const current = form.getValues('features') ?? [];
      if (!current[index]) {
        return;
      }
      const next = [...current];
      next.splice(index, 1);
      setFeatures(next);
    },
    [form, setFeatures],
  );

  const customFeatures = useMemo(
    () =>
      features
        .map((feature, index) => ({ feature, index }))
        .filter(({ feature }) => !catalogKeySet.has(feature.feature)),
    [features, catalogKeySet],
  );

  const onValidSubmit = async (values: PlanFormValues) => {
    const sanitizedFeatureMap = new Map<string, PlanFormFeature>();

    (values.features ?? []).forEach((feature) => {
      if (!feature) return;
      const key = (feature.feature ?? '').trim();
      if (!key) return;

      const definition = featureCatalogMap.get(key);
      const enabled = Boolean(feature.enabled);

      let limit: number | undefined;
      if (
        typeof feature.limit === 'number' &&
        Number.isFinite(feature.limit) &&
        feature.limit >= 0
      ) {
        limit = Math.floor(feature.limit);
      }

      if (!enabled) {
        limit = undefined;
      }

      if (definition && !definition.supportsLimit) {
        limit = undefined;
      }

      sanitizedFeatureMap.set(key, {
        feature: key,
        enabled,
        ...(limit !== undefined ? { limit } : {}),
      });
    });

    const payload: PlanFormValues = {
      ...values,
      templateIds: values.templateIds ?? [],
      features: Array.from(sanitizedFeatureMap.values()),
    };

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(onValidSubmit)}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div className="space-y-4 md:w-2/3">
          <div>
            <Label htmlFor="name" error={!!errors.name}>
              Plan name
            </Label>
            <Input id="name" error={errors.name?.message} {...register('name')} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="price" error={!!errors.price}>
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="currencyId" error={!!errors.currencyId}>
                Currency
              </Label>
              {currencies.length > 0 ? (
                <>
                  <select
                    id="currencyId"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    {...register('currencyId')}
                  >
                    {currencies.map((currency) => {
                      const parts = [
                        currency.code,
                        currency.symbol ? `(${currency.symbol})` : null,
                        currency.name ? `— ${currency.name}` : null,
                      ].filter(Boolean);
                      return (
                        <option key={currency.id} value={currency.id}>
                          {parts.join(' ')}
                        </option>
                      );
                    })}
                  </select>
                  {errors.currencyId && (
                    <p className="pt-1 text-xs text-red-500">
                      {errors.currencyId.message}
                    </p>
                  )}
                </>
              ) : (
                <p className="rounded-md border border-dashed border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600">
                  No currencies found. Seed currencies in the backend before creating
                  plans.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="frequency" error={!!errors.frequency}>
                Billing frequency
              </Label>
              <select
                id="frequency"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                {...register('frequency')}
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
              {errors.frequency && (
                <p className="pt-1 text-xs text-red-500">
                  {errors.frequency.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="noOfVcards" error={!!errors.noOfVcards}>
                vCards allowed
              </Label>
              <Input
                id="noOfVcards"
                type="number"
                error={errors.noOfVcards?.message}
                {...register('noOfVcards', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="storageLimit" error={!!errors.storageLimit}>
                Storage limit (MB)
              </Label>
              <Input
                id="storageLimit"
                type="number"
                error={errors.storageLimit?.message}
                {...register('storageLimit', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="trialDays" error={!!errors.trialDays}>
                Trial days
              </Label>
              <Input
                id="trialDays"
                type="number"
                error={errors.trialDays?.message}
                {...register('trialDays', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                {...register('isDefault')}
              />
              Mark as default plan
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                {...register('status')}
              />
              Plan is active
            </label>
          </div>
        </div>

        <div className="space-y-4 md:w-1/3">
          <div>
            <div className="flex items-center justify-between">
              <Label>Templates included</Label>
              <span className="text-xs text-slate-400">
                {selectedTemplateIds.length} selected
              </span>
            </div>
            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {availableTemplates.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No templates available yet. Add templates to the catalog to map them
                  to plans.
                </p>
              ) : (
                availableTemplates.map((template) => (
                  <label
                    key={template.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      value={template.id}
                      checked={selectedTemplateIds.includes(template.id)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        const value = Number(event.target.value);
                        const current = new Set(selectedTemplateIds);
                        if (checked) {
                          current.add(value);
                        } else {
                          current.delete(value);
                        }
                        form.setValue('templateIds', Array.from(current));
                      }}
                    />
                    <span className="flex-1">
                      {template.name}
                      {template.category ? (
                        <span className="ml-2 text-xs uppercase text-slate-400">
                          {template.category}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div>
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-700">
                Digital card sections
              </Label>
              <p className="text-xs text-slate-500">
                Enable the sections that subscribers can use on their digital cards.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {featureCatalog
              .filter((definition) => definition.category === 'section')
              .map((definition) => {
                const featureState = featureStateMap.get(definition.key);
                const isEnabled = featureState?.enabled ?? false;
                const limitValue =
                  definition.supportsLimit && isEnabled && typeof featureState?.limit === 'number'
                    ? featureState.limit
                    : '';

                return (
                  <div
                    key={definition.key}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={isEnabled}
                        onChange={(event) =>
                          handleFeatureToggle(definition, event.target.checked)
                        }
                      />
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {definition.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {definition.description}
                          </p>
                        </div>
                        {definition.supportsLimit ? (
                          <div className="space-y-1">
                            <Label
                              htmlFor={`limit-${definition.key}`}
                              className="text-xs font-medium text-slate-500"
                            >
                              {definition.limitLabel ?? 'Limit'}
                            </Label>
                            <Input
                              id={`limit-${definition.key}`}
                              type="number"
                              min={0}
                              disabled={!isEnabled}
                              value={isEnabled ? limitValue : ''}
                              onChange={(event) =>
                                handleFeatureLimitChange(
                                  definition,
                                  event.target.value === ''
                                    ? ''
                                    : Number(event.target.value),
                                )
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </label>
                  </div>
                );
              })}
            {featureCatalog.filter((definition) => definition.category === 'section').length ===
            0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-100 px-3 py-4 text-sm text-slate-500 md:col-span-2">
                No section features configured yet.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-700">
                Additional capabilities
              </Label>
              <p className="text-xs text-slate-500">
                Unlock optional platform capabilities and integrations.
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {featureCatalog
              .filter((definition) => definition.category !== 'section')
              .map((definition) => {
                const featureState = featureStateMap.get(definition.key);
                const isEnabled = featureState?.enabled ?? false;
                const limitValue =
                  definition.supportsLimit && isEnabled && typeof featureState?.limit === 'number'
                    ? featureState.limit
                    : '';

                return (
                  <div
                    key={definition.key}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={isEnabled}
                        onChange={(event) =>
                          handleFeatureToggle(definition, event.target.checked)
                        }
                      />
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {definition.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {definition.description}
                          </p>
                        </div>
                        {definition.supportsLimit ? (
                          <div className="space-y-1">
                            <Label
                              htmlFor={`capability-limit-${definition.key}`}
                              className="text-xs font-medium text-slate-500"
                            >
                              {definition.limitLabel ?? 'Limit'}
                            </Label>
                            <Input
                              id={`capability-limit-${definition.key}`}
                              type="number"
                              min={0}
                              disabled={!isEnabled}
                              value={isEnabled ? limitValue : ''}
                              onChange={(event) =>
                                handleFeatureLimitChange(
                                  definition,
                                  event.target.value === ''
                                    ? ''
                                    : Number(event.target.value),
                                )
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </label>
                  </div>
                );
              })}
            {featureCatalog.filter((definition) => definition.category !== 'section').length ===
            0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-100 px-3 py-4 text-sm text-slate-500">
                No additional capabilities configured yet.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-700">
                Custom features
              </Label>
              <p className="text-xs text-slate-500">
                Use this section for experimental or custom feature flags.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={addCustomFeature}>
              Add custom feature
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {customFeatures.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                No custom features configured. Use &quot;Add custom feature&quot; to include
                bespoke capabilities outside the standard catalog.
              </p>
            ) : (
              customFeatures.map(({ feature, index }) => (
                <div
                  key={`custom-feature-${index}`}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-12"
                >
                  <div className="md:col-span-5">
                    <Label className="text-xs font-medium text-slate-500">
                      Feature key
                    </Label>
                    <Input
                      value={feature.feature}
                      onChange={(event) =>
                        updateFeatureAtIndex(index, {
                          feature: event.target.value,
                        })
                      }
                      placeholder="e.g. premium_support"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs font-medium text-slate-500">
                      Status
                    </Label>
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                      value={feature.enabled ? 'enabled' : 'disabled'}
                      onChange={(event) =>
                        updateFeatureAtIndex(index, {
                          enabled: event.target.value === 'enabled',
                          ...(event.target.value !== 'enabled' ? { limit: undefined } : {}),
                        })
                      }
                    >
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs font-medium text-slate-500">
                      Limit (optional)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={
                        typeof feature.limit === 'number' && Number.isFinite(feature.limit)
                          ? feature.limit
                          : ''
                      }
                      onChange={(event) =>
                        updateFeatureAtIndex(index, {
                          limit:
                            event.target.value === ''
                              ? undefined
                              : Number.isFinite(Number(event.target.value)) &&
                                  Number(event.target.value) >= 0
                                ? Math.floor(Number(event.target.value))
                                : undefined,
                        })
                      }
                      disabled={!feature.enabled}
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs text-red-600 hover:text-red-700"
                      onClick={() => removeFeatureAtIndex(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'create' ? 'Create plan' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

