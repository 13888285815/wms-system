import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

function App() {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Inject CSP meta tag for extra security
    injectCSPMeta();
    // Check if already logged in
    const state = store.getState();
    if (state.currentUser) setCurrentUser(state.currentUser);
  }, []);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => { store.logout(); setCurrentUser(null); };

  const getPageTitle = () => {
    if (currentPage === 'subscription') return 'Subscription & Billing';
    return t(`nav.${currentPage}`);
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
