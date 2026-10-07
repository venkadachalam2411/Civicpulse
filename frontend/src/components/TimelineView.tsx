import React from 'react';
import { IIssueTimeline } from '../types';
import { Clock, User, CheckCircle2, ShieldCheck, Wrench, FileText, AlertCircle } from 'lucide-react';

interface TimelineViewProps {
  timeline: IIssueTimeline[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline }) => {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'reported':
        return Clock;
      case 'verified':
        return ShieldCheck;
      case 'assigned':
        return User;
      case 'in_progress':
        return Wrench;
      case 'resolved':
      case 'closed':
        return CheckCircle2;
      default:
        return FileText;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {timeline.map((event, idx) => {
        const Icon = getStepIcon(event.status);
        const eventDate = new Date(event.createdAt);

        return (
          <div key={event._id || idx} className="relative group">
            {/* Timeline Dot Icon */}
            <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border border-sky-500/50 text-sky-400 group-hover:scale-110 transition-transform">
              <Icon className="w-3 h-3" />
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  {event.status.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {eventDate.toLocaleDateString()} {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-sm font-medium text-slate-200 mt-1.5">{event.message}</p>

              {event.remarks && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 italic">
                  "{event.remarks}"
                </div>
              )}

              {event.changedBy && (
                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>
                    By <strong className="text-slate-300 font-semibold">{event.changedBy.name}</strong> ({event.changedBy.role})
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
