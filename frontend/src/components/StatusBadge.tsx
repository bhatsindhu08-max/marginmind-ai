import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = status.toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (['HEALTHY', 'APPROVED', 'ATTRACTIVE', 'SUFFICIENT', 'LOW'].includes(norm)) {
    colorClasses = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60';
  } else if (['WARNING', 'VERIFY', 'PARTIAL', 'MEDIUM', 'PENDING_APPROVAL', 'REVIEW_REQUIRED'].includes(norm)) {
    colorClasses = 'bg-amber-950/70 text-amber-400 border-amber-800/60';
  } else if (['CRITICAL', 'REJECTED', 'RISKY', 'SHORTAGE', 'HIGH'].includes(norm)) {
    colorClasses = 'bg-rose-950/70 text-rose-400 border-rose-800/60';
  } else if (['APPROVED_WITH_EDITS', 'IN_PRODUCTION'].includes(norm)) {
    colorClasses = 'bg-cyan-950/70 text-cyan-400 border-cyan-800/60';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
