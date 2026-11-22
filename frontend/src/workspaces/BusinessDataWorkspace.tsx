import React, { useState, useEffect } from 'react';
import { Products } from '../pages/Products';
import { BOM } from '../pages/BOM';
import { Suppliers } from '../pages/Suppliers';
import { DocumentUpload } from '../pages/DocumentUpload';
import { Reports } from '../pages/Reports';
import { Package, Layers, Truck, FileUp, FileText } from 'lucide-react';

interface BusinessDataWorkspaceProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const BusinessDataWorkspace: React.FC<BusinessDataWorkspaceProps> = ({
  initialTab = 'products',
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
      id: 'products',
      label: 'Products',
      sublabel: 'Catalog & SKUs',
      icon: Package,
      description: 'Manage master products, target prices, margins & inventory linkages',
    },
    {
      id: 'bom',
      label: 'Materials & BOM',
      sublabel: 'Cost Models & Recipes',
      icon: Layers,
      description: 'Multi-tier Bills of Materials, location-specific labour and utility cost additions',
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      sublabel: 'Vendors & Quotes',
      icon: Truck,
      description: 'Vendor database, quotation history, delivery reliability & alternate sourcing',
    },
    {
      id: 'documents',
      label: 'Documents',
      sublabel: 'OCR & Intelligence',
      icon: FileUp,
      description: 'Upload supplier invoices, POs, quotations and specification sheets for automated extraction',
    },
    {
      id: 'reports',
      label: 'Reports & Exports',
      sublabel: 'Dossiers & Audit',
      icon: FileText,
      description: 'Generate and download formal PDF margin dossiers, CSV BOM sheets and full audit logs',
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
                Business Data Workspace
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono font-semibold">
                Master Data & ERP
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Manufacturing master data: products catalog, multi-tier BOMs with labour and rent overheads, vendor quotes, and document intelligence.
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
        {activeTab === 'products' && <Products />}
        {activeTab === 'bom' && <BOM />}
        {activeTab === 'suppliers' && <Suppliers />}
        {activeTab === 'documents' && <DocumentUpload />}
        {activeTab === 'reports' && <Reports />}
      </div>
    </div>
  );
};
