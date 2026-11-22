import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { PreparedDecision } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Info,
  CheckSquare,
  ShieldCheck,
} from 'lucide-react';

export const DecisionCentre: React.FC = () => {
  const { role } = useAuth();
  const [decisions, setDecisions] = useState<PreparedDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDecision, setSelectedDecision] = useState<PreparedDecision | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<PreparedDecision[]>('/decisions/pending');
      setDecisions(data);
      if (data.length > 0) {
        setSelectedDecision(data[0]);
        setEditPrice(data[0].financial_impact_json.suggested_price || 0);
      } else {
        setSelectedDecision(null);
      }
    } catch (e) {
      console.error('Failed to load decisions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'APPROVE' | 'EDIT' | 'REJECT' | 'RECALCULATE') => {
    if (!selectedDecision) return;
    try {
      setIsSubmitting(true);
      const payload: any = {
        action_taken: action,
        comments: comments || `Action ${action} authorized from Executive Decision Centre.`,
      };

      if (action === 'EDIT') {
        payload.edited_payload_json = {
          ...selectedDecision.recommended_action_json,
          new_selling_price: editPrice,
        };
      }

      await apiRequest(`/decisions/${selectedDecision.id}/action`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert(`Decision #${selectedDecision.id} successfully recorded as ${action}!`);
      setComments('');
      setSelectedDecision(null);
      await loadDecisions();
    } catch (e: any) {
      alert('Action failed: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Prepared Decision Dossiers...</span>
        </div>
      </div>
    );
  }

  const isOwner = role === 'business_owner';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* RBAC Role Context Warning if not Business Owner */}
      {!isOwner && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Viewing as <b className="capitalize font-mono">{role.replace('_', ' ')}</b>. Final authorization requires Business Owner sign-off. Switch role in the header to approve.</span>
        </div>
      )}

      {decisions.length === 0 ? (
        <div className="p-16 text-center glass-panel rounded-2xl border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-90 shadow-glow-emerald" />
          <h3 className="text-base font-bold text-slate-100">All Strategic Decision Proposals Cleared</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            No pending proposals require authorization. To test the decision preparation workflow, run a market shock simulation from the Economic Shock Simulator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Decision Cards List (Reference Image 2 Alerts) */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Pending Action Queue</span>
              <span className="text-cyan-400 font-bold">{decisions.length} Actionable</span>
            </div>
            {decisions.map((dec) => {
              const isSelected = selectedDecision?.id === dec.id;
              return (
                <div
                  key={dec.id}
                  onClick={() => {
                    setSelectedDecision(dec);
                    setEditPrice(dec.financial_impact_json.suggested_price || 0);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative ${
                    isSelected
                      ? 'glass-panel-elevated border-cyan-500/50 shadow-glow-cyan hairline-top-cyan'
                      : 'glass-panel border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-850 text-slate-300 border border-slate-700/80">
                      {dec.decision_type.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge status={dec.status} size="sm" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 line-clamp-1">{dec.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{dec.summary}</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                    <span>Confidence: {(dec.confidence_level * 100).toFixed(0)}%</span>
                    <span className="text-rose-400 font-bold">{dec.risk_level} RISK</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Decision Dossier & Human Authorization Gate */}
          {selectedDecision && (
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-6">
              {/* Dossier Header */}
              <div className="border-b border-slate-800/80 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">
                    Dossier #{selectedDecision.id} • {selectedDecision.decision_type}
                  </span>
                  <StatusBadge status={selectedDecision.status} />
                </div>
                <h2 className="text-lg font-bold text-slate-100 mt-1 font-sans">{selectedDecision.title}</h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  {selectedDecision.summary}
                </p>
              </div>

              {/* Rationale & Market Evidence */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Business Rationale & Trigger Event
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{selectedDecision.rationale}</p>
              </div>

              {/* Financial Impact Before vs After */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 font-mono">
                  Deterministic Financial Impact (Before vs After)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Contract Selling Price</span>
                    <span className="text-sm font-bold text-slate-100 tabular-nums mt-0.5 block">
                      ₹{selectedDecision.financial_impact_json.current_price?.toLocaleString() || selectedDecision.financial_impact_json.agreed_price?.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Proposed Price</span>
                    <span className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5 block">
                      ₹{selectedDecision.financial_impact_json.suggested_price?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Margin Before</span>
                    <span className="text-sm font-bold text-slate-100 tabular-nums mt-0.5 block">
                      {selectedDecision.financial_impact_json.margin_before_pct || selectedDecision.financial_impact_json.previous_margin}%
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Shocked Margin</span>
                    <span className="text-sm font-bold text-rose-400 tabular-nums mt-0.5 block">
                      {selectedDecision.financial_impact_json.margin_after_pct || selectedDecision.financial_impact_json.projected_order_margin}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Alternative Strategic Options */}
              {selectedDecision.recommended_action_json?.alternative_options && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                    Alternative Strategic Options Considered
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedDecision.recommended_action_json.alternative_options.map(
                      (opt: string, i: number) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-cyan-400 mt-0.5">•</span>
                          <span>{opt}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* Executive Action Panel */}
              <div className="border-t border-slate-800/80 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                    Executive Decision Authorization
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    Requires Business Owner signature
                  </span>
                </div>

                {/* Edit Price Field */}
                {selectedDecision.decision_type === 'PRICE_ADJUSTMENT' && (
                  <div className="flex items-center space-x-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-300 font-medium">Override Proposed Price (₹):</span>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                      className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 w-36 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[11px] text-slate-400 font-mono">
                      Restores target margin
                    </span>
                  </div>
                )}

                {/* Executive Comments Input */}
                <div>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add executive authorization commentary, board governance reference, or customer renegotiation notes..."
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 h-20 font-sans"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleAction('REJECT')}
                    disabled={isSubmitting || !isOwner}
                    className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition disabled:opacity-50"
                  >
                    Reject Proposal
                  </button>
                  <button
                    onClick={() => handleAction('RECALCULATE')}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition disabled:opacity-50"
                  >
                    Request Recalculation
                  </button>
                  <button
                    onClick={() => handleAction('EDIT')}
                    disabled={isSubmitting || !isOwner}
                    className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 transition disabled:opacity-50"
                  >
                    Approve with Custom Price
                  </button>
                  <button
                    onClick={() => handleAction('APPROVE')}
                    disabled={isSubmitting || !isOwner}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-glow-emerald transition duration-200 disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize Proposal</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
