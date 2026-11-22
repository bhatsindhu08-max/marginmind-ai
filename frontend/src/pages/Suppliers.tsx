import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Truck, Plus, Mail, Phone, Calendar, Clock, X, ShieldAlert } from 'lucide-react';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Supplier Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [leadTime, setLeadTime] = useState<number>(14);
  const [riskRating, setRiskRating] = useState('LOW');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any[]>('/suppliers');
      setSuppliers(data);
    } catch (e) {
      console.error('Failed to load suppliers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          code,
          name,
          contact_email: contactEmail,
          lead_time_days: leadTime,
          reliability_score: 0.95,
          risk_rating: riskRating,
          payment_terms: paymentTerms,
        }),
      });
      setShowAddModal(false);
      await loadSuppliers();
    } catch (e: any) {
      alert('Failed to add supplier: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Supplier Records & Quotes...</span>
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
              Supplier & Quotation Management
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Procurement Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Vendor relationship directory, active quotations, delivery lead-times, and single-source risk surveillance.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-glow-emerald transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Supplier</span>
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="glass-panel rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{s.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{s.code}</span>
              </div>
              <StatusBadge status={s.risk_rating} />
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400 font-sans">Payment Terms:</span>
                <span className="font-semibold text-slate-100">{s.payment_terms}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400 font-sans">Standard Lead Time:</span>
                <span className="font-semibold text-slate-100">{s.lead_time_days} Days</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400 font-sans">Reliability Score:</span>
                <span className="font-semibold text-emerald-400">
                  {(s.reliability_score * 100).toFixed(0)}% On-Time
                </span>
              </div>
            </div>

            {/* Active Quotes List */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                Active Sourcing Quotations ({s.quotations?.length || 0})
              </span>
              <div className="space-y-1.5">
                {(s.quotations || []).map((q: any) => (
                  <div
                    key={q.id}
                    className="p-2 bg-slate-950/60 rounded border border-slate-800 text-xs font-mono flex items-center justify-between"
                  >
                    <span className="text-slate-300 truncate max-w-[140px] font-sans">
                      {q.material_name || `Material #${q.material_id}`}
                    </span>
                    <span className="font-bold text-emerald-400">
                      ₹{q.quote_price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSupplier}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Add Sourcing Partner</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Supplier Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SUP-STEEL-PUNE"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Company Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mahalaxmi Steel Service Centre"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Commercial Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="sales@mahalaxmisteel.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Lead Time (Days)</label>
                <input
                  type="number"
                  required
                  value={leadTime}
                  onChange={(e) => setLeadTime(parseInt(e.target.value) || 14)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Risk Rating</label>
                <select
                  value={riskRating}
                  onChange={(e) => setRiskRating(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Payment Terms</label>
              <input
                type="text"
                required
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Net 30 / Advance"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
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
                Add Sourcing Partner
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
