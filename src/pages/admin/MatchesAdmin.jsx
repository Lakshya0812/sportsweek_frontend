/**
 * Admin → Matches — Create matches, update results, delete matches.
 * Expanded row shows sub-matches with per-player results.
 * Supports filtering by sport and pending/completed status.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, Swords, Trophy, CheckCircle,
  ChevronDown, ChevronUp, Users,
} from 'lucide-react';
import { api } from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';

// ── Create Match Form ─────────────────────────────────────────────────────

function CreateMatchForm({ sports, galaxies, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    sport: '',
    galaxy_1: '',
    galaxy_2: '',
    points_awarded: 3,
    is_final: false,
  });
  const [error, setError] = useState('');

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.sport || !form.galaxy_1 || !form.galaxy_2) {
      setError('Sport and both galaxies are required.'); return;
    }
    if (form.galaxy_1 === form.galaxy_2) {
      setError('A galaxy cannot play against itself.'); return;
    }
    setError('');
    onSubmit({
      sport: Number(form.sport),
      galaxy_1: Number(form.galaxy_1),
      galaxy_2: Number(form.galaxy_2),
      points_awarded: Number(form.points_awarded),
      is_final: form.is_final,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-400">{error}</div>
      )}
      <div>
        <label className="label">Sport *</label>
        <select value={form.sport} onChange={set('sport')} className="input" required>
          <option value="">Select sport</option>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Galaxy 1 *</label>
          <select value={form.galaxy_1} onChange={set('galaxy_1')} className="input" required>
            <option value="">Select galaxy</option>
            {galaxies.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Galaxy 2 *</label>
          <select value={form.galaxy_2} onChange={set('galaxy_2')} className="input" required>
            <option value="">Select galaxy</option>
            {galaxies.filter((g) => g.id !== Number(form.galaxy_1)).map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Base Points</label>
          <input type="number" min="1" value={form.points_awarded} onChange={set('points_awarded')} className="input" />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_final} onChange={set('is_final')} className="w-4 h-4 accent-galaxy-500" />
            <span className="text-sm text-slate-300">Is Final?</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating...' : 'Create Match'}
        </button>
      </div>
    </form>
  );
}

// ── Update Result Form ────────────────────────────────────────────────────

function UpdateResultForm({ match, galaxies, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    winner: match.winner ?? '',
    points_awarded: match.points_awarded,
    is_final: match.is_final,
  });

  const competitors = galaxies.filter(
    (g) => g.id === match.galaxy_1 || g.id === match.galaxy_2
  );
  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ winner: form.winner ? Number(form.winner) : null, points_awarded: Number(form.points_awarded), is_final: form.is_final });
      }}
      className="space-y-4"
    >
      <p className="text-slate-400 text-sm">
        <span className="font-semibold text-slate-200">{match.galaxy_1_name}</span>
        {' '}<span className="text-slate-600">vs</span>{' '}
        <span className="font-semibold text-slate-200">{match.galaxy_2_name}</span>
        {' — '}<span className="text-galaxy-400">{match.sport_name}</span>
      </p>
      <div>
        <label className="label">Winner</label>
        <select value={form.winner} onChange={set('winner')} className="input">
          <option value="">No winner yet</option>
          {competitors.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Points Awarded</label>
          <input type="number" min="1" value={form.points_awarded} onChange={set('points_awarded')} className="input" />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_final} onChange={set('is_final')} className="w-4 h-4 accent-galaxy-500" />
            <span className="text-sm text-slate-300">Is Final?</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save Result'}
        </button>
      </div>
    </form>
  );
}

// ── Add Sub-Match Form ────────────────────────────────────────────────────

function AddSubMatchForm({ match, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    sub_match_type: 'singles',
    player_1: '', player_1b: '',
    player_2: '', player_2b: '',
    side_1_ids: [], side_2_ids: [],
    winner: '', winning_side_team: '',
    notes: '', order: 1,
  });
  const [error, setError] = useState('');
  const isDoubles = form.sub_match_type === 'doubles';
  const isTeam    = form.sub_match_type === 'team';

  const { data: g1Players } = useQuery({
    queryKey: ['players', match.galaxy_1],
    queryFn: () => api.getPlayers({ galaxy: match.galaxy_1, page_size: 100 }),
    select: (res) => res.data.results ?? res.data,
  });
  const { data: g2Players } = useQuery({
    queryKey: ['players', match.galaxy_2],
    queryFn: () => api.getPlayers({ galaxy: match.galaxy_2, page_size: 100 }),
    select: (res) => res.data.results ?? res.data,
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleTeamPlayer = (side, playerId) => {
    const key = side === 1 ? 'side_1_ids' : 'side_2_ids';
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(playerId)
        ? f[key].filter((id) => id !== playerId)
        : [...f[key], playerId],
    }));
  };

  const winnerChoices = [
    form.player_1 && g1Players?.find((p) => p.id === Number(form.player_1)),
    form.player_2 && g2Players?.find((p) => p.id === Number(form.player_2)),
  ].filter(Boolean);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isTeam) {
      if (form.side_1_ids.length === 0 || form.side_2_ids.length === 0) {
        setError('Team requires at least one player per side.'); return;
      }
      setError('');
      onSubmit({
        match: match.id,
        order: Number(form.order),
        sub_match_type: 'team',
        side_1_player_ids: form.side_1_ids,
        side_2_player_ids: form.side_2_ids,
        winning_side_team: form.winning_side_team ? Number(form.winning_side_team) : null,
        notes: form.notes,
      });
      return;
    }
    if (!form.player_1 || !form.player_2) { setError('Both lead players are required.'); return; }
    if (isDoubles && (!form.player_1b || !form.player_2b)) {
      setError('Doubles requires a partner for each side.'); return;
    }
    setError('');
    onSubmit({
      match: match.id,
      order: Number(form.order),
      sub_match_type: form.sub_match_type,
      player_1:  Number(form.player_1),
      player_1b: isDoubles && form.player_1b ? Number(form.player_1b) : null,
      player_2:  Number(form.player_2),
      player_2b: isDoubles && form.player_2b ? Number(form.player_2b) : null,
      winner: form.winner ? Number(form.winner) : null,
      notes: form.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-400">{error}</div>
      )}
      <p className="text-slate-400 text-sm">
        Sub-match in:{' '}
        <span className="font-semibold text-slate-200">{match.galaxy_1_name}</span>
        {' vs '}
        <span className="font-semibold text-slate-200">{match.galaxy_2_name}</span>
      </p>

      {/* Type toggle */}
      <div className="flex gap-2">
        {['singles', 'doubles', 'team'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setForm((f) => ({
              ...f, sub_match_type: t,
              player_1: '', player_1b: '', player_2: '', player_2b: '',
              side_1_ids: [], side_2_ids: [], winner: '', winning_side_team: '',
            }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
              form.sub_match_type === t
                ? 'bg-galaxy-600 border-galaxy-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Galaxy 1 side */}
      <div className="p-3 bg-slate-800/50 rounded-lg space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{match.galaxy_1_name}</p>
        {isTeam ? (
          <div className="grid grid-cols-2 gap-1.5">
            {g1Players?.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.side_1_ids.includes(p.id)}
                  onChange={() => toggleTeamPlayer(1, p.id)}
                  className="accent-galaxy-500"
                />
                <span className="text-slate-300">{p.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className={`grid gap-3 ${isDoubles ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="label">{isDoubles ? 'Player A *' : 'Player *'}</label>
              <select value={form.player_1} onChange={set('player_1')} className="input" required>
                <option value="">Select player</option>
                {g1Players?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {isDoubles && (
              <div>
                <label className="label">Player B (partner) *</label>
                <select value={form.player_1b} onChange={set('player_1b')} className="input" required>
                  <option value="">Select player</option>
                  {g1Players?.filter((p) => p.id !== Number(form.player_1)).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Galaxy 2 side */}
      <div className="p-3 bg-slate-800/50 rounded-lg space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{match.galaxy_2_name}</p>
        {isTeam ? (
          <div className="grid grid-cols-2 gap-1.5">
            {g2Players?.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.side_2_ids.includes(p.id)}
                  onChange={() => toggleTeamPlayer(2, p.id)}
                  className="accent-galaxy-500"
                />
                <span className="text-slate-300">{p.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className={`grid gap-3 ${isDoubles ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="label">{isDoubles ? 'Player A *' : 'Player *'}</label>
              <select value={form.player_2} onChange={set('player_2')} className="input" required>
                <option value="">Select player</option>
                {g2Players?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {isDoubles && (
              <div>
                <label className="label">Player B (partner) *</label>
                <select value={form.player_2b} onChange={set('player_2b')} className="input" required>
                  <option value="">Select player</option>
                  {g2Players?.filter((p) => p.id !== Number(form.player_2)).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Winner + order */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Winner (optional)</label>
          {isTeam ? (
            <select value={form.winning_side_team} onChange={set('winning_side_team')} className="input">
              <option value="">TBD</option>
              <option value={1}>{match.galaxy_1_name}</option>
              <option value={2}>{match.galaxy_2_name}</option>
            </select>
          ) : (
            <select
              value={form.winner}
              onChange={set('winner')}
              className="input"
              disabled={!form.player_1 || !form.player_2}
            >
              <option value="">TBD</option>
              {winnerChoices.map((p) => (
                <option key={p.id} value={p.id}>
                  {isDoubles
                    ? p.id === Number(form.player_1) ? `${match.galaxy_1_name} pair` : `${match.galaxy_2_name} pair`
                    : p.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="label">Order #</label>
          <input type="number" min="1" value={form.order} onChange={set('order')} className="input" />
        </div>
      </div>

      <div>
        <label className="label">Notes / Score</label>
        <input type="text" value={form.notes} onChange={set('notes')} className="input" placeholder="e.g. 25-20, 15-12" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Adding...' : 'Add Sub-Match'}
        </button>
      </div>
    </form>
  );
}

// ── Sub-Match Result Form ─────────────────────────────────────────────────

function UpdateSubMatchForm({ sub, match, onSubmit, onCancel, loading }) {
  const [winner, setWinner]               = useState(sub.winner ?? '');
  const [winningSideTeam, setWinningSideTeam] = useState(sub.winning_side_team ?? '');
  const [notes, setNotes]                 = useState(sub.notes ?? '');
  const isDoubles = sub.sub_match_type === 'doubles';
  const isTeam    = sub.sub_match_type === 'team';

  const side1Players = sub.team_players?.filter((tp) => tp.side === 1) ?? [];
  const side2Players = sub.team_players?.filter((tp) => tp.side === 2) ?? [];

  const side1Label = isTeam
    ? side1Players.map((tp) => tp.player_name).join(', ') || '—'
    : isDoubles
      ? `${sub.player_1_name} & ${sub.player_1b_name} (${sub.player_1_galaxy})`
      : `${sub.player_1_name} (${sub.player_1_galaxy})`;
  const side2Label = isTeam
    ? side2Players.map((tp) => tp.player_name).join(', ') || '—'
    : isDoubles
      ? `${sub.player_2_name} & ${sub.player_2b_name} (${sub.player_2_galaxy})`
      : `${sub.player_2_name} (${sub.player_2_galaxy})`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isTeam) {
      onSubmit({ winning_side_team: winningSideTeam ? Number(winningSideTeam) : null, notes });
    } else {
      onSubmit({ winner: winner ? Number(winner) : null, notes });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type badge */}
      <div className="flex items-center gap-2">
        <span className={`badge text-xs capitalize ${
          isTeam ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
          isDoubles ? 'badge-blue' : 'badge-green'
        }`}>
          {sub.sub_match_type}
        </span>
        <span className="text-slate-500 text-xs">Sub-match #{sub.order}</span>
      </div>

      {/* Matchup summary */}
      <div className="bg-slate-800/50 rounded-lg p-3 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
          <span className="text-slate-200 font-medium">{side1Label}</span>
        </div>
        <div className="pl-4 text-slate-500 text-xs">vs</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
          <span className="text-slate-200 font-medium">{side2Label}</span>
        </div>
      </div>

      <div>
        <label className="label">Winner {isTeam ? '(winning team)' : isDoubles ? '(winning side)' : ''}</label>
        {isTeam ? (
          <select value={winningSideTeam} onChange={(e) => setWinningSideTeam(e.target.value)} className="input">
            <option value="">TBD</option>
            <option value={1}>{match?.galaxy_1_name ?? 'Side 1'}</option>
            <option value={2}>{match?.galaxy_2_name ?? 'Side 2'}</option>
          </select>
        ) : (
          <select value={winner} onChange={(e) => setWinner(e.target.value)} className="input">
            <option value="">TBD</option>
            <option value={sub.player_1}>
              {isDoubles ? `${sub.player_1_galaxy} pair` : sub.player_1_name}
            </option>
            <option value={sub.player_2}>
              {isDoubles ? `${sub.player_2_galaxy} pair` : sub.player_2_name}
            </option>
          </select>
        )}
      </div>

      <div>
        <label className="label">Notes / Score</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          placeholder="e.g. 25-20, 15-12"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

// ── Expanded Sub-Matches Panel ────────────────────────────────────────────

function SubMatchesPanel({ match }) {
  const qc = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [deleteSub, setDeleteSub] = useState(null);

  const subMatches = match.sub_matches ?? [];

  const addMutation = useMutation({
    mutationFn: api.createSubMatch,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-matches'] }); setAddModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateSubMatch(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-matches'] }); setEditSub(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteSubMatch,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-matches'] }); setDeleteSub(null); },
  });

  return (
    <div className="bg-slate-950 border-t border-slate-800 px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Users size={12} /> Sub-Matches ({subMatches.length})
        </h3>
        <button
          onClick={() => setAddModal(true)}
          className="flex items-center gap-1 text-xs text-galaxy-400 hover:text-galaxy-300 font-medium"
        >
          <Plus size={12} /> Add Sub-Match
        </button>
      </div>

      {subMatches.length === 0 ? (
        <p className="text-slate-600 text-xs italic">No sub-matches yet. Click "Add Sub-Match" to record individual player matchups.</p>
      ) : (
        <div className="space-y-2">
          {subMatches.map((sub) => {
            const isDoubles = sub.sub_match_type === 'doubles';
            const isTeam    = sub.sub_match_type === 'team';
            const side1 = isTeam
              ? sub.team_players?.filter((tp) => tp.side === 1).map((tp) => tp.player_name).join(', ') || '—'
              : isDoubles && sub.player_1b_name
                ? `${sub.player_1_name} & ${sub.player_1b_name}`
                : sub.player_1_name;
            const side2 = isTeam
              ? sub.team_players?.filter((tp) => tp.side === 2).map((tp) => tp.player_name).join(', ') || '—'
              : isDoubles && sub.player_2b_name
                ? `${sub.player_2_name} & ${sub.player_2b_name}`
                : sub.player_2_name;
            const side1Wins = sub.winning_side === 1;
            const side2Wins = sub.winning_side === 2;

            return (
              <div key={sub.id} className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2 text-sm">
                <span className="text-slate-600 text-xs w-5 text-center shrink-0">#{sub.order}</span>
                {/* Type badge */}
                <span className={`badge text-xs capitalize shrink-0 ${
                  isTeam    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  isDoubles ? 'badge-blue' :
                              'bg-slate-700/50 text-slate-400 border border-slate-600'
                }`}>
                  {sub.sub_match_type}
                </span>
                {/* Side 1 */}
                <span className={`flex-1 text-right font-medium truncate ${side1Wins ? 'text-green-400' : 'text-slate-300'}`}>
                  {side1}{side1Wins && <span className="ml-1 text-xs">✓</span>}
                </span>
                <span className="text-slate-600 text-xs shrink-0">vs</span>
                {/* Side 2 */}
                <span className={`flex-1 font-medium truncate ${side2Wins ? 'text-green-400' : 'text-slate-300'}`}>
                  {side2Wins && <span className="mr-1 text-xs">✓</span>}{side2}
                </span>
                {/* Notes */}
                {sub.notes && (
                  <span className="text-slate-500 text-xs hidden lg:block max-w-[140px] truncate shrink-0" title={sub.notes}>
                    {sub.notes}
                  </span>
                )}
                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditSub(sub)} className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors" title="Edit">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => setDeleteSub(sub.id)} className="p-1.5 text-red-600 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors" title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {addModal && (
        <Modal title="Add Sub-Match" onClose={() => setAddModal(false)}>
          <AddSubMatchForm
            match={match}
            loading={addMutation.isPending}
            onCancel={() => setAddModal(false)}
            onSubmit={(data) => addMutation.mutate(data)}
          />
          {addMutation.isError && <ErrorMessage message="Failed to add sub-match." />}
        </Modal>
      )}

      {editSub && (
        <Modal title="Update Sub-Match Result" onClose={() => setEditSub(null)}>
          <UpdateSubMatchForm
            sub={editSub}
            match={match}
            loading={updateMutation.isPending}
            onCancel={() => setEditSub(null)}
            onSubmit={(data) => updateMutation.mutate({ id: editSub.id, data })}
          />
          {updateMutation.isError && <ErrorMessage message="Failed to update sub-match." />}
        </Modal>
      )}

      {deleteSub && (
        <Modal title="Delete Sub-Match?" onClose={() => setDeleteSub(null)}>
          <p className="text-slate-400 mb-6 text-sm">This will permanently remove this sub-match.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteSub(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => deleteMutation.mutate(deleteSub)}
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

// ── Main Page ─────────────────────────────────────────────────────────────

export default function MatchesAdmin() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterSport, setFilterSport] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState(null); // which match row is expanded
  const [createModal, setCreateModal] = useState(false);
  const [editMatch, setEditMatch] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: () => api.getSports({ page_size: 100 }),
    select: (res) => res.data.results ?? res.data,
  });

  const { data: galaxies } = useQuery({
    queryKey: ['galaxies'],
    queryFn: () => api.getGalaxies({ page_size: 100 }),
    select: (res) => res.data.results ?? res.data,
  });

  const params = {
    page,
    ...(filterSport && { sport: filterSport }),
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-matches', filterSport, filterStatus, page],
    queryFn: () => api.getMatches(params),
    select: (res) => res.data,
  });

  const matches = data?.results ?? data ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / 20) : 1;

  // Client-side status filter (pending / completed)
  const filtered = filterStatus === 'pending'
    ? matches.filter((m) => !m.winner)
    : filterStatus === 'completed'
    ? matches.filter((m) => !!m.winner)
    : matches;

  const createMutation = useMutation({
    mutationFn: api.createMatch,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-matches'] }); qc.invalidateQueries({ queryKey: ['galaxies'] }); setCreateModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateMatchResult(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-matches'] }); qc.invalidateQueries({ queryKey: ['galaxies'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setEditMatch(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteMatch,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-matches'] }); qc.invalidateQueries({ queryKey: ['galaxies'] }); setDeleteId(null); },
  });

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Swords size={26} className="text-galaxy-400" />
          <h1 className="text-2xl font-extrabold">Matches</h1>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Match
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterSport} onChange={(e) => { setFilterSport(e.target.value); setPage(1); }} className="input w-auto text-sm">
          <option value="">All Sports</option>
          {sports?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="input w-auto text-sm">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {isLoading && <Spinner className="py-20" size="lg" />}
      {isError && <ErrorMessage message="Failed to load matches." />}

      {/* Table */}
      {!isLoading && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4 w-8"></th>
                  <th className="py-3 px-4">Sport</th>
                  <th className="py-3 px-4">Match</th>
                  <th className="py-3 px-4">Winner</th>
                  <th className="py-3 px-4 text-center">Pts</th>
                  <th className="py-3 px-4 text-center">Subs</th>
                  <th className="py-3 px-4 text-center">Final?</th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-600">No matches found.</td>
                  </tr>
                )}
                {filtered.map((m) => (
                  <>
                    <tr
                      key={m.id}
                      className={`border-b border-slate-800 transition-colors ${expandedId === m.id ? 'bg-slate-800/60' : 'hover:bg-slate-800/40'}`}
                    >
                      {/* Expand toggle */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleExpand(m.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          title={expandedId === m.id ? 'Collapse' : 'Expand sub-matches'}
                        >
                          {expandedId === m.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className="badge badge-blue">{m.sport_name}</span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {m.galaxy_1_name}
                        <span className="text-slate-600 mx-1.5">vs</span>
                        {m.galaxy_2_name}
                      </td>
                      <td className="py-3 px-4">
                        {m.winner_name ? (
                          <span className="flex items-center gap-1.5 text-green-400">
                            <CheckCircle size={13} /> {m.winner_name}
                          </span>
                        ) : (
                          <span className="text-slate-600">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-galaxy-400 font-bold">{m.points_awarded}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`badge ${m.sub_match_count > 0 ? 'badge-blue' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                          {m.sub_match_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {m.is_final ? <Trophy size={15} className="text-yellow-400 mx-auto" /> : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setEditMatch(m)} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors" title="Update result">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteId(m.id)} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded sub-matches row */}
                    {expandedId === m.id && (
                      <tr key={`${m.id}-subs`} className="border-b border-slate-800">
                        <td colSpan={8} className="p-0">
                          <SubMatchesPanel match={m} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create match modal */}
      {createModal && sports && galaxies && (
        <Modal title="New Match" onClose={() => setCreateModal(false)}>
          <CreateMatchForm sports={sports} galaxies={galaxies} loading={createMutation.isPending} onCancel={() => setCreateModal(false)} onSubmit={(data) => createMutation.mutate(data)} />
          {createMutation.isError && <ErrorMessage message="Failed to create match." />}
        </Modal>
      )}

      {/* Edit result modal */}
      {editMatch && galaxies && (
        <Modal title="Update Match Result" onClose={() => setEditMatch(null)}>
          <UpdateResultForm match={editMatch} galaxies={galaxies} loading={updateMutation.isPending} onCancel={() => setEditMatch(null)} onSubmit={(data) => updateMutation.mutate({ id: editMatch.id, data })} />
          {updateMutation.isError && <ErrorMessage message="Failed to update result." />}
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <Modal title="Delete Match?" onClose={() => setDeleteId(null)}>
          <p className="text-slate-400 mb-6 text-sm">This will permanently delete the match and all its sub-matches.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="btn-danger">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
