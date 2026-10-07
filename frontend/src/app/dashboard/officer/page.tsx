'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../services/api';
import { IIssue } from '../../../types';
import { Sidebar } from '../../../components/Sidebar';
import { StatusBadge } from '../../../components/StatusBadge';
import { PriorityBadge } from '../../../components/PriorityBadge';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Clock,
  MapPin,
  Eye,
  KeyRound,
  ShieldCheck,
  Building,
  User,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function OfficerDashboardPage() {
  const router = useRouter();
  const { user, changePassword, loading: authLoading } = useAuth();
  const toast = useToast();
  const [issues, setIssues] = useState<IIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Status/Resolution Modal State
  const [activeIssue, setActiveIssue] = useState<IIssue | null>(null);
  const [newStatus, setNewStatus] = useState<string>('in_progress');
  const [remarks, setRemarks] = useState<string>('');
  const [resolutionFiles, setResolutionFiles] = useState<File[]>([]);
  const [updating, setUpdating] = useState<boolean>(false);

  // First-Login Password Change Modal
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterOverdue, setFilterOverdue] = useState<boolean>(false);

  const fetchOfficerIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterOverdue) params.append('overdue', 'true');

      const res = await api.get(`/officer/issues?${params.toString()}`);
      if (res.data.success) {
        setIssues(res.data.issues || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      if (user.role !== 'officer' && user.role !== 'admin') {
        router.push('/dashboard/citizen');
        return;
      }

      // Check if officer needs to change initial temporary password
      if (user.mustChangePassword) {
        setShowPasswordChangeModal(true);
      }

      fetchOfficerIssues();
    }
  }, [user, authLoading, router, filterStatus, filterPriority, filterOverdue]);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        toast.success('Password updated successfully! Welcome to your workstation.');
        setShowPasswordChangeModal(false);
      } else {
        setPasswordError(res.message || 'Failed to change password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error changing password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIssue) return;
    setUpdating(true);

    try {
      if (newStatus === 'resolved') {
        const formData = new FormData();
        formData.append('resolutionRemarks', remarks || 'Work completed on site.');
        resolutionFiles.forEach((file) => {
          formData.append('resolutionImages', file);
        });

        const res = await api.post(`/officer/issues/${activeIssue._id}/resolve`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data.success) {
          toast.success('Complaint marked as resolved! Resolution proof uploaded.');
          setActiveIssue(null);
          setResolutionFiles([]);
          setRemarks('');
          fetchOfficerIssues();
        }
      } else {
        const res = await api.put(`/officer/issues/${activeIssue._id}/status`, {
          status: newStatus,
          remarks,
        });

        if (res.data.success) {
          toast.success('Complaint status updated successfully.');
          setActiveIssue(null);
          setRemarks('');
          fetchOfficerIssues();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update task status.');
    } finally {
      setUpdating(false);
    }
  };

  const assignedCount = issues.filter((i) => i.status === 'assigned').length;
  const inProgressCount = issues.filter((i) => i.status === 'in_progress').length;
  const resolvedCount = issues.filter((i) => ['resolved', 'closed'].includes(i.status)).length;
  const overdueCount = issues.filter(
    (i) => new Date(i.slaDeadline).getTime() < Date.now() && !['resolved', 'closed'].includes(i.status)
  ).length;

  return (
    <div className="flex gap-8 pb-12">
      <Sidebar />

      <div className="flex-1 space-y-8">
        {/* Workstation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                <Wrench className="w-7 h-7 text-amber-400" />
                <span>Field Officer Workstation</span>
              </h1>
              {user?.employeeId && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-500/30">
                  {user.employeeId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Officer: <strong className="text-white">{user?.name}</strong> | Department:{' '}
              <strong className="text-sky-400">{user?.department || 'General Services'}</strong>
            </p>
          </div>

          <button
            onClick={() => setShowPasswordChangeModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Change Password</span>
          </button>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-purple-500/30 transition-all">
            <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block">Assigned Tasks</span>
            <p className="text-2xl font-black text-purple-400 mt-1">{assignedCount}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-sky-500/30 transition-all">
            <span className="text-[10px] font-mono text-sky-400 uppercase font-bold block">In Progress</span>
            <p className="text-2xl font-black text-sky-400 mt-1">{inProgressCount}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">Resolved</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{resolvedCount}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-rose-500/30 bg-rose-950/10">
            <span className="text-[10px] font-mono text-rose-400 uppercase font-bold block">SLA Breached</span>
            <p className="text-2xl font-black text-rose-400 mt-1">{overdueCount}</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs bg-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs bg-slate-900"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={() => setFilterOverdue(!filterOverdue)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              filterOverdue ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue SLA Only</span>
          </button>
        </div>

        {/* Assigned Issues Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Assigned Field Tasks ({issues.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Issue ID & Title</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">SLA Deadline</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading workstation tasks...
                    </td>
                  </tr>
                ) : issues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No assigned tasks found matching criteria.
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono font-bold text-sky-400 block">{issue.issueId}</span>
                        <span className="font-bold text-white block mt-0.5 max-w-xs truncate">{issue.title}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5 truncate">{issue.location}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-300">{issue.category}</td>
                      <td className="px-6 py-4">
                        <PriorityBadge
                          priority={issue.priority}
                          score={issue.priorityScore}
                          slaDeadline={issue.slaDeadline}
                          isResolved={['resolved', 'closed'].includes(issue.status)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                        {new Date(issue.slaDeadline).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/issues/${issue._id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        {!['resolved', 'closed'].includes(issue.status) && (
                          <button
                            onClick={() => {
                              setActiveIssue(issue);
                              setNewStatus(issue.status === 'assigned' ? 'in_progress' : 'resolved');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm"
                          >
                            <Wrench className="w-3.5 h-3.5" /> Update Work
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Task Status & Resolution Proof Modal */}
        {activeIssue && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-lg w-full p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  Update Task: <span className="text-sky-400">{activeIssue.issueId}</span>
                </h3>
                <button onClick={() => setActiveIssue(null)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs bg-slate-900"
                  >
                    <option value="in_progress">In Progress (Started Work)</option>
                    <option value="resolved">Resolved (Upload After Resolution Photo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Work Remarks</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter site inspection findings, repair details, or resolution notes..."
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                {newStatus === 'resolved' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Upload After-Resolution Proof Photo *
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) setResolutionFiles(Array.from(e.target.files));
                      }}
                      className="w-full text-xs text-slate-300"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveIssue(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20"
                  >
                    {updating ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal (First-time or On Demand) */}
        {showPasswordChangeModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-amber-500/40 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <span>{user?.mustChangePassword ? 'First Login: Set Your Password' : 'Change Password'}</span>
                </h3>
                {!user?.mustChangePassword && (
                  <button onClick={() => setShowPasswordChangeModal(false)} className="text-slate-400 hover:text-white">
                    ✕
                  </button>
                )}
              </div>

              {user?.mustChangePassword && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  For your account security, please create a personal password to replace the initial temporary password.
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {user?.mustChangePassword ? 'Temporary / Current Password' : 'Current Password'}
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">New Secure Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {!user?.mustChangePassword && (
                    <button
                      type="button"
                      onClick={() => setShowPasswordChangeModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
                  >
                    {changingPassword ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
