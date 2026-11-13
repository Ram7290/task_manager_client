import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import {
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  Building2,
  TrendingUp,
  FileCheck,
  Plus,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getDashboard();
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-slate-400">Loading system overview...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Overview & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            High-level operational metrics across all departments, projects, and work submissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/tasks"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create & Assign Task
          </Link>
          <Link
            to="/admin/worklogs"
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            All Worklogs
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Employees</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.total_employees || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.total_managers || 0} Managers
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-600">{stats?.active_projects || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Company initiatives</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tasks</span>
            <CheckSquare className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-600">{stats?.total_tasks || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.task_status_counts?.IN_PROGRESS || 0} In Progress
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Submissions</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {stats?.submitted_reports_today || 0}
            <span className="text-xs text-slate-400 font-normal"> / {stats?.total_employees}</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.pending_submissions_today || 0} pending
          </span>
        </div>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Hours */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-blue-600" /> Logged Hours by Project
          </h3>
          <div className="space-y-3">
            {stats?.project_hours && Object.keys(stats.project_hours).length > 0 ? (
              Object.entries(stats.project_hours).map(([proj, hours]) => (
                <div
                  key={proj}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-800">{proj}</span>
                  <span className="text-xs font-black text-blue-600">{hours} hrs</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No submitted project hours yet.</p>
            )}
          </div>
        </div>

        {/* Department Hours */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" /> Logged Hours by Department
          </h3>
          <div className="space-y-3">
            {stats?.department_hours && Object.keys(stats.department_hours).length > 0 ? (
              Object.entries(stats.department_hours).map(([dept, hours]) => (
                <div
                  key={dept}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-800">{dept}</span>
                  <span className="text-xs font-black text-purple-600">{hours} hrs</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No submitted department hours yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
