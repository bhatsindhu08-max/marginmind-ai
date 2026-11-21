import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { DecisionCentre } from './pages/DecisionCentre';
import { ApprovalHistory } from './pages/ApprovalHistory';
import { MarginGuard } from './pages/MarginGuard';
import { SupplyShock } from './pages/SupplyShock';
import { OrderSure } from './pages/OrderSure';
import { Forecasting } from './pages/Forecasting';
import { ProductViability } from './pages/ProductViability';
import { PriceSimulation } from './pages/PriceSimulation';
import { ScenarioSimulator } from './pages/ScenarioSimulator';
import { Products } from './pages/Products';
import { BOM } from './pages/BOM';
import { Suppliers } from './pages/Suppliers';
import { MarketIntelligence } from './pages/MarketIntelligence';
import { DocumentUpload } from './pages/DocumentUpload';
import { Reports } from './pages/Reports';
import { UserManagement } from './pages/UserManagement';
import { Settings } from './pages/Settings';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (!isAuthenticated) {
    return <Login onSuccess={() => setCurrentTab('dashboard')} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentTab} />;
      case 'decisions':
        return <DecisionCentre />;
      case 'approvals':
        return <ApprovalHistory />;
      case 'marginguard':
        return <MarginGuard />;
      case 'supplyshock':
        return <SupplyShock />;
      case 'ordersure':
        return <OrderSure />;
      case 'forecasting':
        return <Forecasting />;
      case 'viability':
        return <ProductViability />;
      case 'pricing':
        return <PriceSimulation />;
      case 'scenarios':
        return <ScenarioSimulator onNavigate={setCurrentTab} />;
      case 'products':
        return <Products />;
      case 'bom':
        return <BOM />;
      case 'suppliers':
        return <Suppliers />;
      case 'market':
        return <MarketIntelligence />;
      case 'documents':
        return <DocumentUpload />;
      case 'reports':
        return <Reports />;
      case 'onboarding':
        return <Onboarding />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
