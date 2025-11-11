'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { authStorage } from '@/lib/auth-storage';
import { getDashboardRouteForRole } from '@/lib/role-utils';
import type { LoginResponse } from '@/types/auth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    setError(null);
    try {
      const response = await api.post<LoginResponse>('/auth/login', values);
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
          'Invalid email or password';
        setError(message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" error={!!errors.email}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@ivgkcards.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" error={!!errors.password}>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Sign in
      </Button>

      <div className="space-y-2 text-center text-xs text-slate-500">
        <p>
          Use your platform credentials. Default super admin:{' '}
          admin@ivgkcards.com / Admin@123456
        </p>
        <p>
          New to IVGK Digital Cards?{' '}
          <Link href="/register" className="font-semibold text-indigo-600">
            Create an account
          </Link>
        </p>
      </div>
    </form>
  );
}
