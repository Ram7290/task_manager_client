import React, { useState, useEffect } from 'react';
import { worklogApi } from '../../lib/api';
import { Tags, Plus } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await worklogApi.getCategories({ include_inactive: 'true' });
      setCategories(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setSaving(true);
      await worklogApi.createCategory({ name: newName, description: newDesc || null });
      setNewName('');
      setNewDesc('');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
    setError('');
  };

  const handleSaveEdit = async (id) => {
    setError('');
    try {
      await worklogApi.updateCategory(id, { name: editName, description: editDesc || null });
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (cat) => {
    setError('');
    try {
      await worklogApi.updateCategory(cat.id, { is_active: !cat.is_active });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Worklog Categories</h1>
        <p className="text-sm text-slate-500 mt-1">
          Work types employees choose when logging time. Deactivated categories stay on past
          entries but can't be picked for new ones.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
          {error}
        </div>
      )}

      {/* Add category */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Tags className="w-4 h-4 text-brand" /> Add Category
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3">
          <input
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (e.g. Design)"
            className={inputClass}
          />
          <input
            type="text"
            maxLength={500}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            {saving ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      {/* Category list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-4 font-bold">Name</th>
                <th className="py-3 px-4 font-bold">Description</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-slate-500">
                    No categories yet. Add one above.
                  </td>
                </tr>
              )}
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;
                return (
                  <tr key={cat.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {isEditing ? (
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={100}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={inputClass}
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          maxLength={500}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className={inputClass}
                        />
                      ) : (
                        <span className="text-slate-500">{cat.description || '—'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          cat.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(cat.id)}
                            className="px-2.5 py-1 bg-brand text-white rounded-lg hover:bg-brand-dark font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(cat)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleToggleActive(cat)}
                            className={`px-2.5 py-1 rounded-lg font-semibold ${
                              cat.is_active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {cat.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
