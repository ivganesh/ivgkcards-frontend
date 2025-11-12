import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CurrencyFormValues } from '@/types/currency';

const currencySchema = z.object({
  code: z
    .string()
    .min(3, 'Currency code must be three characters')
    .max(3, 'Currency code must be three characters')
    .regex(/^[A-Z]{3}$/, 'Use an uppercase ISO 4217 code (e.g., USD)'),
  name: z.string().min(1, 'Currency name is required').max(80),
  symbol: z.string().min(1, 'Symbol is required').max(8),
  isActive: z.boolean(),
});

export type CurrencySchema = z.infer<typeof currencySchema>;

interface CurrencyFormProps {
  mode: 'create' | 'edit';
  initialValues?: CurrencyFormValues & { code?: string };
  onSubmit: (values: CurrencyFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const defaultValues: CurrencyFormValues = {
  code: '',
  name: '',
  symbol: '',
  isActive: true,
};

export function CurrencyForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: CurrencyFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencySchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset({
        code: initialValues.code,
        name: initialValues.name,
        symbol: initialValues.symbol,
        isActive: initialValues.isActive,
      });
    } else {
      reset(defaultValues);
    }
  }, [mode, initialValues, reset]);

  const handleValidSubmit = async (values: CurrencyFormValues) => {
    const payload: CurrencyFormValues = {
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      symbol: values.symbol.trim(),
      isActive: values.isActive,
    };

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit)}
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="currency-code" error={!!errors.code}>
            Currency code
          </Label>
          <Input
            id="currency-code"
            placeholder="e.g. USD"
            error={errors.code?.message}
            {...register('code')}
            disabled={mode === 'edit'}
          />
        </div>
        <div>
          <Label htmlFor="currency-symbol" error={!!errors.symbol}>
            Symbol
          </Label>
          <Input
            id="currency-symbol"
            placeholder="$"
            error={errors.symbol?.message}
            {...register('symbol')}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="currency-name" error={!!errors.name}>
          Currency name
        </Label>
        <Input
          id="currency-name"
          placeholder="United States Dollar"
          error={errors.name?.message}
          {...register('name')}
        />
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          {...register('isActive')}
        />
        Currency is active
      </label>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'create' ? 'Add currency' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

