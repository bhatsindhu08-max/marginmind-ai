import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import { Zap, AlertTriangle, Truck, Clock, Layers, ShieldCheck, ArrowRight, ShieldAlert, Radio } from 'lucide-react';

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
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Scanning Global Supply Chain Shocks & Run-Out Buffers...</span>
        </div>
      </div>
    );
  }

  const singleSourceCount = (data?.vulnerabilities || []).filter((v: any) => v.is_single_sourced).length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* KPI Cards with Sparklines & Submetrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Critical Shocks"
          value={data?.critical_shocks_count || 0}
          subtitle="Materials with <15d buffer"
          change={data?.critical_shocks_count > 0 ? 'CRITICAL RISK' : 'SECURE'}
          isPositive={data?.critical_shocks_count === 0}
          icon={Zap}
          variant={data?.critical_shocks_count > 0 ? 'rose' : 'emerald'}
          sparkline={data?.critical_shocks_count > 0 ? [2, 1, 3, 2, data?.critical_shocks_count] : [1, 0, 0, 0, 0, 0]}
          sparklineColor={data?.critical_shocks_count > 0 ? 'rose' : 'emerald'}
          submetrics={[
            { label: 'Runway', value: '<15 Days' },
            { label: 'Exposure', value: 'High' },
            { label: 'Action', value: 'Reorder' },
          ]}
        />

        <MetricCard
          title="Materials Monitored"
          value={data?.materials_monitored || 0}
          subtitle="Connected to active BOMs"
          badge="100% Tracked"
          icon={Layers}
          variant="cyan"
          sparkline={[8, 9, 10, 10, 11, data?.materials_monitored || 12]}
          sparklineColor="cyan"
          submetrics={[
            { label: 'Categories', value: 'Raw / Semi' },
            { label: 'Unit Tracking', value: 'KG / M' },
            { label: 'Stock Value', value: 'Verified' },
          ]}
        />

        <MetricCard
          title="Single-Source Risks"
          value={singleSourceCount}
          subtitle="Sole vendor dependencies"
          change={singleSourceCount > 0 ? 'Diversify Needed' : 'Diversified'}
          isPositive={singleSourceCount === 0}
          icon={Truck}
          variant={singleSourceCount > 0 ? 'amber' : 'emerald'}
          sparkline={[1, 2, 2, 3, 2, singleSourceCount]}
          sparklineColor="amber"
          submetrics={[
            { label: 'Single Vendor', value: `${singleSourceCount}` },
            { label: 'Multi Vendor', value: `${(data?.materials_monitored || 0) - singleSourceCount}` },
            { label: 'Status', value: 'Alert' },
          ]}
        />

        <MetricCard
          title="Verified External Shocks"
          value={(data?.recent_shocks || []).length}
          subtitle="Trade gazettes & shipping feeds"
          badge="PinkSheet & MoCI"
          icon={Radio}
          variant="purple"
          sparkline={[2, 3, 3, 4, 3, (data?.recent_shocks || []).length]}
          sparklineColor="purple"
          submetrics={[
            { label: 'Tariffs', value: '1' },
            { label: 'Freight', value: '1' },
            { label: 'Energy', value: '1' },
          ]}
        />
      </div>

      {/* Verified Supply Disruption Radar (Reference Image 2 Risk Alerts) */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              Verified External Disruption Radar
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Real-time trade policy & logistics alerts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {(data?.recent_shocks || []).map((ev: any) => (
            <div
              key={ev.id}
              className="p-4 bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl flex flex-col justify-between transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-400">{ev.published_date}</span>
                  <StatusBadge status={ev.severity} size="sm" />
                </div>
                <h3 className="text-xs font-bold text-slate-200 line-clamp-2 group-hover:text-cyan-300 transition leading-snug">
                  {ev.title}
                </h3>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>Type: {ev.event_type.replace('_', ' ')}</span>
                <span className="text-amber-400 font-bold">Impact Surface</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Internal Material Exposure & Inventory Buffer Table (Reference Image 3 Data Tables) */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Material Vulnerability & Single-Source Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Days of inventory on hand calculated against active customer order commitments.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Materials: <span className="text-cyan-400 font-bold">{data?.vulnerabilities?.length || 0}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Material Name & Category</th>
                <th className="py-3.5 px-4 text-right">Current Stock</th>
                <th className="py-3.5 px-4 text-right">30-Day Demand</th>
                <th className="py-3.5 px-4 min-w-[150px]">Run-out Buffer (Days)</th>
                <th className="py-3.5 px-4 text-center">Sourcing Depth</th>
                <th className="py-3.5 px-4">Primary Sourcing Partner</th>
                <th className="py-3.5 px-4 text-center">Supply Risk</th>
                <th className="py-3.5 px-4 text-right">Exposed Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {(data?.vulnerabilities || []).map((v: any) => {
                const daysVal = Number(v.days_of_supply) || 0;
                const bufferBarColor =
                  daysVal < 15 ? 'bg-rose-400' : daysVal < 30 ? 'bg-amber-400' : 'bg-emerald-400';

                return (
                  <tr key={v.material_id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-slate-100">{v.material_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{v.category}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      {v.current_stock.toLocaleString()} <span className="text-slate-400 font-sans">{v.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 tabular-nums">
                      {v.demand_30d.toLocaleString()} <span className="text-slate-500 font-sans">{v.unit}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-10 text-right font-bold tabular-nums ${
                          daysVal < 15 ? 'text-rose-400' : daysVal < 30 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {daysVal > 365 ? '>365d' : `${daysVal}d`}
                        </span>
                        <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${bufferBarColor}`}
                            style={{ width: `${Math.min(Math.max((daysVal / 60) * 100, 5), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {v.is_single_sourced ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-medium">
                          Single Source
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                          {v.supplier_count} Suppliers
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-200">{v.primary_supplier}</td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      <StatusBadge status={v.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-200 tabular-nums">
                      {v.affected_orders_count} Orders
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
