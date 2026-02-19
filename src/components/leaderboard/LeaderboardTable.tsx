'use client';

import Link from 'next/link';
import type { ScoreResult } from '@/lib/types';
import { ROUND_NAMES } from '@/lib/constants';

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  accessToken: string;
  score: ScoreResult;
  rank: number;
}

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  revealedThrough: number;
  tournamentName: string;
}

const ROUND_SHORT_LABELS: Record<number, string> = {
  1: 'R1',
  2: 'R2',
  3: 'S16',
  4: 'E8',
  5: 'FF',
  6: 'Champ',
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-champion text-[#0A0A0A] font-bold text-sm shadow-lg shadow-champion/20">
        {rank}
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#A8A8A8] text-[#0A0A0A] font-bold text-sm shadow-lg shadow-[#A8A8A8]/20">
        {rank}
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#CD7F32] text-[#0A0A0A] font-bold text-sm shadow-lg shadow-[#CD7F32]/20">
        {rank}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-muted font-medium text-sm">
      {rank}
    </span>
  );
}

export default function LeaderboardTable({
  entries,
  revealedThrough,
  tournamentName,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-accent text-center mb-4">
          {tournamentName}
        </h1>
        <p className="text-center text-muted font-sans text-lg">
          No brackets submitted yet.
        </p>
      </div>
    );
  }

  if (revealedThrough === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-accent text-center mb-2">
          {tournamentName}
        </h1>
        <p className="text-center text-dim font-sans text-sm mb-8">
          {entries.length} bracket{entries.length !== 1 ? 's' : ''} submitted
        </p>
        <div className="rounded-xl border border-subtle bg-surface-hover p-8 text-center">
          <p className="text-muted font-sans text-base leading-relaxed">
            No rounds revealed yet. Scores will appear once the hosts start revealing results.
          </p>
        </div>
      </div>
    );
  }

  const revealedRoundName = ROUND_NAMES[revealedThrough] ?? `Round ${revealedThrough}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-accent mb-2">
          {tournamentName}
        </h1>
        <p className="text-dim font-sans text-sm">
          {entries.length} bracket{entries.length !== 1 ? 's' : ''} submitted
          <span className="mx-2 text-zinc-700">|</span>
          Revealed through {revealedRoundName}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-subtle bg-surface-hover overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dim w-16 text-center">
                  Rank
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dim">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-accent text-right">
                  Score
                </th>
                {[1, 2, 3, 4, 5, 6].map((round) => (
                  <th
                    key={round}
                    className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider text-right whitespace-nowrap ${
                      round <= revealedThrough ? 'text-muted' : 'text-zinc-700'
                    }`}
                  >
                    {ROUND_SHORT_LABELS[round]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const isTop1 = entry.rank === 1;
                const isTop3 = entry.rank <= 3;

                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-subtle/50 transition-colors hover:bg-charcoal/30 ${
                      isTop1
                        ? 'bg-accent/5'
                        : isTop3
                        ? 'bg-charcoal/10'
                        : ''
                    } ${index === entries.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <RankBadge rank={entry.rank} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/bracket/${entry.accessToken}`}
                        className={`font-medium transition-colors hover:underline ${
                          isTop1
                            ? 'text-accent'
                            : 'text-zinc-200 hover:text-accent'
                        }`}
                      >
                        {entry.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-bold tabular-nums ${
                          isTop1 ? 'text-champion text-lg' : 'text-foreground'
                        }`}
                      >
                        {entry.score.total}
                      </span>
                    </td>
                    {[1, 2, 3, 4, 5, 6].map((round) => (
                      <td
                        key={round}
                        className={`px-3 py-3 text-right tabular-nums text-sm ${
                          round <= revealedThrough
                            ? 'text-foreground'
                            : 'text-zinc-700'
                        }`}
                      >
                        {round <= revealedThrough
                          ? entry.score.byRound[round]
                          : '\u2014'}
                      </td>
                    ))}
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
