import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, Package, AlertTriangle, CheckCircle2, MoreHorizontal, LayoutGrid } from 'lucide-react';
import { store } from '../../store';
import { InventoryItem, StockStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useRefresh } from '../../store/reactive';

const Inventory: React.FC = () => {
  const refresh = useRefresh();
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const state = store.getState();
  const warehouses = state.warehouses;
  const suppliers = state.suppliers;
  const inventory = state.inventory;

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    productName: '',
    sku: '',
    warehouseId: '',
    warehouseName: '',
    quantity: 0,
    minStock: 10,
    maxStock: 1000,
    unit: '件',
    category: '',
    supplierId: '',
    supplierName: ''
  });

  const filteredData = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = 
        item.productName.toLowerCase().includes(search.toLowerCase()) || 
        item.sku.toLowerCase().includes(search.toLowerCase());
      const matchesWarehouse = warehouseFilter === 'all' || item.warehouseId === warehouseFilter;
      return matchesSearch && matchesWarehouse;
    });
  }, [inventory, search, warehouseFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const currentData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const getStockStatus = (item: InventoryItem): StockStatus => {
    if (item.quantity < item.minStock) return 'low';
    if (item.quantity > item.maxStock) return 'overstock';
    return 'normal';
  };

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setEditingId(item.id);
      setFormData(item);
    } else {
      setEditingId(null);
      const defaultWarehouse = warehouses[0] || { id: '', name: '' };
      const defaultSupplier = suppliers[0] || { id: '', name: '' };
      setFormData({
        productName: '',
        sku: '',
        warehouseId: defaultWarehouse.id,
        warehouseName: defaultWarehouse.name,
        quantity: 0,
        minStock: 10,
        maxStock: 1000,
        unit: '件',
        category: '',
        supplierId: defaultSupplier.id,
        supplierName: defaultSupplier.name
      });
    }
    setIsModalOpen(true);
  };

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const w = warehouses.find(wh => wh.id === id);
    if (w) {
      setFormData({ ...formData, warehouseId: w.id, warehouseName: w.name });
    }
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const s = suppliers.find(sup => sup.id === id);
    if (s) {
      setFormData({ ...formData, supplierId: s.id, supplierName: s.name });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      store.updateInventory(editingId, formData);
    } else {
      store.addInventory(formData as any);
    }
    refresh();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条库存记录吗？')) {
      store.deleteInventory(id);
      refresh();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 顶部标题栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">库存管理</h1>
          <p className="text-sm text-gray-500 mt-1">查看和管理各个仓库的实时库存量</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shadow-sm">
          <Plus size={18} />
          新增库存
        </Button>
      </div>

      {/* 筛选行 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索商品名或SKU..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 min-w-[150px]">
          <Filter size={16} className="text-gray-400" />
          <select 
            className="bg-gray-50 border-none rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-600"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="all">全部仓库</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 列表表格 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">商品详情</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">所属仓库</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">现有库存</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">警戒范围 (低-高)</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">单位</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">库存状态</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentData.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                          <Package size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{item.productName}</div>
                          <div className="text-[11px] font-mono text-gray-400 mt-0.5">{item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-600">{item.warehouseName}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${status === 'low' ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded">{item.minStock}</span>
                        <MoreHorizontal size={10} />
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded">{item.maxStock}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 italic">
                      {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {status === 'low' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                          <AlertTriangle size={12} />
                          库存不足
                        </span>
                      )}
                      {status === 'overstock' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600">
                          <AlertTriangle size={12} />
                          库存过剩
                        </span>
                      )}
                      {status === 'normal' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600">
                          <CheckCircle2 size={12} />
                          正常
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    未查找到相关库存记录
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
        title={editingId ? '编辑库存' : '新增库存'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-5 gap-y-4">
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <label className="text-sm font-semibold text-gray-700">商品名称</label>
            <input
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
              value={formData.productName || ''}
              onChange={e => setFormData({ ...formData, productName: e.target.value })}
              placeholder="请输入商品名"
            />
          </div>
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <label className="text-sm font-semibold text-gray-700">SKU</label>
            <input
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm font-mono"
              value={formData.sku || ''}
              onChange={e => setFormData({ ...formData, sku: e.target.value })}
              placeholder="例如: EL-BT-101"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">仓库</label>
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm bg-white"
              value={formData.warehouseId || ''}
              onChange={handleWarehouseChange}
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">供应商</label>
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm bg-white"
              value={formData.supplierId || ''}
              onChange={handleSupplierChange}
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">现有数量</label>
            <input
              required
              type="number"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
              value={formData.quantity || 0}
              onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">单位</label>
            <input
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
              value={formData.unit || ''}
              onChange={e => setFormData({ ...formData, unit: e.target.value })}
              placeholder="个/件/套..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">最低库存 (预警值)</label>
            <input
              required
              type="number"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm text-red-600 font-bold"
              value={formData.minStock || 0}
              onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">最高库存</label>
            <input
              required
              type="number"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
              value={formData.maxStock || 0}
              onChange={e => setFormData({ ...formData, maxStock: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <label className="text-sm font-semibold text-gray-700">分类</label>
            <input
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
              value={formData.category || ''}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              placeholder="电子产品/原材料/成品..."
            />
          </div>

          <div className="col-span-2 pt-4 flex gap-3">
            <Button type="submit" className="flex-1 justify-center py-2.5">
              保存库存信息
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

export default Inventory;
