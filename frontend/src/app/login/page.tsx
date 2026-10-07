'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  LogIn,
  UserPlus,
  ShieldAlert,
  KeyRound,
  Mail,
  User,
  Phone,
  Wrench,
  Lock,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, register, loading: authLoading } = useAuth();

  // Mode: 'citizen' (Citizen/Admin Email login), 'officer' (Employee ID login), 'register' (Citizen registration)
  const [activeTab, setActiveTab] = useState<'citizen' | 'officer' | 'register'>('citizen');

  // Login form state
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');

  // Register form state (Citizen only)
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Prefetch dashboard routes for instant client-side redirection
  useEffect(() => {
    router.prefetch('/dashboard/citizen');
    router.prefetch('/dashboard/officer');
    router.prefetch('/dashboard/admin');
    router.prefetch('/dashboard');
  }, [router]);

  // Sync mode and role from URL query parameters if provided
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const roleParam = searchParams.get('role');

    if (modeParam === 'register') {
      setActiveTab('register');
    } else if (roleParam === 'officer') {
      setActiveTab('officer');
    } else if (roleParam === 'admin' || roleParam === 'citizen') {
      setActiveTab('citizen');
    }
  }, [searchParams]);

  const getRoleDashboard = (role?: string) => {
    if (role === 'admin') return '/dashboard/admin';
    if (role === 'officer') return '/dashboard/officer';
    return '/dashboard/citizen';
  };

  useEffect(() => {
    if (user && !authLoading) {
      router.replace(getRoleDashboard(user.role));
    }
  }, [user, authLoading, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const identifier = activeTab === 'officer' ? employeeId.trim().toUpperCase() : email.trim().toLowerCase();

    if (!identifier || !password.trim()) {
      setErrorMsg(
        activeTab === 'officer'
          ? 'Please enter your Employee ID and password.'
          : 'Please enter your registered email address and password.'
      );
      setLoading(false);
      return;
    }

    const res = await login(identifier, password);
    if (res.success) {
      router.replace(activeTab === 'officer' ? '/dashboard/officer' : '/dashboard/citizen');
    } else {
      setLoading(false);
      setErrorMsg(res.message || 'Invalid login credentials. Please try again.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!regData.name.trim()) {
      setErrorMsg('Please enter your full name.');
      setLoading(false);
      return;
    }
    if (!regData.email.trim() || !regData.password.trim()) {
      setErrorMsg('Please enter a valid email and password.');
      setLoading(false);
      return;
    }
    if (regData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    // Public registration strictly creates citizen accounts
    const res = await register({
      name: regData.name.trim(),
      email: regData.email.trim().toLowerCase(),
      password: regData.password,
      phone: regData.phone.trim(),
      role: 'citizen',
    });

    if (res.success) {
      // Instant redirect to citizen dashboard without extra delay
      router.replace('/dashboard/citizen');
    } else {
      setLoading(false);
      setErrorMsg(res.message || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="max-w-md mx-auto pt-6 pb-16">
      <div className="glass-card p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 text-sky-400 flex items-center justify-center mx-auto mb-2 border border-sky-500/30">
            <Activity className="w-6 h-6 text-sky-400" />
          </div>
          <h1 className="text-2xl font-black text-white">
            {activeTab === 'register'
              ? 'Join CivicPulse'
              : activeTab === 'officer'
              ? 'Officer Workstation'
              : 'Sign In to Portal'}
          </h1>
          <p className="text-xs text-slate-400">
            {activeTab === 'register'
              ? 'Create your citizen account to report and track civic issues'
              : activeTab === 'officer'
              ? 'Authorized field officers sign in using municipal Employee ID'
              : 'Sign in with your email to access citizen or admin controls'}
          </p>
        </div>

        {/* Tab Selection: Citizen/Admin vs Officer vs Register */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('citizen');
              setErrorMsg('');
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'citizen'
                ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('officer');
              setErrorMsg('');
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'officer'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Officer ID</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'register'
                ? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Citizen / Admin Email Login */}
        {activeTab === 'citizen' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <span>Authenticating...</span> : <><LogIn className="w-4 h-4" /> Sign In with Email</>}
            </button>
          </form>
        )}

        {/* Tab 2: Field Officer Employee ID Login */}
        {activeTab === 'officer' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
              <strong>Field Officer Portal:</strong> Use your official Employee ID assigned by the municipal administration.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Officer Employee ID *</label>
              <div className="relative">
                <Wrench className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter Employee ID"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs font-mono uppercase tracking-wider text-amber-300 placeholder:text-slate-600 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <span>Authenticating Officer...</span> : <><LogIn className="w-4 h-4" /> Officer Workstation Login</>}
            </button>
          </form>
        )}

        {/* Tab 3: Citizen Registration (Public) */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] leading-relaxed">
              <strong>Citizen Account:</strong> Public registration automatically registers you as a Citizen to report issues, track resolutions, and vote on community priorities.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  placeholder="+1-555-0199"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <span>Creating Account...</span> : <><UserPlus className="w-4 h-4" /> Create Citizen Account</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
