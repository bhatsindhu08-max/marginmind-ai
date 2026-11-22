import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Product } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Sliders, DollarSign, TrendingUp, TrendingDown, Percent, ArrowRight, Activity } from 'lucide-react';

export const PriceSimulation: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [currentPrice, setCurrentPrice] = useState<number>(4200);
  const [simulatedPrice, setSimulatedPrice] = useState<number>(4200);
  const [simResult, setSimResult] = useState<any>(null);
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
        setCurrentPrice(prods[0].selling_price);
        setSimulatedPrice(prods[0].selling_price);
        runSimulation(prods[0].id, prods[0].selling_price);
      }
    } catch (e) {
      console.error('Failed to load products:', e);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (id: number, price: number) => {
    try {
      const res = await apiRequest<any>(`/viability/${id}/simulate-price?new_price=${price}`);
      setSimResult(res);
    } catch (e) {
      console.error('Simulation failed:', e);
    }
  };

  const handleSelectProduct = (id: number) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setCurrentPrice(prod.selling_price);
      setSimulatedPrice(prod.selling_price);
      runSimulation(id, prod.selling_price);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Price Elasticity Model...</span>
        </div>
      </div>
    );
  }

  const priceDeltaPercent = ((simulatedPrice - currentPrice) / currentPrice * 100.0).toFixed(1);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Controls & Interactive Sliders */}
      <div className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300 uppercase block">
              Select Product:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleSelectProduct(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 w-80 font-sans"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: ₹{p.selling_price.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="text-right font-mono p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Baseline Contract Price:</span>
            <span className="text-lg font-bold text-slate-100 tabular-nums">₹{currentPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Price Range Slider */}
        <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
              Simulated Selling Price: <span className="font-mono text-cyan-300 text-lg font-bold ml-1">₹{simulatedPrice.toLocaleString()}</span>
            </span>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                parseFloat(priceDeltaPercent) >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {parseFloat(priceDeltaPercent) >= 0 ? '+' : ''}
              {priceDeltaPercent}% vs Baseline
            </span>
          </div>

          <input
            type="range"
            min={Math.floor(currentPrice * 0.7)}
            max={Math.ceil(currentPrice * 1.5)}
            step={25}
            value={simulatedPrice}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSimulatedPrice(val);
              runSimulation(selectedProductId, val);
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />

          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>-30% (₹{(currentPrice * 0.7).toFixed(0)})</span>
            <span className="text-slate-300 font-bold">Current (₹{currentPrice.toFixed(0)})</span>
            <span>+50% (₹{(currentPrice * 1.5).toFixed(0)})</span>
          </div>
        </div>
      </div>

      {/* Simulation Results Dashboard */}
      {simResult && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Simulated Gross Margin:</span>
              <div className="mt-1 flex items-center space-x-3">
                <StatusBadge status={simResult.margin_status} />
                <span className="text-xl font-bold font-mono text-slate-100 tabular-nums">
                  {simResult.simulated_margin_percent}% Gross Margin
                </span>
              </div>
            </div>
            <div className="text-right font-mono p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Target Threshold:</span>
              <span className="text-sm font-bold text-cyan-300">{simResult.target_margin_percent}%</span>
            </div>
          </div>

          {/* Economics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase">Unit Cost Basis</span>
              <span className="text-lg font-bold text-slate-100 tabular-nums mt-0.5 block">
                ₹{simResult.current_cost?.toLocaleString()}
              </span>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase">Simulated Unit Profit</span>
              <span className="text-lg font-bold text-emerald-400 tabular-nums mt-0.5 block">
                ₹{simResult.simulated_gross_profit?.toLocaleString()}
              </span>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase">Price Delta</span>
              <span className="text-lg font-bold text-slate-200 tabular-nums mt-0.5 block">
                {simResult.price_change_amount >= 0 ? '+' : ''}₹{simResult.price_change_amount?.toLocaleString()}
              </span>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase">Annual Net Profit Delta</span>
              <span
                className={`text-lg font-bold tabular-nums mt-0.5 block ${
                  simResult.elasticity_analysis?.net_profit_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {simResult.elasticity_analysis?.net_profit_delta >= 0 ? '+' : ''}₹
                {simResult.elasticity_analysis?.net_profit_delta?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Elasticity Assessment */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <span className="font-bold text-slate-200 block uppercase tracking-wider text-[11px] font-mono">
              Microeconomic Elasticity Insights:
            </span>
            <p className="leading-relaxed">
              Based on empirical industrial price elasticity of demand ({simResult.elasticity_analysis?.assumed_price_elasticity}), 
              a {simResult.price_change_percent}% price adjustment is projected to result in a {simResult.elasticity_analysis?.projected_volume_change_percent}% change in order volume.
            </p>
            <p className="text-slate-400 font-mono text-[11px]">
              Simulated annual operating profit: ₹{simResult.elasticity_analysis?.simulated_annual_profit?.toLocaleString()} (vs Baseline ₹{simResult.elasticity_analysis?.baseline_annual_profit?.toLocaleString()}).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
