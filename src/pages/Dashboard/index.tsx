import React from 'react';
import { Warehouse, Package, AlertTriangle, ShoppingCart, TrendingUp, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { store } from '../../store';
import { useRefresh } from '../../store/reactive';

const Dashboard: React.FC = () => {
  useRefresh(); // 虽然不需要显式调用refresh，但引入以防万一或满足规则
  const state = store.getState();
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  // 统计数据
  const stats = [
    {
      label: '仓库总数',
      value: state.warehouses.length,
      icon: Warehouse,
      color: 'bg-blue-50 text-blue-600',
      arrowColor: 'text-blue-400'
    },
    {
      label: '库存品种',
      value: state.inventory.length,
      icon: Package,
      color: 'bg-green-50 text-green-600',
      arrowColor: 'text-green-400'
    },
    {
      label: '库存预警数',
      value: state.inventory.filter(item => item.quantity < item.minStock).length,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
      arrowColor: 'text-red-400'
    },
    {
      label: '待处理订单数',
      value: state.orders.filter(order => ['pending', 'processing'].includes(order.status)).length,
      icon: ShoppingCart,
      color: 'bg-orange-50 text-orange-600',
      arrowColor: 'text-orange-400'
    }
  ];

  const lowStockItems = state.inventory
    .filter(item => item.quantity < item.minStock)
    .slice(0, 5);

  const recentInbound = [...state.inbound]
    .sort((a, b) => new Date(b.inboundDate).getTime() - new Date(a.inboundDate).getTime())
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-full">
      {/* 顶部欢迎语 */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
          <p className="text-gray-500 mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
          <TrendingUp className="w-4 h-4" />
          <span>系统运行正常</span>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative group hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
            <ArrowUpRight className={`absolute top-5 right-5 w-5 h-5 ${stat.arrowColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 库存预警列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              库存预警
            </h2>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">最近 5 条</span>
          </div>
          <div className="p-2">
            {lowStockItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold">商品名称</th>
                      <th className="px-4 py-3 font-semibold">仓库</th>
                      <th className="px-4 py-3 font-semibold text-right">当前量</th>
                      <th className="px-4 py-3 font-semibold text-right">最低量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {lowStockItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 font-medium text-gray-700">{item.productName}</td>
                        <td className="px-4 py-4 text-gray-500">{item.warehouseName}</td>
                        <td className="px-4 py-4 text-right font-bold text-red-500">{item.quantity}</td>
                        <td className="px-4 py-4 text-right text-gray-400 italic">{item.minStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-green-500">
                <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
                <p className="font-medium">库存状态正常</p>
              </div>
            )}
          </div>
        </div>

        {/* 最近入库 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              最近入库
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {recentInbound.length > 0 ? (
              recentInbound.map(record => (
                <div key={record.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 hover:border-blue-100 hover:bg-blue-50/10 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="w-5 h-5 rotate-180" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-bold text-gray-800 text-sm">{record.productName}</h4>
                      <span className="text-xs text-gray-400">{record.inboundDate}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">单号: {record.orderNo}</p>
                      <span className="text-sm font-bold text-blue-600">+{record.quantity} {record.sku.includes('EL') ? '个' : '件'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-gray-400 text-sm">暂无入库记录</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
