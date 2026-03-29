import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/ui/Toast';
import { store } from './store';
import { injectCSPMeta } from './utils/security';
import { User } from './types';
import './i18n';

// Pages
import DashboardPage from './pages/Dashboard';
import WarehousesPage from './pages/Warehouses';
import InventoryPage from './pages/Inventory';
import InboundPage from './pages/Inbound';
import OutboundPage from './pages/Outbound';
import OrdersPage from './pages/Orders';
import SuppliersPage from './pages/Suppliers';
import UsersPage from './pages/Users';
import ReportsPage from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import SubscriptionPage from './pages/Subscription';
import LoginPage from './pages/Login';

type Page = 'dashboard' | 'warehouses' | 'inventory' | 'inbound' | 'outbound'
  | 'orders' | 'suppliers' | 'users' | 'reports' | 'settings' | 'subscription';

const pageTitles: Record<string, string> = {
  dashboard: '仪表盘',
  warehouses: '仓库管理',
  inventory: '库存管理',
  inbound: '入库管理',
  outbound: '出库管理',
  orders: '订单管理',
  suppliers: '供应商管理',
  users: '用户管理',
  reports: '报表中心',
  settings: '系统设置',
  subscription: '订阅与计费',
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [layoutDir, setLayoutDir] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    // Inject CSP meta tag for extra security
    injectCSPMeta();
    
    // Detect document direction for responsive RTL support
    const currentDir = (document.documentElement.dir as 'ltr' | 'rtl') || 'ltr';
    setLayoutDir(currentDir);

    // Check if already logged in
    const state = store.getState();
    if (state.currentUser) setCurrentUser(state.currentUser);
  }, []);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => { store.logout(); setCurrentUser(null); };

  const getPageTitle = () => {
    return pageTitles[currentPage] || '仓库管理系统';
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':    return <DashboardPage />;
      case 'warehouses':   return <WarehousesPage />;
      case 'inventory':    return <InventoryPage />;
      case 'inbound':      return <InboundPage />;
      case 'outbound':     return <OutboundPage />;
      case 'orders':       return <OrdersPage />;
      case 'suppliers':    return <SuppliersPage />;
      case 'users':        return <UsersPage />;
      case 'reports':      return <ReportsPage />;
      case 'settings':     return <SettingsPage />;
      case 'subscription': return <SubscriptionPage />;
      default:             return <DashboardPage />;
    }
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir={layoutDir}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page as Page)}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={getPageTitle()} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
      {/* Global Toast notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
