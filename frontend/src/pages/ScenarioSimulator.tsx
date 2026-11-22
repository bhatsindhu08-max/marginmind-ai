import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Globe2, Zap, ArrowRight, ShieldAlert, CheckCircle2, TrendingDown, Layers, Activity } from 'lucide-react';

interface ScenarioSimulatorProps {
  onNavigate?: (tab: string) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ onNavigate }) => {
  const [indicatorCode, setIndicatorCode] = useState<string>('LME_ALU');
  const [percentageChange, setPercentageChange] = useState<number>(15.0);
  const [result, setResult] = useState<any>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  const indicators = [
    { code: 'LME_ALU', name: 'LME Aluminium Cash Settled (USD/MT)', defaultShock: 15.0 },
    { code: 'WPI_STEEL', name: 'WPI - Basic Metals & Steel (Index)', defaultShock: 10.0 },
    { code: 'RBI_USDINR', name: 'RBI Reference Rate USD/INR (Forex)', defaultShock: 5.0 },
    { code: 'BRENT_CRUDE', name: 'Brent Crude Oil Benchmark (USD/bbl)', defaultShock: 12.0 },
  ];

  const handleRunSimulation = async () => {
    try {
      setSimulating(true);
      const res = await apiRequest<any>('/market/simulate-shock', {
        method: 'POST',
        body: JSON.stringify({
          indicator_code: indicatorCode,
          percentage_change: percentageChange,
          notes: 'Interactive Executive Simulation',
        }),
      });
      setResult(res);
    } catch (e: any) {
      alert('Simulation failed: ' + e.message);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Simulation Configuration Controls */}
      <div className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              Configure External Economic Shock
            </h2>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold">Knowledge Graph Cascade</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Select Market Benchmark Indicator:
            </label>
            <select
              value={indicatorCode}
              onChange={(e) => setIndicatorCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-sans"
            >
              {indicators.map((ind) => (
                <option key={ind.code} value={ind.code}>
                  {ind.code} — {ind.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Simulated Shock Magnitude:
              </label>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                percentageChange >= 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                {percentageChange >= 0 ? '+' : ''}
                {percentageChange}%
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={40}
              step={1}
              value={percentageChange}
              onChange={(e) => setPercentageChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none mt-2"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5">
              <span>-20% (Commodity Relief)</span>
              <span>0% (Neutral)</span>
              <span>+40% (Severe Supply Crisis)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800/80">
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-glow-cyan transition duration-200 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>{simulating ? 'Propagating Shock Cascade...' : 'Propagate Shock Through Enterprise Graph'}</span>
          </button>
        </div>
      </div>

      {/* Propagation Results Showcase */}
      {result && (
        <div className="space-y-6">
          {/* Exposure Summary Cards (Reference Image 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 glass-panel rounded-2xl hairline-top-rose">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Total Net Exposure</span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-400 mt-1 block tabular-nums">
                ₹{result.total_exposure?.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                Inventory + Order Cost Delta
              </span>
            </div>
            <div className="p-5 glass-panel rounded-2xl hairline-top-amber">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Inventory Revaluation</span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 mt-1 block tabular-nums">
                ₹{result.total_inventory_exposure?.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                Replacement value shift
              </span>
            </div>
            <div className="p-5 glass-panel rounded-2xl">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Breached Products</span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 mt-1 block tabular-nums">
                {result.products_breaching_threshold?.length || 0} Lines
              </span>
              <span className="text-[11px] text-rose-400 mt-1 block font-mono">
                Crossed critical margin floor
              </span>
            </div>
            <div className="p-5 glass-panel rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Price Revisions Advised</span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-1 block tabular-nums">
                  {result.prepared_decision_count} Generated
                </span>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('products')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 mt-3 group"
              >
                <span>Review Product Catalog</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Cascade Hop 1: Affected Materials */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 font-mono flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Graph Hop 1: Internal Raw Materials Mapped to {result.indicator_code}</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Material Code & Name</th>
                    <th className="py-3 px-4 text-right">Previous Price</th>
                    <th className="py-3 px-4 text-right">Shocked Price</th>
                    <th className="py-3 px-4 text-right">Effective Change</th>
                    <th className="py-3 px-4 text-right">Stock On Hand</th>
                    <th className="py-3 px-4 text-right">Stock Value Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {result.affected_materials.map((m: any) => (
                    <tr key={m.material_id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-100">
                        {m.material_name}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 tabular-nums">₹{m.previous_market_price}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-400 tabular-nums">₹{m.new_market_price}</td>
                      <td className="py-3.5 px-4 text-right text-amber-400 tabular-nums font-bold">+{m.effective_change_percent}%</td>
                      <td className="py-3.5 px-4 text-right tabular-nums">{m.current_stock.toLocaleString()} {m.unit}</td>
                      <td className="py-3.5 px-4 text-right text-emerald-400 tabular-nums font-bold">
                        +₹{m.stock_value_delta.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cascade Hop 2: Affected Products & Margin Erosion */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 font-mono flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Graph Hop 2: Product Unit Costs, Gross Margins & Threshold Breaches</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Product Name & SKU</th>
                    <th className="py-3 px-4 text-right">Contract Price</th>
                    <th className="py-3 px-4 text-right">Previous Cost</th>
                    <th className="py-3 px-4 text-right">New Unit Cost</th>
                    <th className="py-3 px-4 text-right">Previous Margin</th>
                    <th className="py-3 px-4 text-right">Shocked Margin</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Suggested Recovery Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {result.affected_products.map((p: any) => (
                    <tr key={p.product_id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-100">
                        {p.product_name}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums">₹{p.selling_price.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-slate-400 tabular-nums">₹{p.previous_unit_cost.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-400 tabular-nums">₹{p.new_unit_cost.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-emerald-400 tabular-nums font-bold">{p.previous_margin_percent}%</td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-400 tabular-nums">{p.new_margin_percent}%</td>
                      <td className="py-3.5 px-4 text-center font-sans">
                        <StatusBadge status={p.new_health} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-cyan-300 tabular-nums">
                        ₹{p.suggested_new_price.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
