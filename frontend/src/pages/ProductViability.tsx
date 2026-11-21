import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Product } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Layers, HelpCircle, ArrowRight } from 'lucide-react';

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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Running Strategic Viability Assessment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Product Lifecycle & Strategic Viability
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Continue vs Discontinue Analysis
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Answers whether to continue producing, renegotiate index escalation clauses, or phase out unprofitable product lines.
          </p>
        </div>
      </div>

      {/* Product Selector */}
      <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <span className="text-xs font-medium text-slate-300">Select Product:</span>
        <select
          value={selectedProductId}
          onChange={(e) => handleSelectProduct(parseInt(e.target.value))}
          className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-80"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
      </div>

      {/* Strategic Decision Recommendation Card */}
      {viability && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase">Strategic Verdict:</span>
              <div className="text-xl font-bold text-slate-100 mt-1 flex items-center space-x-3">
                <span>{viability.strategic_recommendation?.replace(/_/g, ' ')}</span>
                <StatusBadge status={viability.margin_health} />
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-slate-400 block">Current Gross Margin:</span>
              <span className="text-lg font-bold text-emerald-400">
                {viability.current_gross_margin_percent}% (Target: {viability.target_margin_percent}%)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Executive Rationale:
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{viability.rationale}</p>
          </div>

          {/* Break-Even Economics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg font-mono">
              <span className="text-[11px] text-slate-400 block">Monthly Break-Even Volume</span>
              <span className="text-base font-bold text-slate-100">
                {viability.break_even?.break_even_units || 'N/A'} Units / month
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Covers Rs 250k monthly fixed plant overhead
              </span>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg font-mono">
              <span className="text-[11px] text-slate-400 block">Break-Even Revenue</span>
              <span className="text-base font-bold text-slate-100">
                ₹{viability.break_even?.break_even_revenue?.toLocaleString() || 'N/A'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Zero-profit operating threshold</span>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg font-mono">
              <span className="text-[11px] text-slate-400 block">Unit Contribution Margin</span>
              <span className="text-base font-bold text-emerald-400">
                ₹{viability.break_even?.unit_contribution?.toLocaleString()} / unit
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Selling price minus variable costs</span>
            </div>
          </div>

          {/* Strategic Options List */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Strategic Action Pathways
            </h4>
            <div className="space-y-2">
              {(viability.action_options || []).map((opt: string, i: number) => (
                <div key={i} className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg text-xs text-slate-300 flex items-start space-x-2">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cost Driver Materials Exposure */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Top Raw Material Cost Concentrations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {(viability.top_cost_driver_materials || []).map((m: any, i: number) => (
                <div key={i} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <span className="font-semibold text-slate-200 block font-sans">{m.material_name}</span>
                  <div className="text-slate-400 text-[11px] mt-1">Category: {m.category}</div>
                  <div className="text-slate-100 font-bold mt-1">
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
