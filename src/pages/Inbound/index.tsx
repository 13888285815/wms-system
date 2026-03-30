import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import { store } from '../../store';
import { InboundRecord, OrderStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useRefresh } from '../../store/reactive';

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const configs: Record<string, { label: string; className: string }> = {
    pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '已审核', className: 'bg-blue-100 text-blue-700' },
    completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
    cancelled: { label: '已取消', className: 'bg-red-100 text-red-700' },
  };
  const config = configs[status] || configs.pending;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const InboundPage: React.FC = () => {
  const refresh = useRefresh();
  const { inbound, warehouses, suppliers } = store.getState();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm: Omit<InboundRecord, 'id' | 'orderNo'> = {
    warehouseId: '',
    warehouseName: '',
    supplierId: '',
    supplierName: '',
    productId: 'p-custom',
    productName: '',
    sku: '',
    quantity: 0,
    unitPrice: 0,
    totalAmount: 0,
    operator: '',
    inboundDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const filteredData = useMemo(() => {
    return inbound.filter(item => {
      const matchesSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || 
                          item.productName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => b.inboundDate.localeCompare(a.inboundDate));
  }, [inbound, search, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InboundRecord) => {
    setEditingId(item.id);
    setFormData({
      warehouseId: item.warehouseId,
      warehouseName: item.warehouseName,
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: item.totalAmount,
      operator: item.operator,
      inboundDate: item.inboundDate,
      status: item.status,
      notes: item.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条入库记录吗？')) {
      store.deleteInbound(id);
      refresh();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      store.updateInbound(editingId, formData);
    } else {
      store.addInbound(formData);
    }
    setIsModalOpen(false);
    refresh();
  };

  const handleWarehouseChange = (id: string) => {
    const w = warehouses.find(i => i.id === id);
    setFormData(prev => ({ ...prev, warehouseId: id, warehouseName: w?.name || '' }));
  };

  const handleSupplierChange = (id: string) => {
    const s = suppliers.find(i => i.id === id);
    setFormData(prev => ({ ...prev, supplierId: id, supplierName: s?.name || '' }));
  };

  const updateAmount = (qty: number, price: number) => {
    setFormData(prev => ({ ...prev, quantity: qty, unitPrice: price, totalAmount: qty * price }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">入库管理</h1>
          <p className="text-gray-500 text-sm mt-1">管理商品的入库流程和历史记录</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus size={18} />
          新增入库
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索入库单号、商品名称..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已审核</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">入库单号</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">仓库</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">供应商</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">商品名</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">数量</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">单价</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">总金额</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">操作员</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">日期</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">状态</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{item.orderNo}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.warehouseName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.supplierName}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                    <div className="text-xs text-gray-400">{item.sku}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">¥{item.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-blue-600 text-right font-bold">¥{item.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.operator}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.inboundDate}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-400">
                    暂无入库记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 {filteredData.length} 条 / 第 {page} 页
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              上一页
            </Button>
            <Button variant="secondary" size="sm" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>
              下一页
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? '编辑入库单' : '新增入库单'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">入库仓库</label>
              <select
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={formData.warehouseId}
                onChange={e => handleWarehouseChange(e.target.value)}
              >
                <option value="">选择仓库</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">供应商</label>
              <select
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={formData.supplierId}
                onChange={e => handleSupplierChange(e.target.value)}
              >
                <option value="">选择供应商</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">商品名称</label>
              <input
                required
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={formData.productName}
                onChange={e => setFormData(prev => ({ ...prev, productName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">商品SKU</label>
              <input
                required
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={formData.sku}
                onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">数量</label>
              <input
                required
                type="number"
                min="1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={formData.quantity}
                onChange={e => updateAmount(Number(e.target.value), formData.unitPrice)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">单价 (¥)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={formData.unitPrice}
                onChange={e => updateAmount(formData.quantity, Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">总金额</label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-blue-600 font-bold">
                ¥{formData.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">操作员</label>
              <input
                required
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={formData.operator}
                onChange={e => setFormData(prev => ({ ...prev, operator: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">入库日期</label>
              <input
                required
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={formData.inboundDate}
                onChange={e => setFormData(prev => ({ ...prev, inboundDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">状态</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
            >
              <option value="pending">待审核</option>
              <option value="approved">已审核</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">备注</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button type="submit">
              确定
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InboundPage;
