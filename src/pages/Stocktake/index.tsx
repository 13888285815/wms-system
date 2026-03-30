import React, { useState } from 'react';
import { ClipboardList, Plus, Search, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useRefresh } from '../../store/reactive';

interface StocktakeTask {
  id: string;
  code: string;
  warehouse: string;
  type: '全盘' | '抽盘' | '循环盘点';
  planner: string;
  planDate: string;
  actualDate: string;
  status: '待执行' | '进行中' | '已完成' | '已取消';
  totalSku: number;
  countedSku: number;
  diffQty: number;
  diffAmount: number;
  remark: string;
}

interface StocktakeDetail {
  id: string;
  taskId: string;
  sku: string;
  product: string;
  bookQty: number;
  actualQty: number;
  diff: number;
  reason: string;
}

const MOCK_TASKS: StocktakeTask[] = [
  { id: '1', code: 'ST-2026-001', warehouse: '主仓库A', type: '全盘', planner: '张主管', planDate: '2026-03-28', actualDate: '2026-03-28', status: '已完成', totalSku: 120, countedSku: 120, diffQty: -8, diffAmount: -1240, remark: '月末盘点' },
  { id: '2', code: 'ST-2026-002', warehouse: '副仓库B', type: '抽盘', planner: '李主管', planDate: '2026-03-29', actualDate: '2026-03-29', status: '进行中', totalSku: 50, countedSku: 32, diffQty: -2, diffAmount: -380, remark: '' },
  { id: '3', code: 'ST-2026-003', warehouse: '主仓库A', type: '循环盘点', planner: '张主管', planDate: '2026-03-30', actualDate: '', status: '待执行', totalSku: 30, countedSku: 0, diffQty: 0, diffAmount: 0, remark: '重点SKU' },
  { id: '4', code: 'ST-2026-004', warehouse: '临时仓C', type: '全盘', planner: '王主管', planDate: '2026-03-25', actualDate: '2026-03-26', status: '已完成', totalSku: 80, countedSku: 80, diffQty: 5, diffAmount: 620, remark: '' },
];

const MOCK_DETAILS: StocktakeDetail[] = [
  { id: '1', taskId: '1', sku: 'SKU-001', product: '铝合金外壳A', bookQty: 500, actualQty: 495, diff: -5, reason: '损耗' },
  { id: '2', taskId: '1', sku: 'SKU-002', product: '电路板PCB-01', bookQty: 200, actualQty: 197, diff: -3, reason: '丢失' },
  { id: '3', taskId: '1', sku: 'SKU-003', product: '成品组装件X', bookQty: 100, actualQty: 100, diff: 0, reason: '' },
  { id: '4', taskId: '4', sku: 'SKU-010', product: '螺丝M3×8', bookQty: 2000, actualQty: 2005, diff: 5, reason: '入库多计' },
];

const statusColor: Record<string, string> = {
  '待执行': 'bg-gray-100 text-gray-600',
  '进行中': 'bg-blue-100 text-blue-700',
  '已完成': 'bg-green-100 text-green-700',
  '已取消': 'bg-red-100 text-red-500',
};

const typeColor: Record<string, string> = {
  '全盘': 'bg-purple-100 text-purple-700',
  '抽盘': 'bg-orange-100 text-orange-700',
  '循环盘点': 'bg-cyan-100 text-cyan-700',
};

export default function StocktakePage() {
  const refresh = useRefresh();
  const [tasks, setTasks] = useState<StocktakeTask[]>(MOCK_TASKS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<StocktakeTask | null>(null);
  const [form, setForm] = useState<Partial<StocktakeTask>>({});

  const details = MOCK_DETAILS.filter(d => d.taskId === selectedTask?.id);
  const filtered = tasks.filter(t =>
    (!search || t.code.includes(search) || t.warehouse.includes(search)) &&
    (!filterStatus || t.status === filterStatus)
  );

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === '已完成').length,
    inProgress: tasks.filter(t => t.status === '进行中').length,
    pending: tasks.filter(t => t.status === '待执行').length,
  };

  const handleAdd = () => {
    if (!form.warehouse || !form.type) return;
    const newTask: StocktakeTask = {
      id: Date.now().toString(),
      code: `ST-2026-${String(tasks.length + 1).padStart(3, '0')}`,
      warehouse: form.warehouse || '',
      type: form.type as StocktakeTask['type'] || '全盘',
      planner: form.planner || '',
      planDate: form.planDate || new Date().toISOString().slice(0, 10),
      actualDate: '',
      status: '待执行',
      totalSku: Number(form.totalSku) || 0,
      countedSku: 0,
      diffQty: 0,
      diffAmount: 0,
      remark: form.remark || '',
    };
    setTasks(prev => [newTask, ...prev]);
    setShowModal(false); setForm({}); refresh();
  };

  return (
    <div className="p-6 space-y-6">
      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '盘点任务', value: stats.total, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '已完成', value: stats.done, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '进行中', value: stats.inProgress, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: '待执行', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 任务列表 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 flex-1">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索单号/仓库..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">全部状态</option>
                {['待执行','进行中','已完成','已取消'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} /> 新建盘点
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['盘点单号','仓库','类型','计划日期','SKU数','已盘','差异数量','状态'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(t => (
                    <tr key={t.id} onClick={() => setSelectedTask(t)}
                      className={`cursor-pointer transition-colors ${selectedTask?.id === t.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-3 font-mono text-xs text-blue-600">{t.code}</td>
                      <td className="px-3 py-3 font-medium text-gray-800">{t.warehouse}</td>
                      <td className="px-3 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${typeColor[t.type]}`}>{t.type}</span></td>
                      <td className="px-3 py-3 text-gray-500">{t.planDate}</td>
                      <td className="px-3 py-3 text-gray-700">{t.totalSku}</td>
                      <td className="px-3 py-3 text-gray-700">{t.countedSku}</td>
                      <td className="px-3 py-3">
                        <span className={t.diffQty === 0 ? 'text-gray-500' : t.diffQty > 0 ? 'text-green-600' : 'text-red-500'}>
                          {t.diffQty > 0 ? '+' : ''}{t.diffQty}
                        </span>
                      </td>
                      <td className="px-3 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColor[t.status]}`}>{t.status}</span></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">暂无盘点任务</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 盘点明细 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-blue-600" />
            {selectedTask ? `${selectedTask.code} 明细` : '点击任务查看明细'}
          </h3>
          {selectedTask ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['仓库', selectedTask.warehouse], ['类型', selectedTask.type],
                  ['计划日期', selectedTask.planDate], ['状态', selectedTask.status],
                  ['差异数量', String(selectedTask.diffQty)], ['差异金额', `¥${selectedTask.diffAmount}`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-2">
                    <div className="text-gray-400">{k}</div>
                    <div className="font-medium text-gray-700 mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              {details.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-500 mb-2">差异明细</div>
                  <div className="space-y-2">
                    {details.filter(d => d.diff !== 0).map(d => (
                      <div key={d.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-xl p-2">
                        <div>
                          <div className="font-medium text-gray-700">{d.product}</div>
                          <div className="text-gray-400">{d.sku}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${d.diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {d.diff > 0 ? '+' : ''}{d.diff}
                          </div>
                          <div className="text-gray-400">{d.reason}</div>
                        </div>
                      </div>
                    ))}
                    {details.filter(d => d.diff !== 0).length === 0 && (
                      <div className="text-center text-gray-400 py-4">无差异记录</div>
                    )}
                  </div>
                </div>
              )}
              {details.length === 0 && (
                <div className="text-center text-gray-400 py-6 text-sm">暂无明细数据</div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12 text-sm">请从左侧选择盘点任务</div>
          )}
        </div>
      </div>

      {/* 新建弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新建盘点任务</h3>
            <div className="space-y-4">
              {[
                { label: '仓库名称', key: 'warehouse', type: 'text' },
                { label: '负责人', key: 'planner', type: 'text' },
                { label: '计划日期', key: 'planDate', type: 'date' },
                { label: 'SKU数量', key: 'totalSku', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">盘点类型</label>
                <select value={form.type || ''} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">请选择</option>
                  {['全盘','抽盘','循环盘点'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">备注</label>
                <input value={form.remark || ''} onChange={e => setForm(p => ({ ...p, remark: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => { setShowModal(false); setForm({}); }} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
