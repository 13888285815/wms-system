import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { store } from '../../store';
import { Order, Warehouse } from '../../types';

const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  
  const [data, setData] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Order | null>(null);
  const [formData, setFormData] = useState<Partial<Order>>({
    customer: '',
    products: '',
    totalAmount: 0,
    warehouseId: '',
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    const state = store.getState();
    setData(state.orders || []);
    setWarehouses(state.warehouses || []);
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesStatus;
    });
  }, [data, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleOpenModal = (item: Order | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        customer: '',
        products: '',
        totalAmount: 0,
        warehouseId: warehouses[0]?.id || '',
        status: 'pending',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const payload = formData as Order;
    if (editingItem) {
      store.updateOrder(payload);
    } else {
      store.addOrder({ ...payload, orderId: `ORD${Date.now()}`, createdAt: new Date().toISOString() });
    }
    setData([...store.getState().orders]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      store.deleteOrder(id);
      setData([...store.getState().orders]);
    }
  };

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('orderManagement')}</h1>
        <Button onClick={() => handleOpenModal()}>{t('addOrder')}</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="w-48">
          <Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: t('allStatus'), value: 'all' },
              { label: t('pending'), value: 'pending' },
              { label: t('processing'), value: 'processing' },
              { label: t('shipped'), value: 'shipped' },
              { label: t('completed'), value: 'completed' },
              { label: t('cancelled'), value: 'cancelled' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['id', 'customer', 'product', 'totalAmount', 'warehouse', 'status', 'createdAt', 'actions'].map(col => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t(`order.${col}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item) => (
              <tr key={item.orderId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.orderId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.customer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{item.products}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">¥{item.totalAmount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{warehouses.find(w => w.id === item.warehouseId)?.name || item.warehouseId}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge type={getStatusBadgeType(item.status)}>{t(item.status)}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">{t('edit')}</button>
                  <button onClick={() => handleDelete(item.orderId)} className="text-red-600 hover:text-red-900">{t('delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-700">
          {t('paginationInfo', { current: currentPage, total: totalPages })}
        </span>
        <div className="flex gap-2">
          <Button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>{t('prev')}</Button>
          <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>{t('next')}</Button>
        </div>
      </div>

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? t('editOrder') : t('addOrder')}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave}>{t('save')}</Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label={t('customer')}
            className="col-span-2"
            value={formData.customer}
            onChange={(e) => setFormData({...formData, customer: e.target.value})}
          />
          <Input 
            label={t('products')}
            className="col-span-2"
            value={formData.products}
            onChange={(e) => setFormData({...formData, products: e.target.value})}
          />
          <Input 
            type="number"
            label={t('totalAmount')}
            value={formData.totalAmount}
            onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})}
          />
          <Select 
            label={t('warehouse')}
            value={formData.warehouseId}
            onChange={(e) => setFormData({...formData, warehouseId: e.target.value})}
            options={warehouses.map(w => ({ label: w.name, value: w.id }))}
          />
          <Select 
            label={t('status')}
            className="col-span-2"
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
            options={[
              { label: t('pending'), value: 'pending' },
              { label: t('processing'), value: 'processing' },
              { label: t('shipped'), value: 'shipped' },
              { label: t('completed'), value: 'completed' },
              { label: t('cancelled'), value: 'cancelled' },
            ]}
          />
          <Input 
            label={t('notes')}
            className="col-span-2"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </div>
      </Modal>
    </div>
  );
};

export default OrdersPage;
