export interface OverviewStats {
  candidates: { total: number; vouchers: number };
  subscriptions: { active: number };
  exams: { total: number; today: number; yesterday: number };
  revenue: { total: number };
}

export interface UserAccount {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  account_status: string;
  subscription_tier: string;
  cbt_key?: string;
  created_at: string;
  streak_count?: number;
  xp_points?: number;
  exam_subject_combination?: string[];
  phone?: string;
  last_login?: string;
}

export interface BillingLog {
  reference: string;
  userId: string;
  planCode: string;
  amount: number;
  email: string;
  verifiedAt: string;
}

export interface MaintenanceStatusResponse {
  isMaintenance: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ToggleMaintenanceResponse {
  success: boolean;
  isMaintenance: boolean;
  message: string;
  updatedAt?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}
