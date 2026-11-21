import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingDown, ArrowUpRight, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Running MarginGuard™ Surveillance Engine...</span>
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
              MarginGuard™ Surveillance System
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Continuous Cost Tracking
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time margin erosion detection, threshold breach alarms, and suggested selling-price restorations.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Monitored Catalog"
          value={data?.total_products || 0}
          subtitle="Active manufactured lines"
          icon={ShieldAlert}
        />
        <MetricCard
          title="Healthy Margins"
          value={data?.healthy_count || 0}
          subtitle="Gross margin >= 25.0%"
          isPositive={true}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Warning Zone"
          value={data?.warning_count || 0}
          subtitle="Margin between 16% - 25%"
          change="Tight Cushion"
          isPositive={false}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Critical Breaches"
          value={data?.critical_count || 0}
          subtitle="Gross margin < 16.0%"
          change={data?.critical_count > 0 ? 'CRITICAL RISK' : 'None'}
          isPositive={data?.critical_count === 0}
          icon={TrendingDown}
        />
      </div>

      {/* Catalog Margin Table with Decomposition & Price Adjustment Suggestions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
              Product-Level Margin Health & Recovery Actions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked by margin vulnerability. Target selling price restores desired 25% enterprise profit cushion.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Total Unit Cost</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">Gross Margin %</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Material Share</th>
                <th className="py-3 px-4 text-right">Suggested Target Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {(data?.all_products || []).map((p: any) => (
                <tr key={p.product_id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-slate-100">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium">₹{p.selling_price.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right text-slate-400">₹{p.total_cost.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right text-slate-200">₹{p.gross_profit.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right font-bold">
                    <span
                      className={
                        p.health === 'HEALTHY'
                          ? 'text-emerald-400'
                          : p.health === 'WARNING'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }
                    >
                      {p.margin_percent}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={p.health} />
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400">{p.material_share}%</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                    ₹{p.suggested_price.toLocaleString()}
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
