import React from 'react';
import {
  Warehouse, Package, AlertTriangle, ShoppingCart,
  DollarSign, Users, Handshake, ClipboardList,
  Factory, TrendingUp, TrendingDown, ArrowUpRight,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { store } from '../../store';
import { erpStore } from '../../store/erp';
import { useRefresh } from '../../store/reactive';

const Dashboard: React.FC = () => {
  useRefresh();
  const s = store.getState();
  const e = erpStore.getState();

  // WMS 指标
  const lowStock = s.inventory.filter(i => i.quantity < i.minStock);
  const pendingOrders = s.orders.filter(o => o.status === 'pending' || o.status === 'processing');

  // 财务指标
  const totalIncome = e.financeRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = e.financeRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const overdueAR = e.accountsReceivable.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.dueAmount, 0);

  // HR 指标
  const activeEmployees = e.employees.filter(emp => emp.status === 'active').length;
  const pendingPayroll = e.payrollRecords.filter(p => p.status !== 'paid').length;

  // CRM 指标
  const activeCustomers = e.customers.filter(c => c.status === 'active').length;
  const openOpportunities = e.opportunities.filter(o => !['won', 'lost'].includes(o.stage));
  const pipelineValue = openOpportunities.reduce((sum, o) => sum + o.amount, 0);

  // 采购指标
  const pendingPR = e.purchaseRequests.filter(r => r.status === 'pending').length;
  const activePO = e.purchaseOrders.filter(o => !['received', 'cancelled'].includes(o.status)).length;

  // 生产指标
  const activePlans = e.productionPlans.filter(p => p.status === 'in_progress');
  const totalProductionProgress = activePlans.length > 0
    ? Math.round(activePlans.reduce((sum, p) => sum + (p.completedQty / p.plannedQty) * 100, 0) / activePlans.length)
    : 0;

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="p-6 space-y-6">
      {/* 顶部欢迎 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-700">系统运行正常</span>
        </div>
      </div>

      {/* ── WMS 核心指标 ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">仓储管理</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '仓库总数', value: s.warehouses.length, icon: Warehouse, color: 'blue', sub: '个仓库运营中' },
            { label: '库存品种', value: s.inventory.length, icon: Package, color: 'indigo', sub: '个SKU在库' },
            { label: '库存预警', value: lowStock.length, icon: AlertTriangle, color: lowStock.length > 0 ? 'red' : 'green', sub: lowStock.length > 0 ? '项需补货' : '库存状态正常' },
            { label: '待处理订单', value: pendingOrders.length, icon: ShoppingCart, color: 'orange', sub: '张订单待处理' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50`}>
                  <Icon size={20} className={`text-${color}-600`} />
                </div>
                <ArrowUpRight size={14} className="text-gray-300" />
              </div>
              <div className={`text-3xl font-bold text-${color}-600 mb-1`}>{value}</div>
              <div className="text-sm font-medium text-gray-700">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ERP 财务指标 ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">财务概览</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <span className="text-xs text-gray-500">总收入</span>
            </div>
            <div className="text-2xl font-bold text-green-600">¥{totalIncome.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <TrendingDown size={16} className="text-red-500" />
              </div>
              <span className="text-xs text-gray-500">总支出</span>
            </div>
            <div className="text-2xl font-bold text-red-500">¥{totalExpense.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign size={16} className="text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">净利润</span>
            </div>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
              ¥{netProfit.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <AlertCircle size={16} className="text-orange-500" />
              </div>
              <span className="text-xs text-gray-500">逾期应收</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">¥{overdueAR.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* ── ERP 业务指标 ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">业务概览</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* HR */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-violet-600" />
              </div>
              <span className="font-semibold text-gray-800">人力资源</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">在职员工</span>
                <span className="font-bold text-gray-800">{activeEmployees} 人</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">部门数</span>
                <span className="font-bold text-gray-800">{e.departments.length} 个</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">待发薪资</span>
                <span className={`font-bold ${pendingPayroll > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                  {pendingPayroll > 0 ? `${pendingPayroll} 份待发` : '全部已发'}
                </span>
              </div>
            </div>
          </div>

          {/* CRM */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center">
                <Handshake size={16} className="text-cyan-600" />
              </div>
              <span className="font-semibold text-gray-800">客户关系</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">活跃客户</span>
                <span className="font-bold text-gray-800">{activeCustomers} 家</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">商机数</span>
                <span className="font-bold text-gray-800">{openOpportunities.length} 个</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">管道价值</span>
                <span className="font-bold text-blue-600">¥{(pipelineValue / 10000).toFixed(1)}万</span>
              </div>
            </div>
          </div>

          {/* 采购 & 生产 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Factory size={16} className="text-amber-600" />
              </div>
              <span className="font-semibold text-gray-800">采购 & 生产</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">待审批采购申请</span>
                <span className={`font-bold ${pendingPR > 0 ? 'text-orange-500' : 'text-gray-800'}`}>{pendingPR} 个</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">在途采购单</span>
                <span className="font-bold text-gray-800">{activePO} 张</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">生产进度</span>
                <span className="font-bold text-green-600">{totalProductionProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 底部双栏 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 库存预警 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            库存预警
          </h3>
          {lowStock.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600 py-4">
              <CheckCircle size={18} />
              <span className="text-sm">所有库存状态正常</span>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{item.productName}</div>
                    <div className="text-xs text-gray-400">{item.warehouseName} · {item.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-500">{item.quantity} {item.unit}</div>
                    <div className="text-xs text-gray-400">最低 {item.minStock}</div>
                  </div>
                </div>
              ))}
              {lowStock.length > 5 && (
                <div className="text-xs text-gray-400 text-center pt-1">还有 {lowStock.length - 5} 项预警</div>
              )}
            </div>
          )}
        </div>

        {/* 商机动态 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            销售商机
          </h3>
          {e.opportunities.length === 0 ? (
            <div className="text-sm text-gray-400 py-4 text-center">暂无商机数据</div>
          ) : (
            <div className="space-y-2">
              {e.opportunities.slice(0, 5).map(opp => {
                const stageMap: Record<string, { label: string; color: string }> = {
                  lead: { label: '线索', color: 'bg-gray-100 text-gray-600' },
                  qualified: { label: '意向', color: 'bg-blue-100 text-blue-700' },
                  proposal: { label: '报价', color: 'bg-yellow-100 text-yellow-700' },
                  negotiation: { label: '谈判', color: 'bg-orange-100 text-orange-700' },
                  won: { label: '成交', color: 'bg-green-100 text-green-700' },
                  lost: { label: '丢单', color: 'bg-red-100 text-red-700' },
                };
                const stage = stageMap[opp.stage] || { label: opp.stage, color: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={opp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{opp.title}</div>
                      <div className="text-xs text-gray-400">{opp.customerName} · {opp.assignedTo}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stage.color}`}>{stage.label}</span>
                      <span className="text-sm font-bold text-gray-700">¥{(opp.amount / 10000).toFixed(0)}万</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 待办事项 ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-indigo-500" />
          待办事项
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '待审批采购申请', value: pendingPR, color: 'orange', urgent: pendingPR > 0 },
            { label: '逾期应收账款', value: e.accountsReceivable.filter(r => r.status === 'overdue').length, color: 'red', urgent: true },
            { label: '待处理销售订单', value: pendingOrders.length, color: 'blue', urgent: pendingOrders.length > 0 },
            { label: '待发薪资单', value: pendingPayroll, color: 'violet', urgent: pendingPayroll > 0 },
          ].map(({ label, value, color, urgent }) => (
            <div key={label} className={`rounded-xl p-3 border ${urgent && value > 0 ? `bg-${color}-50 border-${color}-200` : 'bg-gray-50 border-gray-100'}`}>
              <div className={`text-2xl font-bold ${urgent && value > 0 ? `text-${color}-600` : 'text-gray-400'}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
