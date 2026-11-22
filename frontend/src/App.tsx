import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { apiRequest } from './api/client';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { Dashboard } from './pages/Dashboard';
import { IntelligenceWorkspace } from './workspaces/IntelligenceWorkspace';
import { BusinessDataWorkspace } from './workspaces/BusinessDataWorkspace';
import { SettingsWorkspace } from './workspaces/SettingsWorkspace';
import { Login } from './pages/Login';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Exactly 4 Workspaces: 'overview' | 'intelligence' | 'data' | 'settings'
  const [currentWorkspace, setCurrentWorkspace] = useState<string>('overview');

  // Internal tab state for each workspace
  const [workspaceTabs, setWorkspaceTabs] = useState<Record<string, string>>({
    intelligence: 'orders',
    data: 'products',
    settings: 'financial',
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Global seamless router: maps any legacy tab or new workspace/tab navigation cleanly
  const handleGlobalNavigate = (destination: string, subTab?: string) => {
    const wsMap: Record<string, { ws: string; tab: string }> = {
      // Overview
      overview: { ws: 'overview', tab: 'dashboard' },
      dashboard: { ws: 'overview', tab: 'dashboard' },

      // Unified Intelligence & Simulation Workspace
      intelligence: { ws: 'intelligence', tab: subTab || workspaceTabs.intelligence || 'orders' },
      ordersure: { ws: 'intelligence', tab: 'orders' },
      orders: { ws: 'intelligence', tab: 'orders' },
      analysis: { ws: 'intelligence', tab: subTab || 'orders' },
      marginguard: { ws: 'intelligence', tab: 'margin' },
      margin: { ws: 'intelligence', tab: 'margin' },
      shocks: { ws: 'intelligence', tab: 'shocks' },
      scenarios: { ws: 'intelligence', tab: 'shocks' },
      pricing: { ws: 'intelligence', tab: 'pricing' },
      forecasting: { ws: 'intelligence', tab: 'forecasting' },
      supplyshock: { ws: 'intelligence', tab: 'supply' },
      supply: { ws: 'intelligence', tab: 'supply' },
      market: { ws: 'intelligence', tab: 'market' },
      viability: { ws: 'intelligence', tab: 'viability' },

      // Business Data Workspace
      data: { ws: 'data', tab: subTab || workspaceTabs.data || 'products' },
      products: { ws: 'data', tab: 'products' },
      bom: { ws: 'data', tab: 'bom' },
      suppliers: { ws: 'data', tab: 'suppliers' },
      documents: { ws: 'data', tab: 'documents' },
      reports: { ws: 'data', tab: 'reports' },

      // Redirect any legacy Decision Centre links seamlessly to Intelligence / OrderSure
      decisions: { ws: 'intelligence', tab: 'orders' },
      approvals: { ws: 'intelligence', tab: 'orders' },
      history: { ws: 'intelligence', tab: 'orders' },

      // Settings Workspace
      settings: { ws: 'settings', tab: subTab || workspaceTabs.settings || 'financial' },
      onboarding: { ws: 'settings', tab: 'company' },
      company: { ws: 'settings', tab: 'company' },
      users: { ws: 'settings', tab: 'financial' },
      team: { ws: 'settings', tab: 'financial' },
      financial: { ws: 'settings', tab: 'financial' },
      integrations: { ws: 'settings', tab: 'integrations' },
    };

    const target = wsMap[destination.toLowerCase()] || { ws: destination, tab: subTab || '' };
    setCurrentWorkspace(target.ws);
    if (target.tab) {
      setWorkspaceTabs((prev) => ({
        ...prev,
        [target.ws]: target.tab,
      }));
    }
  };

  const setWorkspaceTab = (workspace: string, tab: string) => {
    setWorkspaceTabs((prev) => ({
      ...prev,
      [workspace]: tab,
    }));
  };

  if (!isAuthenticated) {
    return <Login onSuccess={() => setCurrentWorkspace('overview')} />;
  }

  const renderWorkspace = () => {
    switch (currentWorkspace) {
      case 'overview':
        return <Dashboard onNavigate={(target) => handleGlobalNavigate(target)} />;
      case 'intelligence':
        return (
          <IntelligenceWorkspace
            initialTab={workspaceTabs.intelligence}
            onTabChange={(tab) => setWorkspaceTab('intelligence', tab)}
            onNavigateGlobal={handleGlobalNavigate}
          />
        );
      case 'data':
        return (
          <BusinessDataWorkspace
            initialTab={workspaceTabs.data}
            onTabChange={(tab) => setWorkspaceTab('data', tab)}
          />
        );
      case 'settings':
        return (
          <SettingsWorkspace
            initialTab={workspaceTabs.settings}
            onTabChange={(tab) => setWorkspaceTab('settings', tab)}
          />
        );
      default:
        return <Dashboard onNavigate={(target) => handleGlobalNavigate(target)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Exactly 4 Primary Workspaces Sidebar */}
      <Sidebar
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={(ws) => handleGlobalNavigate(ws)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{renderWorkspace()}</main>
      </div>

      {/* Global Command Palette / Search (⌘K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleGlobalNavigate}
      />
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
