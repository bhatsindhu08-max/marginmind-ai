import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Globe2, Zap, ArrowRight, ShieldAlert, CheckCircle2, TrendingDown } from 'lucide-react';

interface ScenarioSimulatorProps {
  onNavigate: (tab: string) => void;
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Macroeconomic Shock Propagation Engine
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Knowledge Graph Cascade
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate an external macro or commodity shock and trace its multi-hop propagation through internal BOMs, inventory, and customer commitments.
          </p>
        </div>
      </div>

      {/* Simulation Configuration Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
          <Globe2 className="w-4 h-4 text-emerald-400" />
          <span>Configure External Economic Shock</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Select Market Benchmark Indicator:
            </label>
            <select
              value={indicatorCode}
              onChange={(e) => setIndicatorCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
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
              <label className="text-xs font-medium text-slate-300">
                Simulated Shock Magnitude:
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
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
              className="w-full accent-emerald-500 cursor-pointer mt-2"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>-20% (Commodity Relief)</span>
              <span>0% (Neutral)</span>
              <span>+40% (Severe Supply Crisis)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>{simulating ? 'Propagating Shock...' : 'Propagate Shock Through Enterprise Graph'}</span>
          </button>
        </div>
      </div>

      {/* Propagation Results Showcase */}
      {result && (
        <div className="space-y-6">
          {/* Exposure Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Net Exposure</span>
              <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
                ₹{result.total_exposure?.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                Inventory + Order Cost Delta
              </span>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Inventory Revaluation</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                ₹{result.total_inventory_exposure?.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                Replacement value shift
              </span>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Breached Products</span>
              <span className="text-2xl font-bold font-mono text-slate-100 mt-1 block">
                {result.products_breaching_threshold?.length || 0}
              </span>
              <span className="text-[11px] text-rose-400 mt-1 block font-mono">
                Crossed critical margin floor
              </span>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Prepared Decisions</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                  {result.prepared_decision_count} Generated
                </span>
              </div>
              <button
                onClick={() => onNavigate('decisions')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1 mt-2"
              >
                <span>Review in Decision Centre</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cascade Hop 1: Affected Materials */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 font-mono">
              Graph Hop 1: Internal Raw Materials Mapped to {result.indicator_code}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Material Code & Name</th>
                    <th className="py-2.5 px-4 text-right">Previous Price</th>
                    <th className="py-2.5 px-4 text-right">Shocked Price</th>
                    <th className="py-2.5 px-4 text-right">Effective Change</th>
                    <th className="py-2.5 px-4 text-right">Stock On Hand</th>
                    <th className="py-2.5 px-4 text-right">Stock Value Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {result.affected_materials.map((m: any) => (
                    <tr key={m.material_id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-sans font-medium text-slate-100">
                        {m.material_name}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">₹{m.previous_market_price}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-400">₹{m.new_market_price}</td>
                      <td className="py-3 px-4 text-right text-amber-400">+{m.effective_change_percent}%</td>
                      <td className="py-3 px-4 text-right">{m.current_stock.toLocaleString()} {m.unit}</td>
                      <td className="py-3 px-4 text-right text-emerald-400">
                        +₹{m.stock_value_delta.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cascade Hop 2: Affected Products & Margin Erosion */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 font-mono">
              Graph Hop 2: Product Unit Costs, Gross Margins & Threshold Breaches
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Product Name & SKU</th>
                    <th className="py-2.5 px-4 text-right">Contract Price</th>
                    <th className="py-2.5 px-4 text-right">Previous Cost</th>
                    <th className="py-2.5 px-4 text-right">New Unit Cost</th>
                    <th className="py-2.5 px-4 text-right">Previous Margin</th>
                    <th className="py-2.5 px-4 text-right">Shocked Margin</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Suggested Recovery Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {result.affected_products.map((p: any) => (
                    <tr key={p.product_id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-sans font-medium text-slate-100">
                        {p.product_name}
                      </td>
                      <td className="py-3 px-4 text-right">₹{p.selling_price.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-400">₹{p.previous_unit_cost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-400">₹{p.new_unit_cost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-emerald-400">{p.previous_margin_percent}%</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-400">{p.new_margin_percent}%</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={p.new_health} />
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
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
