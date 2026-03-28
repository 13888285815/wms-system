import React from 'react';
import { useTranslation } from 'react-i18next';
import { Warehouse, Package, AlertTriangle, ShoppingCart } from 'lucide-react';
import { store } from '../../store';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const state = store.getState();

  const totalWarehouses = state.warehouses.length;
  const totalProducts = state.inventory.length;
  const lowStockItems = state.inventory.filter(i => i.quantity < i.minStock).length;
  const pendingOrders = state.orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

  const inventoryWarnings = state.inventory
    .filter(i => i.quantity < i.minStock)
    .slice(0, 5); // Show top 5 warnings

  const recentInbound = [...state.inbound]
    .sort((a, b) => new Date(b.inboundDate).getTime() - new Date(a.inboundDate).getTime())
    .slice(0, 3);

  const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: any, colorClass: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="text-white" size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('dashboard.totalWarehouses')} value={totalWarehouses} icon={Warehouse} colorClass="bg-blue-500" />
        <StatCard title={t('dashboard.totalProducts')} value={totalProducts} icon={Package} colorClass="bg-green-500" />
        <StatCard title={t('dashboard.lowStockItems')} value={lowStockItems} icon={AlertTriangle} colorClass="bg-red-500" />
        <StatCard title={t('dashboard.pendingOrders')} value={pendingOrders} icon={ShoppingCart} colorClass="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Warning Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{t('dashboard.inventoryWarning')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">{t('common.productName')}</th>
                  <th className="px-6 py-3 font-medium">{t('common.warehouse')}</th>
                  <th className="px-6 py-3 font-medium text-red-600">{t('common.quantity')}</th>
                  <th className="px-6 py-3 font-medium">{t('common.minStock')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {inventoryWarnings.length > 0 ? (
                  inventoryWarnings.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-medium">{item.productName}</td>
                      <td className="px-6 py-4 text-gray-500">{item.warehouseName}</td>
                      <td className="px-6 py-4 text-red-600 font-semibold">{item.quantity} {item.unit}</td>
                      <td className="px-6 py-4 text-gray-500">{item.minStock}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">{t('common.noData')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Inbound Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{t('dashboard.recentInbound')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">{t('common.orderNo')}</th>
                  <th className="px-6 py-3 font-medium">{t('common.productName')}</th>
                  <th className="px-6 py-3 font-medium">{t('common.quantity')}</th>
                  <th className="px-6 py-3 font-medium">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {recentInbound.length > 0 ? (
                  recentInbound.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-blue-600 font-medium">{item.orderNo}</td>
                      <td className="px-6 py-4 text-gray-900">{item.productName}</td>
                      <td className="px-6 py-4 text-gray-500">{item.quantity} {item.unitPrice ? '' : ''}</td>
                      <td className="px-6 py-4 text-gray-500">{item.inboundDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">{t('common.noData')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
