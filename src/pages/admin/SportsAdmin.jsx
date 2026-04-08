/**
 * Admin → Sports — CRUD management for Sport records.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Trophy } from 'lucide-react';
import { api } from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Modal from '../../components/Modal.jsx';

function SportForm({ initial, onSubmit, onCancel, loading }) {
  const [name, setName] = useState(initial?.name || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Sport name is required.'); return; }
    onSubmit({ name: name.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-400">{error}</div>
      )}
      <div>
        <label className="label">Sport Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="e.g. Cricket"
          required
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Sport'}
        </button>
      </div>
    </form>
  );
}

export default function SportsAdmin() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: sports, isLoading, isError } = useQuery({
    queryKey: ['sports'],
    queryFn: () => api.getSports({ page_size: 100 }),
    select: (res) => res.data.results ?? res.data,
  });

  const createMutation = useMutation({
    mutationFn: api.createSport,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sports'] }); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateSport(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sports'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteSport,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sports'] }); setDeleteId(null); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy size={26} className="text-galaxy-400" />
          <h1 className="text-2xl font-extrabold">Sports</h1>
        </div>
        <button onClick={() => setModal({ mode: 'create' })} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Sport
        </button>
      </div>

      {isLoading && <Spinner className="py-20" size="lg" />}
      {isError && <ErrorMessage message="Failed to load sports." />}

      {sports && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Sport</th>
                  <th className="py-3 px-4 text-center">Matches</th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sports.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4 text-center text-slate-400">{s.match_count}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setModal({ mode: 'edit', sport: s })}
                          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(s.id)}
                          className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
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

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'New Sport' : `Edit — ${modal.sport.name}`}
          onClose={() => setModal(null)}
        >
          <SportForm
            initial={modal.sport}
            loading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => setModal(null)}
            onSubmit={(data) => {
              if (modal.mode === 'create') createMutation.mutate(data);
              else updateMutation.mutate({ id: modal.sport.id, data });
            }}
          />
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Sport?" onClose={() => setDeleteId(null)}>
          <p className="text-slate-400 mb-6 text-sm">
            Deleting this sport will also delete all associated matches. This cannot be undone.
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
