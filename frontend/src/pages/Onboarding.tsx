import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Building2, Check, ArrowRight, ShieldCheck, Layers, Globe2 } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('metal_steel');
  const [currentIndustry, setCurrentIndustry] = useState<string>('metal_steel');
  const [loading, setLoading] = useState<boolean>(true);
  const [applying, setApplying] = useState<boolean>(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const [data, biz] = await Promise.all([
        apiRequest<any[]>('/auth/templates'),
        apiRequest<any>('/business/current').catch(() => null),
      ]);
      setTemplates(data);
      if (biz?.industry_type) {
        setCurrentIndustry(biz.industry_type);
        setSelectedTemplate(biz.industry_type);
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyIndustry = async (templateId: string) => {
    try {
      setApplying(true);
      await apiRequest('/business/current', {
        method: 'PUT',
        body: JSON.stringify({ industry_type: templateId }),
      });
      localStorage.setItem('marginmind_industry', templateId);
      setCurrentIndustry(templateId);
      alert(`Manufacturing industry updated! Switched to "${activeTemplate?.name || templateId}".`);
      window.location.reload();
    } catch (e: any) {
      alert('Failed to update industry: ' + e.message);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Multi-Industry Templates...</span>
        </div>
      </div>
    );
  }

  const activeTemplate = templates.find((t) => t.id === selectedTemplate) || templates[0];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Multi-Industry Manufacturing Architecture
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Configurable Templates
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            MarginMind AI features an extensible multi-industry engine with tailored BOM schemas, cost drivers, and external benchmarks.
          </p>
        </div>
      </div>

      {/* Industry Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {templates.map((tmpl) => {
          const isSelected = selectedTemplate === tmpl.id;
          return (
            <div
              key={tmpl.id}
              onClick={() => setSelectedTemplate(tmpl.id)}
              className={`p-5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-850 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-emerald-400 uppercase font-semibold">
                      {tmpl.id}
                    </span>
                    {currentIndustry === tmpl.id && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <h3 className="text-sm font-bold text-slate-100">{tmpl.name}</h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Target: {tmpl.default_target_margin}%</span>
                <span>Floor: {tmpl.critical_margin_threshold}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Template Deep-Dive Configuration */}
      {activeTemplate && (
        <div className="glass-panel rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-mono text-emerald-400 uppercase">Selected Template Schema:</span>
            <h2 className="text-lg font-bold text-slate-100 mt-1">{activeTemplate.name}</h2>
            <p className="text-xs text-slate-400 mt-1">{activeTemplate.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Material Categories */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block font-mono">
                Standard Material Categories:
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {(activeTemplate.material_categories || []).map((cat: string, i: number) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{cat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Standard Units & Cost Structure */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 font-mono">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block font-mono">
                Measurement Units & Margin Expectations:
              </span>
              <div className="space-y-2 text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Supported Units of Measure:</span>
                  <span className="text-slate-100">{(activeTemplate.default_units || []).join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Baseline Profit Margin Target:</span>
                  <span className="text-emerald-400 font-bold">{activeTemplate.default_target_margin}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Critical Risk Threshold:</span>
                  <span className="text-rose-400 font-bold">{activeTemplate.critical_margin_threshold}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-800/80 gap-3">
            <span className="text-xs text-slate-400 font-sans">
              {currentIndustry === activeTemplate.id
                ? '✓ This industry configuration is currently active for your enterprise.'
                : `Switch enterprise schema to ${activeTemplate.name} to activate tailored benchmarks and margin thresholds.`}
            </span>
            <button
              onClick={() => handleApplyIndustry(activeTemplate.id)}
              disabled={applying || currentIndustry === activeTemplate.id}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 self-start sm:self-auto ${
                currentIndustry === activeTemplate.id
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-glow-cyan'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{currentIndustry === activeTemplate.id ? 'Currently Active' : `Set as Active Industry`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
