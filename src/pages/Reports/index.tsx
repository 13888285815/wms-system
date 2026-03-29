import React, { useState, useMemo } from 'react';
import { Download, BarChart2, Package, TrendingUp, TrendingDown, Calendar, Warehouse as WarehouseIcon } from 'lucide-react';
import { store } from '../../store';
import { useRefresh } from '../../store/reactive';

const ReportsPage: React.FC = () => {
  const refresh = useRefresh();
  const [activeTab, setActiveTab] = useState<'inventory' | 'inbound' | 'outbound' | 'orders'>('inventory');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const warehouses = useMemo(() => store.getState().warehouses, [refresh]);

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(r => Object.values(r).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const isWithinDateRange = (dateStr: string) => {
    if (!startDate && !endDate) return true;
    const date = new Date(dateStr);
    if (startDate && date < new Date(startDate)) return false;
    if (endDate && date > new Date(endDate)) return false;
    return true;
  };

  // Inventory Data
  const inventoryData = useMemo(() => {
    return store.getState().inventory.filter(item => {
      const matchesWarehouse = !warehouseFilter || item.warehouseId === warehouseFilter;
      // Note: inventoryItem has lastUpdated, but we usually report current state. 
      // Rule says filter by date range if applicable.
      const matchesDate = isWithinDateRange(item.lastUpdated);
      return matchesWarehouse && matchesDate;
    });
  }, [refresh, warehouseFilter, startDate, endDate]);

  const inventoryStats = useMemo(() => {
    const total = inventoryData.length;
    const low = inventoryData.filter(i => i.quantity < i.minStock).length;
    const over = inventoryData.filter(i => i.quantity > i.maxStock).length;
    return { total, low, over };
  }, [inventoryData]);

  // Inbound Data
  const inboundData = useMemo(() => {
    return store.getState().inbound.filter(item => {
      const matchesWarehouse = !warehouseFilter || item.warehouseId === warehouseFilter;
      const matchesDate = isWithinDateRange(item.inboundDate);
      return matchesWarehouse && matchesDate;
    });
  }, [refresh, warehouseFilter, startDate, endDate]);

  const inboundStats = useMemo(() => {
    const count = inboundData.length;
    const totalQty = inboundData.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = inboundData.reduce((sum, i) => sum + i.totalAmount, 0);
    return { count, totalQty, totalAmount };
  }, [inboundData]);

  // Outbound Data
  const outboundData = useMemo(() => {
    return store.getState().outbound.filter(item => {
      const matchesWarehouse = !warehouseFilter || item.warehouseId === warehouseFilter;
      const matchesDate = isWithinDateRange(item.outboundDate);
      return matchesWarehouse && matchesDate;
    });
  }, [refresh, warehouseFilter, startDate, endDate]);

  const outboundStats = useMemo(() => {
    const count = outboundData.length;
    const totalQty = outboundData.reduce((sum, i) => sum + i.quantity, 0);
    return { count, totalQty };
  }, [outboundData]);

  // Order Data
  const orderData = useMemo(() => {
    return store.getState().orders.filter(item => {
      const matchesWarehouse = !warehouseFilter || item.warehouseId === warehouseFilter;
      const matchesDate = isWithinDateRange(item.createdAt);
      return matchesWarehouse && matchesDate;
    });
  }, [refresh, warehouseFilter, startDate, endDate]);

  const orderStats = useMemo(() => {
    const count = orderData.length;
    const totalAmount = orderData.reduce((sum, i) => sum + i.totalAmount, 0);
    const completed = orderData.filter(o => o.status === 'completed').length;
    return { count, totalAmount, completed };
  }, [orderData]);

  const handleExport = () => {
    let dataToExport: any[] = [];
    let filename = '';
    
    if (activeTab === 'inventory') {
      dataToExport = inventoryData;
      filename = '库存报表.csv';
    } else if (activeTab === 'inbound') {
      dataToExport = inboundData;
      filename = '入库报表.csv';
    } else if (activeTab === 'outbound') {
      dataToExport = outboundData;
      filename = '出库报表.csv';
    } else if (activeTab === 'orders') {
      dataToExport = orderData;
      filename = '订单报表.csv';
    }
    
    exportCSV(dataToExport, filename);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">报表中心</h1>
          <p className="text-gray-500 mt-1">查看系统运营汇总数据，导出业务报表</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-end gap-4">
        <div className="space-y-1.5 flex-1 w-full">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <WarehouseIcon size={14} /> 所属仓库
          </label>
          <select
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="">全部仓库</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5 flex-1 w-full">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Calendar size={14} /> 开始日期
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 flex-1 w-full">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Calendar size={14} /> 结束日期
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium h-[38px] shadow-sm"
        >
          <Download size={16} />
          导出CSV
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { id: 'inventory', name: '库存报表', icon: Package },
          { id: 'inbound', name: '入库报表', icon: TrendingUp },
          { id: 'outbound', name: '出库报表', icon: TrendingDown },
          { id: 'orders', name: '订单报表', icon: BarChart2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative ${
              activeTab === tab.id 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.name}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">总品种数</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryStats.total}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">库存预警数</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryStats.low}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">过剩品种数</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryStats.over}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-medium">
                    <th className="px-6 py-4">商品名称</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">仓库</th>
                    <th className="px-6 py-4">当前库存</th>
                    <th className="px-6 py-4">最低库存</th>
                    <th className="px-6 py-4">最高库存</th>
                    <th className="px-6 py-4">单位</th>
                    <th className="px-6 py-4">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventoryData.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.productName}</td>
                      <td className="px-6 py-4 text-gray-500">{item.sku}</td>
                      <td className="px-6 py-4 text-gray-600">{item.warehouseName}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-gray-500">{item.minStock}</td>
                      <td className="px-6 py-4 text-gray-500">{item.maxStock}</td>
                      <td className="px-6 py-4 text-gray-500">{item.unit}</td>
                      <td className="px-6 py-4">
                        {item.quantity < item.minStock ? (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase">不足</span>
                        ) : item.quantity > item.maxStock ? (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100 uppercase">过剩</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 uppercase">正常</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inbound' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">入库总次数</p>
                <p className="text-2xl font-bold text-gray-900">{inboundStats.count}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">入库总数量</p>
                <p className="text-2xl font-bold text-gray-900">{inboundStats.totalQty}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold">¥</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">入库总金额</p>
                <p className="text-2xl font-bold text-gray-900">¥{inboundStats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-medium">
                    <th className="px-6 py-4">入库单号</th>
                    <th className="px-6 py-4">仓库</th>
                    <th className="px-6 py-4">供应商</th>
                    <th className="px-6 py-4">商品</th>
                    <th className="px-6 py-4">数量</th>
                    <th className="px-6 py-4">单价</th>
                    <th className="px-6 py-4">总金额</th>
                    <th className="px-6 py-4">日期</th>
                    <th className="px-6 py-4">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inboundData.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-mono text-xs font-medium text-blue-600">{item.orderNo}</td>
                      <td className="px-6 py-4 text-gray-600">{item.warehouseName}</td>
                      <td className="px-6 py-4 text-gray-600">{item.supplierName}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{item.productName}</td>
                      <td className="px-6 py-4 text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-gray-500">¥{item.unitPrice}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">¥{item.totalAmount}</td>
                      <td className="px-6 py-4 text-gray-500">{item.inboundDate}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          {item.status === 'completed' ? '已入库' : '待处理'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'outbound' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">出库总次数</p>
                <p className="text-2xl font-bold text-gray-900">{outboundStats.count}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">出库总数量</p>
                <p className="text-2xl font-bold text-gray-900">{outboundStats.totalQty}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-medium">
                    <th className="px-6 py-4">出库单号</th>
                    <th className="px-6 py-4">仓库</th>
                    <th className="px-6 py-4">商品</th>
                    <th className="px-6 py-4">数量</th>
                    <th className="px-6 py-4">目的地</th>
                    <th className="px-6 py-4">日期</th>
                    <th className="px-6 py-4">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {outboundData.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-mono text-xs font-medium text-red-600">{item.orderNo}</td>
                      <td className="px-6 py-4 text-gray-600">{item.warehouseName}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{item.productName}</td>
                      <td className="px-6 py-4 text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-gray-500">{item.destination}</td>
                      <td className="px-6 py-4 text-gray-500">{item.outboundDate}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          {item.status === 'completed' ? '已出库' : '待处理'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <BarChart2 size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">订单总数</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.count}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold">¥</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">总金额</p>
                <p className="text-2xl font-bold text-gray-900">¥{orderStats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">已完成数</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-medium">
                    <th className="px-6 py-4">订单号</th>
                    <th className="px-6 py-4">客户</th>
                    <th className="px-6 py-4">商品明细</th>
                    <th className="px-6 py-4">金额</th>
                    <th className="px-6 py-4">状态</th>
                    <th className="px-6 py-4">仓库</th>
                    <th className="px-6 py-4">日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderData.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-mono text-xs font-medium text-indigo-600">{item.orderNo}</td>
                      <td className="px-6 py-4 text-gray-900">{item.customer}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{item.products}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">¥{item.totalAmount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'completed' ? 'bg-green-50 text-green-600' : 
                          item.status === 'shipped' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                        }`}>
                          {item.status === 'completed' ? '已完成' : 
                           item.status === 'shipped' ? '已发货' : '处理中'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{item.warehouseName}</td>
                      <td className="px-6 py-4 text-gray-500">{item.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
