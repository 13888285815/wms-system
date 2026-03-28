import { Plan, PlanId, BillingCycle, SubscriptionState, BillingRecord, VerificationStatus } from '../types/subscription';

const STORAGE_KEY = 'wms_subscription';

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    aiTokens: 10_000,
    tokenPrice: 0,        // can't purchase on free
    warehouses: 1,
    users: 3,
    features: [
      '1 warehouse',
      '3 team members',
      '10,000 AI tokens/mo',
      'Basic inventory management',
      'CSV export',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 49,
    annualPrice: 39,      // per month, billed annually
    aiTokens: 500_000,
    tokenPrice: 1.5,      // $1.50 per 1000 extra tokens
    warehouses: 10,
    users: 25,
    features: [
      '10 warehouses',
      '25 team members',
      '500,000 AI tokens/mo',
      'Advanced analytics',
      'API access',
      'Priority email support',
      'Custom integrations',
      'Audit logs',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 199,
    annualPrice: 159,
    aiTokens: -1,         // unlimited
    tokenPrice: 0.8,
    warehouses: -1,
    users: -1,
    features: [
      'Unlimited warehouses',
      'Unlimited users',
      'Unlimited AI tokens',
      'Dedicated account manager',
      'SLA 99.9% uptime',
      'Custom SSO / SAML',
      'On-premise deployment',
      '24/7 phone support',
    ],
  },
];

function nowStr() { return new Date().toISOString().split('T')[0]; }
function addDays(date: string, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function generateId() { return Math.random().toString(36).substr(2, 9); }

const defaultState = (): SubscriptionState => ({
  subscription: {
    planId: 'free',
    status: 'active',
    cycle: 'monthly',
    startDate: nowStr(),
    renewalDate: addDays(nowStr(), 30),
    cancelAtPeriodEnd: false,
  },
  tokenBalance: {
    included: 10_000,
    purchased: 0,
    used: 0,
    lastReset: nowStr(),
  },
  billing: [],
  emailVerification: 'unverified',
});

class SubscriptionStore {
  private state: SubscriptionState;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.state = saved ? JSON.parse(saved) : defaultState();
  }

  private save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); }

  getState() { return this.state; }
  getPlan(id: PlanId) { return PLANS.find(p => p.id === id)!; }
  getCurrentPlan() { return this.getPlan(this.state.subscription.planId); }

  // ─── Email Verification ───────────────────────────────────────────────────

  sendVerificationCode(): string {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
    this.state.verificationCode = code;
    this.state.verificationExpiry = expiry;
    this.state.emailVerification = 'pending';
    this.save();
    // In production: send real email. Demo: return code to display
    console.log(`[DEMO] Verification code: ${code}`);
    return code;
  }

  verifyCode(code: string): { success: boolean; message: string } {
    if (this.state.emailVerification === 'verified') return { success: true, message: 'Already verified' };
    if (!this.state.verificationCode || !this.state.verificationExpiry) {
      return { success: false, message: 'No verification pending' };
    }
    if (new Date(this.state.verificationExpiry) < new Date()) {
      return { success: false, message: 'Code expired' };
    }
    if (code !== this.state.verificationCode) {
      return { success: false, message: 'Invalid code' };
    }
    this.state.emailVerification = 'verified';
    this.state.verificationCode = undefined;
    this.state.verificationExpiry = undefined;
    this.save();
    return { success: true, message: 'Email verified successfully' };
  }

  // ─── Subscription Management ──────────────────────────────────────────────

  upgrade(planId: PlanId, cycle: BillingCycle): BillingRecord {
    const plan = this.getPlan(planId);
    const price = cycle === 'annual'
      ? plan.annualPrice * 12
      : plan.monthlyPrice;

    const record: BillingRecord = {
      id: generateId(),
      date: nowStr(),
      description: `${plan.name} Plan – ${cycle === 'annual' ? 'Annual' : 'Monthly'} subscription`,
      amount: price,
      status: 'paid',
      type: 'subscription',
    };

    this.state.subscription = {
      planId,
      status: 'active',
      cycle,
      startDate: nowStr(),
      renewalDate: addDays(nowStr(), cycle === 'annual' ? 365 : 30),
      cancelAtPeriodEnd: false,
    };

    // Reset token balance for new plan
    const included = plan.aiTokens === -1 ? 999_999_999 : plan.aiTokens;
    this.state.tokenBalance = {
      included,
      purchased: 0,
      used: 0,
      lastReset: nowStr(),
    };

    this.state.billing.unshift(record);
    this.save();
    return record;
  }

  cancelSubscription() {
    this.state.subscription.cancelAtPeriodEnd = true;
    this.save();
  }

  reactivate() {
    this.state.subscription.cancelAtPeriodEnd = false;
    this.save();
  }

  // ─── AI Token Management ──────────────────────────────────────────────────

  purchaseTokens(amount: number): BillingRecord | { error: string } {
    const plan = this.getCurrentPlan();
    if (plan.tokenPrice === 0) return { error: 'Token purchase not available on Free plan' };

    const cost = (amount / 1000) * plan.tokenPrice;
    const record: BillingRecord = {
      id: generateId(),
      date: nowStr(),
      description: `AI Tokens top-up: ${amount.toLocaleString()} tokens`,
      amount: parseFloat(cost.toFixed(2)),
      status: 'paid',
      type: 'token_purchase',
    };

    this.state.tokenBalance.purchased += amount;
    this.state.billing.unshift(record);
    this.save();
    return record;
  }

  consumeTokens(amount: number): boolean {
    const { included, purchased, used } = this.state.tokenBalance;
    const plan = this.getCurrentPlan();
    const total = plan.aiTokens === -1 ? Infinity : (included + purchased);
    if (used + amount > total) return false;
    this.state.tokenBalance.used += amount;
    this.save();
    return true;
  }

  getTokensAvailable(): number {
    const plan = this.getCurrentPlan();
    if (plan.aiTokens === -1) return Infinity;
    const { included, purchased, used } = this.state.tokenBalance;
    return Math.max(0, included + purchased - used);
  }

  resetMonthlyTokens() {
    const plan = this.getCurrentPlan();
    const included = plan.aiTokens === -1 ? 999_999_999 : plan.aiTokens;
    this.state.tokenBalance.included = included;
    this.state.tokenBalance.used = 0;
    this.state.tokenBalance.lastReset = nowStr();
    this.save();
  }

  // Demo: simulate AI API call that consumes tokens
  simulateApiCall(modelName: string, inputTokens: number, outputTokens: number): {
    success: boolean;
    tokensUsed: number;
    cost?: number;
    error?: string;
  } {
    const total = inputTokens + outputTokens;
    const ok = this.consumeTokens(total);
    if (!ok) {
      return { success: false, tokensUsed: 0, error: 'Insufficient token balance' };
    }
    const plan = this.getCurrentPlan();
    const cost = plan.tokenPrice > 0 ? parseFloat(((total / 1000) * plan.tokenPrice).toFixed(4)) : 0;
    return { success: true, tokensUsed: total, cost };
  }
}

export const subscriptionStore = new SubscriptionStore();
