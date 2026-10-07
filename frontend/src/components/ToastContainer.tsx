'use client';

import React from 'react';
import { ToastItem, ToastType } from '../context/ToastContext';
import { CheckCircle2, XCircle, Info, AlertTriangle, X, Activity } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle2,
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        badgeLabel: 'Success',
        borderColor: 'border-emerald-500/30',
        glowColor: 'shadow-emerald-500/10',
        progressColor: 'bg-emerald-500',
      };
    case 'error':
      return {
        icon: XCircle,
        iconColor: 'text-rose-400',
        iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        badgeBg: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        badgeLabel: 'Alert',
        borderColor: 'border-rose-500/30',
        glowColor: 'shadow-rose-500/10',
        progressColor: 'bg-rose-500',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        iconColor: 'text-amber-400',
        iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        badgeLabel: 'Notice',
        borderColor: 'border-amber-500/30',
        glowColor: 'shadow-amber-500/10',
        progressColor: 'bg-amber-500',
      };
    case 'info':
    default:
      return {
        icon: Info,
        iconColor: 'text-sky-400',
        iconBg: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
        badgeBg: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        badgeLabel: 'Info',
        borderColor: 'border-sky-500/30',
        glowColor: 'shadow-sky-500/10',
        progressColor: 'bg-sky-500',
      };
  }
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-5 right-4 sm:right-6 left-4 sm:left-auto sm:w-[400px] z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-live="assertive"
    >
      {toasts.map((toast) => {
        const config = getToastConfig(toast.type);
        const IconComponent = config.icon;

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto relative overflow-hidden glass-panel bg-slate-900/95 backdrop-blur-xl border ${config.borderColor} ${config.glowColor} shadow-2xl rounded-2xl p-4 transition-all duration-300 animate-toast-in hover:scale-[1.01]`}
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div
                className={`w-9 h-9 rounded-xl ${config.iconBg} border flex items-center justify-center shrink-0 mt-0.5`}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Toast Details */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-xs font-black tracking-tight text-white uppercase">
                      {toast.title || 'CivicPulse'}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${config.badgeBg}`}>
                    {config.badgeLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium break-words">
                  {toast.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 -mr-1 -mt-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Countdown Progress Bar */}
            {toast.duration > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/60 overflow-hidden">
                <div
                  className={`h-full ${config.progressColor}`}
                  style={{
                    animation: `toastProgress ${toast.duration}ms linear forwards`,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
