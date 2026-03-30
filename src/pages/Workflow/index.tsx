import React, { useState } from 'react';
import { GitBranch, Plus, Search, Play, CheckCircle, Clock, XCircle, ChevronRight, Settings } from 'lucide-react';
import { useRefresh } from '../../store/reactive';

interface WorkflowDef {
  id: string;
  name: string;
  category: string;
  steps: string[];
  status: '启用' | '停用';
  triggerCount: number;
  successRate: number;
  lastRun: string;
  remark: string;
}

interface WorkflowInstance {
  id: string;
  defId: string;
  defName: string;
  initiator: string;
  startTime: string;
  currentStep: string;
  status: '进行中' | '已完成' | '已拒绝' | '已撤销';
  priority: '普通' | '紧急' | '非常紧急';
}

const MOCK_DEFS: WorkflowDef[] = [
  { id: '1', name: '采购申请审批', category: '采购', steps: ['提交申请','部门经理审批','财务审批','总经理审批','采购执行'], status: '启用', triggerCount: 128, successRate: 94, lastRun: '2026-03-30', remark: '' },
  { id: '2', name: '费用报销审批', category: '财务', steps: ['提交报销','直属上级审批','财务核实','财务总监审批','出纳付款'], status: '启用', triggerCount: 256, successRate: 88, lastRun: '2026-03-30', remark: '' },
  { id: '3', name: '新品上架审批', category: '产品', steps: ['产品经理申请','研发评审','质量检验','运营审批','上架发布'], status: '启用', triggerCount: 42, successRate: 100, lastRun: '2026-03-28', remark: '' },
  { id: '4', name: '员工离职流程', category: '人事', steps: ['提交离职申请','直属领导确认','HR备案','IT权限回收','财务结算'], status: '启用', triggerCount: 18, successRate: 100, lastRun: '2026-03-25', remark: '' },
  { id: '5', name: '合同签署审批', category: '法务', steps: ['起草合同','业务负责人审批','法务审查','总经理签字','归档'], status: '停用', triggerCount: 35, successRate: 91, lastRun: '2026-02-10', remark: '暂停使用' },
];

const MOCK_INSTANCES: WorkflowInstance[] = [
  { id: '1', defId: '1', defName: '采购申请审批', initiator: '李采购', startTime: '2026-03-30 09:00', currentStep: '财务审批', status: '进行中', priority: '普通' },
  { id: '2', defId: '2', defName: '费用报销审批', initiator: '王销售', startTime: '2026-03-30 10:15', currentStep: '直属上级审批', status: '进行中', priority: '紧急' },
  { id: '3', defId: '1', defName: '采购申请审批', initiator: '张采购', startTime: '2026-03-29 14:00', currentStep: '采购执行', status: '已完成', priority: '普通' },
  { id: '4', defId: '3', defName: '新品上架审批', initiator: '赵产品', startTime: '2026-03-29 11:00', currentStep: '已拒绝', status: '已拒绝', priority: '非常紧急' },
  { id: '5', defId: '2', defName: '费用报销审批', initiator: '刘HR', startTime: '2026-03-28 16:00', currentStep: '财务核实', status: '进行中', priority: '普通' },
];

const instanceStatusColor: Record<string, string> = {
  '进行中': 'bg-blue-100 text-blue-700',
  '已完成': 'bg-green-100 text-green-700',
  '已拒绝': 'bg-red-100 text-red-500',
  '已撤销': 'bg-gray-100 text-gray-500',
};

const priorityColor: Record<string, string> = {
  '普通': 'bg-gray-100 text-gray-600',
  '紧急': 'bg-orange-100 text-orange-700',
  '非常紧急': 'bg-red-100 text-red-700',
};

const instanceStatusIcon: Record<string, React.ReactNode> = {
  '进行中': <Clock size={14} className="text-blue-600" />,
  '已完成': <CheckCircle size={14} className="text-green-600" />,
  '已拒绝': <XCircle size={14} className="text-red-500" />,
  '已撤销': <XCircle size={14} className="text-gray-400" />,
};

export default function WorkflowPage() {
  const refresh = useRefresh();
  const [defs] = useState<WorkflowDef[]>(MOCK_DEFS);
  const [instances, setInstances] = useState<WorkflowInstance[]>(MOCK_INSTANCES);
  const [tab, setTab] = useState<'defs' | 'instances'>('instances');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<WorkflowInstance>>({});

  const filteredInstances = instances.filter(i =>
    (!search || i.defName.includes(search) || i.initiator.includes(search)) &&
    (!filterStatus || i.status === filterStatus)
  );

  const stats = {
    total: instances.length,
    inProgress: instances.filter(i => i.status === '进行中').length,
    done: instances.filter(i => i.status === '已完成').length,
    rejected: instances.filter(i => i.status === '已拒绝').length,
  };

  const handleLaunch = () => {
    if (!form.defId || !form.initiator) return;
    const def = defs.find(d => d.id === form.defId);
    if (!def) return;
    const newInst: WorkflowInstance = {
      id: Date.now().toString(),
      defId: form.defId,
      defName: def.name,
      initiator: form.initiator,
      startTime: new Date().toLocaleString('zh-CN'),
      currentStep: def.steps[0],
      status: '进行中',
      priority: form.priority as WorkflowInstance['priority'] || '普通',
    };
    setInstances(prev => [newInst, ...prev]);
    setShowModal(false); setForm({}); refresh();
  };

  return (
    <div className="p-6 space-y-6">
      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '流程实例', value: stats.total, icon: GitBranch, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '进行中', value: stats.inProgress, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: '已完成', value: stats.done, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '已拒绝', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab切换 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { key: 'instances', label: '流程实例' },
            { key: 'defs', label: '流程定义' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${tab === t.key ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'instances' && (
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索流程/发起人..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">全部状态</option>
                  {['进行中','已完成','已拒绝','已撤销'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                <Play size={15} /> 发起流程
              </button>
            </div>
            <div className="space-y-2">
              {filteredInstances.map(inst => (
                <div key={inst.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="flex-shrink-0">{instanceStatusIcon[inst.status]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800 text-sm">{inst.defName}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${priorityColor[inst.priority]}`}>{inst.priority}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${instanceStatusColor[inst.status]}`}>{inst.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>发起人：{inst.initiator}</span>
                      <span>当前步骤：<span className="text-blue-600">{inst.currentStep}</span></span>
                      <span>{inst.startTime}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </div>
              ))}
              {filteredInstances.length === 0 && (
                <div className="text-center text-gray-400 py-10">暂无流程实例</div>
              )}
            </div>
          </div>
        )}

        {tab === 'defs' && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defs.map(def => (
                <div key={def.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-800">{def.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{def.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${def.status === '启用' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{def.status}</span>
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Settings size={14} /></button>
                    </div>
                  </div>
                  {/* 步骤流 */}
                  <div className="flex items-center gap-1 flex-wrap mb-3">
                    {def.steps.map((step, i) => (
                      <React.Fragment key={i}>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg">{step}</span>
                        {i < def.steps.length - 1 && <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>触发次数 <span className="font-semibold text-gray-600">{def.triggerCount}</span></span>
                    <span>成功率 <span className="font-semibold text-green-600">{def.successRate}%</span></span>
                    <span>最近 {def.lastRun}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 发起流程弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">发起流程</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">选择流程</label>
                <select value={form.defId || ''} onChange={e => setForm(p => ({ ...p, defId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">请选择流程</option>
                  {defs.filter(d => d.status === '启用').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">发起人</label>
                <input value={form.initiator || ''} onChange={e => setForm(p => ({ ...p, initiator: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="填写发起人姓名" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">优先级</label>
                <select value={form.priority || '普通'} onChange={e => setForm(p => ({ ...p, priority: e.target.value as any }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['普通','紧急','非常紧急'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              {form.defId && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="text-xs text-blue-600 font-medium mb-2">流程步骤</div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {defs.find(d => d.id === form.defId)?.steps.map((s, i, arr) => (
                      <React.Fragment key={i}>
                        <span className="text-xs text-blue-700">{s}</span>
                        {i < arr.length - 1 && <ChevronRight size={11} className="text-blue-300" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => { setShowModal(false); setForm({}); }} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleLaunch} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">发起</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
