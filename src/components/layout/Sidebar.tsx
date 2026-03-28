import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Warehouse, Package, ArrowDownToLine, ArrowUpFromLine,
  ShoppingCart, Truck, Users, BarChart3, Settings, X, LogOut
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  currentUser: User;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { key: 'warehouses', icon: Warehouse, page: 'warehouses' },
  { key: 'inventory', icon: Package, page: 'inventory' },
  { key: 'inbound', icon: ArrowDownToLine, page: 'inbound' },
  { key: 'outbound', icon: ArrowUpFromLine, page: 'outbound' },
  { key: 'orders', icon: ShoppingCart, page: 'orders' },
  { key: 'suppliers', icon: Truck, page: 'suppliers' },
  { key: 'users', icon: Users, page: 'users' },
  { key: 'reports', icon: BarChart3, page: 'reports' },
  { key: 'settings', icon: Settings, page: 'settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, currentUser, onLogout, isOpen, onClose }) => {
  const { t } = useTranslation();

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    operator: 'bg-green-100 text-green-700',
    viewer: 'bg-gray-100 text-gray-700',
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-40 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Warehouse size={18} />
            </div>
            <span className="font-bold text-sm leading-tight">{t('app.title')}</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {navItems.map(({ key, icon: Icon, page }) => (
            <button
              key={key}
              onClick={() => { onNavigate(page); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-all ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {t(`nav.${key}`)}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{currentUser.name}</div>
              <span className={`text-xs px-1.5 py-0.5 rounded ${roleColors[currentUser.role]}`}>
                {t(`user.${currentUser.role}`)}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <LogOut size={16} />
            {t('nav.settings') === 'Settings' ? 'Logout' : '退出登录'}
          </button>
        </div>
      </aside>
    </>
  );
};
