import React from 'react';
import {
  LayoutDashboard, Warehouse, Package, ArrowDownToLine, ArrowUpFromLine,
  ShoppingCart, Truck, Users, BarChart3, Settings, X, LogOut, CreditCard,
  Zap, DollarSign, UserCheck, Handshake, ClipboardList, Factory, ChevronRight
} from 'lucide-react';
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

const navGroups = [
  {
    label: '工作台',
    items: [
      { label: '工作台', icon: LayoutDashboard, page: 'dashboard' },
    ],
  },
  {
    label: '仓储管理',
    items: [
      { label: '仓库管理', icon: Warehouse, page: 'warehouses' },
      { label: '库存管理', icon: Package, page: 'inventory' },
      { label: '入库管理', icon: ArrowDownToLine, page: 'inbound' },
      { label: '出库管理', icon: ArrowUpFromLine, page: 'outbound' },
      { label: '销售订单', icon: ShoppingCart, page: 'orders' },
      { label: '供应商', icon: Truck, page: 'suppliers' },
    ],
  },
  {
    label: '企业管理 ERP',
    items: [
      { label: '财务管理', icon: DollarSign, page: 'finance' },
      { label: '人力资源', icon: UserCheck, page: 'hr' },
      { label: '客户关系', icon: Handshake, page: 'crm' },
      { label: '采购管理', icon: ClipboardList, page: 'purchase' },
      { label: '生产管理', icon: Factory, page: 'production' },
      { label: '质量管理', icon: ShieldCheck, page: 'quality' },
      { label: '价格管理', icon: Tag, page: 'price' },
      { label: '盘点管理', icon: ScanLine, page: 'stocktake' },
      { label: '流程管理', icon: GitBranch, page: 'workflow' },
    ],
  },
  {
    label: '系统',
    items: [
      { label: '报表中心', icon: BarChart3, page: 'reports' },
      { label: '用户管理', icon: Users, page: 'users' },
      { label: '系统设置', icon: Settings, page: 'settings' },
    ],
  },
];

const roleLabels: Record<string, string> = {
  admin: '超级管理员',
  manager: '仓库经理',
  operator: '操作员',
  viewer: '只读',
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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Factory size={16} />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">ERP Cloud</span>
              <div className="text-[10px] text-gray-500 leading-none">企业资源管理系统</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 py-3 overflow-y-auto no-scrollbar" role="navigation">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {/* Group Header */}
              <div className="px-4 py-1.5">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  {group.label}
                </span>
              </div>
              {/* Group Items */}
              {group.items.map(({ label, icon: Icon, page }) => (
                <button
                  key={page}
                  onClick={() => { onNavigate(page); onClose(); }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-sm font-medium
                    transition-all duration-150 mb-0.5 w-[calc(100%-8px)]
                    ${currentPage === page
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="truncate flex-1 text-left">{label}</span>
                  {currentPage === page && <ChevronRight size={12} className="flex-shrink-0 opacity-60" />}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 space-y-3">
          {/* Plan & Tokens */}
          <div className="bg-gray-800/60 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">当前方案</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${planColors[plan.id] || 'bg-gray-600'}`}>
                {plan.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap size={13} className="text-yellow-400 flex-shrink-0" />
              <span className="text-gray-300 text-xs truncate">
                {tokens === Infinity ? '无限 Token' : `${tokens.toLocaleString()} Token 剩余`}
              </span>
            </div>
            <button
              onClick={() => { onNavigate('subscription'); onClose(); }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300"
            >
              <CreditCard size={11} />
              <span>订阅与计费</span>
            </button>
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
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
            <LogOut size={15} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>
    </>
  );
};
