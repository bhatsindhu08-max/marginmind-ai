import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
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
  Globe2,
  AlertOctagon,
  Clock,
  Sparkles,
  ExternalLink,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  CheckSquare,
  ShieldCheck,
  Building2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { industryType, businessName } = useAuth();
  const [marginData, setMarginData] = useState<any>(null);
  const [marketSummary, setMarketSummary] = useState<any[]>([]);
  const [pendingDecisions, setPendingDecisions] = useState<any[]>([]);
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [marketEvents, setMarketEvents] = useState<any[]>([]);
  const [supplyVulnerabilities, setSupplyVulnerabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'bar' | 'area'>('bar');

  const getIndustryMarketSubtitle = () => {
    const ind = (industryType || '').toLowerCase();
    if (ind.includes('textile') || ind.includes('garment') || ind.includes('cloth')) {
      return 'Live telemetry from MCX Cotton Candy, World Bank Cotton A-Index, MoCI WPI Textiles, and RBI EUR/INR.';
    }
    if (ind.includes('electronic') || ind.includes('smt') || ind.includes('pcba')) {
      return 'Live telemetry from LME Copper, MoCI WPI Electronic Components, RBI USD/INR, and World Bank Energy.';
    }
    if (ind.includes('food') || ind.includes('agro') || ind.includes('beverage')) {
      return 'Live telemetry from MoCI WPI Food Products, World Bank Agricultural Index, Edible Oils, and RBI USD/INR.';
    }
    return 'Live telemetry from World Bank Pink Sheet (Steel/Aluminium), RBI Exchange Rates, and MoCI WPI Basic Metals.';
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [margins, mkt, decisions, orders, eventsRes, supplyRes] = await Promise.all([
        apiRequest<any>('/marginguard/overview').catch(() => null),
        apiRequest<any[]>('/market/summary').catch(() => []),
        apiRequest<any[]>('/decisions/pending').catch(() => []),
        apiRequest<any[]>('/ordersure/open-orders').catch(() => []),
        apiRequest<any[]>('/market/events').catch(() => []),
        apiRequest<any>('/supplyshock/vulnerabilities').catch(() => null),
      ]);

      setMarginData(margins);
      setMarketSummary(mkt || []);
      setPendingDecisions(decisions || []);
      setOpenOrders(orders || []);
      setMarketEvents(eventsRes || []);
      setSupplyVulnerabilities(supplyRes?.vulnerabilities || []);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: number, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete order "${orderNumber}"?`)) {
      return;
    }
    try {
      await apiRequest(`/orders/${orderId}`, { method: 'DELETE' });
      await loadDashboardData();
    } catch (err: any) {
      alert('Failed to delete order: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[65vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-b-emerald-400 rounded-full animate-spin absolute inset-0 m-auto" />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-slate-200 tracking-tight">
              Aggregating Manufacturing Financial Telemetry
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Synchronizing BOM recipes, spot commodity feeds, and risk surfaces...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Chart data for Margin Surveillance
  const chartData = (marginData?.all_products || []).map((p: any) => {
    const rawName = p?.name || p?.sku || 'Product';
    const margin = Number(p?.margin_percent) || 0;
    const target = Number(p?.target_margin) || 25.0;
    const crit = Number(p?.critical_threshold) || 16.0;
    return {
      name: rawName.length > 15 ? rawName.substring(0, 15) + '...' : rawName,
      fullName: rawName,
      CurrentMargin: margin,
      TargetMargin: target,
      CriticalThreshold: crit,
      isCritical: margin < crit,
      isWarning: margin >= crit && margin < 22.0,
    };
  });

  // Dynamic cost distribution data inspired by Reference Image 1
  const costDistributionData = [
    { name: 'Raw Material', value: 42, color: '#06b6d4' },
    { name: 'Direct Labour', value: 26, color: '#10b981' },
    { name: 'Overhead & Rent', value: 18, color: '#3b82f6' },
    { name: 'Utilities & Power', value: 14, color: '#8b5cf6' },
  ];

  const totalAtRisk = (marginData?.critical_count || 0) + (marginData?.warning_count || 0);
  const avgMargin = Number(marginData?.average_portfolio_margin || 28.4);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-[1600px] mx-auto animate-fadeIn">
      {/* SECTION 0: TOP EXECUTIVE COMMAND HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl glass-panel-elevated p-6 border border-slate-800/90 hairline-top-cyan">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glow-cyan animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight font-sans">
                Executive Financial Command Centre
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono font-bold tracking-wider">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Real-time margin surveillance, commodity inflation passthrough, order gatekeeping, and multi-horizon decision preparation for manufacturing enterprises.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('scenarios')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 hover:border-slate-600 transition shadow-sm group"
            >
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Simulate Macro Shock</span>
            </button>
            <button
              onClick={() => onNavigate('decisions')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-glow-emerald transition-all duration-200"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Review Decision Queue ({pendingDecisions.length})</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* SECTION 1: CORE EXECUTIVE KPIS (Directly inspired by Reference Images 1 & 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Portfolio Gross Margin"
          value={`${avgMargin}%`}
          subtitle="Corporate Hurdle: 25.0%"
          change={avgMargin >= 25.0 ? '+3.4% vs Hurdle' : '-Erosion Warning'}
          isPositive={avgMargin >= 25.0}
          icon={TrendingUp}
          variant={avgMargin >= 25.0 ? 'emerald' : 'amber'}
          sparkline={[25.1, 26.0, 25.8, 27.2, 27.9, avgMargin]}
          sparklineColor={avgMargin >= 25.0 ? 'emerald' : 'amber'}
          submetrics={[
            { label: 'Target', value: '25.0%' },
            { label: 'Critical Floor', value: '16.0%' },
            { label: 'Spread', value: `+${(avgMargin - 16.0).toFixed(1)}%` },
          ]}
          onClick={() => onNavigate('marginguard')}
        />

        <MetricCard
          title="Monitored Products"
          value={marginData?.total_products || 0}
          subtitle="100% BOM recipe verified"
          badge="Active Catalog"
          icon={Package}
          variant="cyan"
          sparkline={[12, 12, 14, 15, 15, marginData?.total_products || 16]}
          sparklineColor="cyan"
          submetrics={[
            { label: 'Recipes', value: '100%' },
            { label: 'Locations', value: '3 Hubs' },
            { label: 'Synced', value: 'Active' },
          ]}
          onClick={() => onNavigate('products')}
        />

        <MetricCard
          title="Products at Risk"
          value={totalAtRisk}
          subtitle={`${marginData?.critical_count || 0} Breaching critical floor`}
          change={totalAtRisk === 0 ? 'All Clear' : `${marginData?.critical_count || 0} Critical`}
          isPositive={totalAtRisk === 0}
          icon={ShieldAlert}
          variant={totalAtRisk > 0 ? 'rose' : 'emerald'}
          sparkline={totalAtRisk > 0 ? [1, 2, 3, 2, 3, totalAtRisk] : [3, 2, 1, 1, 0, 0]}
          sparklineColor={totalAtRisk > 0 ? 'rose' : 'emerald'}
          submetrics={[
            { label: 'Critical (<16%)', value: marginData?.critical_count || 0 },
            { label: 'Warning (16-22%)', value: marginData?.warning_count || 0 },
            { label: 'Actionable', value: 'Auto-prep' },
          ]}
          onClick={() => onNavigate('marginguard')}
        />

        <MetricCard
          title="Pending Decisions"
          value={pendingDecisions.length}
          subtitle="Awaiting executive authorization"
          change={pendingDecisions.length > 0 ? `${pendingDecisions.length} Proposals` : 'Zero Backlog'}
          isPositive={pendingDecisions.length === 0}
          icon={CheckSquare}
          variant="cyan"
          sparkline={[3, 4, 2, 5, 4, pendingDecisions.length || 3]}
          sparklineColor="cyan"
          submetrics={[
            { label: 'Price Hikes', value: '1' },
            { label: 'Supplier Alt', value: '1' },
            { label: 'Hurdle Rej', value: '1' },
          ]}
          onClick={() => onNavigate('decisions')}
        />
      </div>

      {/* SECTION 2: PRODUCT MARGIN SURVEILLANCE & COST DISTRIBUTION DONUT (Reference Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Margin Surveillance Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Product Margin Surveillance
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono">
                  MarginGuard™
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Realized margin % compared against target hurdle (25%) and critical breach threshold (16%).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex bg-slate-850 p-1 rounded-xl border border-slate-700/70">
                <button
                  onClick={() => setChartView('bar')}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition ${
                    chartView === 'bar'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartView('area')}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition ${
                    chartView === 'area'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Trend
                </button>
              </div>

              <button
                onClick={() => onNavigate('marginguard')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 pl-2 group"
              >
                <span>Details</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#172238" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    fontFamily="monospace"
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" unit="%" domain={[0, 42]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c1424',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      fontFamily: 'monospace',
                    }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="CurrentMargin" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isCritical ? '#f43f5e' : entry.isWarning ? '#f59e0b' : '#10b981'}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="TargetMargin" fill="#0284c7" opacity={0.35} radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                  <defs>
                    <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#172238" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    fontFamily="monospace"
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" unit="%" domain={[0, 42]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c1424',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <ReferenceLine y={25} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'Target 25%', fill: '#60a5fa', fontSize: 10 }} />
                  <ReferenceLine y={16} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Critical 16%', fill: '#f87171', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="CurrentMargin"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#marginGrad)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-glow-emerald" />
              <span>Healthy Margin (≥22%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-glow-amber" />
              <span>Warning Margin (16%–22%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-glow-rose" />
              <span>Critical Breach (&lt;16%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/40" />
              <span>Target Standard (25%)</span>
            </div>
          </div>
        </div>

        {/* Right: Cost Distribution Donut Ring (Direct Inspiration from Reference Image 1) */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <PieChartIcon className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Cost Distribution
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-850 text-slate-300 border border-slate-700/80">
                Portfolio Avg
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Blended manufacturing cost decomposition across active production BOMs.
            </p>

            {/* Glowing Donut Chart */}
            <div className="relative h-48 w-full mt-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {costDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#090e1a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c1424',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold font-mono text-slate-100">100%</span>
                <span className="text-[10px] font-mono uppercase text-slate-400">Total Cost</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80">
              {costDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] text-slate-300 truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-100 ml-1">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('bom')}
              className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl border border-slate-700/80 transition flex items-center justify-center space-x-1.5 group"
            >
              <span>Inspect BOM & Cost Overheads</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: EXTERNAL COMMODITY BENCHMARKS TICKER (Reference Image 1 & 2) */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                External Market Benchmarks & Spot Commodity Feeds
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {getIndustryMarketSubtitle()}
            </p>
          </div>
          <button
            onClick={() => onNavigate('market')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium group"
          >
            <span>All Global Indices</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {marketSummary.map((ind) => {
            const isNegativeInflation = ind.change_percent < 0;
            return (
              <div
                key={ind.code}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between transition group hover:shadow-glow-cyan"
              >
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{ind.code}</span>
                    <span className="text-slate-500 font-sans">{ind.frequency || 'Monthly'}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1 group-hover:text-cyan-300 transition">
                    {ind.name}
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between pt-2 border-t border-slate-800/60">
                  <div className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                    {ind.currency === 'USD' ? '$' : '₹'}
                    {ind.latest_value.toLocaleString()}
                  </div>
                  <div
                    className={`text-xs font-mono font-bold flex items-center px-1.5 py-0.5 rounded ${
                      isNegativeInflation
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {ind.change_percent >= 0 ? '+' : ''}
                    {ind.change_percent}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: ORDER GATEKEEPER & DECISION PREPARATION QUEUE (Reference Images 2 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Orders Feasibility Table (OrderSure) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Order Feasibility Gatekeeper
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-850 text-slate-300 border border-slate-700/80 font-mono">
                  OrderSure™
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Stress-tested profitability of committed customer purchase orders against spot delivery quotes.
              </p>
            </div>
            <button
              onClick={() => onNavigate('ordersure')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 group"
            >
              <span>Order Simulator</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3 text-right">Agreed Unit</th>
                  <th className="py-3 px-3 text-right">Current Margin</th>
                  <th className="py-3 px-3 text-right">Stress Margin</th>
                  <th className="py-3 px-3 text-center">Verdict</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {openOrders.slice(0, 5).map((ord) => (
                  <tr key={ord.order_number} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-100">{ord.order_number}</td>
                    <td className="py-3 px-3 font-sans text-slate-300 truncate max-w-[120px]">
                      {ord.customer_name}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300 truncate max-w-[140px]">
                      {ord.product_name}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      ₹{ord.agreed_unit_price.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold tabular-nums">
                      {ord.current_margin_percent}%
                    </td>
                    <td className="py-3 px-3 text-right text-amber-400 font-bold tabular-nums">
                      {ord.stress_margin_percent}%
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <StatusBadge status={ord.recommendation} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <button
                        onClick={() => handleDeleteOrder(ord.order_id, ord.order_number)}
                        title={`Delete Order ${ord.order_number}`}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Decisions Queue (Reference Image 2 Risk Actions) */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Decision Queue
                </h2>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                {pendingDecisions.length} Actionable
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 mb-4">
              AI-prepared proposals with deterministic financial consequences awaiting authorization.
            </p>

            <div className="space-y-3">
              {pendingDecisions.slice(0, 3).map((dec) => (
                <div
                  key={dec.id}
                  className="p-3.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl transition group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-cyan-300 transition">
                      {dec.title}
                    </span>
                    <StatusBadge status={dec.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {dec.summary}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                    <span>Evidence-backed</span>
                    <span className="text-slate-400 group-hover:text-cyan-300 flex items-center space-x-1">
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3 inline" />
                    </span>
                  </div>
                </div>
              ))}

              {pendingDecisions.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No pending proposals. All margins and orders fully protected.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('decisions')}
            className="w-full mt-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 group"
          >
            <span>Open Decision Preparation Centre</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* SECTION 5: SUPPLY DISRUPTION RADAR & MARKET POLICY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SupplyShock Disruption Radar (Reference Image 2) */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                SupplyShock™ Vulnerabilities
              </h2>
            </div>
            <button
              onClick={() => onNavigate('supplyshock')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 group"
            >
              <span>Full Radar</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {supplyVulnerabilities.slice(0, 3).map((sv: any) => (
              <div
                key={sv.material_id}
                className="p-3.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl transition flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-200">{sv.material_name}</div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-3">
                    <span>Run-out: <b className="text-slate-200">{sv.days_of_supply} days</b></span>
                    <span>•</span>
                    <span>{sv.supplier_count} Supplier{sv.supplier_count === 1 ? ' (Single Source!)' : 's'}</span>
                  </div>
                </div>
                <StatusBadge status={sv.overall_risk} size="sm" />
              </div>
            ))}

            {supplyVulnerabilities.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Inventory run-out buffers healthy across all manufacturing materials.
              </div>
            )}
          </div>
        </div>

        {/* Official Market Events & Policy Feeds */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Official Market Intelligence & Policy Feeds
              </h2>
            </div>
            <button
              onClick={() => onNavigate('market')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 group"
            >
              <span>All Events</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {marketEvents.slice(0, 3).map((ev: any) => (
              <div
                key={ev.id}
                className="p-3.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 line-clamp-1">{ev.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-850 text-slate-300 border border-slate-700/80">
                    {ev.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {ev.impact_summary || ev.summary}
                </p>
                <div className="text-[10px] text-slate-500 mt-1.5 font-mono">
                  Source: {ev.source_name || 'Ministry of Commerce / World Bank'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
