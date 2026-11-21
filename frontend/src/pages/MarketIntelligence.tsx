import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Globe2, ExternalLink, Calendar, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Syncing Official Benchmark Feeds...</span>
        </div>
      </div>
    );
  }

  const selectedSummary = summary.find((s) => s.code === selectedCode);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              External Market Intelligence & Economic Indicators
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Official Benchmarks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative commodity price data from World Bank Pink Sheet, RBI exchange rates, and Ministry of Commerce WPI index.
          </p>
        </div>
      </div>

      {/* Benchmark Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((ind) => {
          const isSelected = selectedCode === ind.code;
          return (
            <div
              key={ind.code}
              onClick={() => handleSelectIndicator(ind.code)}
              className={`p-5 rounded-xl border cursor-pointer transition ${
                isSelected
                  ? 'bg-slate-850 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400">{ind.code}</span>
                <span
                  className={`text-xs font-mono font-semibold ${
                    ind.change_percent >= 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {ind.change_percent >= 0 ? '+' : ''}
                  {ind.change_percent}%
                </span>
              </div>
              <h3 className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">{ind.name}</h3>
              <div className="mt-3 flex items-baseline justify-between font-mono">
                <span className="text-xl font-bold text-slate-100">
                  {ind.currency === 'USD' ? '$' : '₹'}
                  {ind.latest_value.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">{ind.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Time-Series Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
              {selectedSummary?.name || selectedCode} (24-Month Trend)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical time-series telemetry linked directly into BOM pricing calculations.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Source: <span className="text-emerald-400 font-medium">World Bank / RBI Official Feed</span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                name={selectedSummary?.name || 'Benchmark Price'}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Official Policy & Gazette Announcements */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Verified Policy & Trade Gazette Notifications
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Confirmed customs duties, anti-dumping tariffs, and supply disruption announcements.
          </p>
        </div>

        <div className="divide-y divide-slate-800">
          {events.map((ev) => (
            <div key={ev.id} className="p-5 hover:bg-slate-800/20 transition space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {ev.event_type.replace('_', ' ')}
                  </span>
                  <StatusBadge status={ev.severity} />
                </div>
                <span className="text-[11px] font-mono text-slate-400">{ev.published_date}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-100">{ev.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{ev.summary}</p>

              <div className="flex flex-wrap items-center justify-between pt-2 text-xs font-mono text-slate-400 border-t border-slate-800/60">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-sans">Source:</span>
                  <span className="text-slate-300">{ev.source_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-sans">Affected Materials:</span>
                  <span className="text-emerald-400 font-sans">
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
