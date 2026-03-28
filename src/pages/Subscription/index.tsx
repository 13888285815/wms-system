import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  CreditCard,
  Zap,
  History,
  Info,
  AlertTriangle,
  X,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Database,
  Cpu,
} from 'lucide-react';
import { subscriptionStore, PLANS } from '../../store/subscription';
import {
  Plan,
  PlanId,
  BillingCycle,
  SubscriptionState,
  BillingRecord,
  VerificationStatus,
} from '../../types/subscription';

const SubscriptionPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'plans' | 'billing' | 'api'>('plans');
  const [cycle, setCycle] = useState<BillingCycle>('annual');
  const [state, setState] = useState<SubscriptionState>(subscriptionStore.getState());
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  // Sync state from store
  const refreshState = () => {
    setState({ ...subscriptionStore.getState() });
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleVerifyEmail = () => {
    subscriptionStore.sendVerificationCode();
    setIsVerifying(true);
  };

  const submitVerification = () => {
    const res = subscriptionStore.verifyCode(verificationCode);
    if (res.success) {
      setIsVerifying(false);
      refreshState();
    } else {
      alert(res.message);
    }
  };

  const currentPlan = subscriptionStore.getCurrentPlan();

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Email Verification Banner */}
      {state.emailVerification !== 'verified' && (
        <div className="bg-amber-50 border-b border-amber-100 py-3 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-amber-800">
              {t('Please verify your email to secure your account.')}
            </span>
          </div>
          <button
            onClick={handleVerifyEmail}
            className="text-sm font-semibold text-amber-900 bg-amber-200 px-4 py-1.5 rounded-full hover:bg-amber-300 transition-colors"
          >
            {t('Send Code')}
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pt-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('Subscription')}</h1>
          <p className="text-gray-500 mt-2">{t('Manage your plan, billing, and AI token usage.')}</p>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
          {(['plans', 'billing', 'api'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all
                ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab === 'plans' && t('Plans')}
              {tab === 'billing' && t('Billing')}
              {tab === 'api' && t('API Usage')}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'plans' && (
            <PlansTab cycle={cycle} setCycle={setCycle} state={state} onUpdate={refreshState} />
          )}
          {activeTab === 'billing' && (
            <BillingTab
              state={state}
              onUpdate={refreshState}
              onOpenTokenModal={() => setIsTokenModalOpen(true)}
            />
          )}
          {activeTab === 'api' && <ApiTab state={state} onUpdate={refreshState} />}
        </div>
      </div>

      {/* Verification Modal */}
      {isVerifying && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('Verify your email')}</h3>
            <p className="text-sm text-gray-500 mb-6">
              {t('Enter the 6-digit code we sent to your email address.')}
            </p>
            <input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:outline-none transition-all mb-6"
              placeholder="000000"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsVerifying(false)}
                className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={submitVerification}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-200 transition-all"
              >
                {t('Verify')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Purchase Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t('Buy More Tokens')}</h3>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-8">
              {t('Need more power? Purchase additional tokens for your AI tasks. Purchased tokens do not expire.')}
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[50_000, 100_000, 500_000, 1_000_000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    const res = subscriptionStore.purchaseTokens(amount);
                    if ('error' in res) {
                      alert(res.error);
                    } else {
                      setIsTokenModalOpen(false);
                      refreshState();
                    }
                  }}
                  className="p-4 border border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700">
                    {(amount / 1000).toLocaleString()}K {t('Tokens')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ${((amount / 1000) * (currentPlan.tokenPrice || 0)).toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
            <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-500" />
              <p className="text-xs text-gray-600">
                {t('You are charged')} ${currentPlan.tokenPrice} {t('per 1,000 extra tokens.')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PlansTab: React.FC<{
  cycle: BillingCycle;
  setCycle: (c: BillingCycle) => void;
  state: SubscriptionState;
  onUpdate: () => void;
}> = ({ cycle, setCycle, state, onUpdate }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center p-1.5 bg-gray-100 rounded-full mb-8">
          <button
            onClick={() => setCycle('monthly')}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-all ${
              cycle === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('Monthly')}
          </button>
          <button
            onClick={() => setCycle('annual')}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-all relative ${
              cycle === 'annual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('Annual')}
            <span className="absolute -top-3 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {t('Save 20%')}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => {
          const isCurrent = state.subscription.planId === plan.id;
          const price = cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`
                relative bg-white rounded-3xl p-8 border transition-all duration-300
                ${plan.highlighted ? 'border-blue-500 shadow-xl shadow-blue-100 scale-105 z-1' : 'border-gray-200 hover:border-gray-300 shadow-sm'}
              `}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  {t('Most Popular')}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">${price}</span>
                  <span className="text-gray-500 text-sm">/{t('mo')}</span>
                </div>
                {cycle === 'annual' && plan.id !== 'free' && (
                  <p className="text-xs text-green-600 font-medium mt-1">{t('Billed annually')}</p>
                )}
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    {plan.aiTokens === -1 ? t('Unlimited AI Tokens') : `${plan.aiTokens.toLocaleString()} ${t('Tokens/mo')}`}
                  </span>
                </div>
                {plan.tokenPrice > 0 && (
                  <p className="text-xs text-gray-400 pl-8 -mt-3">
                    {t('Overage:')} ${plan.tokenPrice}/1k {t('tokens')}
                  </p>
                )}

                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600 leading-tight">{feature}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  {t('Current Plan')}
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      subscriptionStore.upgrade(plan.id, cycle);
                      onUpdate();
                    }}
                    className={`
                      w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all
                      ${plan.id === 'pro' || plan.id === 'enterprise' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100' 
                        : 'bg-gray-900 text-white hover:bg-black'}
                    `}
                  >
                    {t('Upgrade')}
                  </button>
                  {plan.id === 'free' && (
                    <button
                      onClick={() => {
                        subscriptionStore.upgrade(plan.id, 'monthly');
                        onUpdate();
                      }}
                      className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-transparent text-gray-500 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                    >
                      {t('Downgrade')}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BillingTab: React.FC<{
  state: SubscriptionState;
  onUpdate: () => void;
  onOpenTokenModal: () => void;
}> = ({ state, onUpdate, onOpenTokenModal }) => {
  const { t } = useTranslation();
  const plan = subscriptionStore.getPlan(state.subscription.planId);
  
  const tokenUsedPercent = plan.aiTokens === -1 
    ? 0 
    : Math.min(100, (state.tokenBalance.used / (state.tokenBalance.included + state.tokenBalance.purchased)) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Current Subscription */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{t('Current Subscription')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('Manage your active plan and renewal settings.')}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              state.subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {state.subscription.status}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-xl font-extrabold text-gray-900">{plan.name} {t('Plan')}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {state.subscription.cycle === 'annual' ? t('Billed annually') : t('Billed monthly')} • 
                {t('Next renewal on')} {state.subscription.renewalDate}
              </p>
            </div>
            <div className="flex gap-4">
              {!state.subscription.cancelAtPeriodEnd ? (
                <button
                  onClick={() => {
                    subscriptionStore.cancelSubscription();
                    onUpdate();
                  }}
                  className="px-6 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {t('Cancel Subscription')}
                </button>
              ) : (
                <button
                  onClick={() => {
                    subscriptionStore.reactivate();
                    onUpdate();
                  }}
                  className="px-6 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {t('Reactivate')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">{t('Billing History')}</h3>
            <History className="w-5 h-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-4">{t('Date')}</th>
                  <th className="px-8 py-4">{t('Description')}</th>
                  <th className="px-8 py-4">{t('Amount')}</th>
                  <th className="px-8 py-4">{t('Status')}</th>
                  <th className="px-8 py-4">{t('Type')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.billing.length > 0 ? (
                  state.billing.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-4 text-sm text-gray-600">{item.date}</td>
                      <td className="px-8 py-4 text-sm font-medium text-gray-900">{item.description}</td>
                      <td className="px-8 py-4 text-sm font-bold text-gray-900">${item.amount.toFixed(2)}</td>
                      <td className="px-8 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-xs text-gray-500 capitalize">{item.type.replace('_', ' ')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400">
                      {t('No billing records found.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Token Balance */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">{t('AI Token Balance')}</h3>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <p className="text-3xl font-extrabold text-gray-900">
                {plan.aiTokens === -1 
                  ? t('Unlimited') 
                  : (state.tokenBalance.included + state.tokenBalance.purchased - state.tokenBalance.used).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{t('remaining')}</p>
            </div>

            {plan.aiTokens !== -1 && (
              <>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-2">
                  <div 
                    className="bg-purple-600 h-full transition-all duration-1000"
                    style={{ width: `${tokenUsedPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className="text-purple-600">{state.tokenBalance.used.toLocaleString()} {t('Used')}</span>
                  <span className="text-gray-400">{(state.tokenBalance.included + state.tokenBalance.purchased).toLocaleString()} {t('Total')}</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6 pt-8 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{t('Included in Plan')}</span>
              <span className="font-bold text-gray-900">{plan.aiTokens === -1 ? '∞' : plan.aiTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{t('Extra Purchased')}</span>
              <span className="font-bold text-gray-900">{state.tokenBalance.purchased.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{t('Overage Price')}</span>
              <span className="font-bold text-gray-900">${plan.tokenPrice} / 1k</span>
            </div>

            {plan.id !== 'free' && (
              <button
                onClick={onOpenTokenModal}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all group"
              >
                <Zap className="w-4 h-4" />
                {t('Buy More Tokens')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ApiTab: React.FC<{
  state: SubscriptionState;
  onUpdate: () => void;
}> = ({ state, onUpdate }) => {
  const { t } = useTranslation();
  const [model, setModel] = useState('gpt-4o');
  const [inputTokens, setInputTokens] = useState(500);
  const [outputTokens, setOutputTokens] = useState(200);
  const [history, setHistory] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const estimatedTotal = inputTokens + outputTokens;
  const currentPlan = subscriptionStore.getCurrentPlan();
  const estimatedCost = currentPlan.tokenPrice > 0 
    ? ((estimatedTotal / 1000) * currentPlan.tokenPrice).toFixed(4)
    : '0.00';

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = subscriptionStore.simulateApiCall(model, inputTokens, outputTokens);
      setIsSimulating(false);
      
      const newEntry = {
        id: Math.random().toString(36).substr(2, 9),
        model,
        tokens: estimatedTotal,
        success: res.success,
        cost: res.cost,
        error: res.error,
        time: new Date().toLocaleTimeString(),
      };
      
      setHistory(prev => [newEntry, ...prev].slice(0, 5));
      onUpdate();
    }, 800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">{t('Simulate AI Call')}</h3>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            {t('Simulate an AI API call to see token consumption in real-time based on your plan.')}
          </p>

          <div className="space-y-8">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-4">{t('Choose Model')}</label>
              <div className="grid grid-cols-3 gap-3">
                {['GPT-4o', 'Claude 3.5', 'Gemini 1.5'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m.toLowerCase().replace(' ', '-'))}
                    className={`
                      py-3 px-4 rounded-xl text-xs font-bold border transition-all
                      ${model === m.toLowerCase().replace(' ', '-') 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                        : 'border-gray-100 text-gray-500 hover:border-gray-300'}
                    `}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-4">
                  <label className="text-sm font-bold text-gray-700">{t('Input Tokens')}</label>
                  <span className="text-sm font-mono text-blue-600">{inputTokens.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={10000}
                  step={100}
                  value={inputTokens}
                  onChange={(e) => setInputTokens(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between mb-4">
                  <label className="text-sm font-bold text-gray-700">{t('Output Tokens')}</label>
                  <span className="text-sm font-mono text-blue-600">{outputTokens.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={100}
                  value={outputTokens}
                  onChange={(e) => setOutputTokens(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 rounded-2xl flex items-center justify-between border border-blue-100/50">
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">{t('Estimated Cost')}</p>
                <p className="text-2xl font-extrabold text-blue-900">${estimatedCost}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">{t('Total Tokens')}</p>
                <p className="text-2xl font-extrabold text-blue-900">{estimatedTotal.toLocaleString()}</p>
              </div>
            </div>

            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className={`
                w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                ${isSimulating ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'}
              `}
            >
              {isSimulating ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  {t('Run API Call')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">{t('Call History')}</h3>
            <Database className="w-5 h-5 text-gray-400" />
          </div>
          <div className="divide-y divide-gray-50">
            {history.length > 0 ? (
              history.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition-all flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.success ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {item.success ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-gray-900 truncate uppercase tracking-tight">{item.model}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{item.time}</p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        {item.tokens.toLocaleString()} tokens
                      </p>
                      <p className={`text-xs font-bold ${item.success ? 'text-gray-900' : 'text-red-600'}`}>
                        {item.success ? `-$${item.cost?.toFixed(4)}` : item.error}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-400">
                <p className="text-sm">{t('Run a simulation to see results here.')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
