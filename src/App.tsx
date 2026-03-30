import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/ui/Toast';
import { store } from './store';
import { injectCSPMeta } from './utils/security';
import { User } from './types';
import './i18n';

// WMS Pages
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

// ERP Pages
import FinancePage from './pages/Finance';
import HRPage from './pages/HR';
import CRMPage from './pages/CRM';
import PurchasePage from './pages/Purchase';
import ProductionPage from './pages/Production';
import QualityPage from './pages/Quality';
import PricePage from './pages/Price';
import StocktakePage from './pages/Stocktake';
import WorkflowPage from './pages/Workflow';

type Page =
  | 'dashboard' | 'warehouses' | 'inventory' | 'inbound' | 'outbound'
  | 'orders' | 'suppliers' | 'users' | 'reports' | 'settings' | 'subscription'
  | 'finance' | 'hr' | 'crm' | 'purchase' | 'production'
  | 'quality' | 'price' | 'stocktake' | 'workflow';

const pageTitles: Record<string, string> = {
  dashboard: '工作台',
  warehouses: '仓库管理',
  inventory: '库存管理',
  inbound: '入库管理',
  outbound: '出库管理',
  orders: '销售订单',
  suppliers: '供应商',
  users: '用户管理',
  reports: '报表中心',
  settings: '系统设置',
  subscription: '订阅与计费',
  finance: '财务管理',
  hr: '人力资源',
  crm: '客户关系',
  purchase: '采购管理',
  production: '生产管理',
  quality: '质量管理',
  price: '价格管理',
  stocktake: '盘点管理',
  workflow: '流程管理',
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [layoutDir, setLayoutDir] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    // injectCSPMeta() disabled — CSP meta tag blocks Vite dev server & GitHub Pages
    const currentDir = (document.documentElement.dir as 'ltr' | 'rtl') || 'ltr';
    setLayoutDir(currentDir);
    const state = store.getState();
    if (state.currentUser) setCurrentUser(state.currentUser);

    const observer = new MutationObserver(() => {
      setLayoutDir((document.documentElement.dir as 'ltr' | 'rtl') || 'ltr');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    return () => observer.disconnect();
  }, []);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => { store.logout(); setCurrentUser(null); };

  const renderPage = () => {
    switch (currentPage) {
      // WMS
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
      // ERP
      case 'finance':      return <FinancePage />;
      case 'hr':           return <HRPage />;
      case 'crm':          return <CRMPage />;
      case 'purchase':     return <PurchasePage />;
      case 'production':   return <ProductionPage />;
      case 'quality':      return <QualityPage />;
      case 'price':        return <PricePage />;
      case 'stocktake':    return <StocktakePage />;
      case 'workflow':     return <WorkflowPage />;
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
        <Header title={pageTitles[currentPage] || '意念ERP'} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
