import type { PlanFrequency, UserRole } from '@/types/auth';

export interface PlanFeature {
  id?: string;
  feature: string;
  enabled: boolean;
  limit?: number | null;
}

export interface PlanTemplateAccess {
  templateId: number;
  template?: {
    id: number;
    name: string;
    category?: string | null;
  };
}

export interface PlanSummary {
  id: string;
  name: string;
  price: number | string;
  currencyId: string;
  frequency: PlanFrequency;
  noOfVcards: number;
  storageLimit: number;
  trialDays: number;
  isDefault: boolean;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  currency?: {
    code: string;
    name: string;
    symbol: string | null;
  };
  features: PlanFeature[];
  planTemplates: PlanTemplateAccess[];
  _count?: {
    subscriptions: number;
  };
}

export interface PlanFormFeature {
  feature: string;
  enabled: boolean;
  limit?: number;
}

export interface PlanFormValues {
  name: string;
  price: number;
  currencyId: string;
  frequency: PlanFrequency;
  noOfVcards: number;
  storageLimit: number;
  trialDays: number;
  isDefault: boolean;
  status: boolean;
  features?: PlanFormFeature[];
  templateIds?: number[];
}

export type PlanUserRole = Extract<UserRole, 'SUPER_ADMIN' | 'ADMIN' | 'USER'>;

