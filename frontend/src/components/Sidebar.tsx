'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Wrench,
  ShieldCheck,
  Compass,
  MapPin,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const citizenLinks = [
    { label: 'My Complaints', href: '/dashboard/citizen', icon: FileText },
    { label: 'Report New Issue', href: '/report', icon: PlusCircle },
    { label: 'Explore Community', href: '/explore', icon: Compass },
    { label: 'City Map View', href: '/map', icon: MapPin },
  ];

  const officerLinks = [
    { label: 'Assigned Workstation', href: '/dashboard/officer', icon: Wrench },
    { label: 'Explore Issues', href: '/explore', icon: Compass },
    { label: 'City Map View', href: '/map', icon: MapPin },
  ];

  const adminLinks = [
    { label: 'Admin Control Center', href: '/dashboard/admin', icon: ShieldCheck },
    { label: 'Explore Community', href: '/explore', icon: Compass },
    { label: 'City Map View', href: '/map', icon: MapPin },
  ];

  let links = citizenLinks;
  if (user.role === 'officer') links = officerLinks;
  if (user.role === 'admin') links = adminLinks;

  const getRoleBadgeStyle = (role: string) => {
    if (role === 'admin') return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    if (role === 'officer') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
  };

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="glass-panel rounded-2xl p-4 sticky top-24 border border-slate-800 space-y-6">
        <div className="px-3.5 py-3 bg-slate-900/90 rounded-xl border border-slate-800">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Signed in as</p>
          <p className="text-xs font-bold text-white truncate mt-0.5">{user.name}</p>
          <span
            className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRoleBadgeStyle(
              user.role
            )}`}
          >
            {user.role}
          </span>
        </div>

        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 px-3 mb-2">
            Portal Navigation
          </p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-sky-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
