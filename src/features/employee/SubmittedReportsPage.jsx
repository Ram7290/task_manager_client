import { LoadingSkeleton } from '../../components/ui/feedback';
import React, { useState, useEffect } from 'react';
import { worklogApi } from '../../lib/api';
import { formatMinutes } from '../../lib/utils';
import { Calendar, Clock, CheckCircle, ChevronDown, ChevronRight, FileText } from 'lucide-react';

export default function SubmittedReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await worklogApi.getMyReports();
        setReports(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const toggleExpand = (id) => {
    setExpandedReportId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Worklog History</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your submitted and draft daily reports
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No reports recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isExpanded = expandedReportId === report.id;
            const totalMinutes =
              report.worklogs?.reduce((sum, w) => sum + w.duration_minutes, 0) || 0;
            const isSubmitted = report.status === 'SUBMITTED';

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
                    <div className="p-2 rounded-lg bg-brand-light text-brand">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{report.report_date}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {report.worklogs?.length || 0} entries logged
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                        Logged
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {formatMinutes(totalMinutes)}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isSubmitted
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {report.status}
                    </span>
                    {report.auto_submitted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">
                        AUTO-SUBMITTED
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/60 divide-y divide-slate-100">
                    {report.worklogs?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 italic">No entries in this report.</p>
                    ) : (
                      report.worklogs.map((w) => (
                        <div key={w.id} className="py-3 flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
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
                                  ({w.project.name})
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{w.description}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                            {formatMinutes(w.duration_minutes)}
                          </span>
                        </div>
                      ))
                    )}
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
