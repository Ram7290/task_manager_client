import { notify } from '../../components/ui/feedback';
import React, { useState, useEffect } from 'react';
import { adminApi, projectApi } from '../../lib/api';
import { Building2, FolderKanban, Plus } from 'lucide-react';

export default function AdminDepartmentsProjectsPage() {
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjStatus, setNewProjStatus] = useState('ACTIVE');

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptRes, projRes] = await Promise.all([
        adminApi.getDepartments(),
        projectApi.list(),
      ]);
      setDepartments(deptRes.data);
      setProjects(projRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      await adminApi.createDepartment({ name: newDeptName, description: newDeptDesc });
      setNewDeptName('');
      setNewDeptDesc('');
      await loadData();
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    try {
      await projectApi.create({
        name: newProjName,
        description: newProjDesc,
        status: newProjStatus,
      });
      setNewProjName('');
      setNewProjDesc('');
      await loadData();
    } catch (err) {
      notify.error(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Departments & Projects</h1>
        <p className="text-sm text-slate-500 mt-1">
          Structure company organization units and operational project portfolios
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Departments Column */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand" /> Create Department
            </h2>
            <form onSubmit={handleCreateDept} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Department Name (e.g. Finance)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Description (Optional)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                + Add Department
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Existing Departments</h3>
            <div className="space-y-2">
              {departments.map((d) => (
                <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-900 text-xs block">{d.name}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{d.description}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {d.users?.length || 0} members assigned
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projects Column */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-brand" /> Create Project
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="Project Name (e.g. Mobile Redesign)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <select
                  value={newProjStatus}
                  onChange={(e) => setNewProjStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                + Add Project
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Current Projects</h3>
            <div className="space-y-2">
              {projects.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 text-xs block">{p.name}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">{p.description}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-light text-brand-dark border border-brand-light">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
