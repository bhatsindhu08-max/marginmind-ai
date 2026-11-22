import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingDown, ArrowUpRight, DollarSign, Activity } from 'lucide-react';

export const MarginGuard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarginData();
  }, []);

  const loadMarginData = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<any>('/marginguard/overview');
      setData(res);
    } catch (e) {
      console.error('Failed to load MarginGuard data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Running MarginGuard™ Real-Time Telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Overview Cards with Sparklines & Submetrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Monitored Catalog"
          value={data?.total_products || 0}
          subtitle="Active manufactured lines"
          icon={ShieldAlert}
          variant="cyan"
          sparkline={[12, 13, 14, 15, 15, data?.total_products || 16]}
          sparklineColor="cyan"
          submetrics={[
            { label: 'Avg Margin', value: `${data?.average_portfolio_margin || 28.4}%` },
            { label: 'Target Floor', value: '25.0%' },
            { label: 'Coverage', value: '100%' },
          ]}
        />
        <MetricCard
          title="Healthy Margins"
          value={data?.healthy_count || 0}
          subtitle="Gross margin >= 22.0%"
          change="Strong Cushion"
          isPositive={true}
          icon={CheckCircle2}
          variant="emerald"
          sparkline={[8, 9, 10, 11, 10, data?.healthy_count || 12]}
          sparklineColor="emerald"
          submetrics={[
            { label: 'Status', value: 'Stable' },
            { label: 'Share', value: `${Math.round(((data?.healthy_count || 0) / (data?.total_products || 1)) * 100)}%` },
            { label: 'Risk', value: 'None' },
          ]}
        />
        <MetricCard
          title="Warning Zone"
          value={data?.warning_count || 0}
          subtitle="Margin between 16% - 22%"
          change="Thin Cushion"
          isPositive={false}
          icon={AlertTriangle}
          variant="amber"
          sparkline={[3, 2, 4, 3, 2, data?.warning_count || 2]}
          sparklineColor="amber"
          submetrics={[
            { label: 'Watchlist', value: 'Active' },
            { label: 'Action', value: 'Monitor' },
            { label: 'Revisions', value: 'Drafted' },
          ]}
        />
        <MetricCard
          title="Critical Breaches"
          value={data?.critical_count || 0}
          subtitle="Gross margin < 16.0%"
          change={data?.critical_count > 0 ? 'Breach Floor' : 'All Clear'}
          isPositive={data?.critical_count === 0}
          icon={TrendingDown}
          variant={data?.critical_count > 0 ? 'rose' : 'emerald'}
          sparkline={data?.critical_count > 0 ? [1, 2, 2, 3, 2, data?.critical_count] : [2, 1, 0, 0, 0, 0]}
          sparklineColor={data?.critical_count > 0 ? 'rose' : 'emerald'}
          submetrics={[
            { label: 'Floor', value: '16.0%' },
            { label: 'Erosion', value: 'Severe' },
            { label: 'Proposal', value: 'In Queue' },
          ]}
        />
      </div>

      {/* Catalog Margin Table with Visual Progress Bar Decomposition */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Product-Level Margin Health & Suggested Price Recovery
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ranked by margin vulnerability. Target suggested price calculates deterministic price adjustment to restore 25% target margin.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Total Monitored: <span className="text-cyan-400 font-bold">{data?.all_products?.length || 0}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Product Name & SKU</th>
                <th className="py-3.5 px-4 text-right">Selling Price</th>
                <th className="py-3.5 px-4 text-right">Unit Cost</th>
                <th className="py-3.5 px-4 text-right">Gross Profit</th>
                <th className="py-3.5 px-4 min-w-[160px]">Margin Health %</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Material Share</th>
                <th className="py-3.5 px-4 text-right">Suggested Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {(data?.all_products || []).map((p: any) => {
                const marginVal = Number(p.margin_percent);
                const barColor =
                  p.health === 'HEALTHY'
                    ? 'bg-emerald-400'
                    : p.health === 'WARNING'
                    ? 'bg-amber-400'
                    : 'bg-rose-400';

                return (
                  <tr key={p.product_id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-slate-100">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium tabular-nums">
                      ₹{p.selling_price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 tabular-nums">
                      ₹{p.total_cost.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-200 font-medium tabular-nums">
                      ₹{p.gross_profit.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-12 text-right font-bold tabular-nums ${
                          p.health === 'HEALTHY' ? 'text-emerald-400' : p.health === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {p.margin_percent}%
                        </span>
                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${Math.min(Math.max(marginVal * 2.5, 0), 100)}%` }}
                          />
                          {/* 25% target line marker */}
                          <div className="absolute top-0 bottom-0 left-[62.5%] w-0.5 bg-sky-400/80" title="Target: 25%" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      <StatusBadge status={p.health} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 tabular-nums">
                      {p.material_share}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-cyan-300 tabular-nums">
                      ₹{p.suggested_price.toLocaleString()}
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
