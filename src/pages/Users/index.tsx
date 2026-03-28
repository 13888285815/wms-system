import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import { User, UserRole, StatusActive } from '../../types';
import { store } from '../../store';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Omit<User, 'id' | 'createdAt' | 'lastLogin' | 'warehouseName'>>({
    username: '',
    name: '',
    role: 'operator',
    email: '',
    phone: '',
    warehouseId: '',
    status: 'active',
  });

  const { users, warehouses } = store.getState();

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        warehouseId: user.warehouseId,
        status: user.status,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        name: '',
        role: 'operator',
        email: '',
        phone: '',
        warehouseId: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const warehouseName = formData.warehouseId === '' ? t('All') : (warehouses.find(w => w.id === formData.warehouseId)?.name || '');
    const dataWithWarehouseName = { ...formData, warehouseName };

    if (editingUser) {
      store.updateUser(editingUser.id, dataWithWarehouseName);
    } else {
      store.addUser(dataWithWarehouseName);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('Are you sure you want to delete this user?'))) {
      store.deleteUser(id);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'manager': return 'info';
      case 'operator': return 'success';
      case 'viewer': return 'default';
      default: return 'default';
    }
  };

  const roleOptions = [
    { value: 'admin', label: t('Administrator') },
    { value: 'manager', label: t('Manager') },
    { value: 'operator', label: t('Operator') },
    { value: 'viewer', label: t('Viewer') },
  ];

  const warehouseOptions = [
    { value: '', label: t('All') },
    ...warehouses.map(w => ({ value: w.id, label: w.name }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('User Management')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} />
          {t('Add User')}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder={t('Search by username, name or email...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="text-gray-400" size={18} />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'all', label: t('All Roles') },
              ...roleOptions
            ]}
            className="w-full md:w-48"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Username')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Name')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Role')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Email')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Phone')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Warehouse')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Status')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Last Login')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {t(user.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.warehouseName}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge variant={user.status === 'active' ? 'success' : 'default'}>
                      {t(user.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{user.lastLogin}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(user)}>
                        <Edit2 size={16} className="text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 italic">
                    {t('No users found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? t('Edit User') : t('Add User')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('Username')}
              required
              disabled={!!editingUser}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            <Input
              label={t('Name')}
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('Role')}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={roleOptions}
            />
            <Select
              label={t('Status')}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusActive })}
              options={[
                { value: 'active', label: t('Active') },
                { value: 'inactive', label: t('Inactive') },
              ]}
            />
          </div>
          <Input
            label={t('Email')}
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label={t('Phone')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Select
            label={t('Assigned Warehouse')}
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            options={warehouseOptions}
            disabled={formData.role === 'admin'}
          />
          {formData.role === 'admin' && (
            <p className="text-xs text-gray-500 italic px-1">
              {t('Admins have access to all warehouses.')}
            </p>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit">
              {t('Save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
