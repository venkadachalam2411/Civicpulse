'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { IIssue } from '../../../types';
import { Sidebar } from '../../../components/Sidebar';
import { IssueCard } from '../../../components/IssueCard';
import { FileText, Clock, Wrench, CheckCircle2, PlusCircle, AlertCircle } from 'lucide-react';

export default function CitizenDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [issues, setIssues] = useState<IIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      api
        .get('/issues/my')
        .then((res) => {
          if (res.data.success) {
            setIssues(res.data.issues || []);
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const total = issues.length;
  const pending = issues.filter((i) => ['reported', 'under_review', 'verified'].includes(i.status)).length;
  const inProgress = issues.filter((i) => ['assigned', 'in_progress'].includes(i.status)).length;
  const resolved = issues.filter((i) => ['resolved', 'closed'].includes(i.status)).length;

  return (
    <div className="flex gap-8 pb-12">
      <Sidebar />

      <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Citizen Portal</h1>
            <p className="text-xs text-slate-400 mt-1">Track your submitted complaints and community upvotes.</p>
          </div>

          <Link
            href="/report"
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Report New Issue
          </Link>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Total Reported</span>
            <p className="text-2xl font-black text-white mt-1">{total}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">Pending Review</span>
            <p className="text-2xl font-black text-amber-400 mt-1">{pending}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-mono text-blue-400 uppercase font-bold block">In Progress</span>
            <p className="text-2xl font-black text-blue-400 mt-1">{inProgress}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">Resolved</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{resolved}</p>
          </div>
        </div>

        {/* Complaints Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Your Submitted Complaints</h2>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading complaints...</div>
          ) : issues.length === 0 ? (
            <div className="glass-card p-10 text-center rounded-2xl border border-slate-800 space-y-3">
              <p className="text-sm font-bold text-slate-300">You haven't reported any issues yet.</p>
              <p className="text-xs text-slate-500">Notice a pothole, broken streetlight, or garbage dump?</p>
              <Link
                href="/report"
                className="inline-block px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold"
              >
                File Your First Complaint
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {issues.map((issue) => (
                <IssueCard key={issue._id} issue={issue} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
