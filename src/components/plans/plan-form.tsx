'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { currencyOptions } from '@/data/currencies';
import type { PlanFormFeature, PlanFormValues, PlanSummary } from '@/types/plan';

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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'features',
  });

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset({
        name: initialValues.name,
        price: initialValues.price,
        currencyId: initialValues.currencyId,
        frequency: initialValues.frequency,
        noOfVcards: initialValues.noOfVcards,
        storageLimit: initialValues.storageLimit,
        trialDays: initialValues.trialDays,
        isDefault: initialValues.isDefault,
        status: initialValues.status,
        features:
          initialValues.features?.map<PlanFormFeature>((feature) => ({
            feature: feature.feature,
            enabled: feature.enabled,
            limit:
              feature.limit === null || typeof feature.limit === 'undefined'
                ? undefined
                : feature.limit,
          })) ?? [],
        templateIds:
          initialValues.planTemplates?.map((planTemplate) => planTemplate.templateId) ??
          [],
      });
    } else {
      reset({
        ...defaultValues,
        currencyId: currencies[0]?.id ?? '',
      });
    }
  }, [initialValues, mode, reset, currencies]);

  const selectedTemplateIds = useWatch({
    control,
    name: 'templateIds',
  }) || [];

  const handleFeatureAdd = () => {
    append({ feature: '', enabled: true, limit: undefined });
  };

  const onValidSubmit = async (values: PlanFormValues) => {
    const sanitizedFeatures =
      values.features?.map<PlanFormFeature>((feature) => ({
        ...feature,
        limit:
          typeof feature.limit === 'number' && !Number.isNaN(feature.limit)
            ? feature.limit
            : undefined,
      })) ?? [];

    const payload: PlanFormValues = {
      ...values,
      templateIds: values.templateIds ?? [],
      features: sanitizedFeatures,
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
                      const meta = currencyOptions.find(
                        (option) => option.code === currency.code,
                      );
                      const label = meta
                        ? `${meta.code} — ${meta.name}`
                        : `${currency.code}`;
                      return (
                        <option key={currency.id} value={currency.id}>
                          {label}
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

      <div>
        <div className="flex items-center justify-between">
          <Label>Plan features</Label>
          <Button type="button" variant="secondary" onClick={handleFeatureAdd}>
            Add feature
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {fields.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No features added yet. Use &quot;Add feature&quot; to include plan
              capabilities. Features help determine what tenants unlock.
            </p>
          ) : (
            fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-12"
              >
                <div className="md:col-span-5">
                  <Label htmlFor={`feature-${index}`} error={!!errors.features?.[index]?.feature}>
                    Feature name
                  </Label>
                  <Input
                    id={`feature-${index}`}
                    error={errors.features?.[index]?.feature?.message}
                    {...register(`features.${index}.feature` as const)}
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor={`limit-${index}`} error={!!errors.features?.[index]?.limit}>
                    Limit (optional)
                  </Label>
                  <Input
                    id={`limit-${index}`}
                    type="number"
                    placeholder="Unlimited"
                    error={
                      errors.features?.[index]?.limit &&
                      'Limit must be a positive number'
                    }
                    {...register(`features.${index}.limit` as const, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    {...register(`features.${index}.enabled` as const)}
                  />
                  <span className="text-sm text-slate-600">Enabled</span>
                </div>
                <div className="flex items-center justify-end md:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm text-red-500 hover:text-red-600"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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

