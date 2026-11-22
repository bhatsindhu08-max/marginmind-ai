import React, { useState, useEffect } from 'react';
import { DecisionCentre } from '../pages/DecisionCentre';
import { ApprovalHistory } from '../pages/ApprovalHistory';
import { apiRequest } from '../api/client';
import { CheckSquare, History, ShieldAlert } from 'lucide-react';

interface DecisionWorkspaceProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
  pendingCount?: number;
}

export const DecisionWorkspace: React.FC<DecisionWorkspaceProps> = ({
  initialTab = 'pending',
  onTabChange,
  pendingCount: initialPendingCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [pendingCount, setPendingCount] = useState<number>(initialPendingCount);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
    loadPendingCount();
  }, [initialTab]);

  const loadPendingCount = async () => {
    try {
      const data = await apiRequest<any[]>('/decisions/pending');
      if (Array.isArray(data)) {
        setPendingCount(data.length);
      }
    } catch {
      // ignore
    }
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  const tabs = [
    {
      id: 'pending',
      label: 'Pending Decisions',
      sublabel: 'Action Queue',
      icon: CheckSquare,
      badge: pendingCount > 0 ? `${pendingCount}` : undefined,
      badgeColor: 'rose',
      description: 'Review AI-prepared proposals, financial impact analysis and authorize recommendations',
    },
    {
      id: 'history',
      label: 'Decision History',
      sublabel: 'Audit Trail',
      icon: History,
      description: 'Immutable historical record of authorized proposals, approver timestamps and execution feedback',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col">
      {/* Workspace Header & Horizontal Tab Bar */}
      <div className="bg-[#0c1424]/90 backdrop-blur-md border-b border-slate-800/80 px-6 pt-5 pb-0 sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-cyan" />
              <h1 className="text-xl font-bold text-slate-100 tracking-tight font-sans">
                Decision Centre
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono font-semibold">
                Governance & Sign-Off
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic decision preparation: AI-formulated proposals with financial justifications, multi-signature authorizations, and complete audit history.
            </p>
          </div>
        </div>

        {/* Clean Horizontal Tabs */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar border-b border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-500/10 shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title={tab.description}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-850 text-slate-400'
                }`}>
                  {tab.sublabel}
                </span>

                {tab.badge && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 p-6">
        {activeTab === 'pending' && <DecisionCentre />}
        {activeTab === 'history' && <ApprovalHistory />}
      </div>
    </div>
  );
};
