import type { Pick, ScoreResult } from './types';
import { POINTS_PER_ROUND, GAMES_PER_ROUND } from './constants';

/**
 * Score a participant's bracket against the master bracket.
 * Only counts rounds that have been revealed (revealedThroughRound).
 *
 * ESPN-style escalating points:
 *   Round 1 = 1pt, Round 2 = 2pts, Sweet 16 = 4pts,
 *   Elite 8 = 8pts, Final Four = 16pts, Championship = 32pts
 */
export function scoreSubmission(
  picks: Record<string, Pick>,
  masterPicks: Record<string, { winnerId: string }>,
  revealedThroughRound: number
): ScoreResult {
  const byRound: Record<number, number> = {};
  const maxPossibleByRound: Record<number, number> = {};
  let total = 0;
  let maxPossible = 0;

  for (let round = 1; round <= 6; round++) {
    const points = POINTS_PER_ROUND[round];
    const games = GAMES_PER_ROUND[round];

    maxPossibleByRound[round] = points * games;
    maxPossible += maxPossibleByRound[round];

    if (round > revealedThroughRound) {
      byRound[round] = 0;
      continue;
    }

    let roundScore = 0;
    for (const [key, masterPick] of Object.entries(masterPicks)) {
      const keyRound = parseInt(key.split('-')[0]);
      if (keyRound !== round) continue;

      const participantPick = picks[key];
      if (participantPick && participantPick.winnerId === masterPick.winnerId) {
        roundScore += points;
      }
    }

    byRound[round] = roundScore;
    total += roundScore;
  }

  return { total, byRound, maxPossible, maxPossibleByRound };
}

/**
 * Score multiple submissions and return them sorted by total score (descending).
 */
export function scoreAndRankSubmissions(
  submissions: { id: string; display_name: string; picks: Record<string, Pick>; access_token: string }[],
  masterPicks: Record<string, { winnerId: string }>,
  revealedThroughRound: number
): {
  id: string;
  displayName: string;
  accessToken: string;
  score: ScoreResult;
  rank: number;
}[] {
  const scored = submissions.map((sub) => ({
    id: sub.id,
    displayName: sub.display_name,
    accessToken: sub.access_token,
    score: scoreSubmission(sub.picks, masterPicks, revealedThroughRound),
  }));

  // Sort by total score descending
  scored.sort((a, b) => b.score.total - a.score.total);

  // Assign ranks (handle ties)
  let currentRank = 1;
  return scored.map((entry, index) => {
    if (index > 0 && entry.score.total < scored[index - 1].score.total) {
      currentRank = index + 1;
    }
    return { ...entry, rank: currentRank };
  });
}
