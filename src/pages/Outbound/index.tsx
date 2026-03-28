import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { store } from '../../store';
import { Outbound, Warehouse } from '../../types';

const OutboundPage: React.FC = () => {
  const { t } = useTranslation();
  
  const [data, setData] = useState<Outbound[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Outbound | null>(null);
  const [formData, setFormData] = useState<Partial<Outbound>>({
    warehouseId: '',
    productName: '',
    sku: '',
    destination: '',
    quantity: 0,
    operator: '',
    outboundDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    const state = store.getState();
    setData(state.outbounds || []);
    setWarehouses(state.warehouses || []);
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesWarehouse = warehouseFilter === 'all' || item.warehouseId === warehouseFilter;
      const matchesSearch = 
        item.outboundId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.destination?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesWarehouse && matchesSearch;
    });
  }, [data, warehouseFilter, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleOpenModal = (item: Outbound | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        warehouseId: warehouses[0]?.id || '',
        productName: '',
        sku: '',
        destination: '',
        quantity: 0,
        operator: '',
        outboundDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        reason: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const payload = formData as Outbound;
    if (editingItem) {
      store.updateOutbound(payload);
    } else {
      store.addOutbound({ ...payload, outboundId: `OUT${Date.now()}` });
    }
    setData([...store.getState().outbounds]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      store.deleteOutbound(id);
      setData([...store.getState().outbounds]);
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
        <h1 className="text-2xl font-bold">{t('outboundManagement')}</h1>
        <Button onClick={() => handleOpenModal()}>{t('addOutbound')}</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="w-48">
          <Select 
            value={warehouseFilter} 
            onChange={(e) => setWarehouseFilter(e.target.value)}
            options={[
              { label: t('allWarehouses'), value: 'all' },
              ...warehouses.map(w => ({ label: w.name, value: w.id }))
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
              {['id', 'warehouse', 'destination', 'product', 'quantity', 'operator', 'date', 'status', 'reason', 'actions'].map(col => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t(`outbound.${col}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item) => (
              <tr key={item.outboundId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.outboundId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{warehouses.find(w => w.id === item.warehouseId)?.name || item.warehouseId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.destination}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.productName} ({item.sku})</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.operator}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.outboundDate}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge type={getStatusBadgeType(item.status)}>{t(item.status)}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{item.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">{t('edit')}</button>
                  <button onClick={() => handleDelete(item.outboundId)} className="text-red-600 hover:text-red-900">{t('delete')}</button>
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
        title={editingItem ? t('editOutbound') : t('addOutbound')}
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
            className="col-span-2"
            value={formData.warehouseId}
            onChange={(e) => setFormData({...formData, warehouseId: e.target.value})}
            options={warehouses.map(w => ({ label: w.name, value: w.id }))}
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
            label={t('destination')}
            className="col-span-2"
            value={formData.destination}
            onChange={(e) => setFormData({...formData, destination: e.target.value})}
          />
          <Input 
            type="number"
            label={t('quantity')}
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
          />
          <Input 
            label={t('operator')}
            value={formData.operator}
            onChange={(e) => setFormData({...formData, operator: e.target.value})}
          />
          <Input 
            type="date"
            label={t('outboundDate')}
            value={formData.outboundDate}
            onChange={(e) => setFormData({...formData, outboundDate: e.target.value})}
          />
          <Select 
            label={t('status')}
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
            label={t('reason')}
            className="col-span-2"
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
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

export default OutboundPage;
