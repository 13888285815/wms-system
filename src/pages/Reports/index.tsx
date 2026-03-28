import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Filter, BarChart2, PieChart, Activity, ShoppingCart } from 'lucide-react';
import { store } from '../../store';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

type TabType = 'inventory' | 'inbound' | 'outbound' | 'orders';

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [warehouseId, setWarehouseId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { inventory, inbound, outbound, orders, warehouses } = store.getState();

  const filteredData = useMemo(() => {
    const isDateInRange = (date: string) => {
      if (!startDate && !endDate) return true;
      const d = new Date(date);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate)) return false;
      return true;
    };

    const isWarehouseMatch = (id: string) => warehouseId === 'all' || id === warehouseId;

    switch (activeTab) {
      case 'inventory':
        return inventory.filter(i => isWarehouseMatch(i.warehouseId));
      case 'inbound':
        return inbound.filter(i => isWarehouseMatch(i.warehouseId) && isDateInRange(i.inboundDate));
      case 'outbound':
        return outbound.filter(i => isWarehouseMatch(i.warehouseId) && isDateInRange(i.outboundDate));
      case 'orders':
        return orders.filter(o => isWarehouseMatch(o.warehouseId) && isDateInRange(o.createdAt));
      default:
        return [];
    }
  }, [activeTab, warehouseId, startDate, endDate, inventory, inbound, outbound, orders]);

  const stats = useMemo(() => {
    switch (activeTab) {
      case 'inventory':
        const totalQty = filteredData.reduce((acc, curr: any) => acc + curr.quantity, 0);
        const lowStock = filteredData.filter((i: any) => i.quantity <= i.minStock).length;
        return [
          { label: t('Total Quantity'), value: totalQty, icon: <Activity className="text-blue-500" /> },
          { label: t('Total Categories'), value: filteredData.length, icon: <BarChart2 className="text-green-500" /> },
          { label: t('Low Stock Items'), value: lowStock, icon: <PieChart className="text-red-500" /> },
        ];
      case 'inbound':
        const inboundQty = filteredData.reduce((acc, curr: any) => acc + curr.quantity, 0);
        const inboundAmount = filteredData.reduce((acc, curr: any) => acc + curr.totalAmount, 0);
        return [
          { label: t('Total Inbound Qty'), value: inboundQty, icon: <Activity className="text-blue-500" /> },
          { label: t('Total Inbound Amount'), value: `¥${inboundAmount.toLocaleString()}`, icon: <ShoppingCart className="text-green-500" /> },
          { label: t('Total Transactions'), value: filteredData.length, icon: <BarChart2 className="text-indigo-500" /> },
        ];
      case 'outbound':
        const outboundQty = filteredData.reduce((acc, curr: any) => acc + curr.quantity, 0);
        return [
          { label: t('Total Outbound Qty'), value: outboundQty, icon: <Activity className="text-blue-500" /> },
          { label: t('Total Transactions'), value: filteredData.length, icon: <BarChart2 className="text-indigo-500" /> },
        ];
      case 'orders':
        const ordersAmount = filteredData.reduce((acc, curr: any) => acc + curr.totalAmount, 0);
        const completedOrders = filteredData.filter((o: any) => o.status === 'completed').length;
        return [
          { label: t('Total Order Amount'), value: `¥${ordersAmount.toLocaleString()}`, icon: <ShoppingCart className="text-green-500" /> },
          { label: t('Total Orders'), value: filteredData.length, icon: <BarChart2 className="text-blue-500" /> },
          { label: t('Completed Orders'), value: completedOrders, icon: <Activity className="text-green-500" /> },
        ];
    }
  }, [activeTab, filteredData, t]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = Object.keys(filteredData[0]);
    const csvContent = [
      headers.join(','),
      ...filteredData.map((row: any) => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'inventory', label: t('Inventory Report') },
    { key: 'inbound', label: t('Inbound Report') },
    { key: 'outbound', label: t('Outbound Report') },
    { key: 'orders', label: t('Order Report') },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('Report Center')}</h1>
        <Button variant="outline" onClick={handleExportCSV} disabled={filteredData.length === 0} className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
          <Download size={18} />
          {t('Export CSV')}
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-64">
            <Select
              label={t('Warehouse')}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              options={[{ value: 'all', label: t('All Warehouses') }, ...warehouses.map(w => ({ value: w.id, label: w.name }))]}
            />
          </div>
          {activeTab !== 'inventory' && (
            <>
              <div className="w-full sm:w-48">
                <Input
                  label={t('Start Date')}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Input
                  label={t('End Date')}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats?.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-gray-50 rounded-lg">
              {React.cloneElement(stat.icon as React.ReactElement, { size: 24 })}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 px-2 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              {activeTab === 'inventory' && (
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Product Name')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('SKU')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Warehouse')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Quantity')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Unit')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Category')}</th>
                </tr>
              )}
              {activeTab === 'inbound' && (
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Order No')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Date')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Warehouse')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Product')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Quantity')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Total Amount')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Operator')}</th>
                </tr>
              )}
              {activeTab === 'outbound' && (
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Order No')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Date')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Warehouse')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Product')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Quantity')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Destination')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Operator')}</th>
                </tr>
              )}
              {activeTab === 'orders' && (
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Order No')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Created At')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Customer')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Products')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Total Amount')}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">{t('Status')}</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  {activeTab === 'inventory' && (
                    <>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.productName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{item.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.warehouseName}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.unit}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                    </>
                  )}
                  {activeTab === 'inbound' && (
                    <>
                      <td className="px-6 py-4 text-sm text-blue-600 font-medium">{item.orderNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.inboundDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.warehouseName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.productName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">¥{item.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.operator}</td>
                    </>
                  )}
                  {activeTab === 'outbound' && (
                    <>
                      <td className="px-6 py-4 text-sm text-blue-600 font-medium">{item.orderNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.outboundDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.warehouseName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.productName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.destination}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.operator}</td>
                    </>
                  )}
                  {activeTab === 'orders' && (
                    <>
                      <td className="px-6 py-4 text-sm text-blue-600 font-medium">{item.orderNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.createdAt}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.customer}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{item.products}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">¥{item.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t(item.status)}</td>
                    </>
                  )}
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                    {t('No records found for the selected criteria')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
