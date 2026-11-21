import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Product } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CheckCircle2, AlertTriangle, XCircle, Calculator, PackageCheck, ArrowRight } from 'lucide-react';

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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Running OrderSure™ Gatekeeper...</span>
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
              OrderSure™ Feasibility Gatekeeper
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Pre-Commitment Margin Defense
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluates financial feasibility, inventory availability, and stress-scenario resilience before accepting customer purchase orders.
          </p>
        </div>
      </div>

      {/* Interactive Order Evaluator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span>Interactive New Order Evaluator</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Select Product Catalog Item
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Evaluation Output Dossier */}
        {evaluation && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Feasibility Verdict:</span>
                <div className="mt-1 flex items-center space-x-2">
                  <StatusBadge status={evaluation.recommendation} />
                  <span className="text-xs text-slate-300 font-medium">
                    {evaluation.recommendation === 'ATTRACTIVE'
                      ? 'Financially Attractive under Current & Stress Assumptions'
                      : evaluation.recommendation === 'VERIFY'
                      ? 'Requires Additional Price Escalation or Inventory Hedging'
                      : 'High Financial Risk — Sub-Critical Contribution Margin'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block">Suggested Minimum Price Floor</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  ₹{evaluation.suggested_price_floor?.toLocaleString()} / unit
                </span>
              </div>
            </div>

            {/* Financial Metrics Comparison */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[11px] block">Order Revenue</span>
                <span className="text-sm font-bold text-slate-100">
                  ₹{evaluation.total_revenue?.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[11px] block">Current Margin</span>
                <span className="text-sm font-bold text-emerald-400">
                  {evaluation.current_margin_percent}% (₹{evaluation.current_gross_profit?.toLocaleString()})
                </span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[11px] block">Stress Margin</span>
                <span className="text-sm font-bold text-amber-400">
                  {evaluation.stress_margin_percent}% (₹{evaluation.stress_gross_profit?.toLocaleString()})
                </span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[11px] block">Inventory Buffer</span>
                <span className="text-sm font-bold text-slate-200">
                  {evaluation.min_inventory_coverage_percent}% Covered
                </span>
              </div>
            </div>

            {/* Recommendation Reasons & Risks */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Order Evaluation Audit Notes:
              </h4>
              <ul className="space-y-1 text-xs text-slate-300">
                {(evaluation.recommendation_reasons || []).map((r: string, i: number) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Open Orders Feasibility Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Active Commitments Feasibility Surveillance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Every live customer order evaluated against current spot commodity prices and +18% stress scenarios.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product Line</th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Agreed Price</th>
                <th className="py-3 px-4 text-right">Current Margin</th>
                <th className="py-3 px-4 text-right">Stress Margin</th>
                <th className="py-3 px-4 text-right">Price Floor</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {openOrders.map((ord) => (
                <tr key={ord.order_number} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-100">{ord.order_number}</td>
                  <td className="py-3.5 px-4 font-sans">{ord.customer_name}</td>
                  <td className="py-3.5 px-4 font-sans">{ord.product_name}</td>
                  <td className="py-3.5 px-4 text-right">{ord.order_quantity}</td>
                  <td className="py-3.5 px-4 text-right">₹{ord.agreed_unit_price?.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
                    {ord.current_margin_percent}%
                  </td>
                  <td className="py-3.5 px-4 text-right text-amber-400 font-bold">
                    {ord.stress_margin_percent}%
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-300">
                    ₹{ord.suggested_price_floor?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={ord.recommendation} />
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
