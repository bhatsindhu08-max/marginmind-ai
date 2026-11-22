import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Material, LocationHub } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Layers,
  Plus,
  Link,
  Database,
  TrendingUp,
  X,
  RefreshCw,
  MapPin,
  Sliders,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export const BOM: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingPrices, setSyncingPrices] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Location hub state
  const [locationData, setLocationData] = useState<any>(null);
  const [availableLocations, setAvailableLocations] = useState<LocationHub[]>([]);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [selectedHubId, setSelectedHubId] = useState<string>('PUNE_MIDC');
  const [calibrateWages, setCalibrateWages] = useState<boolean>(true);

  // Manual Material Override modal
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editStandardCost, setEditStandardCost] = useState<number>(0);
  const [editMarketPrice, setEditMarketPrice] = useState<number>(0);
  const [editMinStock, setEditMinStock] = useState<number>(0);

  // New Material modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Raw Material');
  const [unit, setUnit] = useState('kg');
  const [standardCost, setStandardCost] = useState<number>(100);
  const [marketPrice, setMarketPrice] = useState<number>(100);
  const [initialStock, setInitialStock] = useState<number>(500);
  const [inventoryMap, setInventoryMap] = useState<Record<number, number>>({});

  useEffect(() => {
    loadMaterials();
    loadLocationData();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const [data, invList] = await Promise.all([
        apiRequest<Material[]>('/materials'),
        apiRequest<any[]>('/materials/inventory').catch(() => [])
      ]);
      setMaterials(data || []);
      const map: Record<number, number> = {};
      (invList || []).forEach((inv: any) => {
        map[inv.material_id] = inv.current_stock;
      });
      setInventoryMap(map);
    } catch (e) {
      console.error('Failed to load materials:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadLocationData = async () => {
    try {
      const [loc, hubs] = await Promise.all([
        apiRequest<any>('/business/location'),
        apiRequest<LocationHub[]>('/business/locations')
      ]);
      setLocationData(loc);
      setAvailableLocations(hubs);
      if (loc?.location_hub_id) {
        setSelectedHubId(loc.location_hub_id);
      }
    } catch (e) {
      console.error('Failed to load location data:', e);
    }
  };

  const handleSyncPrices = async () => {
    try {
      setSyncingPrices(true);
      setSyncResult(null);
      const res: any = await apiRequest('/materials/sync-external-prices', { method: 'POST' });
      setSyncResult(res);
      await loadMaterials();
    } catch (e: any) {
      alert('Price sync failed: ' + e.message);
    } finally {
      setSyncingPrices(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      await apiRequest('/business/location', {
        method: 'PUT',
        body: JSON.stringify({
          location_hub: selectedHubId,
          calibrate_wages: calibrateWages
        })
      });
      setShowLocationModal(false);
      await loadLocationData();
      await loadMaterials();
    } catch (e: any) {
      alert('Failed to update location hub: ' + e.message);
    }
  };

  const handleOpenEditModal = (m: Material) => {
    setEditingMaterial(m);
    setEditStandardCost(m.standard_cost);
    setEditMarketPrice(m.current_market_price);
    setEditMinStock(m.min_safety_stock);
  };

  const handleSaveManualCostOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    try {
      await apiRequest(`/materials/${editingMaterial.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          standard_cost: editStandardCost,
          current_market_price: editMarketPrice,
          min_safety_stock: editMinStock
        })
      });
      setEditingMaterial(null);
      await loadMaterials();
    } catch (e: any) {
      alert('Failed to update material costs: ' + e.message);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/materials', {
        method: 'POST',
        body: JSON.stringify({
          code: code || `MAT-${Date.now().toString().slice(-4)}`,
          name,
          category,
          unit,
          standard_cost: Number(standardCost) || 0,
          current_market_price: Number(marketPrice) || Number(standardCost) || 0,
          initial_stock: Number(initialStock) || 0,
          min_safety_stock: 100.0,
          is_active: true,
        }),
      });
      setShowAddModal(false);
      setCode('');
      setName('');
      setInitialStock(500);
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
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            Raw materials database mapped to external commodity benchmarks with freight basis, regional wages, and manual cost overrides.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncPrices}
            disabled={syncingPrices}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
            title="Automatically pull latest official benchmark prices for all mapped materials"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingPrices ? 'animate-spin' : ''}`} />
            <span>{syncingPrices ? 'Syncing Live Feeds...' : 'Auto-Fetch Market Prices'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Material</span>
          </button>
        </div>
      </div>

      {/* Location Cluster Banner */}
      {locationData && (
        <div className="p-4 glass-panel rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                <span>Active Manufacturing Hub: {locationData.location_hub?.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-mono">
                  {locationData.location_hub?.tier}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Regional Worker Wage Benchmark: <strong className="text-slate-200">₹{locationData.regional_wage_benchmark}/day</strong> • Freight Logistics Basis: <strong className="text-slate-200">+₹{locationData.freight_basis_per_kg}/kg</strong> • {locationData.location_hub?.notes}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowLocationModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition font-medium self-start sm:self-auto"
          >
            Switch Location Hub
          </button>
        </div>
      )}

      {/* Automated Sync Success Banner */}
      {syncResult && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Automated Market Price Intelligence: Synchronized {syncResult.synced_count} Materials!</span>
          </div>
          <div className="text-[11px] text-slate-300">
            Hub: <strong>{syncResult.location_hub}</strong> • Regional Freight Applied: <strong>+₹{syncResult.regional_freight_basis}/kg</strong>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-800/40 font-mono text-[11px]">
            {syncResult.updated_materials.map((u: any) => (
              <div key={u.material_id} className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-100 font-semibold block">{u.material_name}</span>
                  <span className="text-[10px] text-slate-400">{u.formula_applied}</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold">₹{u.new_market_price.toLocaleString()}</span>
                  <span className={`text-[10px] block ${u.change_percent >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {u.change_percent >= 0 ? '+' : ''}{u.change_percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Materials Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Material Code & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">In-Stock Quantity</th>
                <th className="py-3 px-4 text-right">Standard Cost</th>
                <th className="py-3 px-4 text-right">Landed Market Price</th>
                <th className="py-3 px-4 text-right">Total Stock Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {materials.map((m) => {
                const stockQty = inventoryMap[m.id] !== undefined ? inventoryMap[m.id] : 100;
                const stockVal = stockQty * (m.current_market_price || m.standard_cost);
                return (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-slate-100">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.code}</div>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-400">{m.category}</td>
                    <td className="py-3.5 px-4 text-center">{m.unit}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-cyan-300">
                      {stockQty.toLocaleString()} {m.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">₹{m.standard_cost.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                      ₹{m.current_market_price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      ₹{stockVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={m.is_active ? 'HEALTHY' : 'CRITICAL'} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <button
                        onClick={() => handleOpenEditModal(m)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition flex items-center space-x-1 ml-auto"
                        title="Manually override material cost for location/vendor adjustments"
                      >
                        <Sliders className="w-3 h-3 text-emerald-400" />
                        <span>Override Cost</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Material Cost Override Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveManualCostOverride}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Manual Material Cost Override</h3>
                <span className="text-xs text-slate-400 font-mono">{editingMaterial.code} • {editingMaterial.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingMaterial(null)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Adjust purchase price and landed market cost to reflect vendor negotiations, local spot mandi prices, or regional location logistics.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Standard Purchase Cost (₹ / {editingMaterial.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editStandardCost}
                  onChange={(e) => setEditStandardCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Current Landed Market Price (₹ / {editingMaterial.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editMarketPrice}
                  onChange={(e) => setEditMarketPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Minimum Safety Stock ({editingMaterial.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMaterial(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm"
              >
                Save Cost Override
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Switch Location Hub Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Configure Manufacturing Location Hub</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Selecting your manufacturing cluster automatically adjusts regional worker wage benchmarks and inbound material freight basis spreads across all product costings.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {availableLocations.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => setSelectedHubId(loc.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    selectedHubId === loc.id
                      ? 'bg-emerald-950/40 border-emerald-500/80 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs flex items-center space-x-2">
                      <span>{loc.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {loc.state}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Daily Wage: <strong className="text-emerald-400">₹{loc.daily_wage_benchmark}</strong> • Freight Basis: <strong className="text-slate-200">+₹{loc.freight_basis_per_kg}/kg</strong>
                    </div>
                  </div>
                  {selectedHubId === loc.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={calibrateWages}
                  onChange={(e) => setCalibrateWages(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                />
                <span>Calibrate product line wages to this regional benchmark</span>
              </label>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLocation}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm"
                >
                  Apply Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <label className="text-xs text-slate-300 font-medium block mb-1">Material Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="MAT-RAW-001"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Material Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="High Purity Electrolytic Copper"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Unit of Measure</label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg / piece / meter"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Standard Cost (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={standardCost}
                  onChange={(e) => setStandardCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Current Market (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={marketPrice}
                  onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Current Stock in Hand ({unit})</label>
              <input
                type="number"
                step="any"
                required
                value={initialStock}
                onChange={(e) => setInitialStock(parseFloat(e.target.value) || 0)}
                placeholder="500"
                className="w-full bg-slate-950 border border-cyan-800/60 rounded-lg p-2.5 text-xs text-cyan-300 font-mono font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Recorded into factory inventory to check order fulfillment feasibility.
              </span>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm"
              >
                Save Material
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
