import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Business } from '../types';
import { Settings as SettingsIcon, Save, Database, ShieldCheck, CheckCircle2, Globe2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [targetMargin, setTargetMargin] = useState<number>(25.0);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(16.0);
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const biz = await apiRequest<Business>('/business/current');
      setBusiness(biz);
      setName(biz.name);
      setCurrency(biz.currency);
      setAddress(biz.address || '');
      setTargetMargin(biz.settings_json?.default_target_margin || 25.0);
      setCriticalThreshold(biz.settings_json?.critical_margin_threshold || 16.0);
    } catch (e) {
      console.error('Failed to load business settings:', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiRequest('/business/current', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          currency,
          address,
          settings_json: {
            default_target_margin: targetMargin,
            critical_margin_threshold: criticalThreshold,
            demo_mode: true,
          },
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
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
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
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
              <input
                type="text"
                disabled
                value="Metal and Steel Manufacturing"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-slate-400"
              />
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

      {/* External Data Source Registries Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
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
