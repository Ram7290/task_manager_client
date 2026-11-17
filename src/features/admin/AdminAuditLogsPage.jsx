import { LoadingSkeleton } from '../../components/ui/feedback';
import React, { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { ShieldAlert, Clock, User, FileText } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getAuditLogs();
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Audit Trail</h1>
        <p className="text-sm text-slate-500 mt-1">
          Immutable event history of security actions, task creations, status updates, and
          administrative corrections
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No audit events recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Action</th>
                <th className="py-3 px-4 font-bold">Actor</th>
                <th className="py-3 px-4 font-bold">Entity</th>
                <th className="py-3 px-4 font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {log.actor ? `${log.actor.first_name} ${log.actor.last_name}` : 'System'}
                    {log.actor && (
                      <span className="text-[10px] text-slate-500 block font-normal">
                        {log.actor.role}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ''}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                    {log.new_values ? JSON.stringify(log.new_values) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
