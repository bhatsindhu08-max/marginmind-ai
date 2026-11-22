import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import { API_BASE } from '../api/client';

export const Reports: React.FC = () => {
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'excel', title: string) => {
    try {
      setDownloading(true);
      setDownloadSuccess(null);
      const endpoint = format === 'pdf' ? '/reports/export-pdf' : '/reports/export-excel';
      const token = localStorage.getItem('marginmind_token');

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MarginMind_${title.replace(/ /g, '_')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setDownloadSuccess(`Generated and downloaded ${title} in ${format.toUpperCase()} format!`);
    } catch (e: any) {
      alert('Report export failed: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const reportPacks = [
    {
      id: 'margin_health',
      title: 'Portfolio Margin Health & Costing Dossier',
      desc: 'Complete multi-tier BOM cost explosion, scrap allowances, gross profits, and threshold breach indicators for all manufactured lines.',
      formats: ['pdf', 'excel'] as ('pdf' | 'excel')[],
      badge: 'Board Ready',
    },
    {
      id: 'order_economics',
      title: 'Order Feasibility & Stress Sensitivity Report',
      desc: 'Customer commitments analyzed against spot raw material costs and +18% supply shock inflation scenarios.',
      formats: ['pdf', 'excel'] as ('pdf' | 'excel')[],
      badge: 'OrderSure™',
    },
    {
      id: 'governance_audit',
      title: 'Pricing & Quotation Audit Ledger',
      desc: 'Historical ledger of price revisions, supplier quotation updates, and margin adjustments.',
      formats: ['pdf', 'excel'] as ('pdf' | 'excel')[],
      badge: 'Audit Trail',
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Executive Dossiers & Analytical Reports
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Audit-Grade Exports
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Export deterministic financial costing reports, order viability analyses, and immutable decision audit histories in PDF and Excel formats.
          </p>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Report Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportPacks.map((pack) => (
          <div
            key={pack.id}
            className="glass-panel rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {pack.badge}
                </span>
                <span className="text-xs font-mono text-emerald-400">Official Dossier</span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">{pack.title}</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{pack.desc}</p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">Available Formats:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('pdf', pack.title)}
                  disabled={downloading}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center space-x-1"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleExport('excel', pack.title)}
                  disabled={downloading}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center space-x-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Epistemic Governance & Methodology Banner */}
      <div className="glass-panel rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Report Governance & Methodology Declaration</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          All financial figures in MarginMind reports are generated using deterministic mathematical formulas based on current verified Bills of Materials, scrap allowances, machine hour depreciation, and official commodity benchmark indices. Predictions are strictly framed as conditional scenario envelopes rather than unconditional certainties.
        </p>
      </div>
    </div>
  );
};
