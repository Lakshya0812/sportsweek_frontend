/**
 * Admin → Players — manage players per galaxy.
 * Filter by galaxy; create, edit, delete players.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { api } from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Modal from '../../components/Modal.jsx';

// ── Player Form ───────────────────────────────────────────────────────────

function PlayerForm({ initial, galaxies, onSubmit, onCancel, loading }) {
  const [name, setName] = useState(initial?.name || '');
  const [galaxy, setGalaxy] = useState(initial?.galaxy || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Player name is required.'); return; }
    if (!galaxy)      { setError('Galaxy is required.'); return; }
    onSubmit({ name: name.trim(), galaxy: Number(galaxy) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-400">{error}</div>
      )}
      <div>
        <label className="label">Player Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="e.g. Arjun Sharma"
          required
        />
      </div>
      <div>
        <label className="label">Galaxy *</label>
        <select
          value={galaxy}
          onChange={(e) => setGalaxy(e.target.value)}
          className="input"
          required
          disabled={!!initial} // can't change galaxy once created
        >
          <option value="">Select galaxy</option>
          {galaxies.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        {initial && (
          <p className="text-xs text-slate-500 mt-1">Galaxy cannot be changed after creation.</p>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : initial ? 'Save Changes' : 'Add Player'}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function PlayersAdmin() {
  const qc = useQueryClient();
  const [filterGalaxy, setFilterGalaxy] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: galaxies } = useQuery({
    queryKey: ['galaxies'],
    queryFn: () => api.getGalaxies({ page_size: 100 }),
    select: (res) => res.data.results ?? res.data,
  });

  const { data: players, isLoading, isError } = useQuery({
    queryKey: ['players', filterGalaxy],
    queryFn: () => api.getPlayers({ ...(filterGalaxy && { galaxy: filterGalaxy }), page_size: 200 }),
    select: (res) => res.data.results ?? res.data,
  });

  const createMutation = useMutation({
    mutationFn: api.createPlayer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['players'] }); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updatePlayer(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['players'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deletePlayer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['players'] }); setDeleteId(null); },
  });

  // Group players by galaxy for a cleaner display
  const grouped = players
    ? players.reduce((acc, p) => {
        const key = p.galaxy_name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Users size={26} className="text-galaxy-400" />
          <div>
            <h1 className="text-2xl font-extrabold">Players</h1>
            <p className="text-slate-500 text-sm">Manage players per galaxy</p>
          </div>
        </div>
        <button onClick={() => setModal({ mode: 'create' })} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Player
        </button>
      </div>

      {/* Galaxy filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-400">Filter by galaxy:</label>
        <select
          value={filterGalaxy}
          onChange={(e) => setFilterGalaxy(e.target.value)}
          className="input w-auto text-sm"
        >
          <option value="">All Galaxies</option>
          {galaxies?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        {players && (
          <span className="text-xs text-slate-500 ml-auto">{players.length} players</span>
        )}
      </div>

      {isLoading && <Spinner className="py-20" size="lg" />}
      {isError && <ErrorMessage message="Failed to load players." />}

      {/* Grouped by galaxy */}
      {Object.entries(grouped).map(([galaxyName, gPlayers]) => (
        <div key={galaxyName} className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            {/* Galaxy colour dot */}
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: `hsl(${[...galaxyName].reduce((a,c) => a+c.charCodeAt(0),0) % 360},60%,50%)` }}
            />
            <h2 className="font-semibold text-slate-200">{galaxyName}</h2>
            <span className="ml-auto text-xs text-slate-500">{gPlayers.length} players</span>
          </div>
          <div className="divide-y divide-slate-800">
            {gPlayers.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `hsl(${[...p.name].reduce((a,c) => a+c.charCodeAt(0),0) % 360},55%,40%)` }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="font-medium text-sm">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModal({ mode: 'edit', player: p })}
                    className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {players && players.length === 0 && (
        <div className="card p-12 text-center text-slate-600">No players found.</div>
      )}

      {/* Create / Edit modal */}
      {modal && galaxies && (
        <Modal
          title={modal.mode === 'create' ? 'Add Player' : `Edit — ${modal.player.name}`}
          onClose={() => setModal(null)}
        >
          <PlayerForm
            initial={modal.player}
            galaxies={galaxies}
            loading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => setModal(null)}
            onSubmit={(data) => {
              if (modal.mode === 'create') createMutation.mutate(data);
              else updateMutation.mutate({ id: modal.player.id, data });
            }}
          />
          {(createMutation.isError || updateMutation.isError) && (
            <ErrorMessage message="Failed to save player. Name may already exist in this galaxy." />
          )}
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <Modal title="Delete Player?" onClose={() => setDeleteId(null)}>
          <p className="text-slate-400 mb-6 text-sm">
            This will remove the player from the system. Sub-matches they participated in will lose this player reference.
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
