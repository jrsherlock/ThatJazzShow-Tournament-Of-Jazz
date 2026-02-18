'use client';

import { useState } from 'react';
import type { ScoreResult } from '@/lib/types';
import { ROUND_NAMES, POINTS_PER_ROUND, GAMES_PER_ROUND } from '@/lib/constants';

interface RankedSubmission {
  id: string;
  displayName: string;
  accessToken: string;
  score: ScoreResult;
  rank: number;
}

interface SubmissionsTableProps {
  rankedSubmissions: RankedSubmission[];
  revealedThroughRound: number;
  tournamentName: string;
}

const ROUND_SHORT_NAMES: Record<number, string> = {
  1: 'R1',
  2: 'R2',
  3: 'S16',
  4: 'E8',
  5: 'FF',
  6: 'Champ',
};

export default function SubmissionsTable({
  rankedSubmissions,
  revealedThroughRound,
  tournamentName,
}: SubmissionsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#D4A843] tracking-wide">
          Submissions
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          View all bracket submissions and scores for {tournamentName}.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1A1A1A] border border-[#D4A843]/20 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
            Total Submissions
          </p>
          <p className="text-2xl font-bold text-[#D4A843]">
            {rankedSubmissions.length}
          </p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#D4A843]/20 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
            Rounds Revealed
          </p>
          <p className="text-2xl font-bold text-zinc-200">
            {revealedThroughRound}{' '}
            <span className="text-sm font-normal text-zinc-500">of 6</span>
          </p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#D4A843]/20 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
            {revealedThroughRound > 0 ? 'Leader Score' : 'Status'}
          </p>
          <p className="text-2xl font-bold text-zinc-200">
            {revealedThroughRound > 0 && rankedSubmissions.length > 0
              ? `${rankedSubmissions[0].score.total} pts`
              : 'Awaiting reveal'}
          </p>
        </div>
      </div>

      {/* No rounds revealed notice */}
      {revealedThroughRound === 0 && (
        <div className="bg-[#1A1A1A] border border-[#D4A843]/20 rounded-lg px-4 py-3">
          <p className="text-zinc-400 text-sm">
            No rounds have been revealed yet. Scores will appear once the first round is revealed
            from the{' '}
            <span className="text-[#D4A843]">Reveal</span> page.
          </p>
        </div>
      )}

      {/* No submissions */}
      {rankedSubmissions.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-400 text-lg">No submissions yet.</p>
          <p className="text-zinc-600 text-sm mt-1">
            Submissions will appear here once participants submit their brackets.
          </p>
        </div>
      )}

      {/* Submissions Table */}
      {rankedSubmissions.length > 0 && (
        <div className="bg-[#1A1A1A] border border-[#D4A843]/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D4A843]/30">
                  <th className="text-left px-4 py-3 text-[#D4A843] font-semibold uppercase tracking-wider text-xs w-16">
                    Rank
                  </th>
                  <th className="text-left px-4 py-3 text-[#D4A843] font-semibold uppercase tracking-wider text-xs">
                    Name
                  </th>
                  <th className="text-center px-4 py-3 text-[#D4A843] font-semibold uppercase tracking-wider text-xs w-20">
                    Total
                  </th>
                  {[1, 2, 3, 4, 5, 6].map((round) => (
                    <th
                      key={round}
                      className={`text-center px-3 py-3 font-semibold uppercase tracking-wider text-xs w-16 ${
                        round <= revealedThroughRound
                          ? 'text-[#D4A843]'
                          : 'text-zinc-600'
                      }`}
                    >
                      {ROUND_SHORT_NAMES[round]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankedSubmissions.map((submission, index) => {
                  const isExpanded = expandedId === submission.id;
                  const isEven = index % 2 === 0;

                  return (
                    <Fragment key={submission.id}>
                      <tr
                        onClick={() => toggleExpand(submission.id)}
                        className={`border-b border-zinc-800/60 cursor-pointer transition-colors hover:bg-[#D4A843]/5 ${
                          isEven ? 'bg-[#1A1A1A]' : 'bg-[#151515]'
                        } ${isExpanded ? 'bg-[#D4A843]/10 hover:bg-[#D4A843]/10' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              submission.rank === 1
                                ? 'bg-[#D4A843]/20 text-[#D4A843]'
                                : submission.rank === 2
                                ? 'bg-zinc-600/20 text-zinc-300'
                                : submission.rank === 3
                                ? 'bg-amber-800/20 text-amber-600'
                                : 'text-zinc-500'
                            }`}
                          >
                            {submission.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-200 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{submission.displayName}</span>
                            <svg
                              className={`w-4 h-4 text-zinc-500 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-zinc-100 font-bold">
                            {revealedThroughRound > 0
                              ? submission.score.total
                              : '\u2014'}
                          </span>
                        </td>
                        {[1, 2, 3, 4, 5, 6].map((round) => (
                          <td
                            key={round}
                            className={`px-3 py-3 text-center text-xs ${
                              round <= revealedThroughRound
                                ? 'text-zinc-300'
                                : 'text-zinc-700'
                            }`}
                          >
                            {round <= revealedThroughRound
                              ? submission.score.byRound[round]
                              : '\u2014'}
                          </td>
                        ))}
                      </tr>

                      {/* Expanded details row */}
                      {isExpanded && (
                        <tr
                          className={
                            isEven ? 'bg-[#1A1A1A]' : 'bg-[#151515]'
                          }
                        >
                          <td
                            colSpan={9}
                            className="px-4 py-4 border-b border-zinc-800/60"
                          >
                            <SubmissionDetails
                              submission={submission}
                              revealedThroughRound={revealedThroughRound}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Fragment import ─── */
import { Fragment } from 'react';

/* ─── Expanded detail component ─── */
function SubmissionDetails({
  submission,
  revealedThroughRound,
}: {
  submission: RankedSubmission;
  revealedThroughRound: number;
}) {
  return (
    <div className="space-y-4 pl-8">
      {/* Score Breakdown */}
      <div>
        <h4 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
          Score Breakdown
        </h4>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5, 6].map((round) => {
            const isRevealed = round <= revealedThroughRound;
            const maxForRound = POINTS_PER_ROUND[round] * GAMES_PER_ROUND[round];
            const scored = submission.score.byRound[round];

            return (
              <div
                key={round}
                className={`px-3 py-2 rounded border text-center min-w-[80px] ${
                  isRevealed
                    ? 'border-[#D4A843]/30 bg-[#D4A843]/5'
                    : 'border-zinc-800 bg-zinc-900/30'
                }`}
              >
                <p
                  className={`text-xs mb-1 ${
                    isRevealed ? 'text-[#D4A843]/70' : 'text-zinc-600'
                  }`}
                >
                  {ROUND_NAMES[round]}
                </p>
                <p
                  className={`text-sm font-bold ${
                    isRevealed ? 'text-zinc-200' : 'text-zinc-700'
                  }`}
                >
                  {isRevealed ? `${scored} / ${maxForRound}` : '\u2014'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500">
        <span>
          Submission ID:{' '}
          <span className="text-zinc-400 font-mono">{submission.id.slice(0, 8)}...</span>
        </span>
        <span>
          Total Score:{' '}
          <span className="text-zinc-300 font-semibold">
            {revealedThroughRound > 0 ? `${submission.score.total} pts` : 'N/A'}
          </span>
        </span>
        <span>
          Max Possible:{' '}
          <span className="text-zinc-400">{submission.score.maxPossible} pts</span>
        </span>
      </div>
    </div>
  );
}
