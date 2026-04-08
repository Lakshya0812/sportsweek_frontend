/**
 * Public Matches page — lists all matches filterable by sport.
 * Each card expands to show individual player sub-matches.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Swords, Trophy, Filter, ChevronDown, ChevronUp, Users, CheckCircle } from 'lucide-react';
import { api } from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Pagination from '../components/Pagination.jsx';

// ── Sub-Match List ────────────────────────────────────────────────────────

function SubMatchList({ subMatches }) {
  if (!subMatches || subMatches.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
        <Users size={11} /> Player Matchups
      </p>
      <div className="space-y-1.5">
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
            <div key={sub.id} className="text-xs bg-slate-800/60 rounded-lg px-3 py-2 space-y-1.5">
              {/* Header row: order + type badge + notes */}
              <div className="flex items-center gap-2">
                <span className="text-slate-600 w-5 text-center shrink-0">#{sub.order}</span>
                <span className={`badge capitalize shrink-0 ${
                  isTeam
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : isDoubles
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                }`}>
                  {sub.sub_match_type}
                </span>
                {sub.notes && (
                  <span className="text-slate-500 truncate hidden sm:block" title={sub.notes}>
                    {sub.notes}
                  </span>
                )}
              </div>
              {/* Matchup row */}
              <div className="flex items-center gap-2 pl-7">
                <span className={`flex-1 text-right font-medium truncate ${side1Wins ? 'text-green-400' : 'text-slate-300'}`}>
                  {side1Wins && <CheckCircle size={10} className="inline mr-1 mb-0.5" />}
                  {side1}
                </span>
                <span className="text-slate-600 shrink-0 text-xs">vs</span>
                <span className={`flex-1 font-medium truncate ${side2Wins ? 'text-green-400' : 'text-slate-300'}`}>
                  {side2}
                  {side2Wins && <CheckCircle size={10} className="inline ml-1 mb-0.5" />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Match Card ────────────────────────────────────────────────────────────

function MatchCard({ match }) {
  const [expanded, setExpanded] = useState(false);
  const hasResult  = !!match.winner;
  const isFinal    = match.is_final;
  const subCount   = match.sub_match_count ?? match.sub_matches?.length ?? 0;

  return (
    <div className="card hover:border-slate-700 transition-colors flex flex-col">
      <div className="p-5 flex flex-col flex-1 min-h-[11rem]">
        {/* Sport + badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="badge badge-blue">{match.sport_name}</span>
          {isFinal && (
            <span className="badge bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              <Trophy size={10} className="mr-1" /> Final
            </span>
          )}
          {!hasResult && (
            <span className="badge bg-slate-700/50 text-slate-400 border border-slate-600/30 ml-auto">
              Upcoming
            </span>
          )}
        </div>

        {/* Teams — grows to fill card height */}
        <div className="flex items-center justify-between gap-4 flex-1">
          <div className={`flex-1 text-center ${hasResult && match.winner_name === match.galaxy_1_name ? 'text-green-400' : ''}`}>
            <p className="font-bold text-base">{match.galaxy_1_name}</p>
            {hasResult && match.winner_name === match.galaxy_1_name && (
              <p className="text-xs text-green-400 mt-1 font-medium">Winner ✓</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Swords size={18} className="text-slate-600" />
            <span className="text-xs text-slate-600 font-medium">VS</span>
          </div>
          <div className={`flex-1 text-center ${hasResult && match.winner_name === match.galaxy_2_name ? 'text-green-400' : ''}`}>
            <p className="font-bold text-base">{match.galaxy_2_name}</p>
            {hasResult && match.winner_name === match.galaxy_2_name && (
              <p className="text-xs text-green-400 mt-1 font-medium">Winner ✓</p>
            )}
          </div>
        </div>

        {/* Points row */}
        {hasResult && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Points awarded</span>
            <span className="text-galaxy-400 font-semibold">
              {match.points_awarded}
              {match.bonus_points > 0 && (
                <span className="text-yellow-400 ml-1">(+{match.bonus_points} bonus)</span>
              )}
            </span>
          </div>
        )}

        {/* Sub-match expand toggle */}
        {subCount > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 py-1.5 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
          >
            <Users size={11} />
            {subCount} matchup{subCount !== 1 ? 's' : ''} (singles &amp; doubles)
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Sub-matches panel */}
      {expanded && (
        <div className="px-5 pb-4">
          <SubMatchList subMatches={match.sub_matches} />
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function Matches() {
  const [selectedSport, setSelectedSport] = useState('');
  const [page, setPage] = useState(1);

  const { data: sportsData } = useQuery({
    queryKey: ['sports'],
    queryFn: () => api.getSports({ page_size: 100 }),
    select: (res) => res.data.results ?? res.data,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['matches', selectedSport, page],
    queryFn: () => api.getMatches({ ...(selectedSport && { sport: selectedSport }), page }),
    select: (res) => res.data,
  });

  const matches    = data?.results ?? data ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / 20) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Swords size={28} className="text-galaxy-400" />
          <div>
            <h1 className="text-2xl font-extrabold">Matches</h1>
            <p className="text-slate-500 text-sm">All fixtures — click a match to see player matchups</p>
          </div>
        </div>

        {/* Sport filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={selectedSport}
            onChange={(e) => { setSelectedSport(e.target.value); setPage(1); }}
            className="input w-auto text-sm"
          >
            <option value="">All Sports</option>
            {sportsData?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <Spinner className="py-20" size="lg" />}
      {isError && <ErrorMessage message="Failed to load matches." />}

      {!isLoading && !isError && matches.length === 0 && (
        <div className="card p-12 text-center text-slate-500">No matches found.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
