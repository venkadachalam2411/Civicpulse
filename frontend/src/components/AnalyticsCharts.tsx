'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { IAnalyticsData } from '../types';
import { BarChart3, TrendingUp, PieChart as PieIcon, Users } from 'lucide-react';

interface AnalyticsChartsProps {
  data: IAnalyticsData;
}

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data }) => {
  const categoryData = data.categoryStats || data.issuesByCategory || [];
  const priorityData = data.priorityStats || data.issuesByPriority || [];
  const monthlyData = data.monthlyTrends || [];
  const officerData = data.officerWorkload || [];

  const totalComplaints = data.metrics?.totalIssues ?? data.totalIssues ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Issues by Category Bar Chart */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <span>Complaints by Category</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Live MongoDB Data</span>
        </div>

        <div className="h-64 w-full">
          {categoryData.length > 0 && categoryData.some((c) => c.count > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                />
                <Bar dataKey="count" name="Complaints" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <p>No complaints reported yet in any category.</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trends Line Chart */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Monthly Report & Resolution Trends</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Past 6 Months</span>
        </div>

        <div className="h-64 w-full">
          {monthlyData.length > 0 && monthlyData.some((m) => m.total > 0 || m.resolved > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total Reported" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <p>No monthly trends data available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Issues by Priority Pie Chart */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-amber-400" />
            <span>Priority Distribution</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Real-time Tiers</span>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {priorityData.length > 0 && priorityData.some((p) => p.count > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  nameKey="priority"
                  label={({ priority, count }) => `${priority.toUpperCase()}: ${count}`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <p>No priority data recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Officer Workload Chart */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Officer Workload & Resolution Capacity</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Assigned vs Resolved</span>
        </div>

        <div className="h-64 w-full">
          {officerData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={officerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Bar dataKey="assigned" name="Active Tasks" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved Tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <p>No field officers registered yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
