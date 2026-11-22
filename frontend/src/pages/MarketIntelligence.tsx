import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Globe2, ExternalLink, Calendar, ShieldCheck, TrendingUp, Info, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const MarketIntelligence: React.FC = () => {
  const [summary, setSummary] = useState<any[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('LME_ALU');
  const [history, setHistory] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      const [sum, evts] = await Promise.all([
        apiRequest<any[]>('/market/summary'),
        apiRequest<any[]>('/market/events'),
      ]);
      setSummary(sum);
      setEvents(evts);
      if (sum.length > 0) {
        setSelectedCode(sum[0].code);
        loadHistory(sum[0].code);
      }
    } catch (e) {
      console.error('Failed to load market intelligence:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (code: string) => {
    try {
      const data = await apiRequest<any[]>(`/market/history/${code}`);
      setHistory(data);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  const handleSelectIndicator = (code: string) => {
    setSelectedCode(code);
    loadHistory(code);
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Syncing Official Benchmark Feeds...</span>
        </div>
      </div>
    );
  }

  const selectedSummary = summary.find((s) => s.code === selectedCode);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Benchmark Tiles (Reference Image 1 & 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((ind) => {
          const isSelected = selectedCode === ind.code;
          const isPositiveChange = ind.change_percent >= 0;
          return (
            <div
              key={ind.code}
              onClick={() => handleSelectIndicator(ind.code)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 relative ${
                isSelected
                  ? 'glass-panel-elevated border-cyan-500/50 shadow-glow-cyan hairline-top-cyan'
                  : 'glass-panel border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold tracking-wider ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {ind.code}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    isPositiveChange
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {ind.change_percent >= 0 ? '+' : ''}
                  {ind.change_percent}%
                </span>
              </div>
              <h3 className="text-xs font-semibold text-slate-200 mt-2 line-clamp-1">{ind.name}</h3>
              <div className="mt-4 flex items-baseline justify-between font-mono pt-2 border-t border-slate-800/60">
                <span className="text-2xl font-bold text-slate-100 tabular-nums">
                  {ind.currency === 'USD' ? '$' : '₹'}
                  {ind.latest_value.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">{ind.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Time-Series Chart (Reference Image 1 Area Chart) */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                {selectedSummary?.name || selectedCode} (24-Month Telemetry Trend)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Historical time-series telemetry linked directly into dynamic BOM costing algorithms.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            Source: <span className="text-cyan-400 font-bold">World Bank Pink Sheet / RBI Official Feed</span>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 15, right: 20, left: 10, bottom: 15 }}>
              <defs>
                <linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#172238" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} fontFamily="monospace" />
              <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c1424',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  fontFamily: 'monospace',
                }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#mktGrad)"
                name={selectedSummary?.name || 'Benchmark Price'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Official Policy & Gazette Announcements */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Verified Policy & Trade Gazette Notifications
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Confirmed customs tariffs, anti-dumping duties, and logistics disruption gazettes.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold">{events.length} Recorded</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {events.map((ev) => (
            <div key={ev.id} className="p-5 hover:bg-slate-850/40 transition space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-850 text-slate-300 border border-slate-700/80">
                    {ev.event_type.replace('_', ' ')}
                  </span>
                  <StatusBadge status={ev.severity} size="sm" />
                </div>
                <span className="text-[11px] font-mono text-slate-400">{ev.published_date}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-100">{ev.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{ev.summary}</p>

              <div className="flex flex-wrap items-center justify-between pt-2 text-xs font-mono text-slate-400 border-t border-slate-800/60">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-sans">Source:</span>
                  <span className="text-slate-200">{ev.source_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-sans">Affected Materials:</span>
                  <span className="text-cyan-400 font-sans font-bold">
                    {(ev.affected_materials || []).join(', ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
