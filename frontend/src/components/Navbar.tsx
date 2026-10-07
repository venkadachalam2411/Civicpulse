'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  PlusCircle,
  Compass,
  MapPin,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Wrench,
  FileText,
  LogIn,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'officer') return '/dashboard/officer';
    return '/dashboard/citizen';
  };

  const getDashboardLabel = () => {
    if (!user) return 'Sign In';
    if (user.role === 'admin') return 'Admin Center';
    if (user.role === 'officer') return 'Workstation';
    return 'My Complaints';
  };

  const getDashboardIcon = () => {
    if (user?.role === 'admin') return ShieldCheck;
    if (user?.role === 'officer') return Wrench;
    return FileText;
  };

  const DashboardIcon = getDashboardIcon();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
              Civic<span className="text-sky-400">Pulse</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block -mt-1">
              Report. Track. Resolve.
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {user && (
            <Link
              href={getDashboardLink()}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/dashboard')
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <DashboardIcon className="w-4 h-4 text-sky-400" />
              <span>{getDashboardLabel()}</span>
            </Link>
          )}

          <Link
            href="/explore"
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              pathname === '/explore'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explore Issues</span>
          </Link>

          <Link
            href="/map"
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              pathname === '/map'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>City Map</span>
          </Link>
        </nav>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Show "Report Issue" only to Citizen (not Admin, not Officer, not Guests) */}
          {user && user.role === 'citizen' && (
            <Link
              href="/report"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Issue</span>
            </Link>
          )}

          {user && <NotificationBell />}

          {/* User Menu or Guest Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center font-bold text-sky-300 text-xs uppercase">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-semibold text-white block leading-tight">{user.name}</span>
                  <span className="text-[10px] uppercase font-bold text-sky-400 block">{user.role}</span>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-2xl border border-slate-800 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-sky-500/20 text-sky-300">
                      {user.role}
                    </span>
                  </div>

                  <Link
                    href={getDashboardLink()}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  >
                    <LayoutDashboard className="w-4 h-4 text-sky-400" />
                    {user.role === 'admin'
                      ? 'Admin Control Center'
                      : user.role === 'officer'
                      ? 'Officer Workstation'
                      : 'Citizen Portal'}
                  </Link>

                  {user.role === 'citizen' && (
                    <Link
                      href="/report"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      Report Issue
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/80 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-sky-400" />
                Sign In
              </Link>

              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
