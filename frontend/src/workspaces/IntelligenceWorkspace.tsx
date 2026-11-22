import React, { useState, useEffect } from 'react';
import { OrderSure } from '../pages/OrderSure';
import { MarginGuard } from '../pages/MarginGuard';
import { ScenarioSimulator } from '../pages/ScenarioSimulator';
import { PriceSimulation } from '../pages/PriceSimulation';
import { Forecasting } from '../pages/Forecasting';
import { SupplyShock } from '../pages/SupplyShock';
import { MarketIntelligence } from '../pages/MarketIntelligence';
import { ProductViability } from '../pages/ProductViability';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  Sliders,
  TrendingUp,
  AlertTriangle,
  Globe2,
  LineChart,
} from 'lucide-react';

interface IntelligenceWorkspaceProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
  onNavigateGlobal?: (destination: string, subTab?: string) => void;
}

export const IntelligenceWorkspace: React.FC<IntelligenceWorkspaceProps> = ({
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
      label: 'Order Feasibility',
      sublabel: 'OrderSure',
      icon: ShieldCheck,
      description: 'Stress-test incoming and open customer purchase orders against spot delivery costs & runway',
    },
    {
      id: 'margin',
      label: 'Margin Surveillance',
      sublabel: 'MarginGuard',
      icon: ShieldAlert,
      description: 'Continuous portfolio margin tracking, cost breakdown, erosion detection & price recovery',
    },
    {
      id: 'shocks',
      label: 'What-If Shocks',
      sublabel: 'Macro Stress',
      icon: Zap,
      description: 'Simulate tariff changes, energy spikes, wage hikes, and commodity price surges across products',
    },
    {
      id: 'pricing',
      label: 'Pricing Simulator',
      sublabel: 'Elasticity Engine',
      icon: Sliders,
      description: 'Analyze volume trade-offs, price elasticity curves and profit-maximizing price points',
    },
    {
      id: 'forecasting',
      label: 'Cost Forecasting',
      sublabel: 'Multi-Horizon',
      icon: TrendingUp,
      description: 'Econometric projections across 4 time horizons and 3 economic inflation scenarios',
    },
    {
      id: 'supply',
      label: 'Supply Risk Radar',
      sublabel: 'SupplyShock',
      icon: AlertTriangle,
      description: 'Single-source dependency, inventory run-out buffers, alternate quotes & disruption radar',
    },
    {
      id: 'market',
      label: 'Market Signals',
      sublabel: 'Commodity Indices',
      icon: Globe2,
      description: 'Official commodity benchmarks (MCX, LME, World Bank Pink Sheet) and WPI inflation feeds',
    },
    {
      id: 'viability',
      label: 'Break-Even Economics',
      sublabel: 'Unit Economics',
      icon: LineChart,
      description: 'Contribution margins, break-even unit volumes & product lifecycle pathways',
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
                Intelligence & Simulation Workspace
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono font-semibold">
                Predictive & Stress Engines
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Unified financial analysis: order viability gatekeeping, live product margin surveillance, what-if macro shocks, price elasticity, and market commodity telemetry.
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
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-slate-850 text-slate-400'
                  }`}
                >
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
        {activeTab === 'margin' && <MarginGuard />}
        {activeTab === 'shocks' && (
          <ScenarioSimulator
            onNavigate={(dest) => (onNavigateGlobal ? onNavigateGlobal(dest) : undefined)}
          />
        )}
        {activeTab === 'pricing' && <PriceSimulation />}
        {activeTab === 'forecasting' && <Forecasting />}
        {activeTab === 'supply' && <SupplyShock />}
        {activeTab === 'market' && <MarketIntelligence />}
        {activeTab === 'viability' && <ProductViability />}
      </div>
    </div>
  );
};
