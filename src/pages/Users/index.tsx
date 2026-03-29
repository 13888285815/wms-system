import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { store } from '../../store';
import { User as UserType, UserRole, StatusActive, Warehouse } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useRefresh } from '../../store/reactive';

const UsersPage: React.FC = () => {
  const refresh = useRefresh();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const warehouses = useMemo(() => store.getState().warehouses, [refresh]);
  const users = useMemo(() => store.getState().users, [refresh]);

  const initialForm = {
    username: '',
    name: '',
    role: 'operator' as UserRole,
    email: '',
    phone: '',
    warehouseId: '',
    warehouseName: '全部仓库',
    status: 'active' as StatusActive,
  };

  const [formData, setFormData] = useState(initialForm);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const handleOpenModal = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        warehouseId: user.warehouseId,
        warehouseName: user.warehouseName,
        status: user.status,
      });
    } else {
      setEditingUser(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      store.updateUser(editingUser.id, formData);
    } else {
      store.addUser(formData);
    }
    refresh();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除该用户吗？')) {
      store.deleteUser(id);
      refresh();
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">超级管理员</span>;
      case 'manager':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">仓库经理</span>;
      case 'operator':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">操作员</span>;
      case 'viewer':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">只读用户</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: StatusActive) => {
    return status === 'active' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">启用</span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">禁用</span>
    );
  };

  const getAvatar = (name: string) => {
    const firstLetter = name.charAt(0).toUpperCase();
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
    const colorIndex = name.length % colors.length;
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${colors[colorIndex]} shadow-sm`}>
        {firstLetter}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-500 mt-1">配置系统权限，管理仓库管理人员与操作员账号</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shadow-sm">
          <Plus size={18} />
          新增用户
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索用户名或姓名..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">全部角色</option>
            <option value="admin">管理员</option>
            <option value="manager">经理</option>
            <option value="operator">操作员</option>
            <option value="viewer">只读用户</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm font-medium">
                <th className="px-6 py-4">用户信息</th>
                <th className="px-6 py-4">角色</th>
                <th className="px-6 py-4">邮箱 & 手机</th>
                <th className="px-6 py-4">所属仓库</th>
                <th className="px-6 py-4">状态</th>
                <th className="px-6 py-4">最后登录</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getAvatar(user.name)}
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{user.name}</span>
                        <span className="text-xs text-gray-500">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-700">{user.email}</span>
                      <span className="text-gray-500 mt-0.5">{user.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Shield size={14} className="text-blue-500" />
                      {user.warehouseName || '全部仓库'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.lastLogin || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
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

        {filteredUsers.length > pageSize && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <span className="text-sm text-gray-500">
              显示 {((currentPage - 1) * pageSize) + 1} 到 {Math.min(currentPage * pageSize, filteredUsers.length)} 条，共 {filteredUsers.length} 条
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
        title={editingUser ? '编辑用户' : '新增用户'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">用户名</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">姓名</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">角色权限</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <option value="admin">超级管理员</option>
                <option value="manager">仓库经理</option>
                <option value="operator">操作员</option>
                <option value="viewer">只读用户</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">状态</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as StatusActive })}
              >
                <option value="active">启用</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">电子邮箱</label>
              <input
                required
                type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">手机号码</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">所属仓库</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                value={formData.warehouseId}
                onChange={(e) => {
                  const id = e.target.value;
                  const warehouse = warehouses.find(w => w.id === id);
                  setFormData({ 
                    ...formData, 
                    warehouseId: id, 
                    warehouseName: id === '' ? '全部仓库' : (warehouse?.name || '') 
                  });
                }}
              >
                <option value="">全部仓库</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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

export default UsersPage;
