import React, { useState, useMemo } from 'react';
import { erpStore, thisMonth } from '../../store/erp';
import { useRefresh } from '../../store/reactive';
import { 
  FinanceRecord, 
  AccountsReceivable, 
  AccountsPayable, 
  FinanceCategory, 
  FinanceType, 
  PaymentStatus 
} from '../../types/erp';

const CATEGORY_MAP: Record<FinanceCategory, string> = {
  sales: '销售收入',
  purchase: '采购支出',
  salary: '薪资',
  rent: '租金',
  tax: '税费',
  other: '其他'
};

const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; color: string }> = {
  paid: { label: '已付', color: 'bg-green-100 text-green-800' },
  unpaid: { label: '未付', color: 'bg-red-100 text-red-800' },
  partial: { label: '部分付', color: 'bg-yellow-100 text-yellow-800' },
  overdue: { label: '已逾期', color: 'bg-red-200 text-red-900 font-bold' }
};

const FinancePage: React.FC = () => {
  const refresh = useRefresh();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [modalType, setModalType] = useState<'finance' | 'ar' | 'ap'>('finance');

  const { financeRecords, accountsReceivable, accountsPayable } = erpStore.getState();

  // Tab 1 Data & Logic
  const filteredFinance = useMemo(() => {
    return financeRecords
      .filter(r => 
        r.recordNo.includes(searchQuery) || 
        r.relatedParty.includes(searchQuery) || 
        r.description.includes(searchQuery)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [financeRecords, searchQuery]);

  const financeStats = useMemo(() => {
    const currentMonth = thisMonth();
    const records = financeRecords.filter(r => r.accountDate.startsWith(currentMonth));
    const income = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const pending = financeRecords
      .filter(r => r.paymentStatus === 'unpaid' || r.paymentStatus === 'partial')
      .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);
    
    return { income, expense, profit: income - expense, pending };
  }, [financeRecords]);

  // Tab 2 Data & Logic
  const filteredAR = useMemo(() => {
    return accountsReceivable
      .filter(r => r.arNo.includes(searchQuery) || r.customerName.includes(searchQuery))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [accountsReceivable, searchQuery]);

  const arStats = useMemo(() => {
    const currentMonth = thisMonth();
    const total = accountsReceivable.reduce((sum, r) => sum + r.dueAmount, 0);
    const overdue = accountsReceivable.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.dueAmount, 0);
    const thisMonthDue = accountsReceivable.filter(r => r.dueDate.startsWith(currentMonth)).reduce((sum, r) => sum + r.dueAmount, 0);
    return { total, overdue, thisMonthDue };
  }, [accountsReceivable]);

  // Tab 3 Data & Logic
  const filteredAP = useMemo(() => {
    return accountsPayable
      .filter(r => r.apNo.includes(searchQuery) || r.supplierName.includes(searchQuery))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [accountsPayable, searchQuery]);

  const apStats = useMemo(() => {
    const currentMonth = thisMonth();
    const total = accountsPayable.reduce((sum, r) => sum + r.dueAmount, 0);
    const overdue = accountsPayable.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.dueAmount, 0);
    const thisMonthDue = accountsPayable.filter(r => r.dueDate.startsWith(currentMonth)).reduce((sum, r) => sum + r.dueAmount, 0);
    return { total, overdue, thisMonthDue };
  }, [accountsPayable]);

  // Pagination Helper
  const paginate = (data: any[]) => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  };

  const handleOpenModal = (type: 'finance' | 'ar' | 'ap', record?: any) => {
    setModalType(type);
    setEditingRecord(record || null);
    setIsModalOpen(true);
  };

  const handleDelete = (type: 'finance' | 'ar' | 'ap', id: string) => {
    if (!window.confirm('确定要删除这条记录吗？')) return;
    if (type === 'finance') erpStore.deleteFinanceRecord(id);
    else if (type === 'ar') erpStore.deleteAR(id);
    else erpStore.deleteAP(id);
    refresh();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">财务管理</h1>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="搜索关键词..."
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={() => {
              if (activeTab === 0) handleOpenModal('finance');
              else if (activeTab === 1) handleOpenModal('ar');
              else if (activeTab === 2) handleOpenModal('ap');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            新增记录
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['收支记录', '应收账款', '应付账款', '财务报表'].map((tab, idx) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(idx); setCurrentPage(1); }}
            className={`px-6 py-3 font-medium ${activeTab === idx ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="本月总收入" value={financeStats.income} color="blue" />
              <StatCard title="本月总支出" value={financeStats.expense} color="red" />
              <StatCard title="净利润" value={financeStats.profit} color="green" />
              <StatCard title="待付/收款" value={financeStats.pending} color="yellow" />
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">单号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">往来方</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginate(filteredFinance).map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.recordNo}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${record.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {record.type === 'income' ? '收入' : '支出'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{CATEGORY_MAP[record.category]}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">¥{record.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.relatedParty}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.accountDate}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${PAYMENT_STATUS_MAP[record.paymentStatus].color}`}>
                          {PAYMENT_STATUS_MAP[record.paymentStatus].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button onClick={() => handleOpenModal('finance', record)} className="text-blue-600 hover:text-blue-900 mr-3">编辑</button>
                        <button onClick={() => handleDelete('finance', record.id)} className="text-red-600 hover:text-red-900">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination total={filteredFinance.length} current={currentPage} pageSize={pageSize} onChange={setCurrentPage} />
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="总应收" value={arStats.total} color="blue" />
              <StatCard title="已逾期" value={arStats.overdue} color="red" />
              <StatCard title="本月到期" value={arStats.thisMonthDue} color="yellow" />
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AR单号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">余额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">到期日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginate(filteredAR).map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.arNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.customerName}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">¥{record.invoiceAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-red-600">¥{record.dueAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.dueDate}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${PAYMENT_STATUS_MAP[record.status].color}`}>
                          {PAYMENT_STATUS_MAP[record.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button onClick={() => handleOpenModal('ar', record)} className="text-blue-600 hover:text-blue-900 mr-3">编辑</button>
                        <button onClick={() => handleDelete('ar', record.id)} className="text-red-600 hover:text-red-900">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination total={filteredAR.length} current={currentPage} pageSize={pageSize} onChange={setCurrentPage} />
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="总应付" value={apStats.total} color="blue" />
              <StatCard title="已逾期" value={apStats.overdue} color="red" />
              <StatCard title="本月到期" value={apStats.thisMonthDue} color="yellow" />
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AP单号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">供应商</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">余额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">到期日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginate(filteredAP).map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.apNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.supplierName}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">¥{record.invoiceAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-red-600">¥{record.dueAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.dueDate}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${PAYMENT_STATUS_MAP[record.status].color}`}>
                          {PAYMENT_STATUS_MAP[record.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button onClick={() => handleOpenModal('ap', record)} className="text-blue-600 hover:text-blue-900 mr-3">编辑</button>
                        <button onClick={() => handleDelete('ap', record.id)} className="text-red-600 hover:text-red-900">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination total={filteredAP.length} current={currentPage} pageSize={pageSize} onChange={setCurrentPage} />
            </div>
          </div>
        )}

        {activeTab === 3 && <ReportsView financeRecords={financeRecords} ar={accountsReceivable} ap={accountsPayable} />}
      </div>

      {isModalOpen && (
        <FinanceModal
          type={modalType}
          record={editingRecord}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => { setIsModalOpen(false); refresh(); }}
        />
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ title, value, color }: { title: string; value: number; color: 'blue' | 'red' | 'green' | 'yellow' }) => {
  const colors = {
    blue: 'border-blue-500 text-blue-600 bg-blue-50',
    red: 'border-red-500 text-red-600 bg-red-50',
    green: 'border-green-500 text-green-600 bg-green-50',
    yellow: 'border-yellow-500 text-yellow-600 bg-yellow-50',
  };
  return (
    <div className={`p-4 rounded-lg border-l-4 shadow-sm ${colors[color]}`}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="text-2xl font-bold mt-1">¥{value.toLocaleString()}</div>
    </div>
  );
};

const Pagination = ({ total, current, pageSize, onChange }: { total: number; current: number; pageSize: number; onChange: (p: number) => void }) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
      <div className="text-sm text-gray-700">共 {total} 条记录，第 {current} / {totalPages} 页</div>
      <div className="flex space-x-2">
        <button
          disabled={current === 1}
          onClick={() => onChange(current - 1)}
          className="px-3 py-1 border rounded bg-white text-gray-600 disabled:opacity-50"
        >
          上一页
        </button>
        <button
          disabled={current === totalPages}
          onClick={() => onChange(current + 1)}
          className="px-3 py-1 border rounded bg-white text-gray-600 disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </div>
  );
};

const ReportsView = ({ financeRecords, ar, ap }: { financeRecords: FinanceRecord[]; ar: AccountsReceivable[]; ap: AccountsPayable[] }) => {
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    financeRecords.forEach(r => {
      const label = CATEGORY_MAP[r.category];
      counts[label] = (counts[label] || 0) + r.amount;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([name, val]) => ({ name, percent: (val / total) * 100, val }));
  }, [financeRecords]);

  const monthTrend = useMemo(() => {
    const currentMonth = thisMonth();
    const records = financeRecords.filter(r => r.accountDate.startsWith(currentMonth));
    const income = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const expense = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const max = Math.max(income, expense, 1);
    return [
      { label: '本月收入', val: income, percent: (income / max) * 100, color: 'bg-green-500' },
      { label: '本月支出', val: expense, percent: (expense / max) * 100, color: 'bg-red-500' }
    ];
  }, [financeRecords]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">收支分类占比</h3>
        <div className="space-y-4">
          {categoryData.map(item => (
            <div key={item.name}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.name}</span>
                <span>¥{item.val.toLocaleString()} ({item.percent.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percent}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">月度趋势对照</h3>
        <div className="space-y-6 pt-4">
          {monthTrend.map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span className="font-bold text-gray-900">¥{item.val.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div className={`${item.color} h-8 rounded-full transition-all duration-500`} style={{ width: `${item.percent}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FinanceModal = ({ type, record, onClose, onSuccess }: { type: 'finance' | 'ar' | 'ap'; record: any; onClose: () => void; onSuccess: () => void }) => {
  const [formData, setFormData] = useState<any>(record || {
    type: 'income',
    category: 'sales',
    amount: 0,
    currency: 'CNY',
    description: '',
    relatedParty: '',
    relatedOrderNo: '',
    accountDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'unpaid',
    paidAmount: 0,
    operator: '',
    notes: '',
    // AR/AP fields
    customerName: '',
    supplierName: '',
    orderNo: '',
    purchaseOrderNo: '',
    invoiceAmount: 0,
    dueAmount: 0,
    status: 'unpaid'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'finance') {
      if (record) erpStore.updateFinanceRecord(record.id, formData);
      else erpStore.addFinanceRecord(formData);
    } else if (type === 'ar') {
      const data = { ...formData, dueAmount: formData.invoiceAmount - formData.paidAmount };
      if (record) erpStore.updateAR(record.id, data);
      else erpStore.addAR({ ...data, customerId: 'manual', orderId: 'manual' });
    } else {
      const data = { ...formData, dueAmount: formData.invoiceAmount - formData.paidAmount };
      if (record) erpStore.updateAP(record.id, data);
      else erpStore.addAP({ ...data, supplierId: 'manual', purchaseOrderId: 'manual' });
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-bold mb-6">{record ? '编辑' : '新增'}{type === 'finance' ? '财务记录' : type === 'ar' ? '应收账款' : '应付账款'}</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {type === 'finance' ? (
              <>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                  <select className="w-full p-2 border rounded" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="income">收入</option>
                    <option value="expense">支出</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select className="w-full p-2 border rounded" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
                  <input type="number" className="w-full p-2 border rounded" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} required />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">币种</label>
                  <input type="text" className="w-full p-2 border rounded" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">往来方</label>
                  <input type="text" className="w-full p-2 border rounded" value={formData.relatedParty} onChange={e => setFormData({ ...formData, relatedParty: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">关联单号</label>
                  <input type="text" className="w-full p-2 border rounded" value={formData.relatedOrderNo} onChange={e => setFormData({ ...formData, relatedOrderNo: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">记账日期</label>
                  <input type="date" className="w-full p-2 border rounded" value={formData.accountDate} onChange={e => setFormData({ ...formData, accountDate: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">到期日</label>
                  <input type="date" className="w-full p-2 border rounded" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">付款状态</label>
                  <select className="w-full p-2 border rounded" value={formData.paymentStatus} onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}>
                    {Object.entries(PAYMENT_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">已付金额</label>
                  <input type="number" className="w-full p-2 border rounded" value={formData.paidAmount} onChange={e => setFormData({ ...formData, paidAmount: Number(e.target.value) })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <input type="text" className="w-full p-2 border rounded" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{type === 'ar' ? '客户名称' : '供应商名称'}</label>
                  <input type="text" className="w-full p-2 border rounded" value={type === 'ar' ? formData.customerName : formData.supplierName} onChange={e => setFormData({ ...formData, [type === 'ar' ? 'customerName' : 'supplierName']: e.target.value })} required />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{type === 'ar' ? '订单号' : '采购单号'}</label>
                  <input type="text" className="w-full p-2 border rounded" value={type === 'ar' ? formData.orderNo : formData.purchaseOrderNo} onChange={e => setFormData({ ...formData, [type === 'ar' ? 'orderNo' : 'purchaseOrderNo']: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
                  <input type="number" className="w-full p-2 border rounded" value={formData.invoiceAmount} onChange={e => setFormData({ ...formData, invoiceAmount: Number(e.target.value) })} required />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">已付金额</label>
                  <input type="number" className="w-full p-2 border rounded" value={formData.paidAmount} onChange={e => setFormData({ ...formData, paidAmount: Number(e.target.value) })} />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">到期日</label>
                  <input type="date" className="w-full p-2 border rounded" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select className="w-full p-2 border rounded" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    {Object.entries(PAYMENT_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <textarea className="w-full p-2 border rounded" rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">取消</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">提交保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinancePage;
