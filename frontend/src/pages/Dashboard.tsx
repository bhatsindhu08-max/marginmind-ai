import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  Package,
  ShieldAlert,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [marginData, setMarginData] = useState<any>(null);
  const [marketSummary, setMarketSummary] = useState<any[]>([]);
  const [pendingDecisions, setPendingDecisions] = useState<any[]>([]);
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [margins, mkt, decisions, orders] = await Promise.all([
        apiRequest<any>('/marginguard/overview'),
        apiRequest<any[]>('/market/summary'),
        apiRequest<any[]>('/decisions/pending'),
        apiRequest<any[]>('/ordersure/open-orders'),
      ]);
      setMarginData(margins);
      setMarketSummary(mkt);
      setPendingDecisions(decisions);
      setOpenOrders(orders);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Aggregating Financial Telemetry...</span>
        </div>
      </div>
    );
  }

  const chartData = (marginData?.all_products || []).map((p: any) => ({
    name: p.name.length > 18 ? p.name.substring(0, 18) + '...' : p.name,
    CurrentMargin: p.margin_percent,
    TargetMargin: p.target_margin,
    CriticalThreshold: p.critical_threshold,
  }));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Financial Command Centre
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time margin surveillance, external shock propagation, and decision preparation.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('scenarios')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Market Shock</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monitored Products"
          value={marginData?.total_products || 0}
          subtitle="100% BOM verified"
          icon={Package}
        />
        <MetricCard
          title="Products at Risk"
          value={marginData?.critical_count + marginData?.warning_count || 0}
          subtitle={`${marginData?.critical_count || 0} Breaching critical threshold`}
          change={marginData?.critical_count > 0 ? 'CRITICAL' : 'STABLE'}
          isPositive={marginData?.critical_count === 0}
          icon={ShieldAlert}
        />
        <MetricCard
          title="Portfolio Avg Margin"
          value={`${marginData?.average_portfolio_margin || 0}%`}
          subtitle="Target threshold: 25.0%"
          change="+1.2%"
          isPositive={true}
          icon={TrendingUp}
        />
        <MetricCard
          title="Pending Decisions"
          value={pendingDecisions.length}
          subtitle="Requires human executive approval"
          change={pendingDecisions.length > 0 ? 'Action Needed' : 'Up to Date'}
          isPositive={pendingDecisions.length === 0}
          icon={CheckCircle2}
        />
      </div>

      {/* Active Market Indicators Radar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
              External Market Benchmarks & Commodity Indices
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live feeds from World Bank Pink Sheet, RBI Exchange Rates, and MoCI WPI Basic Metals.
            </p>
          </div>
          <button
            onClick={() => onNavigate('market')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-medium"
          >
            <span>View Full Market Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketSummary.map((ind) => (
            <div
              key={ind.code}
              className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  {ind.code}
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5 line-clamp-1">
                  {ind.name}
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-lg font-bold font-mono text-slate-100">
                  {ind.currency === 'USD' ? '$' : '₹'}
                  {ind.latest_value.toLocaleString()}
                </div>
                <div
                  className={`text-xs font-mono font-medium flex items-center ${
                    ind.change_percent >= 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {ind.change_percent >= 0 ? '+' : ''}
                  {ind.change_percent}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Margin Health Distribution & Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Margins Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                Product Margin Surveillance
              </h2>
              <p className="text-xs text-slate-400">Current Margin % vs Target (25%) & Threshold (16%)</p>
            </div>
            <button
              onClick={() => onNavigate('marginguard')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              MarginGuard™ Details
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="CurrentMargin" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TargetMargin" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Pending Decision Action Dossier */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pending Approvals</span>
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {pendingDecisions.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              AI-prepared recommendations awaiting authorized human executive decision.
            </p>

            <div className="space-y-3">
              {pendingDecisions.slice(0, 3).map((dec) => (
                <div
                  key={dec.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {dec.title}
                    </span>
                    <StatusBadge status={dec.status} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{dec.summary}</p>
                </div>
              ))}
              {pendingDecisions.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
                  No pending proposals. All margins protected.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('decisions')}
            className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center justify-center space-x-1"
          >
            <span>Open Decision Preparation Centre</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Open Orders Requiring Review */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
              Order Feasibility Gatekeeper (OrderSure™)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous evaluation of open commitments against spot commodity inflation.
            </p>
          </div>
          <button
            onClick={() => onNavigate('ordersure')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            OrderSure™ Simulator
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Order #</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4 text-right">Quantity</th>
                <th className="py-2.5 px-4 text-right">Contract Price</th>
                <th className="py-2.5 px-4 text-right">Current Margin</th>
                <th className="py-2.5 px-4 text-right">Stress Margin</th>
                <th className="py-2.5 px-4 text-center">OrderSure Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {openOrders.map((ord) => (
                <tr key={ord.order_number} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-100">{ord.order_number}</td>
                  <td className="py-3 px-4 font-sans text-slate-300">{ord.customer_name}</td>
                  <td className="py-3 px-4 font-sans text-slate-300">{ord.product_name}</td>
                  <td className="py-3 px-4 text-right">{ord.order_quantity}</td>
                  <td className="py-3 px-4 text-right">₹{ord.agreed_unit_price.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">
                    {ord.current_margin_percent}%
                  </td>
                  <td className="py-3 px-4 text-right text-amber-400">
                    {ord.stress_margin_percent}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={ord.recommendation} />
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
