import React, { useState, useEffect } from 'react';
import { managerApi } from '../../lib/api';
import { formatMinutes } from '../../lib/utils';
import {
  Users,
  CheckSquare,
  Clock,
  AlertCircle,
  TrendingUp,
  FileCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, teamRes] = await Promise.all([
          managerApi.getDashboard(),
          managerApi.getTeam(),
        ]);
        setStats(dashRes.data);
        setTeam(teamRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-slate-400">Loading manager dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Team task allocations, progress tracking, and daily work visibility
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/manager/tasks"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            + Create & Assign Task
          </Link>
          <Link
            to="/manager/worklogs"
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Review Team Worklogs
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Team Members</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.total_team_members || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">In your authorized scope</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tasks In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{stats?.tasks_in_progress || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.tasks_assigned || 0} total assigned tasks
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue Tasks</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600">{stats?.tasks_overdue || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Requires attention</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Reports</span>
            <FileCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {stats?.submitted_reports_today || 0}
            <span className="text-xs text-slate-400 font-normal"> / {stats?.total_team_members}</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.pending_submissions_today || 0} pending submission
          </span>
        </div>
      </div>

      {/* Team Roster Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Authorized Team Members</h2>

        {team.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 italic">
            No employees currently mapped to your management scope. Ask an administrator to assign
            team members.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Employee</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold">Active Assignments</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {team.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {member.first_name} {member.last_name}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {member.email}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {member.department?.name || 'Engineering'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">
                        {member.taskAssignments?.length || 0} active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/manager/worklogs?employee_id=${member.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        View Reports
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
