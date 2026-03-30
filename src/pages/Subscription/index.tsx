import React, { useState, useEffect } from 'react';
import {
  Check,
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
  Mail,
  Lock,
  ArrowUpRight,
  BarChart3,
  Globe,
  Settings,
  CreditCard,
  Crown
} from 'lucide-react';
import { subscriptionStore, PLANS } from '../../store/subscription';
import {
  Plan,
  PlanId,
  BillingCycle,
  SubscriptionState,
  BillingRecord,
} from '../../types/subscription';

const SubscriptionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'billing' | 'api'>('plans');
  const [cycle, setCycle] = useState<BillingCycle>('annual');
  const [state, setState] = useState<SubscriptionState>(subscriptionStore.getState());
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

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
    <div className="min-h-screen bg-[#fcfcfd] pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 pt-16 pb-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] -mr-64 -mt-32" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[80px] -ml-32 -mb-32" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-white text-xs font-bold uppercase tracking-wider">
                  当前方案: {currentPlan.name}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                升级您的意念ERP
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                享受无限仓库管理、AI 智能库存预测及全球 24/7 技术支持。
              </p>
            </div>
            
            <div className="flex items-center gap-6 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
              <div className="text-center">
                <p className="text-blue-200 text-xs font-bold uppercase mb-1">AI Token 余额</p>
                <p className="text-3xl font-black text-white">
                  {currentPlan.aiTokens === -1 ? '无限' : (state.tokenBalance.included + state.tokenBalance.purchased - state.tokenBalance.used).toLocaleString()}
                </p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <p className="text-blue-200 text-xs font-bold uppercase mb-1">团队席位</p>
                <p className="text-3xl font-black text-white">{currentPlan.users === -1 ? '无限' : currentPlan.users}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-xl shadow-blue-900/5 mb-12 border border-gray-100">
          {(['plans', 'billing', 'api'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 px-6 text-sm font-bold rounded-xl transition-all
                ${activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
              `}
            >
              {tab === 'plans' && <Globe className="w-4 h-4" />}
              {tab === 'billing' && <CreditCard className="w-4 h-4" />}
              {tab === 'api' && <Zap className="w-4 h-4" />}
              {tab === 'plans' ? '套餐计划' : tab === 'billing' ? '账单与用量' : 'API 调用预览'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'plans' && (
            <div className="space-y-20">
              {/* Toggle Annual/Monthly */}
              <div className="flex flex-col items-center">
                <div className="inline-flex items-center bg-gray-100 p-1.5 rounded-2xl">
                  <button
                    onClick={() => setCycle('monthly')}
                    className={`px-8 py-2.5 text-sm font-bold rounded-xl transition-all ${cycle === 'monthly' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    按月付款
                  </button>
                  <button
                    onClick={() => setCycle('annual')}
                    className={`px-8 py-2.5 text-sm font-bold rounded-xl transition-all relative ${cycle === 'annual' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    按年付款
                    <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      节省 20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PLANS.map((plan) => {
                  const isCurrent = state.subscription.planId === plan.id;
                  const price = cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
                  const isPro = plan.id === 'pro';
                  
                  return (
                    <div
                      key={plan.id}
                      className={`
                        relative bg-white rounded-[2.5rem] p-10 flex flex-col border-2 transition-all duration-500
                        ${isPro 
                          ? 'border-blue-600 shadow-2xl shadow-blue-200/50 scale-105 z-10' 
                          : 'border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200'}
                      `}
                    >
                      {isPro && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-blue-200">
                          推荐方案
                        </div>
                      )}
                      
                      <div className="mb-10">
                        <h3 className="text-2xl font-black text-gray-900 mb-6">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-6xl font-black text-gray-900">${price}</span>
                          <span className="text-gray-400 font-bold">/ 月</span>
                        </div>
                        {cycle === 'annual' && plan.id !== 'free' && (
                          <p className="text-green-600 font-bold text-xs mt-3 uppercase tracking-tighter">按年计费 (优惠中)</p>
                        )}
                      </div>

                      <div className="space-y-5 mb-12 flex-1">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                          <Zap className="w-5 h-5 text-indigo-600" />
                          <div>
                            <p className="text-xs font-bold text-gray-900">AI Token 额度</p>
                            <p className="text-sm text-gray-500">
                              {plan.aiTokens === -1 ? '无限配额' : `${plan.aiTokens.toLocaleString()} 每月`}
                            </p>
                          </div>
                        </div>
                        
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-600 font-medium leading-tight">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          if (!isCurrent) {
                            subscriptionStore.upgrade(plan.id, cycle);
                            onUpdate();
                          }
                        }}
                        disabled={isCurrent}
                        className={`
                          w-full py-5 rounded-2xl text-base font-black transition-all shadow-xl
                          ${isCurrent 
                            ? 'bg-gray-100 text-gray-400 cursor-default' 
                            : isPro 
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
                              : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'}
                        `}
                      >
                        {isCurrent ? '当前正在使用' : '立即开始'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Comparison Table */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">详细功能对比</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <tr>
                        <th className="px-10 py-6">功能模块</th>
                        {PLANS.map(p => <th key={p.id} className="px-10 py-6">{p.name}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        ['仓库管理', '1个', '10个', '无限'],
                        ['活跃用户', '3个', '25个', '无限'],
                        ['AI Token / 月', '10,000', '500,000', '无限'],
                        ['API 接入能力', '—', '✓', '✓'],
                        ['SLA 保障', '—', '—', '99.9%'],
                        ['24/7 技术支持', '社区', '优先邮件', '专属客服'],
                        ['单点登录 (SSO)', '—', '—', '✓'],
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-10 py-6 text-sm font-bold text-gray-900">{row[0]}</td>
                          <td className="px-10 py-6 text-sm text-gray-500 font-medium">{row[1]}</td>
                          <td className="px-10 py-6 text-sm text-gray-500 font-medium">{row[2]}</td>
                          <td className="px-10 py-6 text-sm text-gray-500 font-medium">{row[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                {/* Email Verification Status */}
                <div className={`
                  p-8 rounded-[2rem] border-2 flex items-center justify-between gap-6
                  ${state.emailVerification === 'verified' 
                    ? 'bg-green-50 border-green-100' 
                    : 'bg-amber-50 border-amber-100'}
                `}>
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      state.emailVerification === 'verified' ? 'bg-green-500/10' : 'bg-amber-500/10'
                    }`}>
                      {state.emailVerification === 'verified' 
                        ? <ShieldCheck className="w-8 h-8 text-green-600" /> 
                        : <Mail className="w-8 h-8 text-amber-600" />}
                    </div>
                    <div>
                      <h4 className={`text-lg font-black ${state.emailVerification === 'verified' ? 'text-green-900' : 'text-amber-900'}`}>
                        {state.emailVerification === 'verified' ? '邮箱已验证' : '邮箱未验证'}
                      </h4>
                      <p className={`text-sm ${state.emailVerification === 'verified' ? 'text-green-700/70' : 'text-amber-700/70'}`}>
                        {state.emailVerification === 'verified' 
                          ? '您的账户处于高等级安全保护状态。' 
                          : '请验证您的邮箱以解锁完整账单管理功能。'}
                      </p>
                    </div>
                  </div>
                  {state.emailVerification !== 'verified' && (
                    <button
                      onClick={handleVerifyEmail}
                      className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 shadow-lg shadow-amber-200"
                    >
                      立即验证
                    </button>
                  )}
                </div>

                {/* Current Plan Details */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h3 className="text-xl font-black text-gray-900">订阅管理</h3>
                      <p className="text-sm text-gray-400 font-medium mt-1">控制您的自动续费和账单通知。</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      state.subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {state.subscription.status === 'active' ? '正常运行中' : '已暂停'}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-10 items-center md:items-start bg-gray-50/50 p-8 rounded-3xl border border-gray-100/50">
                    <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shrink-0 shadow-xl shadow-blue-100">
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-2xl font-black text-gray-900">{currentPlan.name} 套餐</h4>
                      <p className="text-sm text-gray-400 font-medium mt-2">
                        {state.subscription.cycle === 'annual' ? '按年结算' : '按月结算'} • 
                        下次续费日期: <span className="text-gray-900 font-bold">{state.subscription.renewalDate}</span>
                      </p>
                    </div>
                    <div className="flex gap-4 shrink-0">
                      {!state.subscription.cancelAtPeriodEnd ? (
                        <button
                          onClick={() => { subscriptionStore.cancelSubscription(); refreshState(); }}
                          className="px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          取消续费
                        </button>
                      ) : (
                        <button
                          onClick={() => { subscriptionStore.reactivate(); refreshState(); }}
                          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                        >
                          恢复续费
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* History */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-10 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-black text-gray-900">账单记录</h3>
                    <History className="w-6 h-6 text-gray-300" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                          <th className="px-10 py-5">日期</th>
                          <th className="px-10 py-5">描述</th>
                          <th className="px-10 py-5">金额</th>
                          <th className="px-10 py-5">状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {state.billing.length > 0 ? (
                          state.billing.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-all">
                              <td className="px-10 py-6 text-sm text-gray-500 font-medium">{item.date}</td>
                              <td className="px-10 py-6 text-sm font-black text-gray-900">{item.description}</td>
                              <td className="px-10 py-6 text-sm font-black text-gray-900">${item.amount.toFixed(2)}</td>
                              <td className="px-10 py-6">
                                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                                  {item.status === 'paid' ? '支付成功' : '待处理'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} className="px-10 py-20 text-center text-gray-300 font-bold italic">暂无账单数据</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sidebar: Token Balance */}
              <div className="space-y-12">
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm sticky top-8">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                      <Zap className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">AI 用量统计</h3>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-end mb-4">
                        <p className="text-5xl font-black text-gray-900">
                          {currentPlan.aiTokens === -1 ? '∞' : (state.tokenBalance.included + state.tokenBalance.purchased - state.tokenBalance.used).toLocaleString()}
                        </p>
                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-1">可用 Token</p>
                      </div>
                      
                      {currentPlan.aiTokens !== -1 && (
                        <div className="space-y-4">
                          <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(100, (state.tokenBalance.used / (state.tokenBalance.included + state.tokenBalance.purchased)) * 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span>已用: {state.tokenBalance.used.toLocaleString()}</span>
                            <span>总量: {(state.tokenBalance.included + state.tokenBalance.purchased).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-8 border-t border-gray-100 space-y-6">
                      <div className="flex justify-between items-center group cursor-help">
                        <span className="text-sm font-bold text-gray-400 flex items-center gap-2 group-hover:text-gray-900 transition-colors">
                          套餐包含 <Info className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-sm font-black text-gray-900">{currentPlan.aiTokens === -1 ? '无限' : currentPlan.aiTokens.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center group cursor-help">
                        <span className="text-sm font-bold text-gray-400 flex items-center gap-2 group-hover:text-gray-900 transition-colors">
                          额外购买 <Info className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-sm font-black text-gray-900">{state.tokenBalance.purchased.toLocaleString()}</span>
                      </div>
                    </div>

                    {currentPlan.id !== 'free' && (
                      <button
                        onClick={() => setIsTokenModalOpen(true)}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 group transition-all"
                      >
                        <Zap className="w-4 h-4" />
                        购买额外 Token
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400 text-center font-medium">
                      * 购买的 Token 永不过期，将在套餐内配额用完后自动激活使用。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <ApiCallSimulator state={state} onUpdate={refreshState} />
              
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-fit">
                <div className="p-10 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-900">实时调用日志</h3>
                  <Database className="w-6 h-6 text-gray-300" />
                </div>
                <div className="divide-y divide-gray-50">
                  <div className="p-20 text-center text-gray-300 font-bold italic">
                    点击左侧 "开始模拟调用" 查看数据流
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {isVerifying && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[2.5rem] p-12 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-8">
                <ShieldCheck className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">验证您的邮箱</h3>
              <p className="text-sm text-gray-400 font-medium">
                我们向您的注册邮箱发送了一个 6 位数字验证码。
              </p>
            </div>
            
            <input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full text-center text-5xl font-black tracking-[0.2em] py-8 bg-gray-50 border-2 border-gray-100 rounded-3xl focus:border-blue-600 focus:bg-white focus:outline-none transition-all mb-10"
              placeholder="000000"
            />
            
            <div className="flex gap-4">
              <button
                onClick={() => setIsVerifying(false)}
                className="flex-1 py-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                稍后再说
              </button>
              <button
                onClick={submitVerification}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all"
              >
                提交验证
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={() => setIsTokenModalOpen(false)}
              className="absolute top-10 right-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
            
            <div className="mb-12">
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">充值 AI Token</h3>
              <p className="text-sm text-gray-400 font-medium">
                选择适合您的充值包。Token 在购买后将永久有效，优先使用套餐配额。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-12">
              {[
                { amount: 50_000, tag: '入门包', price: 75 },
                { amount: 100_000, tag: '流行包', price: 150 },
                { amount: 500_000, tag: '专业包', price: 750, hot: true },
                { amount: 1_000_000, tag: '企业包', price: 1500 },
              ].map((pkg) => (
                <button
                  key={pkg.amount}
                  onClick={() => {
                    subscriptionStore.purchaseTokens(pkg.amount);
                    setIsTokenModalOpen(false);
                    refreshState();
                  }}
                  className={`
                    p-8 rounded-[2rem] border-2 text-left transition-all group relative
                    ${pkg.hot ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}
                  `}
                >
                  {pkg.hot && <span className="absolute top-4 right-4 bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">最划算</span>}
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">{pkg.tag}</p>
                  <p className="text-2xl font-black text-gray-900 mb-1">{(pkg.amount / 1000).toLocaleString()}K <span className="text-sm font-bold text-gray-400">Tokens</span></p>
                  <p className="text-lg font-black text-indigo-600">${pkg.price}</p>
                </button>
              ))}
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl flex items-center gap-4 border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-blue-600">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                当前计费标准: <span className="font-bold text-gray-900">${currentPlan.tokenPrice}</span> 每 1,000 Extra Tokens。单次调用如未执行成功将不会扣费。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ApiCallSimulator: React.FC<{ state: SubscriptionState; onUpdate: () => void }> = ({ state, onUpdate }) => {
  const [model, setModel] = useState('gpt-4o');
  const [inputTokens, setInputTokens] = useState(500);
  const [outputTokens, setOutputTokens] = useState(200);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

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
      setLastResult({
        ...res,
        time: new Date().toLocaleTimeString(),
        tokens: estimatedTotal,
        model: model.toUpperCase()
      });
      onUpdate();
    }, 1200);
  };

  return (
    <div className="space-y-12">
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Cpu className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-black text-gray-900">AI 接口调用模拟</h3>
        </div>

        <div className="space-y-10">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 block">选择计算模型</label>
            <div className="grid grid-cols-3 gap-4">
              {['GPT-4o', 'Claude 3.5', 'Gemini 1.5'].map((m) => (
                <button
                  key={m}
                  onClick={() => setModel(m.toLowerCase().replace(' ', '-'))}
                  className={`
                    py-4 px-6 rounded-2xl text-xs font-bold border-2 transition-all
                    ${model === m.toLowerCase().replace(' ', '-') 
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-lg shadow-blue-100' 
                      : 'border-gray-50 text-gray-400 hover:border-gray-200'}
                  `}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-900">Input 提示词消耗</span>
                <span className="text-lg font-black text-blue-600">{inputTokens.toLocaleString()} <span className="text-[10px] text-gray-300">TK</span></span>
              </div>
              <input
                type="range" min={100} max={10000} step={100} value={inputTokens}
                onChange={(e) => setInputTokens(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-900">Output 生成消耗</span>
                <span className="text-lg font-black text-blue-600">{outputTokens.toLocaleString()} <span className="text-[10px] text-gray-300">TK</span></span>
              </div>
              <input
                type="range" min={100} max={5000} step={100} value={outputTokens}
                onChange={(e) => setOutputTokens(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          <div className="p-8 bg-blue-900 rounded-[2rem] text-white flex items-center justify-between shadow-2xl shadow-blue-200">
            <div>
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2">预计总费用</p>
              <p className="text-4xl font-black">${estimatedCost}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2">Token 总计</p>
              <p className="text-4xl font-black">{estimatedTotal.toLocaleString()}</p>
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`
              w-full py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-4 transition-all
              ${isSimulating 
                ? 'bg-gray-100 text-gray-400' 
                : 'bg-gray-900 text-white hover:bg-black shadow-2xl shadow-gray-300'}
            `}
          >
            {isSimulating ? (
              <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-6 h-6 fill-current text-yellow-400" />
                执行 API 调用模拟
              </>
            )}
          </button>
        </div>
      </div>
      
      {lastResult && (
        <div className="bg-white rounded-[2.5rem] p-10 border-2 border-green-100 shadow-xl shadow-green-100/50 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-black text-gray-900">模拟结果报告</h4>
            <span className="text-[10px] font-black text-gray-400 uppercase">{lastResult.time}</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 rounded-2xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">消耗模型</p>
              <p className="text-xl font-black text-gray-900">{lastResult.model}</p>
            </div>
            <div className={`p-6 rounded-2xl ${lastResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">执行状态</p>
              <p className={`text-xl font-black ${lastResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {lastResult.success ? '调用成功' : '余额不足'}
              </p>
            </div>
            <div className="col-span-2 p-6 bg-gray-50 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">扣除费用</p>
                <p className="text-2xl font-black text-gray-900">-${lastResult.cost?.toFixed(4) || '0.0000'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">消耗详情</p>
                <p className="text-2xl font-black text-gray-900">{lastResult.tokens.toLocaleString()} TK</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
