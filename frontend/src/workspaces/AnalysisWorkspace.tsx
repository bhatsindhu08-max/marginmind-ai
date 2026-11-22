import React, { useState, useEffect } from 'react';
import { OrderSure } from '../pages/OrderSure';
import { PriceSimulation } from '../pages/PriceSimulation';
import { ScenarioSimulator } from '../pages/ScenarioSimulator';
import { ShieldCheck, Sliders, Zap } from 'lucide-react';

interface AnalysisWorkspaceProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
  onNavigateGlobal?: (destination: string, subTab?: string) => void;
}

export const AnalysisWorkspace: React.FC<AnalysisWorkspaceProps> = ({
  initialTab = 'orders',
  onTabChange,
  onNavigateGlobal,
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
      id: 'orders',
      label: 'Order Evaluation',
      sublabel: 'OrderSure Gatekeeper',
      icon: ShieldCheck,
      description: 'Stress-test incoming and open customer orders against delivered spot costs',
    },
    {
      id: 'pricing',
      label: 'Pricing Simulator',
      sublabel: 'Elasticity Engine',
      icon: Sliders,
      description: 'Analyze volume trade-offs, price elasticity and optimal profit margins',
    },
    {
      id: 'shocks',
      label: 'Economic Shock Simulator',
      sublabel: 'Macro Stress-Testing',
      icon: Zap,
      description: 'Simulate tariff changes, energy spikes, wage hikes and commodity price surges',
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
                Analysis & Simulation Workspace
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono font-semibold">
                Decision Preparation Engines
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic simulations: customer RFQ gatekeeping, price elasticity curves, and macro economic shock testing.
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
        {activeTab === 'orders' && <OrderSure />}
        {activeTab === 'pricing' && <PriceSimulation />}
        {activeTab === 'shocks' && (
          <ScenarioSimulator
            onNavigate={(dest) => (onNavigateGlobal ? onNavigateGlobal(dest) : undefined)}
          />
        )}
      </div>
    </div>
  );
};
