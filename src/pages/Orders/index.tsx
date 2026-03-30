import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, Warehouse } from 'lucide-react';
import { store } from '../../store';
import { Order, OrderStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useRefresh } from '../../store/reactive';

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const configs: Record<string, { label: string; className: string }> = {
    pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
    processing: { label: '处理中', className: 'bg-blue-100 text-blue-700' },
    shipped: { label: '已发货', className: 'bg-purple-100 text-purple-700' },
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

const OrdersPage: React.FC = () => {
  const refresh = useRefresh();
  const { orders, warehouses } = store.getState();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm: Omit<Order, 'id' | 'orderNo' | 'createdAt'> = {
    customer: '',
    products: '',
    totalAmount: 0,
    status: 'pending',
    warehouseId: '',
    warehouseName: '',
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const filteredData = useMemo(() => {
    return orders.filter(item => {
      const matchesSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || 
                          item.customer.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesWarehouse = warehouseFilter === 'all' || item.warehouseId === warehouseFilter;
      return matchesSearch && matchesStatus && matchesWarehouse;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, search, statusFilter, warehouseFilter]);

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

  const handleOpenEdit = (item: Order) => {
    setEditingId(item.id);
    setFormData({
      customer: item.customer,
      products: item.products,
      totalAmount: item.totalAmount,
      status: item.status,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouseName,
      notes: item.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条订单记录吗？')) {
      store.deleteOrder(id);
      refresh();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      store.updateOrder(editingId, formData);
    } else {
      store.addOrder(formData);
    }
    setIsModalOpen(false);
    refresh();
  };

  const handleWarehouseChange = (id: string) => {
    const w = warehouses.find(i => i.id === id);
    setFormData(prev => ({ ...prev, warehouseId: id, warehouseName: w?.name || '' }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
          <p className="text-gray-500 text-sm mt-1">处理销售订单和出库调度计划</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus size={18} />
          新建订单
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索订单号、客户名称..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Warehouse size={18} className="text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={warehouseFilter}
              onChange={e => setWarehouseFilter(e.target.value)}
            >
              <option value="all">所有仓库</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="shipped">已发货</option>
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
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">订单号</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">客户</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">商品</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">总金额</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">仓库</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">状态</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">创建时间</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{item.orderNo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="truncate max-w-[200px] inline-block">{item.products}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ¥{item.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.warehouseName}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.createdAt}</td>
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
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    暂无订单记录
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
        title={editingId ? '编辑订单' : '新建订单'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">客户名称</label>
            <input
              required
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              value={formData.customer}
              onChange={e => setFormData(prev => ({ ...prev, customer: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">商品描述</label>
            <input
              required
              type="text"
              placeholder="如：USB充电线 x100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              value={formData.products}
              onChange={e => setFormData(prev => ({ ...prev, products: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">总金额 (¥)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={formData.totalAmount}
                onChange={e => setFormData(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">出库仓库</label>
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
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">状态</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
            >
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="shipped">已发货</option>
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

export default OrdersPage;
