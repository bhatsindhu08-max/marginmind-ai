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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Prepared Decision Dossiers...</span>
        </div>
      </div>
    );
  }

  const isOwner = role === 'business_owner';

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Decision Preparation Centre
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Human-in-the-Loop Governance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evidence-backed business proposals prepared from market volatility for authorized human approval.
          </p>
        </div>
        {!isOwner && (
          <div className="p-2.5 bg-amber-950/60 border border-amber-800/60 rounded-lg text-amber-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Viewing as {role.replace('_', ' ')}. Approval authority requires Business Owner role.</span>
          </div>
        )}
      </div>

      {decisions.length === 0 ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-semibold text-slate-100">All Decision Proposals Cleared</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            No pending proposals require review. To test the decision preparation workflow, run a market shock simulation from the Macro Simulator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Decision Cards List */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Pending Action Proposals ({decisions.length})
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
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-850 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {dec.decision_type.replace('_', ' ')}
                    </span>
                    <StatusBadge status={dec.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">{dec.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{dec.summary}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                    <span>Confidence: {(dec.confidence_level * 100).toFixed(0)}%</span>
                    <span className="text-rose-400 font-semibold">{dec.risk_level} RISK</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Decision Dossier & Human Approval Gate */}
          {selectedDecision && (
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              {/* Dossier Header */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                    Dossier #{selectedDecision.id} • {selectedDecision.decision_type}
                  </span>
                  <StatusBadge status={selectedDecision.status} />
                </div>
                <h2 className="text-lg font-bold text-slate-100 mt-1">{selectedDecision.title}</h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  {selectedDecision.summary}
                </p>
              </div>

              {/* Rationale & Market Evidence */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Business Rationale & Trigger Event
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedDecision.rationale}</p>
              </div>

              {/* Financial Impact Before vs After */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Deterministic Financial Impact (Before vs After)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Current Selling Price</span>
                    <span className="text-sm font-bold text-slate-100">
                      ₹{selectedDecision.financial_impact_json.current_price?.toLocaleString() || selectedDecision.financial_impact_json.agreed_price?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Proposed Price</span>
                    <span className="text-sm font-bold text-emerald-400">
                      ₹{selectedDecision.financial_impact_json.suggested_price?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Margin Before</span>
                    <span className="text-sm font-bold text-slate-100">
                      {selectedDecision.financial_impact_json.margin_before_pct || selectedDecision.financial_impact_json.previous_margin}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Shocked Margin</span>
                    <span className="text-sm font-bold text-rose-400">
                      {selectedDecision.financial_impact_json.margin_after_pct || selectedDecision.financial_impact_json.projected_order_margin}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Alternative Strategic Options */}
              {selectedDecision.recommended_action_json?.alternative_options && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Alternative Strategic Options Considered
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedDecision.recommended_action_json.alternative_options.map(
                      (opt: string, i: number) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{opt}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* Executive Action Panel */}
              <div className="border-t border-slate-800 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Executive Decision Authorization
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Requires Business Owner signature
                  </span>
                </div>

                {/* Edit Price Field */}
                {selectedDecision.decision_type === 'PRICE_ADJUSTMENT' && (
                  <div className="flex items-center space-x-4 p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-300 font-medium">Override Proposed Price (₹):</span>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm font-mono text-slate-100 w-32 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs text-slate-400 font-mono">
                      Restores target margin
                    </span>
                  </div>
                )}

                {/* Executive Comments Input */}
                <div>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add executive authorization commentary, board reference, or customer renegotiation notes..."
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-700 h-20"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleAction('REJECT')}
                    disabled={isSubmitting || !isOwner}
                    className="px-4 py-2 bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs font-medium rounded-lg border border-rose-800/80 transition disabled:opacity-50"
                  >
                    Reject Proposal
                  </button>
                  <button
                    onClick={() => handleAction('RECALCULATE')}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition disabled:opacity-50"
                  >
                    Request Recalculation
                  </button>
                  <button
                    onClick={() => handleAction('EDIT')}
                    disabled={isSubmitting || !isOwner}
                    className="px-4 py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-xs font-semibold rounded-lg border border-amber-700/80 transition disabled:opacity-50"
                  >
                    Approve with Custom Price
                  </button>
                  <button
                    onClick={() => handleAction('APPROVE')}
                    disabled={isSubmitting || !isOwner}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5"
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
