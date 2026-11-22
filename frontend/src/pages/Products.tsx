import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Product, ProductCostBreakdown } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Package, Plus, Layers, DollarSign, ArrowRight, X, Trash2 } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBreakdown, setSelectedBreakdown] = useState<ProductCostBreakdown | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Manual production cost override state
  const [isEditingCosts, setIsEditingCosts] = useState<boolean>(false);
  const [savingCosts, setSavingCosts] = useState<boolean>(false);
  const [costForm, setCostForm] = useState<any>({
    worker_count: 1,
    wage_per_worker_daily: 750,
    daily_output_units: 100,
    processing_jobwork_cost_per_unit: 0,
    inspection_qc_cost_per_unit: 0,
    consumables_cost_per_unit: 0,
    boiler_steam_fuel_per_unit: 0,
    fixed_overhead_per_unit: 150,
    packaging_freight_per_unit: 50,
    selling_price: 1000,
  });

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
      setIsEditingCosts(false);
      setCostForm({
        worker_count: res.worker_count || 1,
        wage_per_worker_daily: res.wage_per_worker_daily || 750,
        daily_output_units: res.daily_output_units || 100,
        processing_jobwork_cost_per_unit: res.processing_jobwork_cost || 0,
        inspection_qc_cost_per_unit: res.inspection_qc_cost || 0,
        consumables_cost_per_unit: res.consumables_cost || 0,
        boiler_steam_fuel_per_unit: res.boiler_steam_fuel || 0,
        fixed_overhead_per_unit: res.fixed_overhead || 150,
        packaging_freight_per_unit: res.freight_packaging_cost || 50,
        selling_price: res.selling_price || 0,
      });
    } catch (e) {
      console.error('Failed to load cost breakdown:', e);
    }
  };

  const handleSaveProductionCosts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBreakdown) return;
    try {
      setSavingCosts(true);
      const updated = await apiRequest<ProductCostBreakdown>(
        `/products/${selectedBreakdown.product_id}/production-costs`,
        {
          method: 'PUT',
          body: JSON.stringify(costForm),
        }
      );
      setSelectedBreakdown(updated);
      setIsEditingCosts(false);
      await loadProducts();
    } catch (err: any) {
      alert('Failed to save production costs: ' + err.message);
    } finally {
      setSavingCosts(false);
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

  const handleDeleteProduct = async (productId: number, productName: string, sku: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete product "${productName}" (${sku})?\n\nThis will permanently delete this product and all associated Bills of Materials, production costs, and order records.`
      )
    ) {
      return;
    }
    try {
      await apiRequest(`/products/${productId}`, {
        method: 'DELETE',
      });
      if (selectedBreakdown?.product_id === productId) {
        setSelectedBreakdown(null);
      }
      await loadProducts();
    } catch (err: any) {
      alert('Failed to delete product: ' + err.message);
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
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
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
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-glow-emerald transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
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
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => loadCostBreakdown(p.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition"
                      >
                        Cost Breakdown
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name, p.sku)}
                        title={`Delete ${p.name}`}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Breakdown Drawer Modal */}
      {selectedBreakdown && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {selectedBreakdown.product_name}
                </h3>
                <span className="text-xs text-slate-400 font-mono">{selectedBreakdown.sku}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCosts(!isEditingCosts)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    isEditingCosts
                      ? 'bg-amber-500/20 text-amber-300 border-amber-600'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  {isEditingCosts ? 'Back to View' : 'Adjust Wages & Line Costs'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteProduct(
                      selectedBreakdown.product_id,
                      selectedBreakdown.product_name,
                      selectedBreakdown.sku
                    );
                  }}
                  title="Delete this Product"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-700/80 hover:border-rose-500/30 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedBreakdown(null);
                    setIsEditingCosts(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* If Editing Mode: Render Override Form */}
            {isEditingCosts ? (
              <form onSubmit={handleSaveProductionCosts} className="space-y-4">
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-emerald-400 flex items-center justify-between">
                    <span>Deterministic Labor Formula Preview:</span>
                    <span className="font-mono text-emerald-300 font-bold">
                      ₹{((Number(costForm.worker_count || 1) * Number(costForm.wage_per_worker_daily || 0)) / Math.max(Number(costForm.daily_output_units || 1), 1)).toFixed(2)} / pc
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    ({costForm.worker_count || 1} workers × ₹{costForm.wage_per_worker_daily || 0}/day) ÷ {costForm.daily_output_units || 1} pcs/day target
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                  💡 <strong className="text-slate-200">Facility Overhead Tip:</strong> You can adjust per-unit factory rent and water/boiler costs directly here for this product, or use the <strong className="text-emerald-400">Plant OPEX Calculator in System Configuration (Settings)</strong> to divide your monthly bills (Rent, Water, Power) across your total plant volume.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Worker Count */}
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      Active Line Workers (Crew Headcount)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={costForm.worker_count}
                      onChange={(e) => setCostForm({ ...costForm, worker_count: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500">Stitchers, operators, or line technicians</span>
                  </div>

                  {/* Daily Wage */}
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      Daily Wage Rate (₹ / worker / day)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="10"
                      value={costForm.wage_per_worker_daily}
                      onChange={(e) => setCostForm({ ...costForm, wage_per_worker_daily: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500">Varies by hub (e.g. ₹650 Tirupur, ₹850 Pune)</span>
                  </div>

                  {/* Daily Output Target */}
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      Daily Output Target (Units / Day)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={costForm.daily_output_units}
                      onChange={(e) => setCostForm({ ...costForm, daily_output_units: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500">Finished pieces assembled per shift</span>
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium text-emerald-400">
                      Product Selling Price (₹ / unit)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={costForm.selling_price}
                      onChange={(e) => setCostForm({ ...costForm, selling_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-emerald-800/80 rounded-lg text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-[10px] text-slate-500">Wholesale or ex-factory contract price</span>
                  </div>

                  {/* Processing / Job Work */}
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      Job Work / Processing (₹ / unit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={costForm.processing_jobwork_cost_per_unit}
                      onChange={(e) => setCostForm({ ...costForm, processing_jobwork_cost_per_unit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500">Dyeing, heat treatment, SMT AOI, sterilization</span>
                  </div>

                  {/* Inspection QC */}
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      QC Inspection & Trimming (₹ / unit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={costForm.inspection_qc_cost_per_unit}
                      onChange={(e) => setCostForm({ ...costForm, inspection_qc_cost_per_unit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500">Thread trimming, CMM gauge, ICT, microbial check</span>
                  </div>

                  {/* Consumables */}
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      Consumables & Hardware Trims (₹ / unit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={costForm.consumables_cost_per_unit}
                      onChange={(e) => setCostForm({ ...costForm, consumables_cost_per_unit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500">Buttons, polybags, silicone sealant, can lids</span>
                  </div>

                  {/* Boiler Steam & Water Utility Fuel */}
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      Boiler Steam, Water & Fuel (₹ / unit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={costForm.boiler_steam_fuel_per_unit}
                      onChange={(e) => setCostForm({ ...costForm, boiler_steam_fuel_per_unit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500">Steam press, process water, autoclave retort, boiler gas</span>
                  </div>

                  {/* Plant Overhead & Rent */}
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      Factory Rent, Building & Plant Overhead (₹ / unit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={costForm.fixed_overhead_per_unit}
                      onChange={(e) => setCostForm({ ...costForm, fixed_overhead_per_unit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500">Factory rent, building maintenance, supervisor salaries</span>
                  </div>

                  {/* Freight & Packaging */}
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      Outbound Dispatch Freight (₹ / unit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={costForm.packaging_freight_per_unit}
                      onChange={(e) => setCostForm({ ...costForm, packaging_freight_per_unit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500">Carton packaging and logistics shipping</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingCosts(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCosts}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg transition disabled:opacity-50 shadow-sm"
                  >
                    {savingCosts ? 'Recalculating...' : 'Save & Recalculate Profit'}
                  </button>
                </div>
              </form>
            ) : (
              <>
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
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Full Production Cost Elements (Deterministic Formula)
                    </h4>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                      All Overhead & Worker Wages Counted
                    </span>
                  </div>

                  {/* Worker Line Crew Breakdown Box (if worker headcount configured) */}
                  {selectedBreakdown.worker_count && selectedBreakdown.worker_count > 1 ? (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-1.5 text-slate-300">
                      <div className="flex items-center justify-between text-emerald-400 font-bold font-sans text-xs">
                        <span>Direct Labor: Crew Headcount & Wages</span>
                        <span>₹{selectedBreakdown.labour_cost.toFixed(2)} / pc</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-emerald-800/30">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Active Line Workers:</span>
                          <span className="text-slate-200 font-bold">{selectedBreakdown.worker_count} operators/crew</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Daily Wage / Worker:</span>
                          <span className="text-slate-200 font-bold">₹{selectedBreakdown.wage_per_worker_daily} / day</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Daily Output Target:</span>
                          <span className="text-slate-200 font-bold">{selectedBreakdown.daily_output_units} pcs / day</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-0.5">
                        Formula: ({selectedBreakdown.worker_count} workers × ₹{selectedBreakdown.wage_per_worker_daily}) ÷ {selectedBreakdown.daily_output_units} units = ₹{selectedBreakdown.labour_cost.toFixed(2)} direct labor cost per unit.
                      </div>
                    </div>
                  ) : null}

                  <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 divide-y divide-slate-800/60">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-300 font-sans">Raw Materials (BOM Base)</span>
                      <span className="text-slate-100 font-bold">₹{selectedBreakdown.material_cost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-300 font-sans">Fabric / Material Process Scrap Loss</span>
                      <span className="text-slate-100">₹{selectedBreakdown.scrap_cost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-300 font-sans">
                        {selectedBreakdown.worker_count && selectedBreakdown.worker_count > 1
                          ? 'Direct Workers & Stitching Crew Labor'
                          : 'Direct Machinist Labour'}
                      </span>
                      <span className="text-slate-100 font-bold">₹{selectedBreakdown.labour_cost.toLocaleString()}</span>
                    </div>

                    {(selectedBreakdown.processing_jobwork_cost || 0) > 0 && (
                      <div className="flex justify-between py-1.5 text-amber-300/90">
                        <span className="font-sans">Processing / Job Work (Washing, Printing, Dyeing)</span>
                        <span className="font-bold">₹{selectedBreakdown.processing_jobwork_cost?.toLocaleString()}</span>
                      </div>
                    )}

                    {(selectedBreakdown.inspection_qc_cost || 0) > 0 && (
                      <div className="flex justify-between py-1.5 text-cyan-300/90">
                        <span className="font-sans">Quality Inspection, Thread Trimming & Needle Check</span>
                        <span className="font-bold">₹{selectedBreakdown.inspection_qc_cost?.toLocaleString()}</span>
                      </div>
                    )}

                    {(selectedBreakdown.consumables_cost || 0) > 0 && (
                      <div className="flex justify-between py-1.5 text-purple-300/90">
                        <span className="font-sans">Consumables & Hardware Trims (Buttons, Zippers, Polybag)</span>
                        <span className="font-bold">₹{selectedBreakdown.consumables_cost?.toLocaleString()}</span>
                      </div>
                    )}

                    {(selectedBreakdown.boiler_steam_fuel || 0) > 0 && (
                      <div className="flex justify-between py-1.5 text-orange-300/90">
                        <span className="font-sans">Boiler Steam, Process Water & Fuel</span>
                        <span className="font-bold">₹{selectedBreakdown.boiler_steam_fuel?.toLocaleString()}</span>
                      </div>
                    )}

                    {(selectedBreakdown.machine_overhead || 0) > 0 && (
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-300 font-sans">Machinery Overhead & Depreciation</span>
                        <span className="text-slate-100">₹{selectedBreakdown.machine_overhead.toLocaleString()}</span>
                      </div>
                    )}

                    {(selectedBreakdown.energy_cost || 0) > 0 && (
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-300 font-sans">Energy & Electricity Tariff</span>
                        <span className="text-slate-100">₹{selectedBreakdown.energy_cost.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-300 font-sans">Factory Rent & Plant Overhead Absorption</span>
                      <span className="text-slate-100 font-semibold">₹{selectedBreakdown.fixed_overhead.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-300 font-sans">Packaging & Outbound Dispatch Freight</span>
                      <span className="text-slate-100">₹{selectedBreakdown.freight_packaging_cost.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between pt-2.5 font-bold text-sm text-slate-100 border-t-2 border-slate-700">
                      <span className="font-sans">Total Fully-Absorbed Unit Cost</span>
                      <span className="text-emerald-400">₹{selectedBreakdown.total_cost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
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
