import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Calculator,
  Database,
  CheckSquare,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from 'lucide-react';

export interface SidebarProps {
  currentWorkspace: string;
  onSelectWorkspace: (workspace: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSearch: () => void;
  pendingDecisionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentWorkspace,
  onSelectWorkspace,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenSearch,
  pendingDecisionsCount = 0,
}) => {
  // Exactly 6 primary workspaces
  const workspaces = [
    {
      id: 'overview',
      label: 'Overview',
      badge: 'Live',
      icon: LayoutDashboard,
      description: 'Executive command centre, portfolio telemetry & KPIs',
    },
    {
      id: 'intelligence',
      label: 'Intelligence',
      icon: Sparkles,
      description: 'MarginGuard, SupplyShock, Forecasting, Viability & Market Feeds',
    },
    {
      id: 'analysis',
      label: 'Analysis & Simulation',
      icon: Calculator,
      description: 'OrderSure gatekeeper, Price Elasticity & Macro Shock Simulator',
    },
    {
      id: 'data',
      label: 'Business Data',
      icon: Database,
      description: 'Products master, BOM recipes, Supplier quotes & Document OCR',
    },
    {
      id: 'decisions',
      label: 'Decision Centre',
      icon: CheckSquare,
      badge: pendingDecisionsCount > 0 ? `${pendingDecisionsCount}` : undefined,
      badgeType: pendingDecisionsCount > 0 ? 'alert' : undefined,
      description: 'AI-prepared proposals, margin authorization & immutable audit history',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Plant OPEX (Rent & Water), Multi-industry schemas & RBAC team access',
    },
  ];

  const handleSelect = (workspaceId: string) => {
    onSelectWorkspace(workspaceId);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#080d1a] border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div
        className={`p-4 border-b border-slate-800/80 flex items-center justify-between ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <div
          onClick={() => handleSelect('overview')}
          className="flex items-center space-x-3 cursor-pointer group"
          title="MarginMind AI — Home"
        >
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-mono text-base shadow-sm group-hover:border-cyan-400 group-hover:shadow-glow-cyan transition duration-300">
            M
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-100 flex items-center space-x-1.5 font-sans">
                <span>MarginMind</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono">
                  AI
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                Manufacturing OS
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Global Command Palette / Search Quick Action */}
      {!isCollapsed ? (
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-400 transition group shadow-inner"
            title="Search features (⌘K)"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition" />
              <span>Search features...</span>
            </div>
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
              ⌘K
            </kbd>
          </button>
        </div>
      ) : (
        <div className="p-2 flex justify-center">
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-850 border border-transparent hover:border-slate-800 transition"
            title="Search features (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary 6 Workspaces Navigation List */}
      <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto">
        {workspaces.map((ws) => {
          const Icon = ws.icon;
          const isActive = currentWorkspace === ws.id;

          return (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws.id)}
              title={isCollapsed ? `${ws.label}: ${ws.description}` : undefined}
              className={`w-full flex items-center rounded-xl transition-all duration-150 relative group ${
                isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5 space-x-3 text-left'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 via-cyan-500/5 to-transparent text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/60 border border-transparent'
              }`}
            >
              {/* Active Indicator Bar on Left */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-glow-cyan" />
              )}

              {/* Icon */}
              <div
                className={`flex-shrink-0 transition ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Label and Badge */}
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="text-xs truncate tracking-tight">{ws.label}</span>

                  {ws.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-2 ${
                        ws.badgeType === 'alert'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {ws.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070b16]">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-300 font-semibold">
                  SURVEILLANCE LIVE
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  Sync: PinkSheet & WPI
                </span>
              </div>
            </div>
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/40 px-1.5 py-0.5 rounded">
              v2.4
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title="Surveillance System Live">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-glow-emerald" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed/Persistent Sidebar */}
      <aside
        className={`hidden lg:block h-screen sticky top-0 transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
