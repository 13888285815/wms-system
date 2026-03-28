import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { store } from '../../store';
import { Inbound, Warehouse, Supplier } from '../../types';

const InboundPage: React.FC = () => {
  const { t } = useTranslation();
  
  // Data State
  const [data, setData] = useState<Inbound[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inbound | null>(null);
  const [formData, setFormData] = useState<Partial<Inbound>>({
    warehouseId: '',
    supplierId: '',
    productName: '',
    sku: '',
    quantity: 0,
    unitPrice: 0,
    operator: '',
    inboundDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    const state = store.getState();
    setData(state.inbounds || []);
    setWarehouses(state.warehouses || []);
    setSuppliers(state.suppliers || []);
  }, []);

  const totalAmount = useMemo(() => {
    return (formData.quantity || 0) * (formData.unitPrice || 0);
  }, [formData.quantity, formData.unitPrice]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch = 
        item.inboundId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [data, statusFilter, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleOpenModal = (item: Inbound | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        warehouseId: warehouses[0]?.id || '',
        supplierId: suppliers[0]?.id || '',
        productName: '',
        sku: '',
        quantity: 0,
        unitPrice: 0,
        operator: '',
        inboundDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const payload = { ...formData, totalAmount } as Inbound;
    if (editingItem) {
      store.updateInbound(payload);
    } else {
      store.addInbound({ ...payload, inboundId: `IN${Date.now()}` });
    }
    setData([...store.getState().inbounds]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      store.deleteInbound(id);
      setData([...store.getState().inbounds]);
    }
  };

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('inboundManagement')}</h1>
        <Button onClick={() => handleOpenModal()}>{t('addInbound')}</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="w-48">
          <Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: t('allStatus'), value: 'all' },
              { label: t('pending'), value: 'pending' },
              { label: t('approved'), value: 'approved' },
              { label: t('completed'), value: 'completed' },
              { label: t('cancelled'), value: 'cancelled' },
            ]}
          />
        </div>
        <div className="flex-1">
          <Input 
            placeholder={t('searchPlaceholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['id', 'warehouse', 'supplier', 'product', 'quantity', 'unitPrice', 'total', 'operator', 'date', 'status', 'actions'].map(col => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t(`inbound.${col}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item) => (
              <tr key={item.inboundId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.inboundId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{warehouses.find(w => w.id === item.warehouseId)?.name || item.warehouseId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{suppliers.find(s => s.id === item.supplierId)?.name || item.supplierId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.productName} ({item.sku})</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥{item.unitPrice.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">¥{item.totalAmount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.operator}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.inboundDate}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge type={getStatusBadgeType(item.status)}>{t(item.status)}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">{t('edit')}</button>
                  <button onClick={() => handleDelete(item.inboundId)} className="text-red-600 hover:text-red-900">{t('delete')}</button>
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
        title={editingItem ? t('editInbound') : t('addInbound')}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave}>{t('save')}</Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Select 
            label={t('warehouse')}
            value={formData.warehouseId}
            onChange={(e) => setFormData({...formData, warehouseId: e.target.value})}
            options={warehouses.map(w => ({ label: w.name, value: w.id }))}
          />
          <Select 
            label={t('supplier')}
            value={formData.supplierId}
            onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
            options={suppliers.map(s => ({ label: s.name, value: s.id }))}
          />
          <Input 
            label={t('productName')}
            value={formData.productName}
            onChange={(e) => setFormData({...formData, productName: e.target.value})}
          />
          <Input 
            label={t('sku')}
            value={formData.sku}
            onChange={(e) => setFormData({...formData, sku: e.target.value})}
          />
          <Input 
            type="number"
            label={t('quantity')}
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
          />
          <Input 
            type="number"
            label={t('unitPrice')}
            value={formData.unitPrice}
            onChange={(e) => setFormData({...formData, unitPrice: Number(e.target.value)})}
          />
          <div className="col-span-2">
            <p className="text-sm font-medium text-gray-700">{t('totalAmount')}: <span className="text-lg text-indigo-600 font-bold">¥{totalAmount.toFixed(2)}</span></p>
          </div>
          <Input 
            label={t('operator')}
            value={formData.operator}
            onChange={(e) => setFormData({...formData, operator: e.target.value})}
          />
          <Input 
            type="date"
            label={t('inboundDate')}
            value={formData.inboundDate}
            onChange={(e) => setFormData({...formData, inboundDate: e.target.value})}
          />
          <Select 
            label={t('status')}
            className="col-span-2"
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
            options={[
              { label: t('pending'), value: 'pending' },
              { label: t('approved'), value: 'approved' },
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

export default InboundPage;
