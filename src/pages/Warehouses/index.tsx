import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Phone, Building2, User } from 'lucide-react';
import { store } from '../../store';
import { Warehouse, StatusActive } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useRefresh } from '../../store/reactive';

const Warehouses: React.FC = () => {
  const refresh = useRefresh();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Warehouse>>({
    name: '',
    manager: '',
    contactPhone: '',
    capacity: 1000,
    location: '',
    status: 'active' as StatusActive,
    notes: ''
  });

  const warehouses = store.getState().warehouses;

  const filteredData = useMemo(() => {
    return warehouses.filter(w => 
      w.name.toLowerCase().includes(search.toLowerCase()) || 
      w.location.toLowerCase().includes(search.toLowerCase())
    );
  }, [warehouses, search]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const currentData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenModal = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingId(warehouse.id);
      setFormData(warehouse);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        manager: '',
        contactPhone: '',
        capacity: 1000,
        location: '',
        status: 'active',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      store.updateWarehouse(editingId, formData);
    } else {
      store.addWarehouse(formData as any);
    }
    refresh();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除该仓库吗？此操作不可撤销。')) {
      store.deleteWarehouse(id);
      refresh();
    }
  };

  const getCapacityColor = (used: number, total: number) => {
    const ratio = used / total;
    if (ratio > 0.9) return 'bg-red-500';
    if (ratio > 0.8) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* 顶部标题栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">仓库管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理系统内所有存储网点及其状态</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shadow-sm">
          <Plus size={18} />
          新增仓库
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索仓库名称或地址..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 列表表格 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">仓库名称</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">地址</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">负责人 & 电话</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">容量占用</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentData.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Building2 size={16} />
                      </div>
                      <span className="font-bold text-gray-800">{w.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5 max-w-[200px] truncate">
                      <MapPin size={14} className="text-gray-400 shrink-0" />
                      {w.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-700 flex items-center gap-1">
                        <User size={14} className="text-gray-400" />
                        {w.manager}
                      </div>
                      <div className="text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone size={12} />
                        {w.contactPhone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full max-w-[120px]">
                      <div className="flex justify-between text-[10px] mb-1 font-medium text-gray-400">
                        <span>{Math.round((w.usedCapacity / w.capacity) * 100)}%</span>
                        <span>{w.usedCapacity}/{w.capacity}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getCapacityColor(w.usedCapacity, w.capacity)}`}
                          style={{ width: `${(w.usedCapacity / w.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {w.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        启用
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        停用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(w)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(w.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    未找到相关仓库信息
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* 分页 */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
          <span className="text-sm text-gray-500 font-medium">
            第 {page} 页 / 共 {totalPages || 1} 页
          </span>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              上一页
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>

      {/* 编辑/新增 Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? '编辑仓库' : '新增仓库'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">仓库名称</label>
            <input
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入仓库名称"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">负责人</label>
            <input
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
              value={formData.manager || ''}
              onChange={e => setFormData({ ...formData, manager: e.target.value })}
              placeholder="请输入负责人姓名"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">联系电话</label>
            <input
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
              value={formData.contactPhone || ''}
              onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="请输入联系电话"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">仓库容量 (件/m³)</label>
            <input
              required
              type="number"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
              value={formData.capacity || ''}
              onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
              placeholder="请输入容量数值"
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-sm font-semibold text-gray-700">地址</label>
            <input
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
              value={formData.location || ''}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="请输入详细地址"
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-sm font-semibold text-gray-700">状态</label>
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm bg-white"
              value={formData.status || 'active'}
              onChange={e => setFormData({ ...formData, status: e.target.value as StatusActive })}
            >
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-sm font-semibold text-gray-700">备注</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm min-h-[80px]"
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="请输入备注说明（可选）"
            />
          </div>
          <div className="col-span-2 pt-4 flex gap-3">
            <Button type="submit" className="flex-1 justify-center py-2.5">
              保存仓库信息
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1 justify-center py-2.5">
              取消
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Warehouses;
