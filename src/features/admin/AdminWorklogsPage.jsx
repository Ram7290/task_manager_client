import React, { useState, useEffect } from 'react';
import { adminApi, worklogApi } from '../../lib/api';
import { formatMinutes } from '../../lib/utils';
import {
  FileText,
  Calendar,
  Clock,
  ShieldAlert,
  AlertCircle,
  Edit3,
  CheckCircle,
  Plus,
  Trash2,
} from 'lucide-react';

export default function AdminWorklogsPage() {
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Controlled Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [targetReport, setTargetReport] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionEntries, setCorrectionEntries] = useState([]);
  const [applyingCorrection, setApplyingCorrection] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsRes, catsRes] = await Promise.all([
        adminApi.getWorklogs(),
        worklogApi.getCategories(),
      ]);
      setReports(reportsRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCorrection = (report) => {
    setTargetReport(report);
    setCorrectionReason('');
    // populate existing entries
    const initialEntries = (report.worklogs || []).map((w) => ({
      category_id: w.category_id,
      description: w.description,
      duration_minutes: w.duration_minutes,
      task_id: w.task_id || null,
      project_id: w.project_id || null,
    }));
    setCorrectionEntries(initialEntries);
    setShowCorrectionModal(true);
  };

  const updateEntryField = (index, field, value) => {
    setCorrectionEntries((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleApplyCorrection = async (e) => {
    e.preventDefault();
    if (!correctionReason.trim() || correctionReason.trim().length < 5) {
      alert('A valid mandatory reason (minimum 5 characters) is required for audited corrections.');
      return;
    }

    try {
      setApplyingCorrection(true);
      await adminApi.correctReport(targetReport.id, {
        reason: correctionReason.trim(),
        entries: correctionEntries,
      });
      setShowCorrectionModal(false);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setApplyingCorrection(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Submitted Worklogs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Company-wide submitted reports with controlled, audited administrative correction support
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading company worklogs...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No submitted reports found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const totalMinutes =
              report.worklogs?.reduce((sum, w) => sum + w.duration_minutes, 0) || 0;
            const hasCorrections = report.corrections && report.corrections.length > 0;

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-sm">
                      {report.employee?.first_name?.[0]}
                      {report.employee?.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {report.employee?.first_name} {report.employee?.last_name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {report.employee?.department?.name || 'Engineering'} • Date:{' '}
                        {report.report_date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Effort
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {formatMinutes(totalMinutes)}
                      </span>
                    </div>

                    {hasCorrections && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                        CORRECTED ({report.corrections.length})
                      </span>
                    )}

                    <button
                      onClick={() => openCorrection(report)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Audited Correction
                    </button>
                  </div>
                </div>

                {/* Entries */}
                <div className="divide-y divide-slate-100">
                  {report.worklogs?.map((w) => (
                    <div key={w.id} className="py-2.5 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
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
                      <span className="text-xs font-bold text-slate-800">
                        {formatMinutes(w.duration_minutes)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Correction Audit trail if present */}
                {hasCorrections && (
                  <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3 text-xs text-purple-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-purple-800">
                      <ShieldAlert className="w-3.5 h-3.5" /> Audit History:
                    </span>
                    {report.corrections.map((c) => (
                      <p key={c.id} className="text-[11px] text-purple-700">
                        • Corrected by {c.corrector?.first_name} {c.corrector?.last_name}: "
                        {c.reason}" on {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Controlled Correction Modal */}
      {showCorrectionModal && targetReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Audited Report Correction — {targetReport.employee?.first_name}{' '}
                  {targetReport.employee?.last_name}
                </h2>
                <p className="text-xs text-slate-500">Date: {targetReport.report_date}</p>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyCorrection} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                <strong>Administrative Rule:</strong> All corrections are permanent and recorded in
                the immutable audit history with before/after snapshots.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mandatory Correction Justification / Reason *
                </label>
                <textarea
                  rows={2}
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="State the formal reason why this submitted report is being modified..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Entries
                </label>
                <div className="space-y-3">
                  {correctionEntries.map((entry, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={entry.category_id}
                          onChange={(e) => updateEntryField(idx, 'category_id', e.target.value)}
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xs"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step={30}
                          min={30}
                          value={entry.duration_minutes}
                          onChange={(e) =>
                            updateEntryField(idx, 'duration_minutes', parseInt(e.target.value, 10))
                          }
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                      <input
                        type="text"
                        value={entry.description}
                        onChange={(e) => updateEntryField(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyingCorrection}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {applyingCorrection ? 'Saving Audit...' : 'Apply Audited Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
