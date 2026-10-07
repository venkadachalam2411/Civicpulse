'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThumbsUp, MapPin, Calendar, Tag, ArrowRight } from 'lucide-react';
import { IIssue } from '../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface IssueCardProps {
  issue: IIssue;
  initialHasUpvoted?: boolean;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, initialHasUpvoted = false }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [upvotes, setUpvotes] = useState<number>(issue.upvoteCount);
  const [hasUpvoted, setHasUpvoted] = useState<boolean>(initialHasUpvoted);
  const [isUpvoting, setIsUpvoting] = useState<boolean>(false);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info('Please log in to upvote issues.');
      return;
    }

    if (isUpvoting) return;
    setIsUpvoting(true);

    try {
      const res = await api.post(`/issues/${issue._id}/upvote`);
      if (res.data.success) {
        setHasUpvoted(res.data.hasUpvoted);
        setUpvotes(res.data.upvoteCount);
      }
    } catch (err) {
      console.error('Error toggling upvote:', err);
    } finally {
      setIsUpvoting(false);
    }
  };

  const mainImage =
    issue.imageUrls && issue.imageUrls.length > 0
      ? issue.imageUrls[0]
      : 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop';

  return (
    <div className="group glass-card rounded-2xl overflow-hidden hover:border-sky-500/40 transition-all duration-300 flex flex-col h-full shadow-lg hover:shadow-sky-500/5">
      {/* Top Image Preview & Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <Image
          src={mainImage}
          alt={issue.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized={mainImage.startsWith('http')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

        {/* Issue ID Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-950/80 text-sky-400 border border-sky-500/30 backdrop-blur-md">
          {issue.issueId}
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={issue.status} />
        </div>

        {/* Priority Badge */}
        <div className="absolute bottom-3 left-3">
          <PriorityBadge
            priority={issue.priority}
            score={issue.priorityScore}
            slaDeadline={issue.slaDeadline}
            isResolved={['resolved', 'closed', 'rejected'].includes(issue.status)}
          />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-400 font-medium mb-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>{issue.category}</span>
          </div>

          <Link href={`/issues/${issue._id}`}>
            <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2 leading-snug">
              {issue.title}
            </h3>
          </Link>

          <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
            {issue.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate max-w-[55%]">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{issue.location}</span>
          </div>

          {/* Upvote Button */}
          <button
            onClick={handleUpvote}
            disabled={isUpvoting}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              hasUpvoted
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
            <span>{upvotes}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
