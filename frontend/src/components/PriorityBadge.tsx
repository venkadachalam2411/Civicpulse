import React from 'react';
import { PriorityType } from '../types';
import { ShieldAlert, Flame, AlertTriangle, Info, Clock } from 'lucide-react';

interface PriorityBadgeProps {
  priority: PriorityType;
  score?: number;
  slaDeadline?: string;
  isResolved?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  score,
  slaDeadline,
  isResolved = false,
}) => {
  const isOverdue = slaDeadline && !isResolved && new Date(slaDeadline).getTime() < Date.now();

  const getPriorityConfig = (priority: PriorityType) => {
    switch (priority) {
      case 'critical':
        return { label: 'Critical', color: 'bg-rose-500/15 text-rose-400 border-rose-500/40', icon: Flame };
      case 'high':
        return { label: 'High', color: 'bg-amber-500/15 text-amber-400 border-amber-500/40', icon: ShieldAlert };
      case 'medium':
        return { label: 'Medium', color: 'bg-sky-500/15 text-sky-400 border-sky-500/40', icon: AlertTriangle };
      case 'low':
        return { label: 'Low', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40', icon: Info };
    }
  };

  const config = getPriorityConfig(priority);
  const IconComponent = config.icon;

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}
      >
        <IconComponent className="w-3.5 h-3.5" />
        {config.label} {score !== undefined && `(${score}/100)`}
      </span>

      {isOverdue && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse">
          <Clock className="w-3 h-3 text-rose-400" />
          ⚠️ SLA Breached
        </span>
      )}
    </div>
  );
};
