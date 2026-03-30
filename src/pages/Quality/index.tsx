import React, { useState } from 'react';
import { ShieldCheck, Plus, Search, CheckCircle, XCircle, AlertTriangle, ClipboardCheck, Eye } from 'lucide-react';
import { useRefresh } from '../../store/reactive';

interface QualityRecord {
  id: string;
  code: string;
  product: string;
  batch: string;
  type: '来料检验' | '过程检验' | '成品检验' | '出货检验';
  inspector: string;
  date: string;
  qty: number;
  passQty: number;
  failQty: number;
  result: '合格' | '不合格' | '待检';
  defects: string;
  remark: string;
}

const MOCK: QualityRecord[] = [
  { id: '1', code: 'QC-2026-001', product: '铝合金外壳A', batch: 'B20260101', type: '来料检验', inspector: '张质检', date: '2026-03-28', qty: 500, passQty: 495, failQty: 5, result: '合格', defects: '轻微划痕', remark: '允收' },
  { id: '2', code: 'QC-2026-002', product: '电路板PCB-01', batch: 'B20260102', type: '过程检验', inspector: '李质检', date: '2026-03-28', qty: 200, passQty: 180, failQty: 20, result: '不合格', defects: '焊点不良', remark: '退货处理' },
  { id: '3', code: 'QC-2026-003', product: '成品组装件X', batch: 'B20260103', type: '成品检验', inspector: '王质检', date: '2026-03-29', qty: 100, passQty: 100, failQty: 0, result: '合格', defects: '', remark: '全检通过' },
  { id: '4', code: 'QC-2026-004', product: '螺丝M3×8', batch: 'B20260104', type: '来料检验', inspector: '张质检', date: '2026-03-29', qty: 2000, passQty: 0, failQty: 0, result: '待检', defects: '', remark: '' },
  { id: '5', code: 'QC-2026-005', product: '包装盒大号', batch: 'B20260105', type: '出货检验', inspector: '李质检', date: '2026-03-30', qty: 300, passQty: 298, failQty: 2, result: '合格', defects: '印刷偏色', remark: '特采放行' },
];

const resultColor: Record<string, string> = {
  '合格': 'bg-green-100 text-green-700',
  '不合格': 'bg-red-100 text-red-700',
  '待检': 'bg-yellow-100 text-yellow-700',
};

const typeColor: Record<string, string> = {
  '来料检验': 'bg-blue-100 text-blue-700',
  '过程检验': 'bg-purple-100 text-purple-700',
  '成品检验': 'bg-indigo-100 text-indigo-700',
  '出货检验': 'bg-orange-100 text-orange-700',
};

export default function QualityPage() {
  const refresh = useRefresh();
  const [records, setRecords] = useState<QualityRecord[]>(MOCK);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewRecord, setViewRecord] = useState<QualityRecord | null>(null);
  const [form, setForm] = useState<Partial<QualityRecord>>({});

  const filtered = records.filter(r =>
    (!search || r.product.includes(search) || r.code.includes(search)) &&
    (!filterType || r.type === filterType) &&
    (!filterResult || r.result === filterResult)
  );

  const stats = {
    total: records.length,
    pass: records.filter(r => r.result === '合格').length,
    fail: records.filter(r => r.result === '不合格').length,
    pending: records.filter(r => r.result === '待检').length,
    passRate: records.filter(r => r.result !== '待检').length
      ? Math.round(records.filter(r => r.result === '合格').length / records.filter(r => r.result !== '待检').length * 100)
      : 0,
  };

  const handleAdd = () => {
    if (!form.product || !form.type) return;
    const newRecord: QualityRecord = {
      id: Date.now().toString(),
      code: `QC-2026-${String(records.length + 1).padStart(3, '0')}`,
      product: form.product || '',
      batch: form.batch || '',
      type: form.type as QualityRecord['type'] || '来料检验',
      inspector: form.inspector || '',
      date: form.date || new Date().toISOString().slice(0, 10),
      qty: Number(form.qty) || 0,
      passQty: Number(form.passQty) || 0,
      failQty: Number(form.failQty) || 0,
      result: form.result as QualityRecord['result'] || '待检',
      defects: form.defects || '',
      remark: form.remark || '',
    };
    setRecords(prev => [newRecord, ...prev]);
    setShowModal(false);
    setForm({});
    refresh();
  };

  return (
    <div className="p-6 space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '检验总数', value: stats.total, icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '合格', value: stats.pass, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '不合格', value: stats.fail, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: '待检', value: stats.pending, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: '合格率', value: `${stats.passRate}%`, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
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

      {/* 工具栏 */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索产品/单号..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">全部类型</option>
            {['来料检验','过程检验','成品检验','出货检验'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterResult} onChange={e => setFilterResult(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">全部结果</option>
            {['合格','不合格','待检'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> 新建检验单
        </button>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['检验单号','产品名称','批次','类型','检验员','日期','数量','合格','不合格','结果','操作'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{r.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.product}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.batch}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${typeColor[r.type]}`}>{r.type}</span></td>
                  <td className="px-4 py-3 text-gray-600">{r.inspector}</td>
                  <td className="px-4 py-3 text-gray-500">{r.date}</td>
                  <td className="px-4 py-3 text-gray-800">{r.qty}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{r.passQty}</td>
                  <td className="px-4 py-3 text-red-500">{r.failQty}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${resultColor[r.result]}`}>{r.result}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewRecord(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={15} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-gray-400">暂无检验记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新建弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新建检验单</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '产品名称', key: 'product', type: 'text' },
                { label: '批次号', key: 'batch', type: 'text' },
                { label: '检验员', key: 'inspector', type: 'text' },
                { label: '检验日期', key: 'date', type: 'date' },
                { label: '送检数量', key: 'qty', type: 'number' },
                { label: '合格数量', key: 'passQty', type: 'number' },
                { label: '不合格数量', key: 'failQty', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">检验类型</label>
                <select value={form.type || ''} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">请选择</option>
                  {['来料检验','过程检验','成品检验','出货检验'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">检验结果</label>
                <select value={form.result || ''} onChange={e => setForm(p => ({ ...p, result: e.target.value as any }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">请选择</option>
                  {['合格','不合格','待检'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-gray-500 mb-1 block">缺陷描述</label>
              <input value={form.defects || ''} onChange={e => setForm(p => ({ ...p, defects: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => { setShowModal(false); setForm({}); }} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {viewRecord && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">检验详情</h3>
              <button onClick={() => setViewRecord(null)} className="text-gray-400 hover:text-gray-600"><XCircle size={20} /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['单号', viewRecord.code], ['产品', viewRecord.product], ['批次', viewRecord.batch],
                ['类型', viewRecord.type], ['检验员', viewRecord.inspector], ['日期', viewRecord.date],
                ['送检数', viewRecord.qty], ['合格数', viewRecord.passQty], ['不合格数', viewRecord.failQty],
                ['结果', viewRecord.result], ['缺陷描述', viewRecord.defects || '-'], ['备注', viewRecord.remark || '-'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setViewRecord(null)} className="mt-5 w-full py-2 bg-gray-100 rounded-xl text-sm text-gray-600 hover:bg-gray-200">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
