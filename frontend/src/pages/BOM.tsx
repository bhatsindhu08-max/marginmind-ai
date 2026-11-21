import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Material } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Layers, Plus, Link, Database, TrendingUp, X } from 'lucide-react';

export const BOM: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Material form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Carbon Steel');
  const [unit, setUnit] = useState('kg');
  const [standardCost, setStandardCost] = useState<number>(75);
  const [marketPrice, setMarketPrice] = useState<number>(75);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Material[]>('/materials');
      setMaterials(data);
    } catch (e) {
      console.error('Failed to load materials:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/materials', {
        method: 'POST',
        body: JSON.stringify({
          code,
          name,
          category,
          unit,
          standard_cost: standardCost,
          current_market_price: marketPrice,
          min_safety_stock: 100.0,
          is_active: true,
        }),
      });
      setShowAddModal(false);
      await loadMaterials();
    } catch (e: any) {
      alert('Failed to add raw material: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading BOM Material Schemas...</span>
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
              BOM & Raw Material Repository
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Index-Linked Master Data
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Raw materials database mapped to external commodity benchmarks with freight basis and scrap allowances.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Material</span>
        </button>
      </div>

      {/* Materials Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Material Code & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">Standard Cost</th>
                <th className="py-3 px-4 text-right">Current Market Price</th>
                <th className="py-3 px-4">Linked Market Benchmark</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {materials.map((m) => {
                const mapping = m.index_mappings?.[0];
                return (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-slate-100">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.code}</div>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-400">{m.category}</td>
                    <td className="py-3.5 px-4 text-center">{m.unit}</td>
                    <td className="py-3.5 px-4 text-right font-medium">₹{m.standard_cost.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                      ₹{m.current_market_price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {mapping ? (
                        <div className="flex items-center space-x-1.5">
                          <Link className="w-3 h-3 text-emerald-400" />
                          <span className="font-mono text-emerald-400 text-xs">
                            {mapping.indicator_code}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (×{mapping.multiplier} + ₹{mapping.freight_basis} basis)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No external link</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={m.is_active ? 'HEALTHY' : 'CRITICAL'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMaterial}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Add Raw Material</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Material Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="MAT-BRS-C360"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Material Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Free Cutting Brass Rod (C36000)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Unit of Measure</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                >
                  <option value="kg">kg</option>
                  <option value="metric_ton">metric_ton</option>
                  <option value="sheet">sheet</option>
                  <option value="metre">metre</option>
                  <option value="piece">piece</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Standard Cost (₹)</label>
                <input
                  type="number"
                  required
                  value={standardCost}
                  onChange={(e) => setStandardCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Current Market Price (₹)</label>
                <input
                  type="number"
                  required
                  value={marketPrice}
                  onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg"
              >
                Add Material
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
