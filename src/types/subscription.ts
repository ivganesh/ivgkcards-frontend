import type { PlanSummary } from '@/types/plan';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIAL'
  | 'CANCELED'
  | 'EXPIRED'
  | 'SUSPENDED';

export interface SubscriptionSummary {
  id: string;
  planId: string;
  tenantId: string;
  userId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
  canceledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  plan: PlanSummary & {
    currency?: {
      code: string;
      name: string;
      symbol: string | null;
    };
  };
}

