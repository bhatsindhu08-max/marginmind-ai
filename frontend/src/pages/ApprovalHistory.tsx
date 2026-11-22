import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { DecisionApproval } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { History, ShieldCheck, Clock, User, MessageSquare, RefreshCw } from 'lucide-react';

export const ApprovalHistory: React.FC = () => {
  const [history, setHistory] = useState<DecisionApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<DecisionApproval[]>('/decisions/history');
      setHistory(data);
    } catch (e) {
      console.error('Failed to load approval history:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Immutable Governance Trail...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Table Container */}
      {history.length === 0 ? (
        <div className="p-16 text-center glass-panel rounded-2xl border border-slate-800">
          <History className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-slate-200">No Approvals Recorded Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Once business decisions are reviewed and acted upon in the Decision Preparation Centre, their full audit trail will appear here.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Governance & Decision Audit Log
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Complete verifiable audit history of authorized human approvals, custom overrides, and rejections.
              </p>
            </div>
            <button
              onClick={loadHistory}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs rounded-xl border border-slate-700/80 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh Trail</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Decision Dossier</th>
                  <th className="py-3.5 px-4">Authorized By</th>
                  <th className="py-3.5 px-4 text-center">Action Taken</th>
                  <th className="py-3.5 px-4">Executive Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {history.map((app) => (
                  <tr key={app.approval_id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {app.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{app.decision_title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Type: {app.decision_type}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{app.user_name}</div>
                      <div className="text-[10px] text-cyan-400 capitalize font-mono">
                        {(app.user_role || 'business_owner').replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      <StatusBadge status={app.action_taken} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs italic font-sans max-w-xs truncate">
                      "{app.comments || 'No comment provided'}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
