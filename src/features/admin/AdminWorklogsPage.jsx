import { Modal } from '../../components/ui/dialog';
import { notify, LoadingSkeleton } from '../../components/ui/feedback';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi, worklogApi } from '../../lib/api';
import { formatMinutes, localDateStr } from '../../lib/utils';
import {
  FileText,
  ShieldAlert,
  Edit3,
  Filter,
  X,
} from 'lucide-react';

const defaultFilters = () => {
  const today = localDateStr();
  return {
    employee_id: '',
    department_id: '',
    start_date: today,
    end_date: today,
    status: 'SUBMITTED',
  };
};

export default function AdminWorklogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEmployeeId = searchParams.get('employee_id') || '';

  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ ...defaultFilters(), employee_id: initialEmployeeId });
  const [appliedFilters, setAppliedFilters] = useState({
    ...defaultFilters(),
    employee_id: initialEmployeeId,
  });

  // Controlled Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [targetReport, setTargetReport] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionEntries, setCorrectionEntries] = useState([]);
  const [applyingCorrection, setApplyingCorrection] = useState(false);

  const loadReferenceData = async () => {
    try {
      const [empRes, deptRes, catsRes] = await Promise.all([
        adminApi.getUsers({ role: 'EMPLOYEE', is_active: true }),
        adminApi.getDepartments(),
        worklogApi.getCategories(),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async (activeFilters = appliedFilters) => {
    try {
      setLoading(true);
      const params = {};
      if (activeFilters.employee_id) params.employee_id = activeFilters.employee_id;
      if (activeFilters.department_id) params.department_id = activeFilters.department_id;
      if (activeFilters.start_date) params.start_date = activeFilters.start_date;
      if (activeFilters.end_date) params.end_date = activeFilters.end_date;
      if (activeFilters.status) params.status = activeFilters.status;

      const reportsRes = await adminApi.getWorklogs(params);
      setReports(reportsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadReferenceData();
      // initial load uses appliedFilters (which may carry an employee_id from the URL)
      await loadData();
      // clear the consumed URL param so subsequent resets behave normally
      if (searchParams.get('employee_id')) {
        setSearchParams({}, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    loadData(filters);
  };

  const handleClearFilters = () => {
    const reset = defaultFilters();
    setFilters(reset);
    setAppliedFilters(reset);
    loadData(reset);
  };

  const today = localDateStr();
  const hasActiveFilters =
    appliedFilters.employee_id ||
    appliedFilters.department_id ||
    appliedFilters.start_date !== today ||
    appliedFilters.end_date !== today ||
    appliedFilters.status !== 'SUBMITTED';

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
      notify.error('A valid mandatory reason (minimum 5 characters) is required for audited corrections.');
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
      notify.error(err.message);
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

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Filter Submitted Records</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Instructor / Employee */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Instructor
            </label>
            <select
              value={filters.employee_id}
              onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">All Instructors</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Department
            </label>
            <select
              value={filters.department_id}
              onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="SUBMITTED">Submitted</option>
              <option value="DRAFT">Draft</option>
              <option value="ALL">All</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500">
            {loading ? 'Loading…' : `${reports.length} report${reports.length === 1 ? '' : 's'} found`}
            {hasActiveFilters ? ' (filtered)' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No submitted reports found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting the filters to widen your search.
          </p>
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
                    <div className="w-10 h-10 rounded-xl bg-brand-light text-brand-dark font-bold flex items-center justify-center text-sm">
                      {report.employee?.first_name?.[0]}
                      {report.employee?.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {report.employee?.first_name} {report.employee?.last_name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {report.employee?.department?.name || 'Engineering'} • Date:{' '}
                        {report.report_date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Effort
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {formatMinutes(totalMinutes)}
                      </span>
                    </div>

                    {hasCorrections && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-light text-brand-dark border border-brand-light">
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
                      <span className="text-xs font-bold text-slate-800">
                        {formatMinutes(w.duration_minutes)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Correction Audit trail if present */}
                {hasCorrections && (
                  <div className="bg-brand-light/60 border border-brand-light rounded-xl p-3 text-xs text-brand-dark space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-brand-dark">
                      <ShieldAlert className="w-3.5 h-3.5" /> Audit History:
                    </span>
                    {report.corrections.map((c) => (
                      <p key={c.id} className="text-[11px] text-brand-dark">
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
        <Modal open={!!(showCorrectionModal && targetReport)} onOpenChange={(o) => { if (!o) setShowCorrectionModal(false); }}>
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
                className="text-slate-500 hover:text-slate-600"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Entries
                </label>
                <div className="space-y-3">
                  {correctionEntries.map((entry, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  className="px-5 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {applyingCorrection ? 'Saving Audit...' : 'Apply Audited Correction'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
