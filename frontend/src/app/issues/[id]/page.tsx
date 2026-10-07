'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { IIssue, IIssueTimeline } from '../../../types';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { StatusBadge } from '../../../components/StatusBadge';
import { PriorityBadge } from '../../../components/PriorityBadge';
import { TimelineView } from '../../../components/TimelineView';
import { BeforeAfterProof } from '../../../components/BeforeAfterProof';
import { MapView } from '../../../components/MapView';
import { ThumbsUp, MapPin, Tag, User, Calendar, ShieldCheck, ArrowLeft, Clock } from 'lucide-react';

export default function IssueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const issueId = params.id as string;

  const [issue, setIssue] = useState<IIssue | null>(null);
  const [timeline, setTimeline] = useState<IIssueTimeline[]>([]);
  const [hasUpvoted, setHasUpvoted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpvoting, setIsUpvoting] = useState<boolean>(false);

  const fetchIssueDetails = async () => {
    try {
      const res = await api.get(`/issues/${issueId}`);
      if (res.data.success) {
        setIssue(res.data.issue);
        setTimeline(res.data.timeline || []);
        setHasUpvoted(res.data.hasUpvoted || false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

  const handleUpvote = async () => {
    if (!user) {
      toast.info('Please log in to upvote.');
      return;
    }
    if (isUpvoting || !issue) return;
    setIsUpvoting(true);

    try {
      const res = await api.post(`/issues/${issue._id}/upvote`);
      if (res.data.success) {
        setHasUpvoted(res.data.hasUpvoted);
        setIssue((prev) =>
          prev
            ? {
                ...prev,
                upvoteCount: res.data.upvoteCount,
                priorityScore: res.data.priorityScore,
                priority: res.data.priority,
              }
            : null
        );
        toast.success(res.data.hasUpvoted ? 'Upvote registered!' : 'Upvote removed.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update upvote.');
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleConfirmResolution = async () => {
    if (!issue) return;
    try {
      const res = await api.post(`/issues/${issue._id}/confirm-resolution`, {
        action: 'confirm',
        remarks: 'Confirmed work verified on site.',
      });
      if (res.data.success) {
        toast.success('Resolution confirmed. Issue officially closed!');
        fetchIssueDetails();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to confirm resolution.');
    }
  };

  const handleReopenIssue = async () => {
    if (!issue) return;
    try {
      const res = await api.post(`/issues/${issue._id}/confirm-resolution`, {
        action: 'reopen',
        remarks: 'Resolution inspection requires follow-up work.',
      });
      if (res.data.success) {
        toast.success('Issue reopened. Assigned officer and admin notified.');
        fetchIssueDetails();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to reopen issue.');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading complaint details...</div>;
  }

  if (!issue) {
    return (
      <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white">Complaint Not Found</h2>
        <p className="text-xs text-slate-400">The requested issue ID does not exist or was removed.</p>
        <button
          onClick={() => router.push('/explore')}
          className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-semibold"
        >
          Back to Explorer
        </button>
      </div>
    );
  }

  const isReporterOrAdmin = user?.id === issue.reportedBy?._id || user?.role === 'admin';

  return (
    <div className="space-y-8 pb-16">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to listings
      </button>

      {/* Main Issue Header */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-900 text-sky-400 border border-sky-500/30">
                {issue.issueId}
              </span>
              <StatusBadge status={issue.status} />
              <PriorityBadge
                priority={issue.priority}
                score={issue.priorityScore}
                slaDeadline={issue.slaDeadline}
                isResolved={['resolved', 'closed', 'rejected'].includes(issue.status)}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{issue.title}</h1>
          </div>

          {/* Upvote Button */}
          <button
            onClick={handleUpvote}
            disabled={isUpvoting}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              hasUpvoted
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
            <span>👍 {issue.upvoteCount} Upvotes</span>
          </button>
        </div>

        {/* Info Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Category</span>
            <span className="font-bold text-white">{issue.category}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Location</span>
            <span className="font-bold text-white truncate block">{issue.location}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Target SLA Deadline</span>
            <span className="font-bold text-sky-400">{new Date(issue.slaDeadline).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Assigned Officer</span>
            <span className="font-bold text-amber-400">
              {issue.assignedTo ? issue.assignedTo.name : 'Unassigned'}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Complaint Description</h3>
          <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            {issue.description}
          </p>
        </div>

        {/* Image Gallery */}
        {issue.imageUrls && issue.imageUrls.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Issue Photos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {issue.imageUrls.map((url, idx) => (
                <div key={idx} className="relative h-48 w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <Image src={url} alt={`Photo ${idx + 1}`} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resolution Proof Section (If Resolved or Closed) */}
      {['resolved', 'closed'].includes(issue.status) && (
        <BeforeAfterProof
          beforeImages={issue.imageUrls}
          afterImages={issue.resolutionImages}
          remarks={issue.resolutionRemarks}
          resolvedAt={issue.resolvedAt}
          onConfirm={handleConfirmResolution}
          onReopen={handleReopenIssue}
          isReporterOrAdmin={isReporterOrAdmin}
          status={issue.status}
        />
      )}

      {/* Grid: Map & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interactive Map Location */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-400" />
              Incident Satellite Location
            </h3>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 bg-sky-950/60 px-2.5 py-1 rounded-xl border border-sky-800/60 transition-colors"
            >
              Open in Maps ↗
            </a>
          </div>
          <MapView
            issues={[issue]}
            height="380px"
            center={[issue.latitude, issue.longitude]}
            zoom={16}
            defaultLayer="satellite"
            showLayerToggle={true}
            showLocateButton={true}
            showCoordsHUD={true}
          />
        </div>

        {/* Timeline Audit Trail */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            Complaint Progress Timeline
          </h3>
          <TimelineView timeline={timeline} />
        </div>
      </div>
    </div>
  );
}
