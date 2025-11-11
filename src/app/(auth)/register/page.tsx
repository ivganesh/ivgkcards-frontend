'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { authStorage } from '@/lib/auth-storage';
import { getDashboardRouteForRole } from '@/lib/role-utils';
import type { LoginResponse } from '@/types/auth';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/,
        'Include upper, lower case letters and a number',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

type RegisterSchema = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterSchema) => {
    setError(null);
    try {
      const response = await api.post<LoginResponse>('/auth/register', {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });

      authStorage.save(
        {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        },
        response.data.user,
      );

      const destination = getDashboardRouteForRole(response.data.user.role);
      router.push(destination);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { message?: string })?.message ??
          'Unable to register with those details';
        setError(message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
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
        <div className="space-y-2">
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

      <div className="space-y-2">
        <Label htmlFor="email" error={!!errors.email}>
          Work email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@ivgkcards.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password" error={!!errors.password}>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" error={!!errors.confirmPassword}>
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Create your account
      </Button>

      <div className="space-y-2 text-center text-xs text-slate-500">
        <p>
          You can upgrade to paid plans or invite team members after sign-in.
        </p>
        <p>
          Already onboarded?{' '}
          <Link href="/login" className="font-semibold text-indigo-600">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}

