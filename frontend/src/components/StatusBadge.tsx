import React from 'react';

interface StatusBadgeProps {
  status?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || 'UNKNOWN').toUpperCase().trim();

  let colorClasses = 'bg-slate-800/80 text-slate-300 border-slate-700/80';
  let dotColor = 'bg-slate-400';
  let pulse = false;

  if (['HEALTHY', 'APPROVED', 'ATTRACTIVE', 'SUFFICIENT', 'LOW', 'SAFE', 'PASS'].includes(norm)) {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  } else if (['WARNING', 'VERIFY', 'PARTIAL', 'MEDIUM', 'MODERATE', 'MODERADO', 'PENDING_APPROVAL', 'REVIEW_REQUIRED', 'ELEVATED'].includes(norm)) {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-400';
    pulse = true;
  } else if (['CRITICAL', 'REJECTED', 'RISKY', 'SHORTAGE', 'HIGH', 'ALTO', 'FAIL', 'DANGER'].includes(norm)) {
    colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    dotColor = 'bg-rose-400';
    pulse = true;
  } else if (['APPROVED_WITH_EDITS', 'IN_PRODUCTION', 'ACTIVE', 'SIMULATED'].includes(norm)) {
    colorClasses = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    dotColor = 'bg-cyan-400';
  } else if (['DISCONTINUE', 'HARVEST', 'PHASE_OUT'].includes(norm)) {
    colorClasses = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    dotColor = 'bg-purple-400';
  }

  const py = size === 'sm' ? 'py-0.2 px-2 text-[10px]' : 'py-0.5 px-2.5 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-medium border tracking-wide uppercase ${py} ${colorClasses}`}
    >
      <span className="relative flex h-1.5 w-1.5 mr-1.5">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`} />
      </span>
      {(status || norm || 'UNKNOWN').replace(/_/g, ' ')}
    </span>
  );
};
