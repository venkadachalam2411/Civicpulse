'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../services/api';
import { IIssue, IUser, IAnalyticsData, ICategory } from '../../../types';
import { Sidebar } from '../../../components/Sidebar';
import { AnalyticsCharts } from '../../../components/AnalyticsCharts';
import { StatusBadge } from '../../../components/StatusBadge';
import { PriorityBadge } from '../../../components/PriorityBadge';
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  User,
  BarChart3,
  Wrench,
  CheckCircle2,
  UserPlus,
  Sliders,
  Tag,
  Plus,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  Building,
  KeyRound,
  XCircle,
  FileCheck,
  Edit2,
  Power,
  Sparkles,
  Copy,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [analytics, setAnalytics] = useState<IAnalyticsData | null>(null);
  const [issues, setIssues] = useState<IIssue[]>([]);
  const [officers, setOfficers] = useState<IUser[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'issues' | 'officers' | 'categories'>('analytics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Issues Table Filters & Search
  const [issueSearch, setIssueSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterOfficer, setFilterOfficer] = useState('');

  // Assignment Modal
  const [assignIssue, setAssignIssue] = useState<IIssue | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [assignRemarks, setAssignRemarks] = useState<string>('');
  const [assigning, setAssigning] = useState<boolean>(false);

  // Priority Override Modal
  const [overrideIssue, setOverrideIssue] = useState<IIssue | null>(null);
  const [overridePriority, setOverridePriority] = useState<string>('high');
  const [overrideScore, setOverrideScore] = useState<number>(85);
  const [overriding, setOverriding] = useState<boolean>(false);

  // Add Officer Modal
  const [showAddOfficerModal, setShowAddOfficerModal] = useState<boolean>(false);
  const [newOfficerData, setNewOfficerData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department: 'Roads & Infrastructure',
    employeeId: '',
  });
  const [addingOfficer, setAddingOfficer] = useState<boolean>(false);
  const [officerErrorMsg, setOfficerErrorMsg] = useState<string>('');
  const [createdOfficerInfo, setCreatedOfficerInfo] = useState<{
    name: string;
    employeeId: string;
    email: string;
    tempPassword: string;
  } | null>(null);

  // Edit Officer Modal
  const [editingOfficer, setEditingOfficer] = useState<IUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    active: true,
  });
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, issuesRes, officersRes, categoriesRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/issues'),
        api.get('/admin/officers'),
        api.get('/categories/admin'),
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data);
      if (issuesRes.data.success) setIssues(issuesRes.data.issues || []);
      if (officersRes.data.success) setOfficers(officersRes.data.officers || []);
      if (categoriesRes.data.success) setCategories(categoriesRes.data.categories || []);
    } catch (err: any) {
      console.error('Failed to fetch admin data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch live database analytics.');
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
      if (user.role !== 'admin') {
        router.push(user.role === 'officer' ? '/dashboard/officer' : '/dashboard/citizen');
        return;
      }
      fetchAdminData();
    }
  }, [user, authLoading, router]);

  // Open Create Officer Modal & Auto-Fetch Next Details
  const handleOpenAddOfficer = async () => {
    setOfficerErrorMsg('');
    setCreatedOfficerInfo(null);
    setShowAddOfficerModal(true);

    try {
      const res = await api.get('/admin/officers/next-id');
      if (res.data.success) {
        setNewOfficerData({
          name: '',
          email: '',
          password: res.data.suggestedPassword || '',
          phone: '',
          department: 'Roads & Infrastructure',
          employeeId: res.data.nextEmployeeId || 'OFC001',
        });
      }
    } catch (err) {
      console.error('Error getting next officer ID:', err);
    }
  };

  // Auto generate email as Admin types officer name
  const handleOfficerNameChange = async (name: string) => {
    setNewOfficerData((prev) => {
      const sanitized = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '.');
      const autoEmail = sanitized ? `${sanitized}@civicpulse.com` : '';
      return { ...prev, name, email: autoEmail };
    });
  };

  // Handle Verify or Reject Complaint
  const handleVerifyComplaint = async (id: string, action: 'verify' | 'reject') => {
    try {
      const remarks = action === 'reject' ? 'Rejected by administrator.' : 'Verified by administrator.';
      const res = await api.put(`/admin/issues/${id}/verify`, { action, remarks });
      if (res.data.success) {
        toast.success(
          action === 'verify'
            ? 'Complaint verified successfully.'
            : 'Complaint rejected successfully.'
        );
        fetchAdminData();
      } else {
        toast.error(res.data.message || 'Unable to verify complaint.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Unable to verify complaint.');
    }
  };

  // Handle Assign Officer
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignIssue) return;
    if (!selectedOfficerId) {
      toast.info('Please select an officer first.');
      return;
    }

    setAssigning(true);
    try {
      const res = await api.put(`/admin/issues/${assignIssue._id}/assign`, {
        officerId: selectedOfficerId,
        remarks: assignRemarks,
      });

      if (res.data.success) {
        toast.success('Complaint assigned successfully.');
        setAssignIssue(null);
        setAssignRemarks('');
        fetchAdminData();
      } else {
        toast.error(res.data.message || 'Failed to assign officer.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to assign officer.');
    } finally {
      setAssigning(false);
    }
  };

  // Handle Priority Override
  const handlePriorityOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideIssue) return;

    setOverriding(true);
    try {
      const res = await api.put(`/admin/issues/${overrideIssue._id}/priority`, {
        priority: overridePriority,
        priorityScore: overrideScore,
      });

      if (res.data.success) {
        toast.success('Priority score and SLA deadline updated successfully.');
        setOverrideIssue(null);
        fetchAdminData();
      } else {
        toast.error(res.data.message || 'Failed to update priority.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update priority.');
    } finally {
      setOverriding(false);
    }
  };

  // Handle Create Officer Submit
  const handleCreateOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerErrorMsg('');
    setAddingOfficer(true);

    try {
      const res = await api.post('/admin/officers', newOfficerData);
      if (res.data.success) {
        toast.success('Officer created successfully.');
        setCreatedOfficerInfo({
          name: res.data.officer.name,
          employeeId: res.data.officer.employeeId,
          email: res.data.officer.email,
          tempPassword: res.data.tempPassword || newOfficerData.password,
        });
        fetchAdminData();
      } else {
        setOfficerErrorMsg(res.data.message || 'Failed to add officer.');
      }
    } catch (err: any) {
      setOfficerErrorMsg(err.response?.data?.message || err.message || 'Error adding officer.');
    } finally {
      setAddingOfficer(false);
    }
  };

  // Handle Toggle Officer Status (Active / Inactive)
  const handleToggleOfficerStatus = async (officer: IUser) => {
    const newStatus = !officer.active;

    try {
      const res = await api.patch(`/admin/officers/${officer._id}/status`, { active: newStatus });
      if (res.data.success) {
        toast.success(
          res.data.message ||
            (newStatus
              ? `Officer ${officer.name} activated successfully.`
              : `Officer ${officer.name} deactivated successfully.`)
        );
        fetchAdminData();
      } else {
        toast.error(res.data.message || 'Failed to update officer status.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update officer status.');
    }
  };

  // Handle Open Edit Officer Modal
  const handleOpenEditOfficer = (officer: IUser) => {
    setEditingOfficer(officer);
    setEditFormData({
      name: officer.name,
      email: officer.email,
      phone: officer.phone || '',
      department: officer.department || 'Roads & Infrastructure',
      active: officer.active !== false,
    });
  };

  // Handle Save Edit Officer
  const handleSaveEditOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;
    setSavingEdit(true);

    try {
      const res = await api.put(`/admin/officers/${editingOfficer._id}`, editFormData);
      if (res.data.success) {
        toast.success('Officer profile updated successfully.');
        setEditingOfficer(null);
        fetchAdminData();
      } else {
        toast.error(res.data.message || 'Failed to update officer.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update officer.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    try {
      const res = await api.post('/categories', { name: newCatName, description: newCatDesc });
      if (res.data.success) {
        toast.success('Category created successfully.');
        setNewCatName('');
        setNewCatDesc('');
        fetchAdminData();
      } else {
        toast.error(res.data.message || 'Failed to add category.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add category.');
    }
  };

  // Filtered Issues for table
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      !issueSearch ||
      issue.title.toLowerCase().includes(issueSearch.toLowerCase()) ||
      issue.issueId.toLowerCase().includes(issueSearch.toLowerCase()) ||
      issue.location.toLowerCase().includes(issueSearch.toLowerCase()) ||
      issue.category.toLowerCase().includes(issueSearch.toLowerCase());

    const matchesStatus = !filterStatus || issue.status === filterStatus;
    const matchesPriority = !filterPriority || issue.priority === filterPriority;
    const matchesOfficer = !filterOfficer || (issue.assignedTo && issue.assignedTo._id === filterOfficer);

    return matchesSearch && matchesStatus && matchesPriority && matchesOfficer;
  });

  const metrics = analytics?.metrics;

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 pt-3 sm:pt-6 pb-20 max-w-7xl mx-auto w-full">
      <Sidebar />

      <div className="flex-1 space-y-9 min-w-0">
        {/* Header & Tabs */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2 border-b border-slate-800/60">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-sky-400 shrink-0" />
              <span>Admin Control Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
              Verify community complaints, assign department officers, manage Employee IDs, monitor SLA compliance, and dispatch work.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel border border-slate-800/90 text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Analytics & KPIs
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'issues'
                  ? 'bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Complaints Registry ({issues.length})
            </button>
            <button
              onClick={() => setActiveTab('officers')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'officers'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Officer Management ({officers.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Categories
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchAdminData}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Counter KPI Cards */}
        {loading && !analytics ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5 sm:gap-4 my-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="glass-card p-4 sm:p-4.5 rounded-2xl border border-slate-800 animate-pulse">
                <div className="h-3 w-12 bg-slate-800 rounded mx-auto mb-2" />
                <div className="h-7 w-16 bg-slate-800 rounded mx-auto" />
              </div>
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5 sm:gap-4 my-2">
            <div className="glass-card p-4 sm:p-4.5 rounded-2xl border border-slate-800 text-center hover:border-slate-700 transition-all">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Total</span>
              <p className="text-2xl font-black text-white mt-1">{metrics.totalIssues ?? 0}</p>
            </div>
            <div className="glass-card p-4 sm:p-4.5 rounded-2xl border border-slate-800 text-center hover:border-amber-500/30 transition-all">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">Pending</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{metrics.pendingIssues ?? 0}</p>
            </div>
            <div className="glass-card p-4 sm:p-4.5 rounded-2xl border border-slate-800 text-center hover:border-indigo-500/30 transition-all">
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block">Verified</span>
              <p className="text-2xl font-black text-indigo-400 mt-1">{metrics.verifiedIssues ?? 0}</p>
            </div>
            <div className="glass-card p-4 sm:p-4.5 rounded-2xl border border-slate-800 text-center hover:border-blue-500/30 transition-all">
              <span className="text-[10px] font-mono text-blue-400 uppercase font-bold block">In Progress</span>
              <p className="text-2xl font-black text-blue-400 mt-1">{metrics.inProgressIssues ?? 0}</p>
            </div>
            <div className="glass-card p-4 sm:p-4.5 rounded-2xl border border-slate-800 text-center hover:border-emerald-500/30 transition-all">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">Resolved</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{(metrics.resolvedIssues ?? 0) + (metrics.closedIssues ?? 0)}</p>
            </div>
            <div className="glass-card p-4 sm:p-4.5 rounded-2xl border border-rose-500/40 bg-rose-950/15 text-center">
              <span className="text-[10px] font-mono text-rose-400 uppercase font-bold block">SLA Breached</span>
              <p className="text-2xl font-black text-rose-400 mt-1">{metrics.slaBreached ?? metrics.slaBreachedIssues ?? 0}</p>
            </div>
            <div className="glass-card p-4 sm:p-4.5 rounded-2xl border border-sky-500/40 bg-sky-950/15 text-center">
              <span className="text-[10px] font-mono text-sky-400 uppercase font-bold block">Resolution Rate</span>
              <p className="text-2xl font-black text-sky-400 mt-1">{metrics.resolutionRate ?? 0}%</p>
            </div>
          </div>
        ) : null}

        {/* Tab 1: Analytics & KPIs */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-8 pt-2">
            <AnalyticsCharts data={analytics} />
          </div>
        )}

        {/* Tab 2: Complaints Registry & Verification */}
        {activeTab === 'issues' && (
          <div className="space-y-6 pt-2">
            {/* Filter & Search Toolbar */}
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800/90 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={issueSearch}
                    onChange={(e) => setIssueSearch(e.target.value)}
                    placeholder="Search by ID (CIV-2026-XXXXX), title, category, or location..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
                {(issueSearch || filterStatus || filterPriority || filterOfficer) && (
                  <button
                    onClick={() => {
                      setIssueSearch('');
                      setFilterStatus('');
                      setFilterPriority('');
                      setFilterOfficer('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs bg-slate-900"
                  >
                    <option value="">All Statuses</option>
                    <option value="reported">Reported (Needs Verification)</option>
                    <option value="under_review">Under Review</option>
                    <option value="verified">Verified (Ready to Assign)</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter by Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs bg-slate-900"
                  >
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter by Assigned Officer</label>
                  <select
                    value={filterOfficer}
                    onChange={(e) => setFilterOfficer(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs bg-slate-900"
                  >
                    <option value="">All Field Officers</option>
                    {officers.map((off) => (
                      <option key={off._id} value={off._id}>
                        {off.employeeId ? `[${off.employeeId}] ` : ''}{off.name} ({off.department || 'Officer'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Issues Table */}
            <div className="glass-panel rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl">
              <div className="px-6 py-4.5 border-b border-slate-800 bg-slate-900/70 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4.5 h-4.5 text-sky-400" />
                  <span>Complaints Registry ({filteredIssues.length})</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3">Issue ID & Details</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Priority Score</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Assigned Officer</th>
                      <th className="px-6 py-3 text-right">Verification & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Loading complaints registry...
                        </td>
                      </tr>
                    ) : filteredIssues.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No complaints match your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.map((issue) => (
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
                              isResolved={['resolved', 'closed', 'rejected'].includes(issue.status)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={issue.status} />
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-amber-400">
                            {issue.assignedTo ? (
                              <div>
                                <span className="block text-white font-bold flex items-center gap-1">
                                  {issue.assignedTo.employeeId && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                                      {issue.assignedTo.employeeId}
                                    </span>
                                  )}
                                  <span>{issue.assignedTo.name}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal block">{issue.assignedTo.department}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                            <Link
                              href={`/issues/${issue._id}`}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-bold text-[11px] inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </Link>

                            {/* Verification Buttons */}
                            {['reported', 'under_review'].includes(issue.status) && (
                              <>
                                <button
                                  onClick={() => handleVerifyComplaint(issue._id, 'verify')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1 border border-emerald-500/30"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                                </button>
                                <button
                                  onClick={() => handleVerifyComplaint(issue._id, 'reject')}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] inline-flex items-center gap-1 border border-rose-500/30"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </>
                            )}

                            {/* Assignment Button */}
                            {!['resolved', 'closed', 'rejected'].includes(issue.status) && (
                              <button
                                onClick={() => {
                                  setAssignIssue(issue);
                                  if (officers.length > 0) setSelectedOfficerId(officers[0]._id!);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-[11px] inline-flex items-center gap-1 border border-sky-500/30"
                              >
                                <Wrench className="w-3.5 h-3.5" /> {issue.assignedTo ? 'Reassign' : 'Assign'}
                              </button>
                            )}

                            {/* Priority Override Button */}
                            {!['resolved', 'closed', 'rejected'].includes(issue.status) && (
                              <button
                                onClick={() => {
                                  setOverrideIssue(issue);
                                  setOverridePriority(issue.priority);
                                  setOverrideScore(issue.priorityScore);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] inline-flex items-center gap-1 border border-amber-500/30"
                              >
                                <Sliders className="w-3.5 h-3.5" /> Score
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
          </div>
        )}

        {/* Tab 3: Officer Management Section */}
        {activeTab === 'officers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Officer Management ({officers.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Manage municipal field officers, Employee IDs (OFC001+), accounts, and active workloads.
                </p>
              </div>

              <button
                onClick={handleOpenAddOfficer}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Create Officer</span>
              </button>
            </div>

            {/* Official Officer Management Table */}
            <div className="glass-panel rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/70 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Field Officers Registry</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Employee ID</th>
                      <th className="px-6 py-3.5">Name</th>
                      <th className="px-6 py-3.5">Department</th>
                      <th className="px-6 py-3.5">Official Email</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Assigned Issues</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {officers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No field officers created yet. Click "+ Create Officer" to onboard officers.
                        </td>
                      </tr>
                    ) : (
                      officers.map((off) => (
                        <tr key={off._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold">
                            <span className="px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px]">
                              {off.employeeId || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-white">{off.name}</td>
                          <td className="px-6 py-4 text-slate-300">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-sky-300">
                              {off.department || 'General'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] text-sky-400">{off.email}</td>
                          <td className="px-6 py-4">
                            {off.active !== false ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-amber-400">
                            <span>{off.activeTasks ?? 0}</span>
                            <span className="text-[10px] text-slate-500 font-normal ml-1">active</span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setFilterOfficer(off._id!);
                                setActiveTab('issues');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold inline-flex items-center gap-1"
                              title="Filter complaints assigned to this officer"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-400" /> Tasks
                            </button>

                            <button
                              onClick={() => handleOpenEditOfficer(off)}
                              className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] font-semibold inline-flex items-center gap-1 border border-sky-500/30"
                              title="Edit Officer Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>

                            <button
                              onClick={() => handleToggleOfficerStatus(off)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 border ${
                                off.active !== false
                                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                              }`}
                              title={off.active !== false ? 'Deactivate officer' : 'Activate officer'}
                            >
                              <Power className="w-3.5 h-3.5" /> {off.active !== false ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Categories Manager */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <form onSubmit={handleAddCategory} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-400" /> Add New Category
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Environmental Health"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Scope of civic issues covered by this category..."
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/20"
              >
                Create Category
              </button>
            </form>

            <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Active Municipal Categories ({categories.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <div key={cat._id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <h4 className="text-xs font-bold text-white">{cat.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{cat.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Field Officer Modal */}
        {showAddOfficerModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card max-w-lg w-full p-6 rounded-3xl border border-amber-500/30 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                  <span>Onboard Municipal Field Officer</span>
                </h3>
                <button
                  onClick={() => {
                    setShowAddOfficerModal(false);
                    setCreatedOfficerInfo(null);
                  }}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {createdOfficerInfo ? (
                /* Success Credential Screen */
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Officer Account Created Successfully!</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Welcome email with login instructions has been dispatched via Amazon SES.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Employee ID:</span>
                      <strong className="text-amber-400 text-sm">{createdOfficerInfo.employeeId}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Officer Name:</span>
                      <strong className="text-white">{createdOfficerInfo.name}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Official Email:</span>
                      <strong className="text-sky-400">{createdOfficerInfo.email}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Temporary Password:</span>
                      <strong className="text-emerald-400">{createdOfficerInfo.tempPassword}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowAddOfficerModal(false);
                      setCreatedOfficerInfo(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md"
                  >
                    Done & Return to Registry
                  </button>
                </div>
              ) : (
                /* Create Officer Form */
                <>
                  {officerErrorMsg && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      {officerErrorMsg}
                    </div>
                  )}

                  <form onSubmit={handleCreateOfficerSubmit} className="space-y-3.5">
                    {/* Employee ID (Auto-Generated) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Employee ID <span className="text-amber-400 font-normal">(Auto-generated unique ID)</span>
                      </label>
                      <input
                        type="text"
                        value={newOfficerData.employeeId}
                        onChange={(e) => setNewOfficerData({ ...newOfficerData, employeeId: e.target.value })}
                        placeholder="OFC001"
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-bold text-amber-300 uppercase"
                      />
                    </div>

                    {/* Officer Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={newOfficerData.name}
                          onChange={(e) => handleOfficerNameChange(e.target.value)}
                          placeholder="e.g. Arun Kumar"
                          className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs"
                        />
                      </div>
                    </div>

                    {/* Official Email (Auto-Generated) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Official CivicPulse Email <span className="text-sky-400 font-normal">(Auto-generated)</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          value={newOfficerData.email}
                          onChange={(e) => setNewOfficerData({ ...newOfficerData, email: e.target.value })}
                          placeholder="arun.kumar@civicpulse.com"
                          className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs font-mono text-sky-400"
                        />
                      </div>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <select
                          value={newOfficerData.department}
                          onChange={(e) => setNewOfficerData({ ...newOfficerData, department: e.target.value })}
                          className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs bg-slate-900"
                        >
                          <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                          <option value="Water & Sanitation Dept">Water & Sanitation Dept</option>
                          <option value="Electrical & Power Grid">Electrical & Power Grid</option>
                          <option value="Waste & Garbage Management">Waste & Garbage Management</option>
                          <option value="Traffic & Public Safety">Traffic & Public Safety</option>
                          <option value="Parks & Public Properties">Parks & Public Properties</option>
                        </select>
                      </div>
                    </div>

                    {/* Temporary Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Initial Temporary Password <span className="text-slate-400 font-normal">(Required to change on first login)</span>
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={newOfficerData.password}
                          onChange={(e) => setNewOfficerData({ ...newOfficerData, password: e.target.value })}
                          placeholder="Temporary password"
                          className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={newOfficerData.phone}
                          onChange={(e) => setNewOfficerData({ ...newOfficerData, phone: e.target.value })}
                          placeholder="+1-555-0199"
                          className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowAddOfficerModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingOfficer}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md"
                      >
                        {addingOfficer ? 'Creating Officer...' : 'Create Officer & Dispatch SES Email'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* Edit Officer Modal */}
        {editingOfficer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-sky-500/30 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-sky-400" />
                  <span>Edit Officer: {editingOfficer.employeeId}</span>
                </h3>
                <button onClick={() => setEditingOfficer(null)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEditOfficer} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-900"
                  >
                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                    <option value="Water & Sanitation Dept">Water & Sanitation Dept</option>
                    <option value="Electrical & Power Grid">Electrical & Power Grid</option>
                    <option value="Waste & Garbage Management">Waste & Garbage Management</option>
                    <option value="Traffic & Public Safety">Traffic & Public Safety</option>
                    <option value="Parks & Public Properties">Parks & Public Properties</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editActive"
                    checked={editFormData.active}
                    onChange={(e) => setEditFormData({ ...editFormData, active: e.target.checked })}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                  <label htmlFor="editActive" className="text-xs text-slate-300 font-semibold cursor-pointer">
                    Account Active
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingOfficer(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20"
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Officer Modal */}
        {assignIssue && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Assign Work: {assignIssue.issueId}</h3>
                  <p className="text-[11px] text-slate-400 truncate">{assignIssue.title}</p>
                </div>
                <button onClick={() => setAssignIssue(null)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Department Officer *</label>
                  <select
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs bg-slate-900"
                  >
                    {officers.map((off) => (
                      <option key={off._id} value={off._id}>
                        {off.employeeId ? `[${off.employeeId}] ` : ''}{off.name} ({off.department || 'Field Officer'}) — {off.activeTasks || 0} active tasks
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Instructions / Remarks</label>
                  <textarea
                    rows={3}
                    value={assignRemarks}
                    onChange={(e) => setAssignRemarks(e.target.value)}
                    placeholder="e.g. Inspect site immediately, clear debris, and upload resolution photos upon completion."
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignIssue(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning}
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20"
                  >
                    {assigning ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Priority Override Modal */}
        {overrideIssue && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Override Priority: {overrideIssue.issueId}</h3>
                <button onClick={() => setOverrideIssue(null)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handlePriorityOverrideSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Level</label>
                  <select
                    value={overridePriority}
                    onChange={(e) => setOverridePriority(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs bg-slate-900"
                  >
                    <option value="critical">Critical (12h SLA Deadline)</option>
                    <option value="high">High (24h SLA Deadline)</option>
                    <option value="medium">Medium (72h SLA Deadline)</option>
                    <option value="low">Low (168h SLA Deadline)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Score (0–100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOverrideIssue(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={overriding}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                  >
                    {overriding ? 'Saving...' : 'Save Override'}
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
