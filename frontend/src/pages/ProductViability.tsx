import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Product } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Layers, HelpCircle, ArrowRight, LineChart, Target, Compass } from 'lucide-react';

export const ProductViability: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [viability, setViability] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const prods = await apiRequest<Product[]>('/products');
      setProducts(prods);
      if (prods.length > 0) {
        setSelectedProductId(prods[0].id);
        loadViability(prods[0].id);
      }
    } catch (e) {
      console.error('Failed to load products:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadViability = async (id: number) => {
    try {
      const res = await apiRequest<any>(`/viability/${id}`);
      setViability(res);
    } catch (e) {
      console.error('Failed to load viability analysis:', e);
    }
  };

  const handleSelectProduct = (id: number) => {
    setSelectedProductId(id);
    loadViability(id);
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Running Strategic Viability Assessment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Product Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-2xl p-4">
        <div className="flex items-center space-x-3">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold text-slate-300 uppercase">Select Target Product:</span>
          <select
            value={selectedProductId}
            onChange={(e) => handleSelectProduct(parseInt(e.target.value))}
            className="bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 w-80 font-sans"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Target Hurdle: <span className="text-cyan-400 font-bold">25.0%</span>
        </div>
      </div>

      {/* Strategic Decision Recommendation Card (Inspired by Reference Images 1 & 2) */}
      {viability && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Strategic Recommendation:</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-100 mt-1 flex items-center space-x-3">
                <span className="capitalize">{viability.strategic_recommendation?.replace(/_/g, ' ')}</span>
                <StatusBadge status={viability.margin_health} />
              </div>
            </div>
            <div className="text-right font-mono p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Realized Gross Margin:</span>
              <span className="text-xl font-bold text-cyan-300 tabular-nums">
                {viability.current_gross_margin_percent}%
              </span>
              <span className="text-[10px] text-slate-500 block">Target: {viability.target_margin_percent}%</span>
            </div>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Executive Rationale:
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{viability.rationale}</p>
          </div>

          {/* Break-Even Economics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl font-mono">
              <span className="text-[11px] text-slate-400 uppercase block">Monthly Break-Even Volume</span>
              <span className="text-lg font-bold text-slate-100 mt-1 block tabular-nums">
                {viability.break_even?.break_even_units || 'N/A'} Units / month
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Covers fixed plant overhead allocations
              </span>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl font-mono">
              <span className="text-[11px] text-slate-400 uppercase block">Break-Even Revenue</span>
              <span className="text-lg font-bold text-slate-100 mt-1 block tabular-nums">
                ₹{viability.break_even?.break_even_revenue?.toLocaleString() || 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Zero-profit operating hurdle</span>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl font-mono">
              <span className="text-[11px] text-slate-400 uppercase block">Unit Contribution Margin</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block tabular-nums">
                ₹{viability.break_even?.unit_contribution?.toLocaleString()} / unit
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Selling price minus variable costs</span>
            </div>
          </div>

          {/* Strategic Options List */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 font-mono">
              Strategic Action Pathways
            </h4>
            <div className="space-y-2.5">
              {(viability.action_options || []).map((opt: string, i: number) => (
                <div key={i} className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 flex items-start space-x-3">
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{opt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cost Driver Materials Exposure */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 font-mono">
              Top Raw Material Cost Concentrations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {(viability.top_cost_driver_materials || []).map((m: any, i: number) => (
                <div key={i} className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl">
                  <span className="font-bold text-slate-100 block font-sans text-sm">{m.material_name}</span>
                  <div className="text-slate-400 text-[11px] mt-1">Category: {m.category}</div>
                  <div className="text-cyan-300 font-bold mt-2 pt-2 border-t border-slate-800/80 tabular-nums">
                    Qty: {m.quantity} kg • Total: ₹{m.total_cost?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
