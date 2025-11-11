export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';
export type TenantType = 'PERSONAL' | 'ORGANIZATION';
export type TenantRole = 'OWNER' | 'ADMIN' | 'USER';
export type PlanFrequency = 'MONTHLY' | 'YEARLY';

export interface ActiveSubscriptionSummary {
  id: string;
  planId: string;
  planName: string | null;
  planFrequency: PlanFrequency | null;
  status: 'ACTIVE' | 'TRIAL' | 'CANCELED' | 'EXPIRED' | 'SUSPENDED';
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
}

export interface TenantMembership {
  tenantId: string;
  tenantDomain: string;
  tenantType: TenantType;
  membershipRole: TenantRole;
  isPersonalTenant: boolean;
  activeSubscription: ActiveSubscriptionSummary | null;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  defaultTenantId: string | null;
  tenants: TenantMembership[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}
