import React, { useState, useEffect } from 'react';
import { Settings } from '../pages/Settings';
import { Onboarding } from '../pages/Onboarding';
import { Sliders, Building, Link2, ExternalLink } from 'lucide-react';

interface SettingsWorkspaceProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const SettingsWorkspace: React.FC<SettingsWorkspaceProps> = ({
  initialTab = 'financial',
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  const tabs = [
    {
      id: 'financial',
      label: 'Financial & OPEX',
      sublabel: 'Overheads & Rates',
      icon: Sliders,
      description: 'Configure facility labour rates, monthly rent, electricity, water & margin alert thresholds',
    },
    {
      id: 'company',
      label: 'Company & Industry',
      sublabel: 'Profiles & Schema',
      icon: Building,
      description: 'Switch between Metal, Textile, Electronics & Food Processing industry configurations',
    },
    {
      id: 'integrations',
      label: 'System Integrations',
      sublabel: 'APIs & ERP Feeds',
      icon: Link2,
      description: 'External Pink Sheet, MCX, WPI, RBI and enterprise ERP synchronization status',
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
                Settings & Enterprise Configuration
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono font-semibold">
                Administration
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enterprise parameters: location overheads (Rent & Water), multi-industry schemas, role-based governance, and API connectivity.
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 p-6">
        {activeTab === 'financial' && <Settings />}
        {activeTab === 'company' && <Onboarding />}
        {activeTab === 'integrations' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <Link2 className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-slate-100">Live External Integrations</h2>
                </div>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  4 Active Connectors
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                MarginMind AI connects with primary statistical databases and exchange feeds to provide automated inflation telemetry.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">World Bank Pink Sheet</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">CONNECTED</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Monthly commodities indices for Steel (HRC), Aluminum, Zinc, Crude Oil and Natural Gas.</p>
                  <div className="text-[10px] text-slate-500 font-mono">Telemetry: Auto-sync on 5th of each month</div>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">Ministry of Commerce & Industry (WPI)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">CONNECTED</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Wholesale Price Index series for Basic Metals, Textiles, Chemicals and Food Products.</p>
                  <div className="text-[10px] text-slate-500 font-mono">Telemetry: Live MoCI data feed integration</div>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">Reserve Bank of India (RBI) Forex</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">CONNECTED</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Daily reference exchange rates for USD/INR, EUR/INR and import duty calculation baselines.</p>
                  <div className="text-[10px] text-slate-500 font-mono">Telemetry: Daily spot rates updated at 13:00 IST</div>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">ERP & Production Connector</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">READY</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Bi-directional connector for SAP, Oracle NetSuite, Tally Prime and CSV/JSON production drops.</p>
                  <div className="text-[10px] text-slate-500 font-mono">Status: REST Webhooks & SFTP Poller Ready</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
