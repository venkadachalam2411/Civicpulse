import React from 'react';
import Image from 'next/image';
import { CheckCircle2, AlertOctagon, Sparkles } from 'lucide-react';

interface BeforeAfterProofProps {
  beforeImages: string[];
  afterImages: string[];
  remarks?: string;
  resolvedAt?: string;
  onConfirm?: () => void;
  onReopen?: () => void;
  isReporterOrAdmin?: boolean;
  status: string;
}

export const BeforeAfterProof: React.FC<BeforeAfterProofProps> = ({
  beforeImages,
  afterImages,
  remarks,
  resolvedAt,
  onConfirm,
  onReopen,
  isReporterOrAdmin = false,
  status,
}) => {
  const beforeImg =
    beforeImages.length > 0
      ? beforeImages[0]
      : 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop';
  const afterImg =
    afterImages.length > 0
      ? afterImages[0]
      : 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop';

  return (
    <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-bold text-white">Resolution Proof Verification</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Before Image */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Before Resolution
          </span>
          <div className="relative h-56 w-full rounded-xl overflow-hidden border border-rose-500/20 bg-slate-900">
            <Image src={beforeImg} alt="Before Resolution" fill className="object-cover" unoptimized />
          </div>
        </div>

        {/* After Image */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> After Resolution
          </span>
          <div className="relative h-56 w-full rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-900">
            <Image src={afterImg} alt="After Resolution" fill className="object-cover" unoptimized />
          </div>
        </div>
      </div>

      {/* Resolution Remarks */}
      {remarks && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Officer Remarks:</h4>
          <p className="text-sm text-slate-200 mt-1 leading-relaxed">{remarks}</p>
          {resolvedAt && (
            <p className="text-[11px] text-slate-500 mt-2">
              Resolved on: {new Date(resolvedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Citizen Action Buttons */}
      {isReporterOrAdmin && status === 'resolved' && (
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3 flex-wrap">
          <button
            onClick={onReopen}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <AlertOctagon className="w-4 h-4" />
            Reopen Issue (Not Fixed)
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm Resolution
          </button>
        </div>
      )}
    </div>
  );
};
