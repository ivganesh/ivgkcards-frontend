import type { AuthUser } from '@/types/auth';

export type UserRole = AuthUser['role'];

const DASHBOARD_ROUTE_BY_ROLE: Record<UserRole, string> = {
  SUPER_ADMIN: '/dashboard/super-admin',
  ADMIN: '/dashboard/admin',
  USER: '/dashboard',
};

export const getDashboardRouteForRole = (role: UserRole | undefined) => {
  if (!role) {
    return '/dashboard';
  }
  return DASHBOARD_ROUTE_BY_ROLE[role] ?? '/dashboard';
};

