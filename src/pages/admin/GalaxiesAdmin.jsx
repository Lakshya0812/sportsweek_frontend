/**
 * Admin → Galaxies — CRUD management for Galaxy records.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { api } from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Modal from '../../components/Modal.jsx';

// ── Galaxy Form (create / edit) ───────────────────────────────────────────

function GalaxyForm({ initial, onSubmit, onCancel, loading }) {
  const [name, setName] = useState(initial?.name || '');
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    onSubmit({ name: name.trim(), ...(logo && { logo }) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
      <div>
        <label className="label">Galaxy Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="e.g. Andromeda"
          required
        />
      </div>
      <div>
        <label className="label">Logo (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogo(e.target.files[0] || null)}
          className="input text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-slate-700 file:text-slate-200 file:text-sm"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Galaxy'}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function GalaxiesAdmin() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', galaxy?: {} }
  const [deleteId, setDeleteId] = useState(null);

  const { data: galaxies, isLoading, isError } = useQuery({
    queryKey: ['galaxies'],
    queryFn: () => api.getGalaxies({ page_size: 100 }),
    select: (res) => res.data.results ?? res.data,
  });

  const createMutation = useMutation({
    mutationFn: api.createGalaxy,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['galaxies'] }); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateGalaxy(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['galaxies'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteGalaxy,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['galaxies'] }); setDeleteId(null); },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star size={26} className="text-galaxy-400" />
          <h1 className="text-2xl font-extrabold">Galaxies</h1>
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New Galaxy
        </button>
      </div>

      {isLoading && <Spinner className="py-20" size="lg" />}
      {isError && <ErrorMessage message="Failed to load galaxies." />}

      {/* Table */}
      {galaxies && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Galaxy</th>
                  <th className="py-3 px-4 text-right">Points</th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {galaxies.map((g) => (
                  <tr key={g.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {g.logo_url ? (
                          <img src={g.logo_url} alt={g.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: `hsl(${[...g.name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360},60%,40%)` }}
                          >
                            {g.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{g.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-galaxy-400">{g.total_points}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setModal({ mode: 'edit', galaxy: g })}
                          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(g.id)}
                          className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'New Galaxy' : `Edit — ${modal.galaxy.name}`}
          onClose={() => setModal(null)}
        >
          <GalaxyForm
            initial={modal.galaxy}
            loading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => setModal(null)}
            onSubmit={(data) => {
              if (modal.mode === 'create') {
                createMutation.mutate(data);
              } else {
                updateMutation.mutate({ id: modal.galaxy.id, data });
              }
            }}
          />
          {(createMutation.isError || updateMutation.isError) && (
            <ErrorMessage message="Failed to save. Please try again." />
          )}
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <Modal title="Delete Galaxy?" onClose={() => setDeleteId(null)}>
          <p className="text-slate-400 mb-6 text-sm">
            This will permanently delete the galaxy and cannot be undone. Match history will remain intact.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="btn-danger"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
