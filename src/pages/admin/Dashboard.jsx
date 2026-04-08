/**
 * Admin Dashboard — shows summary stats and points distribution table.
 */
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Trophy, Swords, Star, CheckCircle, Clock, Users, GitBranch } from 'lucide-react';
import { api } from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-extrabold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
    select: (res) => res.data,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <LayoutDashboard size={28} className="text-galaxy-400" />
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard</h1>
          <p className="text-slate-500 text-sm">Tournament overview</p>
        </div>
      </div>

      {isLoading && <Spinner className="py-20" size="lg" />}
      {isError && <ErrorMessage message="Failed to load dashboard data." />}

      {data && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Matches"  value={data.total_matches}     icon={Swords}      color="bg-galaxy-600" />
            <StatCard label="Completed"      value={data.completed_matches} icon={CheckCircle} color="bg-green-700" />
            <StatCard label="Pending"        value={data.pending_matches}   icon={Clock}       color="bg-yellow-700" />
            <StatCard label="Galaxies"       value={data.total_galaxies}    icon={Star}        color="bg-purple-700" />
            <StatCard label="Sports"         value={data.total_sports}      icon={Trophy}      color="bg-blue-700" />
            <StatCard label="Players"        value={data.total_players}     icon={Users}       color="bg-pink-700" />
            <StatCard label="Sub-Matches"    value={data.total_sub_matches} icon={GitBranch}   color="bg-teal-700" />
          </div>

          {/* Points distribution */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
              <Trophy size={16} className="text-yellow-400" />
              <h2 className="font-semibold">Points Distribution</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Galaxy</th>
                    <th className="py-3 px-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {data.points_distribution.map((g, i) => {
                    // Visual bar proportional to max points
                    const max = data.points_distribution[0]?.total_points || 1;
                    const pct = Math.round((g.total_points / max) * 100);
                    return (
                      <tr key={g.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-slate-500 font-medium">{i + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-medium">{g.name}</span>
                            {/* Points bar */}
                            <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-xs">
                              <div
                                className="bg-galaxy-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-galaxy-400 text-base">
                          {g.total_points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
