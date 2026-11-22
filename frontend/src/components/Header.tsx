import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { API_BASE } from '../api/client';
import {
  Building,
  ChevronDown,
  Download,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  Sparkles,
  MapPin,
} from 'lucide-react';

export interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onToggleCollapse: () => void;
  isSidebarCollapsed: boolean;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onToggleCollapse,
  isSidebarCollapsed,
  onOpenSearch,
}) => {
  const { role, fullName, businessName, industryType, businessId, switchDemoRole, logout } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const industryLabels: Record<string, string> = {
    metal_steel: 'Metal & Steel Mfg',
    textile_garment: 'Textile & Garment Mfg',
    textile_garments: 'Textile & Garment Mfg',
    textile: 'Textile & Garment Mfg',
    garments: 'Textile & Garment Mfg',
    apparel: 'Textile & Garment Mfg',
    electronics_assembly: 'Electronics Assembly',
    food_processing: 'Food Processing',
  };
  const activeIndustryLabel = industryLabels[industryType] || 'Manufacturing';

  // Extract initials for user avatar
  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const roles: Array<{ role: UserRole; label: string; desc: string }> = [
    { role: 'business_owner', label: 'Business Owner', desc: 'Full Authority & Approvals' },
    { role: 'finance_manager', label: 'Finance Manager', desc: 'Costing, Margins & Pricing' },
    { role: 'procurement_manager', label: 'Procurement Manager', desc: 'Suppliers, Invoices & Sourcing' },
    { role: 'production_manager', label: 'Production Manager', desc: 'BOMs, Inventory & Capacity' },
  ];

  const handleDownloadQuickReport = async (format: 'pdf' | 'excel') => {
    try {
      setDownloading(true);
      const endpoint = format === 'pdf' ? '/reports/export-pdf' : '/reports/export-excel';
      const token = localStorage.getItem('marginmind_token');
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MarginMind_Executive_Dossier.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert('Report download failed: ' + String(e));
    } finally {
      setDownloading(false);
      setDownloadMenuOpen(false);
    }
  };

  return (
    <header className="h-16 bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Left: Toggles & Active Company Context */}
      <div className="flex items-center space-x-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-850 transition"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Enterprise Context Indicator */}
        <div className="flex items-center space-x-2.5 truncate">
          <div className="w-7 h-7 rounded-lg bg-slate-850 border border-slate-700/80 flex items-center justify-center text-slate-300 flex-shrink-0">
            <Building className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                {businessName || 'Apex Precision Forging & Fabrication Ltd.'}
              </span>
              <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{activeIndustryLabel}</span>
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center space-x-1">
                <MapPin className="w-2.5 h-2.5 text-slate-500" />
                <span>Facility: Chennai HQ & Hubs</span>
              </span>
              <span>•</span>
              <span className="text-emerald-400">Deterministic Model Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions, Dossier Export, Demo Badge & Profile Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Search Shortcut */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-850/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-400 text-xs transition"
            title="Search features (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Search features...</span>
            <kbd className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 ml-1">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Quick Report Download Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
            disabled={downloading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-medium transition"
            title="Export executive financial summaries"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="hidden sm:inline">Quick Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {downloadMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 glass-panel-elevated rounded-xl shadow-2xl p-1.5 z-40 border border-slate-700">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 tracking-wider border-b border-slate-800">
                Generate Dossier
              </div>
              <button
                onClick={() => handleDownloadQuickReport('pdf')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-lg text-left transition"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <div>
                  <div className="font-medium">Executive Margin Dossier</div>
                  <div className="text-[10px] text-slate-400">Formal PDF with multi-horizon risk</div>
                </div>
              </button>
              <button
                onClick={() => handleDownloadQuickReport('excel')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-lg text-left transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <div className="font-medium">Financial Telemetry Matrix</div>
                  <div className="text-[10px] text-slate-400">Excel with product BOM breakdowns</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Demo Mode Pill */}
        <div className="hidden xl:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>PRODUCTION READY</span>
        </div>

        {/* Role Switcher & User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition"
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800/80 text-cyan-300 font-bold font-mono text-[11px] flex items-center justify-center">
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-semibold text-xs text-slate-200 leading-tight">
                {fullName || 'Demo Executive'}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono capitalize">
                {(role || 'business_owner').replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-panel-elevated rounded-xl shadow-2xl p-2 z-40 border border-slate-700">
              <div className="px-3 py-2 border-b border-slate-800">
                <div className="text-xs font-bold text-slate-100">{fullName || 'Executive User'}</div>
                <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                  RBAC Role: {(role || 'business_owner').replace('_', ' ')}
                </div>
              </div>

              {/* Demo Role Switcher Section */}
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  Switch Demo Role
                </div>
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchDemoRole(r.role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between transition ${
                      role === r.role
                        ? 'bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{r.label}</div>
                      <div className="text-[10px] text-slate-400">{r.desc}</div>
                    </div>
                    {role === r.role && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 ml-2" />}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-1 mt-1">
                <button
                  onClick={() => {
                    logout();
                    setRoleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg flex items-center space-x-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
