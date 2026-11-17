import { LoadingSkeleton } from '../../components/ui/feedback';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { formatMinutes, localDateStr, localDateOffset } from '../../lib/utils';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Filter,
  X,
  Users,
  Settings,
} from 'lucide-react';

const todayStr = () => localDateStr();
const dateOffset = (days) => localDateOffset(days);

const EMPTY_FILTERS = {
  start_date: dateOffset(-6),
  end_date: todayStr(),
  department_id: '',
};

const formatDay = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
};

// Determine the display state for a single cell
// Returns: 'submitted' | 'off' | 'absent' | 'leave' | 'half_day' | 'missing'
const cellState = (userId, date, matrix, offDaySet, exceptionMap) => {
  if (matrix[userId]?.[date]) return 'submitted';
  if (offDaySet.has(date)) return 'off';
  const ex = exceptionMap[userId]?.[date];
  if (ex === 'ABSENT') return 'absent';
  if (ex === 'LEAVE') return 'leave';
  if (ex === 'HALF_DAY') return 'half_day';
  return 'missing';
};

const CELL_STYLES = {
  submitted: {
    cls: 'bg-emerald-500 text-white',
    title: (cell) =>
      `Submitted · ${formatMinutes(cell?.total_minutes || 0)} · ${
        cell?.submitted_at
          ? new Date(cell.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : ''
      }`,
    icon: <CheckCircle2 className="w-3 h-3" />,
    label: (cell) =>
      cell?.total_minutes >= 60
        ? `${Math.floor(cell.total_minutes / 60)}h`
        : cell?.total_minutes
        ? `${cell.total_minutes}m`
        : '✓',
  },
  off: {
    cls: 'bg-slate-100 border border-slate-200 text-slate-300',
    title: () => 'Company off day',
    icon: null,
    label: () => 'Off',
  },
  absent: {
    cls: 'bg-red-100 border border-red-200 text-red-500',
    title: () => 'Absent',
    icon: null,
    label: () => 'A',
  },
  leave: {
    cls: 'bg-amber-100 border border-amber-200 text-amber-600',
    title: () => 'On Leave',
    icon: null,
    label: () => 'L',
  },
  half_day: {
    cls: 'bg-orange-100 border border-orange-200 text-orange-600',
    title: () => 'Half Day',
    icon: null,
    label: () => 'H',
  },
  missing: {
    cls: 'bg-slate-200 text-slate-500',
    title: () => 'Not submitted',
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: () => '',
  },
};

export default function AdminSubmissionTimelinePage() {
  const [data, setData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const loadDepartments = async () => {
    try {
      const res = await adminApi.getDepartments();
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTimeline = async (activeFilters = appliedFilters) => {
    try {
      setLoading(true);
      const params = {
        start_date: activeFilters.start_date,
        end_date: activeFilters.end_date,
      };
      if (activeFilters.department_id) params.department_id = activeFilters.department_id;
      const res = await adminApi.getSubmissionTimeline(params);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadDepartments();
      await loadTimeline(EMPTY_FILTERS);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    loadTimeline(filters);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    loadTimeline(EMPTY_FILTERS);
  };

  const handleQuickRange = (days) => {
    const next = {
      ...filters,
      start_date: dateOffset(-(days - 1)),
      end_date: todayStr(),
    };
    setFilters(next);
    setAppliedFilters(next);
    loadTimeline(next);
  };

  // Build lookup structures from the flat arrays the API now returns
  const offDaySet = new Set(data?.off_days || []);
  const exceptionMap = data?.exception_map || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-brand" />
            Submission Timeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily report submissions. Off days and absences are shown distinctly — only
            working days count toward submission rates.
          </p>
        </div>
        <Link
          to="/admin/attendance"
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Settings className="w-3.5 h-3.5" />
          Manage Off Days & Absences
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Timeline Filters</span>
          <div className="ml-auto flex items-center gap-1">
            {[7, 14, 30].map((n) => (
              <button
                key={n}
                onClick={() => handleQuickRange(n)}
                className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                Last {n} days
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
            <select
              value={filters.department_id}
              onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={handleClearFilters}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" /> Apply
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Submitted</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200" /> Missing</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> Off Day</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Absent (A)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> Leave (L)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-200" /> Half Day (H)</span>
        <span className="ml-auto flex items-center gap-1.5 text-slate-500">
          <Users className="w-3.5 h-3.5" />
          {data?.total_users || 0} users · {data?.dates?.length || 0} days
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : !data || (data.users || []).length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No active users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-50 py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider min-w-[180px]">
                    User
                  </th>
                  {data.dates.map((d) => {
                    const isOff = offDaySet.has(d);
                    return (
                      <th
                        key={d}
                        className={`px-2 py-3 text-center font-bold min-w-[64px] ${
                          isOff ? 'text-slate-300 bg-slate-50/80' : 'text-slate-500'
                        }`}
                        title={isOff ? `${d} — Off day` : d}
                      >
                        <div className="text-[10px] uppercase tracking-wider">
                          {formatDay(d).split(' ')[0]}
                        </div>
                        <div className="font-black">{formatDay(d).split(' ')[1]}</div>
                        {isOff && <div className="text-[8px] text-slate-500 mt-0.5">off</div>}
                      </th>
                    );
                  })}
                  <th className="py-3 px-3 text-center font-bold text-slate-500 uppercase tracking-wider bg-slate-100">
                    Rate
                  </th>
                </tr>

                {/* Per-day summary row */}
                <tr className="border-b border-slate-200 bg-brand-light/40">
                  <td className="sticky left-0 z-10 bg-brand-light/40 py-2 px-4 font-bold text-slate-700">
                    Day Summary
                  </td>
                  {data.dates.map((d) => {
                    const s = data.summary[d];
                    const isOff = offDaySet.has(d);
                    if (isOff) {
                      return (
                        <td key={d} className="px-1 py-2 text-center">
                          <div className="text-[10px] text-slate-300 font-bold">—</div>
                        </td>
                      );
                    }
                    const expected = s.submitted + s.absent + s.missing;
                    const pct = expected > 0 ? Math.round((s.submitted / expected) * 100) : 0;
                    return (
                      <td key={d} className="px-1 py-2 text-center">
                        <div
                          className={`text-[10px] font-black ${
                            pct === 100 ? 'text-emerald-600' : pct >= 50 ? 'text-brand' : 'text-red-500'
                          }`}
                        >
                          {s.submitted}/{expected}
                        </div>
                        <div className="text-[9px] text-slate-500">{pct}%</div>
                      </td>
                    );
                  })}
                  <td className="py-2 px-3 text-center bg-slate-100 text-[10px] font-bold text-slate-500">
                    submitted
                  </td>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {data.users.map((user) => {
                  const row = data.matrix[user.id] || {};

                  // Rate: submitted / (total working days for this user)
                  let submittedCount = 0;
                  let expectedCount = 0;
                  data.dates.forEach((d) => {
                    const state = cellState(user.id, d, data.matrix, offDaySet, exceptionMap);
                    if (state === 'submitted') submittedCount++;
                    if (state !== 'off') expectedCount++;
                  });
                  const rate = expectedCount > 0 ? Math.round((submittedCount / expectedCount) * 100) : 0;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition">
                      <td className="sticky left-0 z-10 bg-white py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px]">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </div>
                          <div>
                            <Link
                              to={`/admin/users/${user.id}/overview`}
                              className="font-semibold text-slate-900 hover:text-brand transition"
                            >
                              {user.first_name} {user.last_name}
                            </Link>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              {user.department?.name || 'Unassigned'}
                              {user.role === 'MANAGER' && (
                                <span className="text-brand font-bold">· Mgr</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {data.dates.map((d) => {
                        const state = cellState(user.id, d, data.matrix, offDaySet, exceptionMap);
                        const style = CELL_STYLES[state];
                        const cell = row[d];
                        return (
                          <td key={d} className="px-1 py-2 text-center">
                            <div
                              className={`mx-auto w-9 h-9 rounded-lg flex flex-col items-center justify-center text-[9px] font-bold ${style.cls}`}
                              title={style.title(cell)}
                            >
                              {style.icon}
                              <span className={style.icon ? 'mt-0.5' : ''}>
                                {style.label(cell)}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-center bg-slate-50">
                        <span
                          className={`text-[11px] font-black ${
                            rate === 100 ? 'text-emerald-600' : rate >= 50 ? 'text-brand' : 'text-red-500'
                          }`}
                        >
                          {submittedCount}/{expectedCount}
                        </span>
                        <div className="text-[9px] text-slate-500">{rate}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary footer */}
      {!loading && data && (data.users || []).length > 0 && (() => {
        const totalSubmitted = data.dates.reduce((s, d) => s + (data.summary[d]?.submitted || 0), 0);
        const totalMissing = data.dates.reduce((s, d) => s + (data.summary[d]?.missing || 0), 0);
        const totalAbsent = data.dates.reduce(
          (s, d) => s + (data.summary[d]?.absent || 0) + (data.summary[d]?.off || 0),
          0
        );
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Users Tracked', value: data.total_users, color: 'text-slate-900' },
              { label: 'Submissions', value: totalSubmitted, color: 'text-emerald-600' },
              { label: 'Missing (working days)', value: totalMissing, color: 'text-red-500' },
              { label: 'Off / Absent', value: totalAbsent, color: 'text-amber-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
