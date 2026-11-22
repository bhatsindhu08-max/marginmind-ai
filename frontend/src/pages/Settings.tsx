import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Business } from '../types';
import { Settings as SettingsIcon, Save, Database, ShieldCheck, CheckCircle2, Globe2, Building2, Droplets, Zap, DollarSign } from 'lucide-react';

export const Settings: React.FC = () => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState('');
  const [industryType, setIndustryType] = useState('metal_steel');
  const [currency, setCurrency] = useState('INR');
  const [targetMargin, setTargetMargin] = useState<number>(25.0);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(16.0);
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Plant OPEX & Utilities state (Rent, Water Bill, Electricity, Admin)
  const [monthlyRent, setMonthlyRent] = useState<number>(120000);
  const [monthlyWater, setMonthlyWater] = useState<number>(18000);
  const [monthlyPower, setMonthlyPower] = useState<number>(75000);
  const [monthlyAdmin, setMonthlyAdmin] = useState<number>(45000);
  const [monthlyUnits, setMonthlyUnits] = useState<number>(8000);
  const [applyToProducts, setApplyToProducts] = useState<boolean>(true);
  const [savingOpex, setSavingOpex] = useState<boolean>(false);
  const [opexSuccessMsg, setOpexSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadOpex();
  }, []);

  const loadSettings = async () => {
    try {
      const biz = await apiRequest<Business>('/business/current');
      setBusiness(biz);
      setName(biz.name);
      setIndustryType(biz.industry_type || 'metal_steel');
      setCurrency(biz.currency);
      setAddress(biz.address || '');
      setTargetMargin(biz.settings_json?.default_target_margin || 25.0);
      setCriticalThreshold(biz.settings_json?.critical_margin_threshold || 16.0);
    } catch (e) {
      console.error('Failed to load business settings:', e);
    }
  };

  const loadOpex = async () => {
    try {
      const data = await apiRequest<any>('/business/opex');
      if (data?.plant_opex) {
        setMonthlyRent(data.plant_opex.monthly_rent || 120000);
        setMonthlyWater(data.plant_opex.monthly_water_bill || 18000);
        setMonthlyPower(data.plant_opex.monthly_electricity_bill || 75000);
        setMonthlyAdmin(data.plant_opex.monthly_maintenance_admin || 45000);
        setMonthlyUnits(data.plant_opex.monthly_production_units || 8000);
      }
    } catch (e) {
      console.error('Failed to load plant OPEX:', e);
    }
  };

  const totalMonthlyBills = Number(monthlyRent || 0) + Number(monthlyWater || 0) + Number(monthlyPower || 0) + Number(monthlyAdmin || 0);
  const calculatedUnitOverhead = totalMonthlyBills / Math.max(Number(monthlyUnits || 1), 1);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiRequest('/business/current', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          industry_type: industryType,
          currency,
          address,
          settings_json: {
            ...business?.settings_json,
            default_target_margin: targetMargin,
            critical_margin_threshold: criticalThreshold,
            demo_mode: true,
          },
        }),
      });
      localStorage.setItem('marginmind_industry', industryType);
      localStorage.setItem('marginmind_biz', name);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOpex = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingOpex(true);
      setOpexSuccessMsg(null);
      const res = await apiRequest<any>('/business/opex', {
        method: 'PUT',
        body: JSON.stringify({
          monthly_rent: monthlyRent,
          monthly_water_bill: monthlyWater,
          monthly_electricity_bill: monthlyPower,
          monthly_maintenance_admin: monthlyAdmin,
          monthly_production_units: monthlyUnits,
          apply_to_products: applyToProducts,
        }),
      });
      setOpexSuccessMsg(
        applyToProducts
          ? `Saved! Plant unit overhead of ₹${res.calculated_unit_overhead}/unit automatically allocated to ${res.updated_products_count} catalog products.`
          : `Saved! Plant OPEX recorded successfully.`
      );
      setTimeout(() => setOpexSuccessMsg(null), 5000);
    } catch (e: any) {
      alert('Failed to save OPEX: ' + e.message);
    } finally {
      setSavingOpex(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              System Settings & Configuration
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Tenant #1
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure financial margin thresholds, external API data feeds, and company operational defaults.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>System configuration saved successfully!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="glass-panel rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
          Enterprise Profile & Costing Thresholds
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">Company Legal Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Operating Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
              >
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Manufacturing Industry</label>
              <select
                value={industryType}
                onChange={(e) => setIndustryType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg p-2.5 text-slate-100 font-sans"
              >
                <option value="metal_steel">Metal and Steel Manufacturing</option>
                <option value="textile_garment">Textile & Garment Manufacturing (Apparel / Cloth)</option>
                <option value="electronics_assembly">Electronics Assembly & SMT</option>
                <option value="food_processing">Food Processing & Packaging</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Default Target Gross Margin (%)
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={targetMargin}
                onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 25)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard baseline profit expectation across catalog.
              </span>
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Critical Margin Alert Floor (%)
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(parseFloat(e.target.value) || 16)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Triggers MarginGuard™ critical alert and price revision proposal.
              </span>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Plant Location / Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Plant Operating Expenses & Facility Utilities (Rent, Water Bill, Power & Admin) */}
      <form onSubmit={handleSaveOpex} className="glass-panel rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Plant Operating Expenses & Facility Utilities (Rent, Water, Power)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure enterprise recurring monthly facility overheads. MarginMind deterministically computes the
              Overhead Absorption Rate (OAR) and allocates it per unit across your product catalog.
            </p>
          </div>
        </div>

        {opexSuccessMsg && (
          <div className="p-3.5 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{opexSuccessMsg}</span>
          </div>
        )}

        {/* Live Overhead Absorption Summary Banner */}
        <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                Overhead Absorption Rate (OAR)
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                ₹{calculatedUnitOverhead.toFixed(2)} <span className="text-xs text-slate-300 font-sans">/ unit produced</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                Total Monthly Facility Overhead
              </span>
              <span className="text-lg font-bold font-mono text-slate-100">
                ₹{totalMonthlyBills.toLocaleString()} <span className="text-xs text-slate-400 font-sans">/ month</span>
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-emerald-800/30">
            Formula: (₹{monthlyRent.toLocaleString()} Rent + ₹{monthlyWater.toLocaleString()} Water + ₹{monthlyPower.toLocaleString()} Power + ₹{monthlyAdmin.toLocaleString()} Admin) ÷ {Number(monthlyUnits || 1).toLocaleString()} units/mo = ₹{calculatedUnitOverhead.toFixed(2)} / unit.
          </div>
        </div>

        {/* Monthly Overhead Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Factory Rent */}
          <div>
            <label className="text-slate-300 font-medium block mb-1 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Monthly Factory Premises Rent (₹ / month)</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              required
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
            />
            <span className="text-[10px] text-slate-500">Factory shed, warehouse, or lease payment</span>
          </div>

          {/* Water Utility Bill */}
          <div>
            <label className="text-slate-300 font-medium block mb-1 flex items-center space-x-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Monthly Water Utility Bill (₹ / month)</span>
            </label>
            <input
              type="number"
              min="0"
              step="500"
              required
              value={monthlyWater}
              onChange={(e) => setMonthlyWater(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
            />
            <span className="text-[10px] text-slate-500">Municipal industrial water, borewell, or effluent treatment</span>
          </div>

          {/* Electricity & Power Bill */}
          <div>
            <label className="text-slate-300 font-medium block mb-1 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Monthly Electricity & Power Bill (₹ / month)</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              required
              value={monthlyPower}
              onChange={(e) => setMonthlyPower(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
            />
            <span className="text-[10px] text-slate-500">State electricity board tariff + diesel genset fuel</span>
          </div>

          {/* Plant Maintenance & Facility Admin */}
          <div>
            <label className="text-slate-300 font-medium block mb-1 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Plant Maintenance, Security & Admin (₹ / month)</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              required
              value={monthlyAdmin}
              onChange={(e) => setMonthlyAdmin(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
            />
            <span className="text-[10px] text-slate-500">Security guards, supervisor fixed salaries, repairs</span>
          </div>

          {/* Monthly Production Volume */}
          <div className="md:col-span-2">
            <label className="text-slate-300 font-medium block mb-1">
              Estimated Monthly Plant Production Volume (Units / Month)
            </label>
            <input
              type="number"
              min="1"
              step="100"
              required
              value={monthlyUnits}
              onChange={(e) => setMonthlyUnits(parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
            />
            <span className="text-[10px] text-slate-500">Total finished units produced across all product lines per month</span>
          </div>
        </div>

        {/* Apply Checkbox & Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToProducts}
              onChange={(e) => setApplyToProducts(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
            />
            <span>
              Automatically update and allocate this unit overhead (₹{calculatedUnitOverhead.toFixed(2)}/unit) across all catalog products
            </span>
          </label>

          <button
            type="submit"
            disabled={savingOpex}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 whitespace-nowrap"
          >
            <Save className="w-4 h-4" />
            <span>{savingOpex ? 'Calculating...' : 'Save & Allocate Plant Overhead'}</span>
          </button>
        </div>
      </form>

      {/* External Data Source Registries Status */}
      <div className="glass-panel rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Active External Data Feed Connectors</span>
        </h3>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div>
              <span className="font-sans font-semibold text-slate-200 block">World Bank Commodity Pink Sheet</span>
              <span className="text-[11px] text-slate-400">Monthly official global metals, energy, and minerals dataset</span>
            </div>
            <span className="text-emerald-400 text-xs font-semibold">Online (98% Reliability)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div>
              <span className="font-sans font-semibold text-slate-200 block">Reserve Bank of India (RBI) Forex Feed</span>
              <span className="text-[11px] text-slate-400">Daily USD/INR and EUR/INR reference exchange rates</span>
            </div>
            <span className="text-emerald-400 text-xs font-semibold">Online (99% Reliability)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div>
              <span className="font-sans font-semibold text-slate-200 block">Ministry of Commerce & Industry (WPI)</span>
              <span className="text-[11px] text-slate-400">Office of Economic Adviser Wholesale Price Index for Basic Metals</span>
            </div>
            <span className="text-emerald-400 text-xs font-semibold">Online (97% Reliability)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
