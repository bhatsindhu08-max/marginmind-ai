import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Zap,
  CheckCircle2,
  TrendingUp,
  Sliders,
  Sparkles,
  Package,
  Layers,
  Truck,
  FileText,
  History,
  FileSpreadsheet,
  Users,
  Settings,
  HelpCircle,
  Building2,
  Globe2,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navSections = [
    {
      title: 'Command Centre',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'decisions', label: 'Decision Centre', icon: CheckCircle2, badge: 'Active' },
        { id: 'approvals', label: 'Approval History', icon: History },
      ],
    },
    {
      title: 'Financial Intelligence',
      items: [
        { id: 'marginguard', label: 'MarginGuard™', icon: ShieldAlert },
        { id: 'supplyshock', label: 'SupplyShock™ Radar', icon: Zap },
        { id: 'ordersure', label: 'OrderSure™ Gatekeeper', icon: CheckCircle2 },
        { id: 'forecasting', label: 'Multi-Horizon Forecast', icon: TrendingUp },
        { id: 'viability', label: 'Product Viability', icon: Sparkles },
        { id: 'pricing', label: 'Price Elasticity Sim', icon: Sliders },
        { id: 'scenarios', label: 'Macro Shock Simulator', icon: Globe2 },
      ],
    },
    {
      title: 'Operational Records',
      items: [
        { id: 'products', label: 'Products Catalog', icon: Package },
        { id: 'bom', label: 'BOM & Materials', icon: Layers },
        { id: 'suppliers', label: 'Suppliers & Quotes', icon: Truck },
        { id: 'market', label: 'External Market Indices', icon: Globe2 },
        { id: 'documents', label: 'Document Intelligence', icon: FileText },
        { id: 'reports', label: 'Reports & Exports', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Governance & Settings',
      items: [
        { id: 'onboarding', label: 'Industry Onboarding', icon: Building2 },
        { id: 'users', label: 'User Roles & RBAC', icon: Users },
        { id: 'settings', label: 'System Configuration', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 overflow-y-auto select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-lg shadow-sm">
          M
        </div>
        <div>
          <div className="font-bold text-slate-100 tracking-tight flex items-center space-x-1.5">
            <span>MarginMind</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
              AI
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Financial Intelligence</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <div className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-slate-300">Deterministic Engine</span>
          </span>
          <span className="font-mono text-slate-400">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
