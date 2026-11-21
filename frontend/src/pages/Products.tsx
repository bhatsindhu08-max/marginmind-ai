import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Product, ProductCostBreakdown } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Package, Plus, Layers, DollarSign, ArrowRight, X } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBreakdown, setSelectedBreakdown] = useState<ProductCostBreakdown | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // New product form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Fabricated Components');
  const [sellingPrice, setSellingPrice] = useState<number>(3500);
  const [targetMargin, setTargetMargin] = useState<number>(25);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const prods = await apiRequest<Product[]>('/products');
      setProducts(prods);
    } catch (e) {
      console.error('Failed to load products:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCostBreakdown = async (productId: number) => {
    try {
      const res = await apiRequest<ProductCostBreakdown>(`/products/${productId}/cost-breakdown`);
      setSelectedBreakdown(res);
    } catch (e) {
      console.error('Failed to load cost breakdown:', e);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          code,
          name,
          sku,
          category,
          selling_price: sellingPrice,
          target_margin_percent: targetMargin,
          critical_margin_threshold: 16.0,
        }),
      });
      setShowCreateModal(false);
      await loadProducts();
    } catch (e: any) {
      alert('Failed to create product: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Product Master Records...</span>
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
              Product Master Catalog
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              BOM-Connected
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manufactured items catalog with deterministic BOM cost aggregation and margin health tracking.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Product Code & Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Target Margin</th>
                <th className="py-3 px-4 text-right">Critical Floor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-slate-100">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.code}</div>
                  </td>
                  <td className="py-3.5 px-4">{p.sku}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-400">{p.category || 'Standard Mfg'}</td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-100">
                    ₹{p.selling_price.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-semibold">
                    {p.target_margin_percent}%
                  </td>
                  <td className="py-3.5 px-4 text-right text-rose-400">
                    {p.critical_margin_threshold}%
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={p.is_active ? 'HEALTHY' : 'CRITICAL'} />
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    <button
                      onClick={() => loadCostBreakdown(p.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition"
                    >
                      Cost Breakdown
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Breakdown Drawer Modal */}
      {selectedBreakdown && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {selectedBreakdown.product_name}
                </h3>
                <span className="text-xs text-slate-400 font-mono">{selectedBreakdown.sku}</span>
              </div>
              <button
                onClick={() => setSelectedBreakdown(null)}
                className="p-1 text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cost Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase block">Selling Price</span>
                <span className="text-sm font-bold text-slate-100">
                  ₹{selectedBreakdown.selling_price.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase block">Total Unit Cost</span>
                <span className="text-sm font-bold text-slate-100">
                  ₹{selectedBreakdown.total_cost.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase block">Gross Profit</span>
                <span className="text-sm font-bold text-emerald-400">
                  ₹{selectedBreakdown.gross_profit.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase block">Margin %</span>
                <span className="text-sm font-bold text-emerald-400">
                  {selectedBreakdown.gross_margin_percent}%
                </span>
              </div>
            </div>

            {/* Cost Elements Breakdown */}
            <div className="space-y-2 text-xs font-mono">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Full Production Cost Elements (Deterministic Formula)
              </h4>
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 divide-y divide-slate-800/60">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-300 font-sans">Raw Materials (BOM Base)</span>
                  <span className="text-slate-100">₹{selectedBreakdown.material_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-300 font-sans">Scrap / Process Loss Allowance</span>
                  <span className="text-slate-100">₹{selectedBreakdown.scrap_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-300 font-sans">Direct Machinist Labour</span>
                  <span className="text-slate-100">₹{selectedBreakdown.labour_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-300 font-sans">CNC Machine Overhead</span>
                  <span className="text-slate-100">₹{selectedBreakdown.machine_overhead.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-300 font-sans">Energy & Induction Power</span>
                  <span className="text-slate-100">₹{selectedBreakdown.energy_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-300 font-sans">Fixed Plant Overhead Absorption</span>
                  <span className="text-slate-100">₹{selectedBreakdown.fixed_overhead.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-300 font-sans">Packaging & Outbound Freight</span>
                  <span className="text-slate-100">₹{selectedBreakdown.freight_packaging_cost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProduct}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Add New Manufactured Product</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Product Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PRD-VLV-401"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Product Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="High Pressure Ball Valve (DN50)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">SKU</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="HPV-DN50-SS316"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Target Margin %</label>
                <input
                  type="number"
                  required
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 25)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg"
              >
                Create Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
