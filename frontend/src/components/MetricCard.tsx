import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface SubMetric {
  label: string;
  value: string | number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  badge?: string;
  sparkline?: number[];
  sparklineColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'blue';
  submetrics?: SubMetric[];
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate' | 'default';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon: Icon,
  badge,
  sparkline,
  sparklineColor = 'cyan',
  submetrics,
  variant = 'default',
  onClick,
}) => {
  // Determine variant styling
  let borderClasses = 'border-slate-800/80 hover:border-slate-700/80';
  let hairlineClass = '';
  let glowClass = '';
  let iconBg = 'bg-slate-800/80 text-slate-300';

  if (variant === 'cyan') {
    borderClasses = 'border-cyan-500/30 hover:border-cyan-500/50';
    hairlineClass = 'hairline-top-cyan';
    glowClass = 'hover:shadow-glow-cyan';
    iconBg = 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50';
  } else if (variant === 'emerald' || (isPositive === true && variant === 'default')) {
    borderClasses = 'border-emerald-500/25 hover:border-emerald-500/40';
    hairlineClass = 'hairline-top-emerald';
    glowClass = 'hover:shadow-glow-emerald';
    iconBg = 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50';
  } else if (variant === 'amber') {
    borderClasses = 'border-amber-500/30 hover:border-amber-500/50';
    hairlineClass = 'hairline-top-amber';
    glowClass = 'hover:shadow-glow-amber';
    iconBg = 'bg-amber-950/80 text-amber-400 border border-amber-800/50';
  } else if (variant === 'rose' || (isPositive === false && variant === 'default')) {
    borderClasses = 'border-rose-500/30 hover:border-rose-500/50';
    hairlineClass = 'hairline-top-rose';
    glowClass = 'hover:shadow-glow-rose';
    iconBg = 'bg-rose-950/80 text-rose-400 border border-rose-800/50';
  } else if (variant === 'purple') {
    borderClasses = 'border-purple-500/30 hover:border-purple-500/50';
    glowClass = 'hover:shadow-glow-purple';
    iconBg = 'bg-purple-950/80 text-purple-400 border border-purple-800/50';
  }

  // Generate SVG path for sparkline
  const renderSparkline = () => {
    const rawData = sparkline && sparkline.length >= 2 
      ? sparkline 
      : (isPositive ? [20, 22, 21, 25, 27, 26, 30] : [32, 28, 29, 24, 25, 21, 18]);
    
    const data = rawData.map((v) => (typeof v === 'number' && !isNaN(v) ? v : 0));
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 110;
    const height = 36;
    const stepX = width / Math.max(data.length - 1, 1);

    const points = data.map((val, idx) => {
      const x = idx * stepX;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${(isNaN(x) ? 0 : x).toFixed(1)},${(isNaN(y) ? height / 2 : y).toFixed(1)}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

    const strokeColor =
      sparklineColor === 'emerald'
        ? '#10b981'
        : sparklineColor === 'rose'
        ? '#f43f5e'
        : sparklineColor === 'amber'
        ? '#f59e0b'
        : sparklineColor === 'purple'
        ? '#a855f7'
        : '#06b6d4';

    const safeTitle = (title || 'metric').replace(/[^a-zA-Z0-9]/g, '');
    const gradientId = `grad-${safeTitle}-${Math.floor(Math.random() * 1000)}`;
    const lastPoint = points[points.length - 1] || '0,0';
    const [lastX, lastY] = lastPoint.split(',');

    return (
      <svg className="w-24 h-9 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradientId})`} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle
          cx={lastX}
          cy={lastY}
          r="3"
          fill={strokeColor}
          className="animate-pulse"
        />
      </svg>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`relative glass-panel rounded-2xl p-5 transition-all duration-200 ${borderClasses} ${hairlineClass} ${glowClass} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top row: Label and Icon */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
          {title}
        </span>
        <div className={`p-2 rounded-xl transition ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Metric value and sparkline row */}
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono tracking-tight tabular-nums">
            {value}
          </div>
          {badge && (
            <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80">
              {badge}
            </span>
          )}
        </div>

        {/* Embedded Mini Sparkline Chart */}
        <div className="flex flex-col items-end">
          {renderSparkline()}
        </div>
      </div>

      {/* Delta badge & subtitle */}
      {(change || subtitle) && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
          {change && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1 text-emerald-400 inline" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-rose-400 inline" />
              )}
              {change}
            </span>
          )}
          {subtitle && (
            <span className="text-[11px] text-slate-400 truncate max-w-[180px]" title={subtitle}>
              {subtitle}
            </span>
          )}
        </div>
      )}

      {/* Optional submetrics grid (as seen in Reference Image 2) */}
      {submetrics && submetrics.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-800/60 grid grid-cols-3 gap-2 text-center">
          {submetrics.map((sub, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">
                {sub.label}
              </span>
              <span className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                {sub.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
