import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { Category } from '../types';

const EMPTY: Partial<Category> = { name: '', image: '', slug: '', productCount: 0 };

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Partial<Category>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminApi.categories.getAll();
    setCategories(res.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ ...c }); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await adminApi.categories.update(editing.id, form);
      else await adminApi.categories.create(form);
      await load();
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this category?')) {
      await adminApi.categories.delete(id);
      await load();
    }
  };

  const field = (label: string, key: keyof Category, opts?: { required?: boolean; type?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}{opts?.required ? ' *' : ''}</label>
      <input
        required={opts?.required}
        type={opts?.type ?? 'text'}
        value={String(form[key] ?? '')}
        onChange={e => setForm(f => ({ ...f, [key]: opts?.type === 'number' ? parseInt(e.target.value) : e.target.value }))}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Categories</h1>
          <p className="text-gray-400 text-sm mt-1">{categories.length} categories</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors">
          + Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
              <div className="aspect-video overflow-hidden bg-gray-100">
                {c.image ? (
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🏷️</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-xs text-gray-400 mb-1">/{c.slug}</p>
                <p className="text-xs text-gray-500">{c.productCount} products</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(c)}
                    className="flex-1 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    className="flex-1 py-1.5 text-xs font-semibold bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-bold text-xl">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              {field('Name', 'name', { required: true })}
              {field('Slug', 'slug', { required: true })}
              {field('Image URL', 'image')}
              {field('Product Count', 'productCount', { type: 'number' })}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 disabled:opacity-50">
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
