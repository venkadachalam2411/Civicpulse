import React from 'react';
import { IssueStatusType } from '../types';
import { Clock, CheckCircle2, AlertCircle, UserCheck, Wrench, ShieldCheck, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: IssueStatusType;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true }) => {
  const getStatusConfig = (status: IssueStatusType) => {
    switch (status) {
      case 'reported':
        return { label: 'Reported', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30', icon: Clock };
      case 'under_review':
        return { label: 'Under Review', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: AlertCircle };
      case 'verified':
        return { label: 'Verified', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: ShieldCheck };
      case 'assigned':
        return { label: 'Assigned', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: UserCheck };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: Wrench };
      case 'resolved':
        return { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
      case 'closed':
        return { label: 'Closed', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30', icon: CheckCircle2 };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: XCircle };
      default:
        return { label: status, color: 'bg-slate-500/10 text-slate-400 border-slate-500/30', icon: Clock };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5" />}
      {config.label}
    </span>
  );
};
