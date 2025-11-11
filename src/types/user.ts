import type { UserRole } from '@/types/auth';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    vcards: number;
    tenantUsers: number;
  };
}

export interface UsersListResponse {
  items: UserSummary[];
  total: number;
  skip: number;
  take: number;
}

export interface UserStatsResponse {
  totals: {
    users: number;
    activeUsers: number;
    superAdmins: number;
  };
  recentUsers: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
    isEmailVerified: boolean;
    createdAt: string;
  }>;
  recentCardEdits: Array<{
    vcardId: string;
    updatedAt: string;
    owner: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
    cardName: string;
  }>;
}

