import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { DecisionApproval } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { History, ShieldCheck, Clock, User, MessageSquare } from 'lucide-react';

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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Immutable Governance Trail...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Governance & Decision Audit Log
          </h1>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            Immutable Ledger
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Complete verifiable audit history of authorized human approvals, edits, and rejections.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <History className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-slate-200">No Approvals Recorded Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Once business decisions are reviewed and acted upon in the Decision Preparation Centre, their full audit trail will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Decision Dossier</th>
                  <th className="py-3 px-4">Authorized By</th>
                  <th className="py-3 px-4 text-center">Action Taken</th>
                  <th className="py-3 px-4">Executive Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {history.map((app) => (
                  <tr key={app.approval_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {app.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{app.decision_title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Type: {app.decision_type}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{app.user_name}</div>
                      <div className="text-[10px] text-emerald-400 capitalize font-mono">
                        {app.user_role.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={app.action_taken} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-md">
                      <div className="flex items-start space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{app.comments || 'No comments recorded.'}</span>
                      </div>
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
