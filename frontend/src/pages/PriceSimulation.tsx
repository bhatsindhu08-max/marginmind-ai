import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Product } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Sliders, DollarSign, TrendingUp, TrendingDown, Percent, ArrowRight } from 'lucide-react';

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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Price Elasticity Model...</span>
        </div>
      </div>
    );
  }

  const priceDeltaPercent = ((simulatedPrice - currentPrice) / currentPrice * 100.0).toFixed(1);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Selling Price & Elasticity Simulator
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Margin Recovery Optimization
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate the bottom-line profitability and customer demand elasticity effects of adjusting product selling prices.
          </p>
        </div>
      </div>

      {/* Controls & Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Select Product:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleSelectProduct(parseInt(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-80"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: ₹{p.selling_price.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="text-slate-400 block">Baseline Contract Price:</span>
            <span className="text-lg font-bold text-slate-100">₹{currentPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Price Slider */}
        <div className="bg-slate-950/70 p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Simulated Selling Price: <span className="font-mono text-emerald-400 text-base">₹{simulatedPrice.toLocaleString()}</span>
            </span>
            <span
              className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                parseFloat(priceDeltaPercent) >= 0
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}
            >
              {parseFloat(priceDeltaPercent) >= 0 ? '+' : ''}
              {priceDeltaPercent}% vs Current
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
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>-30% (₹{(currentPrice * 0.7).toFixed(0)})</span>
            <span>Current (₹{currentPrice.toFixed(0)})</span>
            <span>+50% (₹{(currentPrice * 1.5).toFixed(0)})</span>
          </div>
        </div>
      </div>

      {/* Simulation Results Dashboard */}
      {simResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase">Simulated Margin Health:</span>
              <div className="mt-1 flex items-center space-x-2">
                <StatusBadge status={simResult.margin_status} />
                <span className="text-base font-bold font-mono text-slate-100">
                  {simResult.simulated_margin_percent}% Gross Margin
                </span>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-slate-400 block">Target Threshold:</span>
              <span className="text-sm font-semibold text-slate-300">{simResult.target_margin_percent}%</span>
            </div>
          </div>

          {/* Economics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-[11px] text-slate-400 block">Unit Cost Basis</span>
              <span className="text-base font-bold text-slate-100">₹{simResult.current_cost?.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-[11px] text-slate-400 block">Simulated Unit Profit</span>
              <span className="text-base font-bold text-emerald-400">₹{simResult.simulated_gross_profit?.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-[11px] text-slate-400 block">Price Delta</span>
              <span className="text-base font-bold text-slate-200">
                {simResult.price_change_amount >= 0 ? '+' : ''}₹{simResult.price_change_amount?.toLocaleString()}
              </span>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-[11px] text-slate-400 block">Annual Net Profit Delta</span>
              <span
                className={`text-base font-bold ${
                  simResult.elasticity_analysis?.net_profit_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {simResult.elasticity_analysis?.net_profit_delta >= 0 ? '+' : ''}₹
                {simResult.elasticity_analysis?.net_profit_delta?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Elasticity Assessment */}
          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2">
            <span className="font-semibold text-slate-200 block uppercase tracking-wider text-[11px]">
              Microeconomic Elasticity Insights:
            </span>
            <p>
              Based on empirical industrial fabrication price elasticity of demand ({simResult.elasticity_analysis?.assumed_price_elasticity}), 
              a {simResult.price_change_percent}% price adjustment is projected to result in a {simResult.elasticity_analysis?.projected_volume_change_percent}% change in order volume.
            </p>
            <p className="text-slate-400">
              Simulated annual operating profit: ₹{simResult.elasticity_analysis?.simulated_annual_profit?.toLocaleString()} (vs Baseline ₹{simResult.elasticity_analysis?.baseline_annual_profit?.toLocaleString()}).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
