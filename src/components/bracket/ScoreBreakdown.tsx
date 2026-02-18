'use client';

import type { ScoreResult } from '@/lib/types';
import { ROUND_NAMES, POINTS_PER_ROUND, GAMES_PER_ROUND } from '@/lib/constants';

interface ScoreBreakdownProps {
  score: ScoreResult;
  revealedThrough: number;
}

export function ScoreBreakdown({ score, revealedThrough }: ScoreBreakdownProps) {
  const percentage = score.maxPossible > 0 ? (score.total / score.maxPossible) * 100 : 0;

  // SVG circle parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="rounded-xl bg-[#1A1A1A] border border-gold/20 p-6">
      <h3 className="font-display text-xl font-bold text-gold mb-6 text-center">
        Score Breakdown
      </h3>

      {/* Circular progress + total score */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#333"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#D4A843"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-bold text-gold">
              {score.total}
            </span>
            <span className="text-xs text-gray-400">
              / {score.maxPossible}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-3">
          {Math.round(percentage)}% of maximum possible
        </p>
      </div>

      {/* Per-round breakdown table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold/20">
              <th className="text-left py-2 px-3 text-gray-400 font-medium">Round</th>
              <th className="text-center py-2 px-3 text-gray-400 font-medium">Correct</th>
              <th className="text-center py-2 px-3 text-gray-400 font-medium">Points</th>
              <th className="text-center py-2 px-3 text-gray-400 font-medium">Max</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((round) => {
              const isRevealed = round <= revealedThrough;
              const roundPoints = score.byRound[round] ?? 0;
              const maxForRound = score.maxPossibleByRound[round] ?? POINTS_PER_ROUND[round] * GAMES_PER_ROUND[round];
              const correctPicks = POINTS_PER_ROUND[round] > 0
                ? roundPoints / POINTS_PER_ROUND[round]
                : 0;

              return (
                <tr
                  key={round}
                  className="border-b border-white/5 last:border-b-0"
                >
                  <td className="py-2.5 px-3 text-white font-medium">
                    {ROUND_NAMES[round]}
                  </td>
                  {isRevealed ? (
                    <>
                      <td className="text-center py-2.5 px-3 text-gray-300">
                        {correctPicks} / {GAMES_PER_ROUND[round]}
                      </td>
                      <td className="text-center py-2.5 px-3 text-gold font-semibold">
                        {roundPoints}
                      </td>
                      <td className="text-center py-2.5 px-3 text-gray-500">
                        {maxForRound}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="text-center py-2.5 px-3 text-gray-600 italic" colSpan={3}>
                        Pending
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
