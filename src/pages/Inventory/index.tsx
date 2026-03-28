import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import { store } from '../../store';
import { InventoryItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

const Inventory: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const state = store.getState();
  const inventory = state.inventory;
  const warehouses = state.warehouses;
  const suppliers = state.suppliers;

  const [formData, setFormData] = useState<Omit<InventoryItem, 'id' | 'lastUpdated'>>({
    productId: '',
    productName: '',
    sku: '',
    warehouseId: '',
    warehouseName: '',
    quantity: 0,
    minStock: 0,
    maxStock: 0,
    unit: '',
    category: '',
    supplierId: '',
    supplierName: '',
  });

  const filteredData = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase());
      const matchWarehouse = warehouseFilter === 'all' || item.warehouseId === warehouseFilter;
      return matchSearch && matchWarehouse;
    });
  }, [inventory, search, warehouseFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity < item.minStock) return 'low';
    if (item.quantity > item.maxStock) return 'overstock';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-red-100 text-red-700';
      case 'overstock': return 'bg-orange-100 text-orange-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,
        quantity: item.quantity,
        minStock: item.minStock,
        maxStock: item.maxStock,
        unit: item.unit,
        category: item.category,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
      });
    } else {
      setEditingItem(null);
      setFormData({
        productId: '',
        productName: '',
        sku: '',
        warehouseId: '',
        warehouseName: '',
        quantity: 0,
        minStock: 0,
        maxStock: 0,
        unit: '',
        category: '',
        supplierId: '',
        supplierName: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-fill names based on IDs
    const selectedWarehouse = warehouses.find(w => w.id === formData.warehouseId);
    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
    
    const finalData = {
      ...formData,
      warehouseName: selectedWarehouse?.name || '',
      supplierName: selectedSupplier?.name || '',
      productId: formData.productId || `P-${Date.now()}` // Generate product ID if missing
    };

    if (editingItem) {
      store.updateInventory(editingItem.id, finalData);
    } else {
      store.addInventory(finalData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('common.confirmDelete'))) {
      store.deleteInventory(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('inventory.title')}</h1>
        <Button onClick={() => handleOpenModal()} className="w-full md:w-auto">
          <Plus size={20} />
          {t('inventory.addInventory')}
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('inventory.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative md:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white transition-all"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="all">{t('common.allWarehouses')}</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">{t('inventory.product')}</th>
                <th className="px-6 py-3 font-medium">{t('inventory.warehouse')}</th>
                <th className="px-6 py-3 font-medium">{t('inventory.quantity')}</th>
                <th className="px-6 py-3 font-medium">{t('inventory.stockLimit')}</th>
                <th className="px-6 py-3 font-medium">{t('inventory.status')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{item.productName}</span>
                          <span className="text-xs text-gray-500">SKU: {item.sku} | {item.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{item.warehouseName}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${status === 'low' ? 'text-red-600' : status === 'overstock' ? 'text-orange-600' : 'text-gray-900'}`}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {item.minStock} ~ {item.maxStock}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {t(`inventory.status.${status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">{t('common.noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('common.pagination', { current: currentPage, total: totalPages })}</span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                {t('common.prev')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? t('inventory.editInventory') : t('inventory.addInventory')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t('inventory.productName')}</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.productName}
                onChange={e => setFormData({ ...formData, productName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">SKU</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t('inventory.warehouse')}</label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.warehouseId}
                onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
              >
                <option value="">{t('common.selectWarehouse')}</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t('inventory.supplier')}</label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.supplierId}
                onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
              >
                <option value="">{t('common.selectSupplier')}</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t('inventory.quantity')}</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t('inventory.unit')}</label>
              <input
                type="text"
                required
                placeholder="pcs, box, kg..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t('inventory.minStock')}</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.minStock}
                onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t('inventory.maxStock')}</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.maxStock}
                onChange={e => setFormData({ ...formData, maxStock: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t('inventory.category')}</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
