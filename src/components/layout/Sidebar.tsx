import React from 'react';
import { LayoutDashboard, Warehouse, Package, ArrowDownToLine, ArrowUpFromLine, ShoppingCart, Truck, Users, BarChart3, Settings, X, LogOut, CreditCard, Zap } from 'lucide-react';
import { User } from '../../types';
import { subscriptionStore } from '../../store/subscription';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  currentUser: User;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: '仪表盘', icon: LayoutDashboard, page: 'dashboard' },
  { label: '仓库管理', icon: Warehouse, page: 'warehouses' },
  { label: '库存管理', icon: Package, page: 'inventory' },
  { label: '入库管理', icon: ArrowDownToLine, page: 'inbound' },
  { label: '出库管理', icon: ArrowUpFromLine, page: 'outbound' },
  { label: '订单管理', icon: ShoppingCart, page: 'orders' },
  { label: '供应商', icon: Truck, page: 'suppliers' },
  { label: '用户管理', icon: Users, page: 'users' },
  { label: '报表中心', icon: BarChart3, page: 'reports' },
  { label: '系统设置', icon: Settings, page: 'settings' },
];

const roleLabels: Record<string, string> = {
  admin: "超级管理员",
  manager: "仓库经理",
  operator: "操作员",
  viewer: "只读"
};

const planLabels: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise"
};

const planColors: Record<string, string> = {
  free: 'bg-gray-700 text-gray-300',
  pro: 'bg-blue-600 text-white',
  enterprise: 'bg-purple-600 text-white',
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage, onNavigate, currentUser, onLogout, isOpen, onClose
}) => {
  const plan = subscriptionStore.getCurrentPlan();
  const tokens = subscriptionStore.getTokensAvailable();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-40
          flex flex-col transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:z-auto
        `}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Warehouse size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight truncate">WMS Cloud</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto" role="navigation">
          {navItems.map(({ label, icon: Icon, page }) => (
            <button
              key={page}
              onClick={() => { onNavigate(page); onClose(); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1
                transition-all
                ${currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-gray-800 space-y-4">
          {/* Subscription & Tokens Card */}
          <div className="bg-gray-800/50 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">当前方案</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${planColors[plan.id] || 'bg-gray-600'}`}>
                {planLabels[plan.id] || plan.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap size={14} className="text-yellow-400 flex-shrink-0" />
              <span className="font-medium truncate">
                {tokens === Infinity ? '无限制' : `${tokens.toLocaleString()} Token`}
              </span>
            </div>
            <button
              onClick={() => { onNavigate('subscription'); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <CreditCard size={12} />
              <span>订阅计费</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{currentUser.name}</div>
              <div className="text-xs text-gray-500 truncate">{roleLabels[currentUser.role] || currentUser.role}</div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>
    </>
  );
};
