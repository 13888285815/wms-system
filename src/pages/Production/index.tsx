import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Edit2, Trash2, LayoutGrid, ClipboardCheck, 
  Settings, Clock, Activity, Target, Layers, 
  ArrowRight, CheckCircle2, AlertCircle, Calendar
} from 'lucide-react';
import { erpStore } from '../../store/erp';
import { store } from '../../store';
import { useRefresh } from '../../store/reactive';
import { 
  ProductionPlan, WorkOrder, WorkOrderStatus, BOMItem 
} from '../../types/erp';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

const ProductionPage: React.FC = () => {
  const refresh = useRefresh();
  const [activeTab, setActiveTab] = useState<'plan' | 'workorder' | 'bom'>('plan');
  
  // States for Production Plan
  const [planSearch, setPlanSearch] = useState('');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProductionPlan | null>(null);

  // States for Work Order
  const [woSearch, setWoSearch] = useState('');
  const [isWoModalOpen, setIsWoModalOpen] = useState(false);
  const [editingWo, setEditingWo] = useState<WorkOrder | null>(null);

  // States for BOM
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const erpData = useMemo(() => erpStore.getState(), [refresh]);
  const wmsData = useMemo(() => store.getState(), [refresh]);
  const warehouses = wmsData.warehouses;

  // --- Production Plan Handlers ---
  const initialPlanForm: Omit<ProductionPlan, 'id' | 'planNo' | 'createdAt'> = {
    productName: '',
    sku: '',
    plannedQty: 0,
    completedQty: 0,
    unit: '',
    warehouseId: '',
    warehouseName: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    status: 'planned',
    bom: [],
    notes: '',
  };

  const [planFormData, setPlanFormData] = useState(initialPlanForm);
  const [bomText, setBomText] = useState(''); // "物料名,数量,单位"

  const filteredPlans = useMemo(() => {
    return erpData.productionPlans.filter(p => 
      p.planNo.toLowerCase().includes(planSearch.toLowerCase()) ||
      p.productName.toLowerCase().includes(planSearch.toLowerCase())
    );
  }, [erpData.productionPlans, planSearch]);

  const planStats = useMemo(() => {
    const total = erpData.productionPlans.length;
    const completionRates = erpData.productionPlans.map(p => (p.completedQty / p.plannedQty) || 0);
    const avgCompletion = total > 0 ? (completionRates.reduce((a, b) => a + b, 0) / total) * 100 : 0;

    return {
      total,
      inProgress: erpData.productionPlans.filter(p => p.status === 'in_progress').length,
      completed: erpData.productionPlans.filter(p => p.status === 'completed').length,
      avgCompletion
    };
  }, [erpData.productionPlans]);

  const handleOpenPlanModal = (plan?: ProductionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanFormData({ ...plan });
      setBomText(plan.bom.map(b => `${b.materialName},${b.quantity},${b.unit}`).join('\n'));
    } else {
      setEditingPlan(null);
      setPlanFormData(initialPlanForm);
      setBomText('');
    }
    setIsPlanModalOpen(true);
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bom: BOMItem[] = bomText.split('\n').filter(line => line.trim()).map(line => {
      const [materialName, quantity, unit] = line.split(',').map(s => s.trim());
      return {
        id: Math.random().toString(36).substr(2, 9),
        materialName: materialName || '',
        sku: '',
        quantity: Number(quantity) || 0,
        unit: unit || '',
        unitCost: 0,
        totalCost: 0
      };
    });

    const data = { ...planFormData, bom };
    if (editingPlan) {
      erpStore.updateProductionPlan(editingPlan.id, data);
    } else {
      erpStore.addProductionPlan(data);
    }
    refresh();
    setIsPlanModalOpen(false);
  };

  // --- Work Order Handlers ---
  const initialWoForm: Omit<WorkOrder, 'id' | 'woNo' | 'createdAt'> = {
    planId: '',
    planNo: '',
    productName: '',
    sku: '',
    targetQty: 0,
    completedQty: 0,
    unit: '',
    assignedTo: '',
    workStation: '',
    startDate: '',
    endDate: '',
    actualStart: '',
    actualEnd: '',
    status: 'planned',
    qualityRate: 100,
    notes: '',
  };

  const [woFormData, setWoFormData] = useState(initialWoForm);

  const filteredWos = useMemo(() => {
    return erpData.workOrders.filter(wo => 
      wo.woNo.toLowerCase().includes(woSearch.toLowerCase()) ||
      wo.productName.toLowerCase().includes(woSearch.toLowerCase())
    );
  }, [erpData.workOrders, woSearch]);

  const woStats = useMemo(() => {
    const completed = erpData.workOrders.filter(w => w.status === 'completed');
    const avgQuality = completed.length > 0 
      ? completed.reduce((sum, w) => sum + w.qualityRate, 0) / completed.length 
      : 0;

    return {
      total: erpData.workOrders.length,
      inProgress: erpData.workOrders.filter(w => w.status === 'in_progress').length,
      completed: completed.length,
      avgQuality
    };
  }, [erpData.workOrders]);

  const handleOpenWoModal = (wo?: WorkOrder) => {
    if (wo) {
      setEditingWo(wo);
      setWoFormData({ ...wo });
    } else {
      setEditingWo(null);
      setWoFormData(initialWoForm);
    }
    setIsWoModalOpen(true);
  };

  const handleWoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWo) {
      erpStore.updateWorkOrder(editingWo.id, woFormData);
    } else {
      erpStore.addWorkOrder(woFormData);
    }
    refresh();
    setIsWoModalOpen(false);
  };

  // Helper Components
  const PriorityBadge = ({ priority }: { priority: string }) => {
    switch (priority) {
      case 'low': return <Badge variant="default">低</Badge>;
      case 'medium': return <Badge variant="info">中</Badge>;
      case 'high': return <Badge variant="danger">高</Badge>;
      default: return <Badge variant="default">{priority}</Badge>;
    }
  };

  const PlanStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'planned': return <Badge variant="default">待生产</Badge>;
      case 'in_progress': return <Badge variant="info">生产中</Badge>;
      case 'completed': return <Badge variant="success">已完成</Badge>;
      case 'cancelled': return <Badge variant="danger">已取消</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const WoStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'planned': return <Badge variant="default">计划</Badge>;
      case 'in_progress': return <Badge variant="info">生产中</Badge>;
      case 'completed': return <Badge variant="success">完成</Badge>;
      case 'paused': return <Badge variant="warning">暂停</Badge>;
      case 'cancelled': return <Badge variant="danger">取消</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const ProgressBar = ({ current, total }: { current: number, total: number }) => {
    const percentage = Math.min(100, Math.round((current / total) * 100) || 0);
    return (
      <div className="w-full space-y-1">
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{current} / {total}</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
            style={{ width: `${percentage}%` }} 
          />
        </div>
      </div>
    );
  };

  const expandedPlan = useMemo(() => {
    return erpData.productionPlans.find(p => p.id === expandedPlanId);
  }, [erpData.productionPlans, expandedPlanId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">生产管理</h1>
          <p className="text-gray-500 mt-1">协调生产计划与工单执行，监控物料使用情况</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'plan' && (
            <Button onClick={() => handleOpenPlanModal()} className="shadow-sm">
              <Plus size={18} />
              新建计划
            </Button>
          )}
          {activeTab === 'workorder' && (
            <Button onClick={() => handleOpenWoModal()} className="shadow-sm">
              <Plus size={18} />
              发布工单
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'plan' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('plan')}
        >
          生产计划
          {activeTab === 'plan' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'workorder' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('workorder')}
        >
          工单管理
          {activeTab === 'workorder' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'bom' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('bom')}
        >
          BOM物料清单
          {activeTab === 'bom' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
      </div>

      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <LayoutGrid size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">计划总数</p>
                <p className="text-xl font-bold">{planStats.total}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">进行中</p>
                <p className="text-xl font-bold">{planStats.inProgress}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-xl font-bold">{planStats.completed}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <Target size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">本月完成率</p>
                <p className="text-xl font-bold">{planStats.avgCompletion.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索计划编号或产品名称..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm font-medium">
                    <th className="px-6 py-4">计划编号</th>
                    <th className="px-6 py-4">产品名/SKU</th>
                    <th className="px-6 py-4">生产进度</th>
                    <th className="px-6 py-4">目标仓库</th>
                    <th className="px-6 py-4">时间周期</th>
                    <th className="px-6 py-4">优先级</th>
                    <th className="px-6 py-4">状态</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">{plan.planNo}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-medium">{plan.productName}</span>
                          <span className="text-xs text-gray-500 font-mono">{plan.sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[150px]">
                        <ProgressBar current={plan.completedQty} total={plan.plannedQty} />
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{plan.warehouseName}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={10} /> {plan.startDate}</span>
                          <span className="flex items-center gap-1"><ArrowRight size={10} /> {plan.endDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={plan.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <PlanStatusBadge status={plan.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenPlanModal(plan)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workorder' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <ClipboardCheck size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">工单总数</p>
                <p className="text-xl font-bold">{woStats.total}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
                <Settings size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">进行中</p>
                <p className="text-xl font-bold">{woStats.inProgress}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-xl font-bold">{woStats.completed}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">平均良品率</p>
                <p className="text-xl font-bold text-emerald-600">{woStats.avgQuality.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索工单号或产品..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={woSearch}
                  onChange={(e) => setWoSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm font-medium">
                    <th className="px-6 py-4">工单号</th>
                    <th className="px-6 py-4">关联计划</th>
                    <th className="px-6 py-4">产品/工作站</th>
                    <th className="px-6 py-4">执行进度</th>
                    <th className="px-6 py-4">负责人</th>
                    <th className="px-6 py-4">截止日期</th>
                    <th className="px-6 py-4">良品率</th>
                    <th className="px-6 py-4">状态</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredWos.map((wo) => (
                    <tr key={wo.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">{wo.woNo}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">{wo.planNo}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-medium">{wo.productName}</span>
                          <span className="text-xs text-gray-500">{wo.workStation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[120px]">
                        <ProgressBar current={wo.completedQty} total={wo.targetQty} />
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{wo.assignedTo}</td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{wo.endDate}</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${wo.qualityRate < 95 ? 'text-red-600' : 'text-green-600'}`}>
                          {wo.qualityRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <WoStatusBadge status={wo.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenWoModal(wo)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bom' && (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)]">
          {/* Left: Plan List */}
          <div className="col-span-12 md:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-900">
              生产计划列表
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {erpData.productionPlans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setExpandedPlanId(plan.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    expandedPlanId === plan.id ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-500/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-900">{plan.productName}</span>
                    <Badge variant="default" className="text-[10px]">{plan.planNo}</Badge>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>物料数: {plan.bom.length} 种</span>
                    <span>SKU: {plan.sku}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: BOM Detail */}
          <div className="col-span-12 md:col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {expandedPlan ? (
              <>
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Layers className="text-blue-600" size={20} />
                    <h2 className="font-bold text-gray-900">BOM 清单: {expandedPlan.productName}</h2>
                  </div>
                  <Badge variant="info">{expandedPlan.planNo}</Badge>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs font-medium sticky top-0">
                        <th className="px-6 py-3">物料名称</th>
                        <th className="px-6 py-3">SKU</th>
                        <th className="px-6 py-3 text-right">单机用量</th>
                        <th className="px-6 py-3">单位</th>
                        <th className="px-6 py-3 text-right">计划总量</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {expandedPlan.bom.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                          <td className="px-6 py-4 font-medium text-gray-900">{item.materialName}</td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.sku || '-'}</td>
                          <td className="px-6 py-4 text-right">{item.quantity}</td>
                          <td className="px-6 py-4 text-gray-600">{item.unit}</td>
                          <td className="px-6 py-4 text-right font-medium text-blue-600">
                            {(item.quantity * expandedPlan.plannedQty).toLocaleString()} {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {expandedPlan.bom.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <AlertCircle size={48} className="mb-4 opacity-20" />
                      <p>该计划未录入BOM数据</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">共 {expandedPlan.bom.length} 种物料</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">生产基数:</span>
                    <span className="font-bold text-gray-900">{expandedPlan.plannedQty} {expandedPlan.unit}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                  <Layers size={40} className="opacity-20" />
                </div>
                <p>请从左侧选择一个生产计划查看其物料清单</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? '编辑生产计划' : '新建生产计划'}
        size="lg"
      >
        <form onSubmit={handlePlanSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">产品名称</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={planFormData.productName}
                onChange={e => setPlanFormData({ ...planFormData, productName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">SKU</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={planFormData.sku}
                onChange={e => setPlanFormData({ ...planFormData, sku: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">计划生产数量</label>
              <input
                required
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={planFormData.plannedQty}
                onChange={e => setPlanFormData({ ...planFormData, plannedQty: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">单位</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={planFormData.unit}
                onChange={e => setPlanFormData({ ...planFormData, unit: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">已完成数量</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={planFormData.completedQty}
                onChange={e => setPlanFormData({ ...planFormData, completedQty: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">入库仓库</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white focus:border-blue-500"
                value={planFormData.warehouseId}
                onChange={e => {
                  const w = warehouses.find(item => item.id === e.target.value);
                  setPlanFormData({ ...planFormData, warehouseId: e.target.value, warehouseName: w?.name || '' });
                }}
              >
                <option value="">选择仓库</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">预计开始</label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={planFormData.startDate}
                onChange={e => setPlanFormData({ ...planFormData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">预计结束</label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={planFormData.endDate}
                onChange={e => setPlanFormData({ ...planFormData, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">优先级</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white focus:border-blue-500"
                value={planFormData.priority}
                onChange={e => setPlanFormData({ ...planFormData, priority: e.target.value as any })}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">状态</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white focus:border-blue-500"
                value={planFormData.status}
                onChange={e => setPlanFormData({ ...planFormData, status: e.target.value as any })}
              >
                <option value="planned">待生产</option>
                <option value="in_progress">生产中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">BOM物料 (格式: 物料名,数量,单位 每行一个)</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-mono text-sm"
                rows={4}
                placeholder="例如: 芯片,1,颗&#10;PCB,1,块"
                value={bomText}
                onChange={e => setBomText(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">备注</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 resize-none"
                rows={2}
                value={planFormData.notes}
                onChange={e => setPlanFormData({ ...planFormData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setIsPlanModalOpen(false)}>取消</Button>
            <Button type="submit">保存计划</Button>
          </div>
        </form>
      </Modal>

      {/* WO Modal */}
      <Modal
        isOpen={isWoModalOpen}
        onClose={() => setIsWoModalOpen(false)}
        title={editingWo ? '编辑工单' : '新建发布工单'}
        size="lg"
      >
        <form onSubmit={handleWoSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">关联计划</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white focus:border-blue-500"
                value={woFormData.planId}
                onChange={e => {
                  const p = erpData.productionPlans.find(item => item.id === e.target.value);
                  setWoFormData({ 
                    ...woFormData, 
                    planId: e.target.value, 
                    planNo: p?.planNo || '',
                    productName: p?.productName || '',
                    sku: p?.sku || '',
                    unit: p?.unit || '',
                    targetQty: p?.plannedQty || 0
                  });
                }}
              >
                <option value="">选择计划</option>
                {erpData.productionPlans.map(p => <option key={p.id} value={p.id}>{p.planNo} | {p.productName}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">工作站</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={woFormData.workStation}
                onChange={e => setWoFormData({ ...woFormData, workStation: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">目标数量</label>
              <input
                required
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={woFormData.targetQty}
                onChange={e => setWoFormData({ ...woFormData, targetQty: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">已完成数量</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={woFormData.completedQty}
                onChange={e => setWoFormData({ ...woFormData, completedQty: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">负责人</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={woFormData.assignedTo}
                onChange={e => setWoFormData({ ...woFormData, assignedTo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">良品率 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={woFormData.qualityRate}
                onChange={e => setWoFormData({ ...woFormData, qualityRate: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">预计开始</label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={woFormData.startDate}
                onChange={e => setWoFormData({ ...woFormData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">预计结束</label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={woFormData.endDate}
                onChange={e => setWoFormData({ ...woFormData, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">状态</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white focus:border-blue-500"
                value={woFormData.status}
                onChange={e => setWoFormData({ ...woFormData, status: e.target.value as WorkOrderStatus })}
              >
                <option value="planned">计划</option>
                <option value="in_progress">生产中</option>
                <option value="completed">完成</option>
                <option value="paused">暂停</option>
                <option value="cancelled">取消</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">备注</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 resize-none"
                rows={2}
                value={woFormData.notes}
                onChange={e => setWoFormData({ ...woFormData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setIsWoModalOpen(false)}>取消</Button>
            <Button type="submit">保存工单</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductionPage;
