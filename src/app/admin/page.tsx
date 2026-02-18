import { createServerClient } from '@/lib/supabase';
import type { TournamentStatus } from '@/lib/types';

interface StatCard {
  label: string;
  value: string | number;
  detail?: string;
}

export default async function AdminDashboardPage() {
  const supabase = createServerClient();

  // Fetch all stats in parallel
  const [tournamentRes, artistRes, submissionRes] = await Promise.all([
    supabase.from('tournament').select('id, name, status'),
    supabase.from('artists').select('id', { count: 'exact', head: true }),
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
  ]);

  const tournaments = tournamentRes.data ?? [];
  const artistCount = artistRes.count ?? 0;
  const submissionCount = submissionRes.count ?? 0;

  // Determine active tournament info
  const activeTournament = tournaments.find(
    (t) => t.status !== 'complete' && t.status !== 'setup'
  );
  const activeTournamentLabel = activeTournament
    ? `${activeTournament.name}`
    : 'None';
  const activeTournamentStatus = activeTournament
    ? formatStatus(activeTournament.status)
    : '--';

  const stats: StatCard[] = [
    {
      label: 'Tournaments',
      value: tournaments.length,
      detail: `Active: ${activeTournamentLabel}`,
    },
    {
      label: 'Tournament Status',
      value: activeTournamentStatus,
      detail: activeTournament ? `ID: ${activeTournament.id.slice(0, 8)}...` : undefined,
    },
    {
      label: 'Artists',
      value: artistCount,
      detail: `${Math.floor(artistCount / 4)} per region (avg)`,
    },
    {
      label: 'Submissions',
      value: submissionCount,
      detail: 'Total bracket submissions',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#D4A843] mb-1">Dashboard</h1>
      <p className="text-zinc-500 text-sm mb-8">
        Overview of your Tournament of Jazz bracket.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-zinc-800 bg-[#1A1A1A] p-5"
          >
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
              {stat.label}
            </p>
            <p className="text-3xl font-bold text-zinc-100">{stat.value}</p>
            {stat.detail && (
              <p className="text-xs text-zinc-500 mt-2">{stat.detail}</p>
            )}
          </div>
        ))}
      </div>

      {tournaments.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-zinc-700 p-8 text-center">
          <p className="text-zinc-400">
            No tournaments yet. Create one to get started.
          </p>
        </div>
      )}

      {tournaments.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">
            All Tournaments
          </h2>
          <div className="rounded-lg border border-zinc-800 bg-[#1A1A1A] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                    ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-zinc-800/50 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-zinc-200">{t.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                      {t.id.slice(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: TournamentStatus }) {
  const colors: Record<TournamentStatus, string> = {
    setup: 'bg-zinc-700 text-zinc-300',
    open: 'bg-emerald-900/60 text-emerald-400',
    closed: 'bg-amber-900/60 text-amber-400',
    revealing: 'bg-purple-900/60 text-purple-400',
    complete: 'bg-blue-900/60 text-blue-400',
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-zinc-700 text-zinc-300'}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
