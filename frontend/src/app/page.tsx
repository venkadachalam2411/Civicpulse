'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Users,
  CheckCircle2,
  MapPin,
  Compass,
  Sparkles,
  Award,
  BarChart3,
  PlusCircle,
  FileText,
  Clock,
  ChevronRight,
  LogIn,
} from 'lucide-react';
import api from '../services/api';
import { IIssue } from '../types';
import { IssueCard } from '../components/IssueCard';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [recentIssues, setRecentIssues] = useState<IIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState<boolean>(true);
  const [stats, setStats] = useState({
    total: 18,
    resolved: 14,
    officers: 6,
    communities: 12,
    slaRate: 94,
  });

  useEffect(() => {
    // Fetch recent public issues for preview (accessible to all)
    api
      .get('/issues?limit=6&sortBy=newest')
      .then((res) => {
        if (res.data.success) {
          setRecentIssues(res.data.issues || []);
          if (res.data.pagination) {
            setStats((prev) => ({
              ...prev,
              total: res.data.pagination.total || prev.total,
            }));
          }
        }
      })
      .catch((e) => console.error('Failed to fetch recent issues:', e))
      .finally(() => setLoadingIssues(false));
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'officer') return '/dashboard/officer';
    return '/dashboard/citizen';
  };

  const getDashboardTitle = () => {
    if (!user) return 'Get Started';
    if (user.role === 'admin') return 'Open Admin Control Center';
    if (user.role === 'officer') return 'Open Officer Workstation';
    return 'Open Citizen Portal';
  };

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-10 pb-12 text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[650px] h-[650px] bg-gradient-to-tr from-sky-500/15 via-indigo-500/15 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-sky-400" />
            <span>CivicPulse Platform 2026 – Smart Community Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Transforming Civic Complaints into{' '}
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
              Verified Solutions.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Report community issues, monitor real-time department progress, and inspect verified Before/After resolution
            proof with transparent SLA tracking.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={getDashboardLink()}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-xl shadow-sky-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
            >
              <span>{getDashboardTitle()}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/explore"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Explore Public Issues</span>
            </Link>

            <Link
              href="/map"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl text-sm font-semibold bg-slate-900/50 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>City Map</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Role Gateways Section (Citizen / Officer / Admin) */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-mono uppercase font-bold text-sky-400 tracking-wider">
            Role-Based Access
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Choose Your Portal Gateway</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            CivicPulse adapts its workspace specifically for citizens, field officers, and city administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Citizen Card */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800/80 hover:border-sky-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-all" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Citizen Portal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                File complaints with AI category suggestions, attach location coordinates & photos, track live status,
                and inspect before/after fix proof.
              </p>

              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Report civic issues & duplicate alert</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Upvote and comment on issues</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Confirm resolution & proof inspection</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80">
              <Link
                href={user ? (user.role === 'citizen' ? '/dashboard/citizen' : '/dashboard') : '/login?role=citizen'}
                className="w-full py-3 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{user && user.role === 'citizen' ? 'Open Citizen Portal' : 'Access Citizen Portal'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Field Officer Card */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800/80 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Officer Workstation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated queue for assigned field tickets. Update work progress, monitor strict SLA countdowns, and
                upload resolution photo proof.
              </p>

              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Assigned task queue & priority badges</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>SLA deadline tracking & status updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Before / After photo resolution upload</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80">
              <Link
                href={user ? (user.role === 'officer' ? '/dashboard/officer' : '/dashboard') : '/login?role=officer'}
                className="w-full py-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{user && user.role === 'officer' ? 'Open Officer Workstation' : 'Access Officer Workstation'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Admin Card */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Admin Control Center</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized municipal intelligence: real-time analytics, SLA compliance monitoring, officer workload
                balancing, and complaint assignment.
              </p>

              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Complete issue registry & verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Priority override (0–100) & SLA rules</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Field officer dispatch & category manager</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80">
              <Link
                href={user ? (user.role === 'admin' ? '/dashboard/admin' : '/dashboard') : '/login?role=admin'}
                className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{user && user.role === 'admin' ? 'Open Admin Center' : 'Access Admin Center'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Platform Statistics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl text-center border border-slate-800 hover:border-sky-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white">{stats.total}+</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Total Issues Tracked</p>
        </div>

        <div className="glass-card p-6 rounded-2xl text-center border border-slate-800 hover:border-emerald-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-emerald-400">{stats.resolved}+</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Verified Resolutions</p>
        </div>

        <div className="glass-card p-6 rounded-2xl text-center border border-slate-800 hover:border-indigo-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white">{stats.officers}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Active Field Officers</p>
        </div>

        <div className="glass-card p-6 rounded-2xl text-center border border-slate-800 hover:border-amber-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-amber-400">{stats.slaRate}%</p>
          <p className="text-xs text-slate-400 font-medium mt-1">SLA Target Compliance</p>
        </div>
      </section>

      {/* How CivicPulse Works (3-Step Lifecycle) */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-mono uppercase font-bold text-sky-400 tracking-wider">
            Resolution Lifecycle
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">How CivicPulse Works</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            From initial citizen report to certified before/after resolution proof in 3 transparent steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 relative group hover:border-sky-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-black text-lg mb-6">
              1
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. Snap, Pin & Report</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Citizens submit issue details and photos. Smart AI suggests the department category and alerts if an
              identical complaint already exists nearby.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-slate-800 relative group hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-black text-lg mb-6">
              2
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. Verify & Dispatch</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Admins review the ticket, compute algorithmic priority scores (0–100) based on upvotes and severity, and
              dispatch dedicated field officers with fixed SLA deadlines.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-slate-800 relative group hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-lg mb-6">
              3
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. Resolve & Verify Proof</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Officers complete site repairs and upload After-Resolution photo evidence. Citizens inspect side-by-side
              Before/After proofs and confirm permanent closure.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Issues Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Recent Public Complaints</h2>
            <p className="text-slate-400 text-xs">Real-time issues reported across neighborhood sectors</p>
          </div>
          <Link
            href="/explore"
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
          >
            <span>Explore all complaints</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingIssues ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading community complaints...</div>
        ) : recentIssues.length === 0 ? (
          <div className="glass-card p-10 text-center rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No complaints reported yet. Be the first to file an issue in your neighborhood!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentIssues.slice(0, 6).map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        )}
      </section>

      {/* Call to Action Banner */}
      <section className="glass-panel p-10 sm:p-12 rounded-3xl border border-sky-500/30 text-center space-y-5 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/60">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black text-white">Notice an issue in your area?</h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            Sign in with your citizen account, tag the location, and let our authorities resolve it with verified proof.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href={getDashboardLink()}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-xl shadow-sky-500/20 transition-all transform hover:scale-105"
          >
            <span>{getDashboardTitle()}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/map"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
          >
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>Open City Map</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
