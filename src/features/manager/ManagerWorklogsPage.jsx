import { LoadingSkeleton } from '../../components/ui/feedback';
import React, { useState, useEffect } from 'react';
import { managerApi } from '../../lib/api';
import { formatMinutes } from '../../lib/utils';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  Filter,
  User,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function ManagerWorklogsPage() {
  const [reports, setReports] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedEmployeeId) params.employee_id = selectedEmployeeId;

      const [reportsRes, teamRes] = await Promise.all([
        managerApi.getSubmittedWorklogs(params),
        managerApi.getTeam(),
      ]);

      setReports(reportsRes.data);
      setTeam(teamRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEmployeeId]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Submitted Team Worklogs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review completed and submitted daily work reports from your team
          </p>
        </div>

        {/* Filter by Team Member */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Employee:
          </span>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="">All Team Members</option>
            {team.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Privacy Notice Alert */}
      <div className="bg-brand-light border border-brand-light rounded-xl p-4 flex items-center gap-3 text-brand-dark text-xs">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-brand" />
        <div>
          <span className="font-bold">Privacy Guard Active: </span>
          Only finalized reports that employees have explicitly submitted are displayed here. In
          accordance with system privacy rules, in-progress draft logs are strictly hidden from
          management until submitted.
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <LoadingSkeleton />
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No submitted reports found</p>
          <p className="text-xs text-slate-500 mt-1">
            Reports will appear here once team members finish and submit their daily logs.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            const totalMinutes =
              report.worklogs?.reduce((sum, w) => sum + w.duration_minutes, 0) || 0;

            return (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition"
              >
                <div
                  onClick={() => toggleExpand(report.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                      {report.employee?.first_name?.[0]}
                      {report.employee?.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {report.employee?.first_name} {report.employee?.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Date: {report.report_date}
                        </span>
                        <span>•</span>
                        <span>
                          Submitted:{' '}
                          {report.submitted_at
                            ? new Date(report.submitted_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Total Effort
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {formatMinutes(totalMinutes)}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      SUBMITTED
                    </span>

                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Expanded entries */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/70 divide-y divide-slate-100">
                    {report.worklogs?.map((w) => (
                      <div key={w.id} className="py-3 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-light text-brand-dark">
                              {w.category?.name}
                            </span>
                            {w.task && (
                              <span className="text-xs font-semibold text-slate-800">
                                Task: {w.task.title}
                              </span>
                            )}
                            {w.project && (
                              <span className="text-[10px] text-slate-500">
                                Project: {w.project.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {w.description}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          {formatMinutes(w.duration_minutes)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
