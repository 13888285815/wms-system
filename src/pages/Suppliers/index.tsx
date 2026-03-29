import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Building, Phone, Mail } from 'lucide-react';
import { store } from '../../store';
import { Supplier, StatusActive } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useRefresh } from '../../store/reactive';

const SuppliersPage: React.FC = () => {
  const refresh = useRefresh();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const initialForm = {
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    category: '',
    status: 'active' as StatusActive,
  };

  const [formData, setFormData] = useState(initialForm);

  const suppliers = useMemo(() => store.getState().suppliers, [refresh]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage]);

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact: supplier.contact,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        category: supplier.category,
        status: supplier.status,
      });
    } else {
      setEditingSupplier(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      store.updateSupplier(editingSupplier.id, formData);
    } else {
      store.addSupplier(formData);
    }
    refresh();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除该供应商吗？')) {
      store.deleteSupplier(id);
      refresh();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">供应商管理</h1>
          <p className="text-gray-500 mt-1">管理系统中的所有供货单位及联系人信息</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shadow-sm">
          <Plus size={18} />
          新增供应商
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="按名称、联系人或分类搜索..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm font-medium">
                <th className="px-6 py-4">供应商名称</th>
                <th className="px-6 py-4">联系人 & 电话</th>
                <th className="px-6 py-4">邮箱</th>
                <th className="px-6 py-4">地址</th>
                <th className="px-6 py-4">供货类别</th>
                <th className="px-6 py-4">状态</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Building size={20} />
                      </div>
                      <span className="font-medium text-gray-900">{supplier.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-medium">{supplier.contact}</span>
                      <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                        <Phone size={12} />
                        {supplier.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Mail size={14} className="text-gray-400" />
                      {supplier.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                    {supplier.address}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {supplier.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {supplier.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        合作中
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        已停止
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(supplier)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(supplier.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSuppliers.length > pageSize && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <span className="text-sm text-gray-500">
              显示 {((currentPage - 1) * pageSize) + 1} 到 {Math.min(currentPage * pageSize, filteredSuppliers.length)} 条，共 {filteredSuppliers.length} 条
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                上一页
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === i + 1 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? '编辑供应商' : '新增供应商'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">供应商名称</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">供货类别</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">联系人</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                value={formData.contact}
                onChange={e => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">联系电话</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">邮箱地址</label>
              <input
                required
                type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">状态</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as StatusActive })}
              >
                <option value="active">合作中</option>
                <option value="inactive">已停止</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">详细地址</label>
              <textarea
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button type="submit">
              确认提交
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuppliersPage;
