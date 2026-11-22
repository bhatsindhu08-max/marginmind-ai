import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Product } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CheckCircle2, AlertTriangle, XCircle, Calculator, PackageCheck, ArrowRight, ShieldCheck, Gauge } from 'lucide-react';

export const OrderSure: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [orderQuantity, setOrderQuantity] = useState<number>(100);
  const [agreedPrice, setAgreedPrice] = useState<number>(4200);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, orders] = await Promise.all([
        apiRequest<Product[]>('/products'),
        apiRequest<any[]>('/ordersure/open-orders'),
      ]);
      setProducts(prods);
      setOpenOrders(orders);
      if (prods.length > 0) {
        setSelectedProductId(prods[0].id);
        setAgreedPrice(prods[0].selling_price);
        runEvaluation(prods[0].id, 100, prods[0].selling_price);
      }
    } catch (e) {
      console.error('Failed to load OrderSure data:', e);
    } finally {
      setLoading(false);
    }
  };

  const runEvaluation = async (prodId: number, qty: number, price: number) => {
    try {
      setEvaluating(true);
      const res = await apiRequest<any>(
        `/ordersure/evaluate?product_id=${prodId}&quantity=${qty}&agreed_price=${price}`
      );
      setEvaluation(res);
    } catch (e) {
      console.error('Order evaluation failed:', e);
    } finally {
      setEvaluating(false);
    }
  };

  const handleProductChange = (prodId: number) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setAgreedPrice(prod.selling_price);
      runEvaluation(prodId, orderQuantity, prod.selling_price);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Running OrderSure™ Gatekeeper Telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Interactive Order Evaluator */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              Interactive Order RFQ Stress Gatekeeper
            </h2>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold">
            {evaluating ? 'Simulating Feasibility...' : 'Calculated Deterministically'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-5">
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Select Product Catalog Item
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-sans"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Order Quantity (Units)
            </label>
            <input
              type="number"
              value={orderQuantity}
              onChange={(e) => {
                const q = parseFloat(e.target.value) || 1;
                setOrderQuantity(q);
                runEvaluation(selectedProductId, q, agreedPrice);
              }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Contracted Unit Price (₹)
            </label>
            <input
              type="number"
              value={agreedPrice}
              onChange={(e) => {
                const p = parseFloat(e.target.value) || 0;
                setAgreedPrice(p);
                runEvaluation(selectedProductId, orderQuantity, p);
              }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Evaluation Output Dossier */}
        {evaluation && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Order Verdict:</span>
                <div className="mt-1 flex items-center space-x-3">
                  <StatusBadge status={evaluation.recommendation} />
                  <span className="text-xs text-slate-300 font-medium font-sans">
                    {evaluation.recommendation === 'ATTRACTIVE'
                      ? 'Financially Attractive under Current & Spot Stress Scenarios'
                      : evaluation.recommendation === 'VERIFY'
                      ? 'Requires Customer Escalation Clause or Margin Cushion Adjustment'
                      : 'High Financial Exposure — Sub-Critical Gross Margin Breached'}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Suggested Minimum Price Floor</span>
                <span className="text-lg font-bold text-cyan-300 tabular-nums">
                  ₹{evaluation.suggested_price_floor?.toLocaleString()} / unit
                </span>
              </div>
            </div>

            {/* Financial Metrics Comparison */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px] block uppercase">Total Revenue</span>
                <span className="text-base font-bold text-slate-100 tabular-nums mt-0.5 block">
                  ₹{evaluation.total_revenue?.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px] block uppercase">Current Margin</span>
                <span className="text-base font-bold text-emerald-400 tabular-nums mt-0.5 block">
                  {evaluation.current_margin_percent}% <span className="text-xs text-slate-400">(₹{evaluation.current_gross_profit?.toLocaleString()})</span>
                </span>
              </div>
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px] block uppercase">Stress Margin</span>
                <span className="text-base font-bold text-amber-400 tabular-nums mt-0.5 block">
                  {evaluation.stress_margin_percent}% <span className="text-xs text-slate-400">(₹{evaluation.stress_gross_profit?.toLocaleString()})</span>
                </span>
              </div>
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px] block uppercase">Stock Coverage</span>
                <span className="text-base font-bold text-cyan-300 tabular-nums mt-0.5 block">
                  {evaluation.min_inventory_coverage_percent}% Covered
                </span>
              </div>
            </div>

            {/* Recommendation Reasons & Risks */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Order Evaluation Audit Notes:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {(evaluation.recommendation_reasons || []).map((r: string, i: number) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Open Orders Feasibility Table (Reference Image 3 Data Tables) */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Active Commitments Feasibility Surveillance
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Every committed customer purchase order evaluated against current spot commodity prices and +18% stress scenarios.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Active Orders: <span className="text-cyan-400 font-bold">{openOrders.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Order Ref</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Product Line</th>
                <th className="py-3.5 px-4 text-right">Qty</th>
                <th className="py-3.5 px-4 text-right">Agreed Price</th>
                <th className="py-3.5 px-4 text-right">Current Margin</th>
                <th className="py-3.5 px-4 text-right">Stress Margin</th>
                <th className="py-3.5 px-4 text-right">Price Floor</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {openOrders.map((ord) => (
                <tr key={ord.order_number} className="hover:bg-slate-850/50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-100">{ord.order_number}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-200">{ord.customer_name}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-300">{ord.product_name}</td>
                  <td className="py-3.5 px-4 text-right tabular-nums">{ord.order_quantity}</td>
                  <td className="py-3.5 px-4 text-right tabular-nums">₹{ord.agreed_unit_price?.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-bold tabular-nums">
                    {ord.current_margin_percent}%
                  </td>
                  <td className="py-3.5 px-4 text-right text-amber-400 font-bold tabular-nums">
                    {ord.stress_margin_percent}%
                  </td>
                  <td className="py-3.5 px-4 text-right text-cyan-300 tabular-nums">
                    ₹{ord.suggested_price_floor?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center font-sans">
                    <StatusBadge status={ord.recommendation} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
