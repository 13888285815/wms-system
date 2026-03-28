export type PlanId = 'free' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
export type VerificationStatus = 'unverified' | 'pending' | 'verified';

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number;   // USD
  annualPrice: number;    // USD/mo billed annually
  aiTokens: number;       // included tokens per month (0 = none)
  tokenPrice: number;     // USD per 1000 extra tokens
  warehouses: number;     // max warehouses (-1 = unlimited)
  users: number;          // max team members (-1 = unlimited)
  features: string[];
  highlighted?: boolean;
}

export interface Subscription {
  planId: PlanId;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  startDate: string;
  renewalDate: string;
  cancelAtPeriodEnd: boolean;
}

export interface AITokenBalance {
  included: number;       // plan-included tokens (resets monthly)
  purchased: number;      // extra purchased tokens
  used: number;           // used this period
  lastReset: string;      // ISO date of last monthly reset
}

export interface BillingRecord {
  id: string;
  date: string;
  description: string;
  amount: number;         // USD
  status: 'paid' | 'pending' | 'failed';
  type: 'subscription' | 'token_purchase' | 'refund';
}

export interface SubscriptionState {
  subscription: Subscription;
  tokenBalance: AITokenBalance;
  billing: BillingRecord[];
  emailVerification: VerificationStatus;
  verificationCode?: string;   // 6-digit code (demo only)
  verificationExpiry?: string;
}
