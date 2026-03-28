import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Warehouse, Package, ArrowDownToLine, ArrowUpFromLine,
  ShoppingCart, Truck, Users, BarChart3, Settings, X, LogOut, CreditCard, Zap
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

const navItems = [
  { key: 'dashboard',     icon: LayoutDashboard,  page: 'dashboard' },
  { key: 'warehouses',    icon: Warehouse,         page: 'warehouses' },
  { key: 'inventory',     icon: Package,           page: 'inventory' },
  { key: 'inbound',       icon: ArrowDownToLine,   page: 'inbound' },
  { key: 'outbound',      icon: ArrowUpFromLine,   page: 'outbound' },
  { key: 'orders',        icon: ShoppingCart,       page: 'orders' },
  { key: 'suppliers',     icon: Truck,             page: 'suppliers' },
  { key: 'users',         icon: Users,             page: 'users' },
  { key: 'reports',       icon: BarChart3,         page: 'reports' },
  { key: 'settings',      icon: Settings,          page: 'settings' },
];

const planColors: Record<string, string> = {
  free:       'bg-gray-600 text-gray-200',
  pro:        'bg-blue-600 text-blue-100',
  enterprise: 'bg-purple-600 text-purple-100',
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage, onNavigate, currentUser, onLogout, isOpen, onClose
}) => {
  const { t } = useTranslation();
  const plan = subscriptionStore.getCurrentPlan();

  const roleColors: Record<string, string> = {
    admin:    'bg-purple-100 text-purple-700',
    manager:  'bg-blue-100 text-blue-700',
    operator: 'bg-green-100 text-green-700',
    viewer:   'bg-gray-100 text-gray-700',
  };

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
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Warehouse size={18} />
            </div>
            <span className="font-bold text-sm leading-tight">{t('app.title')}</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto" role="navigation">
          {navItems.map(({ key, icon: Icon, page }) => {
            // Non-admin: block user management page
            if (page === 'users' && currentUser.role !== 'admin' && currentUser.role !== 'manager') {
              return null;
            }
            return (
              <button
                key={key}
                onClick={() => { onNavigate(page); onClose(); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1
                  transition-all focus-visible:ring-2 focus-visible:ring-blue-500
                  ${currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="truncate">{t(`nav.${key}`)}</span>
              </button>
            );
          })}

          {/* Subscription link */}
          <div className="mt-2 pt-2 border-t border-gray-700">
            <button
              onClick={() => { onNavigate('subscription'); onClose(); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1
                transition-all focus-visible:ring-2 focus-visible:ring-blue-500
                ${currentPage === 'subscription'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <CreditCard size={18} className="flex-shrink-0" />
              <span className="truncate">Subscription</span>
            </button>
          </div>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-700">
          {/* Token quick-view */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-800 rounded-lg mb-3 text-xs">
            <Zap size={12} className="text-yellow-400 flex-shrink-0" />
            <span className="text-gray-300">
              {subscriptionStore.getTokensAvailable() === Infinity
                ? '∞ tokens'
                : `${subscriptionStore.getTokensAvailable().toLocaleString()} tokens`
              }
            </span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-sm font-medium truncate">{currentUser.name}</div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${planColors[plan.id]}`}>
                  {plan.name}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${roleColors[currentUser.role]}`}>
                  {t(`user.${currentUser.role}`)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <LogOut size={16} />
            <span>{t('nav.settings') === 'Settings' ? 'Logout' : '退出登录'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
