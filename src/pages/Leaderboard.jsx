/**
 * Public Leaderboard page — shows all galaxies ranked by total points.
 * Top 3 receive gold / silver / bronze visual treatment.
 */
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { api } from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const MEDAL = [
  { label: '1st', cls: 'badge-gold',   ring: 'ring-yellow-500/50', bg: 'bg-yellow-500/10' },
  { label: '2nd', cls: 'badge-silver', ring: 'ring-slate-400/50',  bg: 'bg-slate-400/10' },
  { label: '3rd', cls: 'badge-bronze', ring: 'ring-orange-600/50', bg: 'bg-orange-700/10' },
];

function GalaxyAvatar({ name, logoUrl }) {
  if (logoUrl) {
    return (
      <img src={logoUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />
    );
  }
  // Generate a deterministic color from the name
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
      style={{ background: `hsl(${hue},60%,40%)` }}
    >
      {name.charAt(0)}
    </div>
  );
}

function PodiumCard({ galaxy, rank }) {
  const medal = MEDAL[rank];
  return (
    <div className={`card p-6 flex flex-col items-center gap-3 ring-1 ${medal.ring} ${medal.bg}`}>
      <span className={medal.cls}>{medal.label}</span>
      <GalaxyAvatar name={galaxy.name} logoUrl={galaxy.logo_url} />
      <div className="text-center">
        <p className="font-bold text-lg">{galaxy.name}</p>
        <p className="text-2xl font-extrabold text-galaxy-400 mt-1">
          {galaxy.total_points}
          <span className="text-sm font-normal text-slate-500 ml-1">pts</span>
        </p>
      </div>
    </div>
  );
}

function TableRow({ galaxy, rank }) {
  const medal = rank < 3 ? MEDAL[rank] : null;
  return (
    <tr className={`border-b border-slate-800 transition-colors hover:bg-slate-800/40 ${rank < 3 ? 'bg-slate-800/20' : ''}`}>
      <td className="py-3 px-4 w-12 text-center">
        {medal ? (
          <span className={medal.cls}>{rank + 1}</span>
        ) : (
          <span className="text-slate-500 text-sm font-medium">{rank + 1}</span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <GalaxyAvatar name={galaxy.name} logoUrl={galaxy.logo_url} />
          <span className="font-medium">{galaxy.name}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-right font-bold text-galaxy-400 text-lg">
        {galaxy.total_points}
      </td>
    </tr>
  );
}

export default function Leaderboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['galaxies', 'leaderboard'],
    queryFn: () => api.getGalaxies({ ordering: '-total_points', page_size: 100 }),
    select: (res) => res.data.results ?? res.data,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy size={28} className="text-yellow-400" />
        <div>
          <h1 className="text-2xl font-extrabold">Galaxy Leaderboard</h1>
          <p className="text-slate-500 text-sm">Live standings — sorted by total points</p>
        </div>
      </div>

      {isLoading && <Spinner className="py-20" size="lg" />}
      {isError && <ErrorMessage message="Failed to load leaderboard." />}

      {data && (
        <>
          {/* Top-3 Podium */}
          {data.length >= 3 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Star size={12} /> Top Galaxies
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.slice(0, 3).map((g, i) => (
                  <PodiumCard key={g.id} galaxy={g} rank={i} />
                ))}
              </div>
            </section>
          )}

          {/* Full Rankings Table */}
          <section className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
              <TrendingUp size={16} className="text-galaxy-400" />
              <h2 className="font-semibold text-slate-200">Full Rankings</h2>
              <span className="ml-auto text-xs text-slate-500">{data.length} galaxies</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                    <th className="py-3 px-4">Galaxy</th>
                    <th className="py-3 px-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((g, i) => (
                    <TableRow key={g.id} galaxy={g} rank={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
