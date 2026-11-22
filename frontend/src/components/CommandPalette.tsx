import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Sparkles,
  ShieldAlert,
  Zap,
  TrendingUp,
  LineChart,
  Globe2,
  Calculator,
  CheckCircle2,
  Percent,
  Flame,
  Database,
  Package,
  Layers,
  Truck,
  FileText,
  CheckSquare,
  History,
  Sliders,
  Building2,
  Users,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  X,
} from 'lucide-react';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (workspace: string, tab?: string) => void;
}

interface SearchEntry {
  title: string;
  category: string;
  keywords: string;
  workspace: string;
  tab?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchEntries: SearchEntry[] = [
    // 1. Overview
    {
      title: 'Executive Dashboard',
      category: 'Overview',
      keywords: 'home dashboard kpi portfolio overview telemetry margin monitored risk',
      workspace: 'overview',
      tab: 'dashboard',
      icon: LayoutDashboard,
      description: 'High-level executive metrics, margin health, open orders & market events',
    },

    // 2. Intelligence Workspace
    {
      title: 'Margin Health (MarginGuard™)',
      category: 'Intelligence',
      keywords: 'margin erosion marginguard threshold cost price increase recovery',
      workspace: 'intelligence',
      tab: 'margin',
      icon: ShieldAlert,
      description: 'Product-level margin tracking, erosion alerts, and price recovery proposals',
    },
    {
      title: 'Supply Risks (SupplyShock™ Radar)',
      category: 'Intelligence',
      keywords: 'supply shock supplyshock vendor inventory buffer single source risk days stock',
      workspace: 'intelligence',
      tab: 'supply',
      icon: Zap,
      description: 'Single-source dependencies, run-out buffers, and commodity supply risks',
    },
    {
      title: 'Multi-Horizon Forecasting',
      category: 'Intelligence',
      keywords: 'forecast forecasting horizon scenarios econometric predictive models 1-3 years',
      workspace: 'intelligence',
      tab: 'forecasting',
      icon: TrendingUp,
      description: 'Raw material and product margin projections across 4 horizons & 3 scenarios',
    },
    {
      title: 'Product Viability & Lifecycle',
      category: 'Intelligence',
      keywords: 'viability lifecycle break even contribution margin continue discontinue',
      workspace: 'intelligence',
      tab: 'viability',
      icon: LineChart,
      description: 'Long-term product profitability, volume break-even & strategic pathways',
    },
    {
      title: 'Market Signals & Economic Indices',
      category: 'Intelligence',
      keywords: 'market commodities benchmark pink sheet lme mcx cotton copper wpi rbi forex',
      workspace: 'intelligence',
      tab: 'market',
      icon: Globe2,
      description: 'Real-time upstream commodity benchmarks, RBI forex rates & WPI index feeds',
    },

    // 3. Analysis & Simulation Workspace
    {
      title: 'Order Evaluation (OrderSure™)',
      category: 'Analysis & Simulation',
      keywords: 'orders ordersure commitments customer gatekeeper contract feasibility stress test',
      workspace: 'analysis',
      tab: 'orders',
      icon: CheckCircle2,
      description: 'Evaluate customer orders against spot commodity inflation & 18% stress shift',
    },
    {
      title: 'Pricing Simulator (Elasticity)',
      category: 'Analysis & Simulation',
      keywords: 'pricing price elasticity recovery margin sensitivity volume curve profit',
      workspace: 'analysis',
      tab: 'pricing',
      icon: Percent,
      description: 'Simulate selling price adjustments and profit sensitivity curves',
    },
    {
      title: 'Economic Shock Simulator (Macro)',
      category: 'Analysis & Simulation',
      keywords: 'macro shock economic simulator bom propagation stress scenario inflation',
      workspace: 'analysis',
      tab: 'scenarios',
      icon: Flame,
      description: 'Simulate external commodity shocks propagated across multi-tier BOMs',
    },

    // 4. Business Data Workspace
    {
      title: 'Products Master Catalog & Wages',
      category: 'Business Data',
      keywords: 'products sku catalog worker wage labour crew cost breakdown output capacity',
      workspace: 'data',
      tab: 'products',
      icon: Package,
      description: 'Manage finished goods, line worker crew headcount, daily wages & costs',
    },
    {
      title: 'Materials & BOM Recipes',
      category: 'Business Data',
      keywords: 'bom materials recipes landed cost auto-fetch market price freight basis hub',
      workspace: 'data',
      tab: 'bom',
      icon: Layers,
      description: 'BOM structures, landed material costs, and auto-fetch market benchmark prices',
    },
    {
      title: 'Suppliers & Vendor Quotations',
      category: 'Business Data',
      keywords: 'suppliers vendor rfq quotes delivery lead time moq single source reliability',
      workspace: 'data',
      tab: 'suppliers',
      icon: Truck,
      description: 'Supplier directory, quotation validity, lead times, and vendor reliability',
    },
    {
      title: 'Document Intelligence & OCR',
      category: 'Business Data',
      keywords: 'documents upload ocr invoice quotation extraction pdf xlsx csv provenance',
      workspace: 'data',
      tab: 'documents',
      icon: FileText,
      description: 'Upload invoices, BOMs & quotes with LLM-based structured OCR extraction',
    },
    {
      title: 'Reports & Export Dossiers',
      category: 'Business Data',
      keywords: 'reports exports pdf excel board memo financial model dossier download',
      workspace: 'data',
      tab: 'reports',
      icon: FileSpreadsheet,
      description: 'Generate formal PDF executive board memos and complete Excel financial models',
    },

    // 5. Settings Workspace
    {
      title: 'Plant OPEX & Utilities (Rent & Water)',
      category: 'Settings',
      keywords: 'rent water bill power electricity utilities plant opex overhead absorption rate',
      workspace: 'settings',
      tab: 'financial',
      icon: Sliders,
      description: 'Configure monthly factory rent, water bills, electricity & per-unit overhead',
    },
    {
      title: 'Multi-Industry Architecture',
      category: 'Settings',
      keywords: 'industry onboarding templates metal steel textile cloth garments electronics food',
      workspace: 'settings',
      tab: 'company',
      icon: Building2,
      description: 'Switch and configure industry presets: Metal, Textile, Electronics, Food',
    },
    {
      title: 'External Data Feed Connectors',
      category: 'Settings',
      keywords: 'integrations connectors api world bank rbi forex wpi feeds telemetry',
      workspace: 'settings',
      tab: 'integrations',
      icon: Database,
      description: 'Live upstream connection health for official economic & commodity datasets',
    },
  ];

  const filtered = query.trim()
    ? searchEntries.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.keywords.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      })
    : searchEntries;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global hotkey: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent
        }
      }
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filtered[selectedIndex]) {
            handleSelect(filtered[selectedIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  const handleSelect = (item: SearchEntry) => {
    onNavigate(item.workspace, item.tab);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl glass-panel-elevated border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh] hairline-top-cyan">
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workspaces, intelligence tools, products, bills, actions... (↑↓ to navigate)"
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 ml-2">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching feature found for "{query}". Try searching for <span className="text-emerald-400 font-mono">margin</span>, <span className="text-emerald-400 font-mono">rent</span>, <span className="text-emerald-400 font-mono">bom</span>, or <span className="text-emerald-400 font-mono">orders</span>.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${item.workspace}-${item.tab}-${item.title}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/30 text-slate-100'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-100 flex items-center space-x-2">
                        <span className="truncate">{item.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono flex-shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 ml-2 flex-shrink-0 ${
                      isSelected ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/80 text-[10px] text-slate-500 flex items-center justify-between font-mono">
          <span>Navigate with ↑ and ↓ • Press Enter to open</span>
          <span>6 Workspaces • 19 Functional Modules</span>
        </div>
      </div>
    </div>
  );
};
