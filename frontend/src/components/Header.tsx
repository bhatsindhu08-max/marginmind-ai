import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { API_BASE } from '../api/client';
import {
  Building,
  UserCheck,
  ChevronDown,
  Download,
  AlertTriangle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '../api/client';

export const Header: React.FC = () => {
  const { role, fullName, businessName, switchDemoRole, logout } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
    }
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Active Company Context */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
          <Building className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <span>{businessName}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Metal & Steel Mfg
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Tenant ID #1 • Live Telemetry Active</div>
        </div>
      </div>

      {/* Right: Actions, Quick Report & Role Switcher */}
      <div className="flex items-center space-x-4">
        {/* Quick Report Download Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDownloadQuickReport('pdf')}
            disabled={downloading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            title="Download Executive PDF Dossier"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>PDF Dossier</span>
          </button>
          <button
            onClick={() => handleDownloadQuickReport('excel')}
            disabled={downloading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            title="Download Full Excel Calculations"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel Sheet</span>
          </button>
        </div>

        {/* Demo Mode Indicator */}
        <div className="px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs flex items-center space-x-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span className="font-mono text-[11px]">Demo Mode Active</span>
        </div>

        {/* Interactive RBAC Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <div className="font-semibold text-slate-100">{fullName}</div>
              <div className="text-[10px] text-emerald-400 capitalize">
                {role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Switch RBAC Role (Demonstration)
              </div>
              <div className="p-1 space-y-1">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchDemoRole(r.role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                      role === r.role
                        ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="font-medium">{r.label}</div>
                    <div className="text-[10px] text-slate-400">{r.desc}</div>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-800 pt-1 mt-1 px-1">
                <button
                  onClick={() => {
                    logout();
                    setRoleMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
