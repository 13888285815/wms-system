import React, { useState } from 'react';
import { Tag, Plus, Search, Edit2, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useRefresh } from '../../store/reactive';

interface PriceItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minPrice: number;
  discount: number;
  currency: string;
  effectDate: string;
  expireDate: string;
  status: '有效' | '过期' | '草稿';
  remark: string;
}

const MOCK: PriceItem[] = [
  { id: '1', code: 'P-001', name: '铝合金外壳A', category: '原材料', unit: '个', costPrice: 25.5, salePrice: 45.0, minPrice: 38.0, discount: 95, currency: 'CNY', effectDate: '2026-01-01', expireDate: '2026-12-31', status: '有效', remark: '' },
  { id: '2', code: 'P-002', name: '电路板PCB-01', category: '元器件', unit: '片', costPrice: 18.0, salePrice: 35.0, minPrice: 28.0, discount: 90, currency: 'CNY', effectDate: '2026-01-01', expireDate: '2026-06-30', status: '有效', remark: '批量优惠' },
  { id: '3', code: 'P-003', name: '成品组装件X', category: '成品', unit: '台', costPrice: 120.0, salePrice: 299.0, minPrice: 240.0, discount: 85, currency: 'CNY', effectDate: '2026-02-01', expireDate: '2026-12-31', status: '有效', remark: '' },
  { id: '4', code: 'P-004', name: '螺丝M3×8', category: '辅料', unit: '千个', costPrice: 8.0, salePrice: 20.0, minPrice: 15.0, discount: 100, currency: 'CNY', effectDate: '2025-01-01', expireDate: '2025-12-31', status: '过期', remark: '' },
  { id: '5', code: 'P-005', name: '新款外壳B', category: '原材料', unit: '个', costPrice: 32.0, salePrice: 58.0, minPrice: 48.0, discount: 95, currency: 'CNY', effectDate: '2026-04-01', expireDate: '2026-12-31', status: '草稿', remark: '待审核' },
];

const statusColor: Record<string, string> = {
  '有效': 'bg-green-100 text-green-700',
  '过期': 'bg-gray-100 text-gray-500',
  '草稿': 'bg-yellow-100 text-yellow-700',
};

export default function PricePage() {
  const refresh = useRefresh();
  const [items, setItems] = useState<PriceItem[]>(MOCK);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PriceItem | null>(null);
  const [form, setForm] = useState<Partial<PriceItem>>({});

  const categories = [...new Set(items.map(i => i.category))];
  const filtered = items.filter(i =>
    (!search || i.name.includes(search) || i.code.includes(search)) &&
    (!filterCat || i.category === filterCat) &&
    (!filterStatus || i.status === filterStatus)
  );

  const avgMargin = items.filter(i => i.status === '有效').length
    ? Math.round(items.filter(i => i.status === '有效').reduce((acc, i) => acc + (i.salePrice - i.costPrice) / i.salePrice * 100, 0) / items.filter(i => i.status === '有效').length)
    : 0;

  const openAdd = () => { setEditItem(null); setForm({ currency: 'CNY', status: '草稿', discount: 100 }); setShowModal(true); };
  const openEdit = (item: PriceItem) => { setEditItem(item); setForm({ ...item }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name || !form.category) return;
    if (editItem) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...form } as PriceItem : i));
    } else {
      const newItem: PriceItem = {
        id: Date.now().toString(),
        code: `P-${String(items.length + 1).padStart(3, '0')}`,
        name: form.name || '',
        category: form.category || '',
        unit: form.unit || '个',
        costPrice: Number(form.costPrice) || 0,
        salePrice: Number(form.salePrice) || 0,
        minPrice: Number(form.minPrice) || 0,
        discount: Number(form.discount) || 100,
        currency: form.currency || 'CNY',
        effectDate: form.effectDate || new Date().toISOString().slice(0, 10),
        expireDate: form.expireDate || '2026-12-31',
        status: form.status as PriceItem['status'] || '草稿',
        remark: form.remark || '',
      };
      setItems(prev => [newItem, ...prev]);
    }
    setShowModal(false); setForm({}); setEditItem(null); refresh();
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id)); refresh();
  };

  return (
    <div className="p-6 space-y-6">
      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '价格条目', value: items.length, icon: Tag, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '有效价格', value: items.filter(i => i.status === '有效').length, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '平均毛利率', value: `${avgMargin}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: '待审核', value: items.filter(i => i.status === '草稿').length, icon: TrendingDown, color: 'text-yellow-600', bg: 'bg-yellow-50' },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索产品/编码..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">全部分类</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">全部状态</option>
            {['有效','过期','草稿'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> 新增价格
        </button>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['编码','产品名称','分类','单位','成本价','销售价','最低价','折扣率','毛利率','生效日期','状态','操作'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => {
                const margin = item.salePrice > 0 ? Math.round((item.salePrice - item.costPrice) / item.salePrice * 100) : 0;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{item.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-gray-700">¥{item.costPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-blue-600 font-semibold">¥{item.salePrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">¥{item.minPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{item.discount}%</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-500'}`}>{margin}%</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.effectDate}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColor[item.status]}`}>{item.status}</span></td>
                    <td className="px-4 py-3 flex gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-12 text-center text-gray-400">暂无价格数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editItem ? '编辑价格' : '新增价格'}</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '产品名称', key: 'name', type: 'text' },
                { label: '分类', key: 'category', type: 'text' },
                { label: '单位', key: 'unit', type: 'text' },
                { label: '成本价', key: 'costPrice', type: 'number' },
                { label: '销售价', key: 'salePrice', type: 'number' },
                { label: '最低价', key: 'minPrice', type: 'number' },
                { label: '折扣率(%)', key: 'discount', type: 'number' },
                { label: '生效日期', key: 'effectDate', type: 'date' },
                { label: '到期日期', key: 'expireDate', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">状态</label>
                <select value={form.status || ''} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['有效','过期','草稿'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-gray-500 mb-1 block">备注</label>
              <input value={form.remark || ''} onChange={e => setForm(p => ({ ...p, remark: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => { setShowModal(false); setForm({}); }} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
