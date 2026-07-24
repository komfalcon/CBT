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
}

export interface BillingLog {
  reference: string;
  userId: string;
  planCode: string;
  amount: number;
  email: string;
  verifiedAt: string;
}
