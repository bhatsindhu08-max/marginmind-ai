import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import { Zap, AlertTriangle, Truck, Clock, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

export const SupplyShock: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShockData();
  }, []);

  const loadShockData = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<any>('/supplyshock/vulnerabilities');
      setData(res);
    } catch (e) {
      console.error('Failed to load SupplyShock data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Scanning Global Supply Chain Shocks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              SupplyShock™ Radar
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-mono">
              Vulnerability Surveillance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time supply disruption monitoring, single-source dependency analysis, and inventory run-out buffer tracking.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Critical Shocks"
          value={data?.critical_shocks_count || 0}
          subtitle="Materials with <15d supply buffer"
          change={data?.critical_shocks_count > 0 ? 'CRITICAL RISK' : 'SECURE'}
          isPositive={data?.critical_shocks_count === 0}
          icon={Zap}
        />
        <MetricCard
          title="Materials Monitored"
          value={data?.materials_monitored || 0}
          subtitle="Connected to active BOMs"
          icon={Layers}
        />
        <MetricCard
          title="Single-Source Risks"
          value={(data?.vulnerabilities || []).filter((v: any) => v.is_single_sourced).length}
          subtitle="Single supplier dependencies"
          icon={Truck}
        />
        <MetricCard
          title="External Events Monitored"
          value={(data?.recent_shocks || []).length}
          subtitle="Trade gazettes & shipping disruptions"
          icon={AlertTriangle}
        />
      </div>

      {/* Recent External Disruption Radar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">
          Verified Supply Disruption Radar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data?.recent_shocks || []).map((ev: any) => (
            <div
              key={ev.id}
              className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-400">{ev.published_date}</span>
                  <StatusBadge status={ev.severity} />
                </div>
                <h3 className="text-xs font-semibold text-slate-200 line-clamp-2">{ev.title}</h3>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>Type: {ev.event_type.replace('_', ' ')}</span>
                <span className="text-amber-400">Impacted</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Internal Material Exposure & Inventory Buffer Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Material Vulnerability & Single-Source Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Days of inventory on hand calculated against active customer order commitments.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Material Name & Category</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4 text-right">30-Day Demand</th>
                <th className="py-3 px-4 text-right">Days of Supply</th>
                <th className="py-3 px-4 text-center">Sourcing Depth</th>
                <th className="py-3 px-4">Primary Sourcing Partner</th>
                <th className="py-3 px-4 text-center">Supply Risk</th>
                <th className="py-3 px-4 text-right">Exposed Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {(data?.vulnerabilities || []).map((v: any) => (
                <tr key={v.material_id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-slate-100">{v.material_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{v.category}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {v.current_stock.toLocaleString()} {v.unit}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400">
                    {v.demand_30d.toLocaleString()} {v.unit}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold">
                    <span
                      className={
                        v.days_of_supply < 15
                          ? 'text-rose-400'
                          : v.days_of_supply < 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {v.days_of_supply > 365 ? '>365d' : `${v.days_of_supply}d`}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {v.is_single_sourced ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-medium">
                        Single Source
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                        {v.supplier_count} Suppliers
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-300">{v.primary_supplier}</td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={v.risk_level} />
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-200">
                    {v.affected_orders_count} Orders
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
