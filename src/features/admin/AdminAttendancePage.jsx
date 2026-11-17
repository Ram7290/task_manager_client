import React, { useState, useEffect, useCallback } from 'react';
import { attendanceApi, adminApi } from '../../lib/api';
import { localDateStr } from '../../lib/utils';
import {
  CalendarDays,
  Plus,
  Trash2,
  X,
  Users,
  RefreshCw,
  SunMedium,
  UserX,
} from 'lucide-react';

const localDateStrUtil = localDateStr;

const todayStr = () => localDateStrUtil();

// Return all Sundays in a given year-month (e.g. "2026-11")
const sundaysInMonth = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);
  const days = [];
  const d = new Date(year, month - 1, 1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  while (d.getMonth() === month - 1) {
    days.push(localDateStrUtil(d));
    d.setDate(d.getDate() + 7);
  }
  return days;
};

const TYPE_LABELS = {
  SUNDAY: { label: 'Sunday', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  SATURDAY: { label: 'Saturday', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  PUBLIC_HOLIDAY: { label: 'Holiday', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  OTHER: { label: 'Other', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const EX_TYPE_LABELS = {
  ABSENT: { label: 'Absent', color: 'bg-red-50 text-red-700 border-red-200' },
  LEAVE: { label: 'Leave', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  HALF_DAY: { label: 'Half Day', color: 'bg-orange-50 text-orange-700 border-orange-200' },
};

const currentYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState('offdays'); // 'offdays' | 'absences'

  // Off days state
  const [offDays, setOffDays] = useState([]);
  const [offLoading, setOffLoading] = useState(true);
  const [offMonth, setOffMonth] = useState(currentYearMonth());
  const [showAddOffDay, setShowAddOffDay] = useState(false);
  const [newOffDate, setNewOffDate] = useState('');
  const [newOffType, setNewOffType] = useState('OTHER');
  const [newOffReason, setNewOffReason] = useState('');
  const [bulkAdding, setBulkAdding] = useState(false);

  // Absences state
  const [exceptions, setExceptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [exLoading, setExLoading] = useState(true);
  const [showMarkAbsence, setShowMarkAbsence] = useState(false);
  const [exEmployee, setExEmployee] = useState('');
  const [exDate, setExDate] = useState(todayStr());
  const [exType, setExType] = useState('ABSENT');
  const [exReason, setExReason] = useState('');
  const [exFilterEmployee, setExFilterEmployee] = useState('');

  const loadOffDays = useCallback(async () => {
    try {
      setOffLoading(true);
      const [year, month] = offMonth.split('-').map(Number);
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
      const res = await attendanceApi.getOffDays({ start_date: start, end_date: end });
      setOffDays(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOffLoading(false);
    }
  }, [offMonth]);

  const loadExceptions = useCallback(async () => {
    try {
      setExLoading(true);
      const params = {};
      if (exFilterEmployee) params.employee_id = exFilterEmployee;
      const res = await attendanceApi.getExceptions(params);
      setExceptions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setExLoading(false);
    }
  }, [exFilterEmployee]);

  const loadEmployees = async () => {
    try {
      const res = await adminApi.getUsers({ role: 'EMPLOYEE', is_active: true });
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadOffDays(); }, [loadOffDays]);
  useEffect(() => { loadExceptions(); loadEmployees(); }, [loadExceptions]);

  // ── Off Day handlers ──────────────────────────────────────────────────────

  const handleAddOffDay = async (e) => {
    e.preventDefault();
    try {
      await attendanceApi.addOffDay({ date: newOffDate, type: newOffType, reason: newOffReason });
      setShowAddOffDay(false);
      setNewOffDate('');
      setNewOffReason('');
      setNewOffType('OTHER');
      await loadOffDays();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkSundays = async () => {
    if (!confirm(`Mark all Sundays in ${offMonth} as off days?`)) return;
    try {
      setBulkAdding(true);
      const entries = sundaysInMonth(offMonth).map(date => ({
        date,
        type: 'SUNDAY',
        reason: 'Weekly off',
      }));
      const res = await attendanceApi.bulkAddOffDays(entries);
      alert(`Added ${res.data.added} Sunday(s). ${res.data.skipped} already existed.`);
      await loadOffDays();
    } catch (err) {
      alert(err.message);
    } finally {
      setBulkAdding(false);
    }
  };

  const handleRemoveOffDay = async (id) => {
    if (!confirm('Remove this off day?')) return;
    try {
      await attendanceApi.removeOffDay(id);
      await loadOffDays();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Absence handlers ──────────────────────────────────────────────────────

  const handleMarkAbsence = async (e) => {
    e.preventDefault();
    if (!exEmployee) { alert('Select an employee.'); return; }
    try {
      await attendanceApi.markException({
        employee_id: exEmployee,
        date: exDate,
        type: exType,
        reason: exReason,
      });
      setShowMarkAbsence(false);
      setExEmployee('');
      setExDate(todayStr());
      setExType('ABSENT');
      setExReason('');
      await loadExceptions();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveException = async (id) => {
    if (!confirm('Remove this attendance record?')) return;
    try {
      await attendanceApi.removeException(id);
      await loadExceptions();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          Attendance & Working Days
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Define company off days and mark individual absences. These are used in the submission
          timeline so missing reports on off days or absent days don't count against employees.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 flex gap-3">
        <CalendarDays className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
        <div>
          <strong>How this works:</strong> Employees can still submit a worklog on any day,
          including off days. These settings only affect the timeline view — a cell on an off day
          shows grey (not red), and an absent/leave day shows amber instead of a missing red ✗.
          The submission rate is calculated only over expected working days.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'offdays', label: 'Company Off Days', icon: <SunMedium className="w-4 h-4" /> },
          { id: 'absences', label: 'Individual Absences', icon: <UserX className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Off Days ─────────────────────────────────────────────────── */}
      {activeTab === 'offdays' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Month:</label>
              <input
                type="month"
                value={offMonth}
                onChange={(e) => setOffMonth(e.target.value || currentYearMonth())}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={loadOffDays}
                className="p-1.5 text-slate-500 hover:text-blue-600 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkSundays}
                disabled={bulkAdding}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <SunMedium className="w-3.5 h-3.5" />
                {bulkAdding ? 'Adding...' : 'Mark All Sundays'}
              </button>
              <button
                onClick={() => setShowAddOffDay(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Off Day
              </button>
            </div>
          </div>

          {offLoading ? (
            <div className="py-10 text-center text-slate-400">Loading off days...</div>
          ) : offDays.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No off days defined for {offMonth}.</p>
              <p className="text-xs text-slate-400 mt-1">
                Use "Mark All Sundays" for a quick start, or add individual dates.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider">Day</th>
                    <th className="py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                    <th className="py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider">Added by</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {offDays.map((od) => {
                    const d = new Date(od.date + 'T00:00:00');
                    const typeInfo = TYPE_LABELS[od.type] || TYPE_LABELS.OTHER;
                    return (
                      <tr key={od.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">{od.date}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {d.toLocaleDateString(undefined, { weekday: 'long' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{od.reason || '—'}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {od.creator ? `${od.creator.first_name} ${od.creator.last_name}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRemoveOffDay(od.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Off Day Modal */}
          {showAddOffDay && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">Add Company Off Day</h2>
                  <button onClick={() => setShowAddOffDay(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAddOffDay} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={newOffDate}
                      onChange={(e) => setNewOffDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Type *</label>
                    <select
                      value={newOffType}
                      onChange={(e) => setNewOffType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="SUNDAY">Sunday (Weekly Off)</option>
                      <option value="SATURDAY">Saturday (Weekly Off)</option>
                      <option value="PUBLIC_HOLIDAY">Public Holiday</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Reason <span className="text-slate-400 normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newOffReason}
                      onChange={(e) => setNewOffReason(e.target.value)}
                      placeholder="e.g. National holiday, Eid, etc."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddOffDay(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Save Off Day
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Individual Absences ──────────────────────────────────────── */}
      {activeTab === 'absences' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Filter by:</label>
              <select
                value={exFilterEmployee}
                onChange={(e) => setExFilterEmployee(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowMarkAbsence(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Mark Absence / Leave
            </button>
          </div>

          {exLoading ? (
            <div className="py-10 text-center text-slate-400">Loading attendance records...</div>
          ) : exceptions.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No attendance exceptions recorded.</p>
              <p className="text-xs text-slate-400 mt-1">
                Use "Mark Absence / Leave" to record when an employee was absent.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                    <th className="py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                    <th className="py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider">Marked by</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exceptions.map((ex) => {
                    const typeInfo = EX_TYPE_LABELS[ex.type] || EX_TYPE_LABELS.ABSENT;
                    return (
                      <tr key={ex.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">
                            {ex.employee?.first_name} {ex.employee?.last_name}
                          </p>
                          <p className="text-[10px] text-slate-400">{ex.employee?.department?.name || '—'}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{ex.date}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{ex.reason || '—'}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {ex.marker ? `${ex.marker.first_name} ${ex.marker.last_name}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRemoveException(ex.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Mark Absence Modal */}
          {showMarkAbsence && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">Mark Absence / Leave</h2>
                  <button onClick={() => setShowMarkAbsence(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleMarkAbsence} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Employee *</label>
                    <select
                      required
                      value={exEmployee}
                      onChange={(e) => setExEmployee(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- Select employee --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={exDate}
                      onChange={(e) => setExDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Type *</label>
                    <select
                      value={exType}
                      onChange={(e) => setExType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ABSENT">Absent (no notice)</option>
                      <option value="LEAVE">Leave (approved)</option>
                      <option value="HALF_DAY">Half Day</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Reason <span className="text-slate-400 normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={exReason}
                      onChange={(e) => setExReason(e.target.value)}
                      placeholder="e.g. Sick, Family emergency..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowMarkAbsence(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Save Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
