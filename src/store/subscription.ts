import { Plan, PlanId, BillingCycle, SubscriptionState, BillingRecord } from '../types/subscription';

const STORAGE_KEY = 'wms_subscription';

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    aiTokens: 10_000,
    tokenPrice: 0,
    warehouses: 1,
    users: 3,
    features: [
      '1个仓库',
      '3个团队成员',
      '每月10,000 AI Token',
      '基础库存管理',
      'CSV数据导出',
      '社区支持',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    monthlyPrice: 49,
    annualPrice: 39,
    aiTokens: 500_000,
    tokenPrice: 1.5,
    warehouses: 10,
    users: 25,
    features: [
      '10个仓库',
      '25个团队成员',
      '每月500,000 AI Token',
      '高级数据分析',
      'API接入',
      '优先邮件支持',
      '自定义集成',
      '操作审计日志',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 199,
    annualPrice: 159,
    aiTokens: -1,
    tokenPrice: 0.8,
    warehouses: -1,
    users: -1,
    features: [
      '无限仓库',
      '无限用户',
      '无限AI Token',
      '专属客户经理',
      '99.9% SLA保障',
      '企业SSO/SAML',
      '私有化部署选项',
      '7×24小时电话支持',
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
    console.log(`[DEMO] Verification code: ${code}`);
    return code;
  }

  verifyCode(code: string): { success: boolean; message: string } {
    if (this.state.emailVerification === 'verified') return { success: true, message: '已验证' };
    if (!this.state.verificationCode || !this.state.verificationExpiry) {
      return { success: false, message: '没有待处理的验证' };
    }
    if (new Date(this.state.verificationExpiry) < new Date()) {
      return { success: false, message: '验证码已过期' };
    }
    if (code !== this.state.verificationCode) {
      return { success: false, message: '验证码无效' };
    }
    this.state.emailVerification = 'verified';
    this.state.verificationCode = undefined;
    this.state.verificationExpiry = undefined;
    this.save();
    return { success: true, message: '邮箱验证成功' };
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
      description: `${plan.name} 套餐 – ${cycle === 'annual' ? '按年' : '按月'} 订阅`,
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
    if (plan.tokenPrice === 0) return { error: 'Starter 套餐无法单独购买 Token' };

    const cost = (amount / 1000) * plan.tokenPrice;
    const record: BillingRecord = {
      id: generateId(),
      date: nowStr(),
      description: `AI Token 充值: ${amount.toLocaleString()} tokens`,
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

  simulateApiCall(modelName: string, inputTokens: number, outputTokens: number): {
    success: boolean;
    tokensUsed: number;
    cost?: number;
    error?: string;
  } {
    const total = inputTokens + outputTokens;
    const ok = this.consumeTokens(total);
    if (!ok) {
      return { success: false, tokensUsed: 0, error: 'Token 余额不足' };
    }
    const plan = this.getCurrentPlan();
    const cost = plan.tokenPrice > 0 ? parseFloat(((total / 1000) * plan.tokenPrice).toFixed(4)) : 0;
    return { success: true, tokensUsed: total, cost };
  }
}

export const subscriptionStore = new SubscriptionStore();
