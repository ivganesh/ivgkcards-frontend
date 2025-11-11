'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserSummary } from '@/types/user';
import type { UserRole } from '@/types/auth';

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
  isEmailVerified: z.boolean(),
});

export type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  mode: 'create' | 'edit';
  initialUser?: UserSummary;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const defaultValues: UserFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'USER',
  password: undefined,
  isEmailVerified: false,
};

export function UserForm({
  mode,
  initialUser,
  onSubmit,
  onCancel,
  isSubmitting,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setError,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === 'edit' && initialUser) {
      reset({
        firstName: initialUser.firstName ?? '',
        lastName: initialUser.lastName ?? '',
        email: initialUser.email,
        role: initialUser.role as UserRole,
        password: undefined,
        isEmailVerified: initialUser.isEmailVerified,
      });
    } else {
      reset(defaultValues);
    }
  }, [initialUser, mode, reset]);

  const selectedRole = useWatch({
    control,
    name: 'role',
  });

  const handleValidSubmit = async (values: UserFormValues) => {
    if (mode === 'create' && (!values.password || values.password.length === 0)) {
      setError('password', {
        type: 'manual',
        message: 'Password is required when creating a user',
      });
      return;
    }

    const payload = {
      ...values,
      password:
        mode === 'edit' && !values.password ? undefined : values.password,
    };

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit)}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="firstName" error={!!errors.firstName}>
            First name
          </Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
        </div>
        <div>
          <Label htmlFor="lastName" error={!!errors.lastName}>
            Last name
          </Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="email" error={!!errors.email}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
        <div>
          <Label htmlFor="role" error={!!errors.role}>
            Role
          </Label>
          <select
            id="role"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            {...register('role')}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          {errors.role && (
            <p className="pt-1 text-xs text-red-500">{errors.role.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="password" error={!!errors.password}>
          {mode === 'create' ? 'Password' : 'Password (leave blank to keep)'}
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder={mode === 'edit' ? '••••••••' : 'Enter a secure password'}
          error={errors.password?.message}
          {...register('password')}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            {...register('isEmailVerified')}
          />
          Email verified
        </label>
        {selectedRole === 'SUPER_ADMIN' && (
          <span className="text-xs text-amber-600">
            Ensure only trusted accounts have super admin access.
          </span>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'create' ? 'Create user' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

