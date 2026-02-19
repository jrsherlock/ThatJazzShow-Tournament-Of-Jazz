import type { Artist, Region, Pick } from './types';
import { REGIONS, ROUND_1_SEED_MATCHUPS } from './constants';

/**
 * Generate a matchup key string from round and matchup index.
 * e.g., round 1, matchup 0 → "1-0"
 */
export function matchupKey(round: number, matchupIndex: number): string {
  return `${round}-${matchupIndex}`;
}

/**
 * Parse a matchup key into round and matchup index.
 */
export function parseMatchupKey(key: string): { round: number; matchupIndex: number } {
  const [round, matchupIndex] = key.split('-').map(Number);
  return { round, matchupIndex };
}

/**
 * Get the number of matchups in a given round.
 * Round 1 = 32, Round 2 = 16, ..., Round 6 = 1
 */
export function matchupsInRound(round: number): number {
  return Math.pow(2, 6 - round); // 32, 16, 8, 4, 2, 1
}

/**
 * Get the region for a given round 1 matchup index (0-31).
 * Matchups 0-7 = region 0 (vocalists), 8-15 = region 1 (bandleaders), etc.
 */
export function regionForMatchup(matchupIndex: number): Region {
  const regionIndex = Math.floor(matchupIndex / 8);
  return REGIONS[regionIndex];
}

/**
 * Get the two Round 1 artists for a given matchup within a region.
 * regionMatchupIndex is 0-7 (within the region).
 */
export function getRound1Artists(
  artists: Artist[],
  region: Region,
  regionMatchupIndex: number
): [Artist | null, Artist | null] {
  const [seedA, seedB] = ROUND_1_SEED_MATCHUPS[regionMatchupIndex];
  const artistA = artists.find((a) => a.region === region && a.seed === seedA) ?? null;
  const artistB = artists.find((a) => a.region === region && a.seed === seedB) ?? null;
  return [artistA, artistB];
}

/**
 * Get all Round 1 matchups for a specific region.
 * Returns array of 8 matchups with their artists.
 */
export function getRegionRound1Matchups(
  artists: Artist[],
  region: Region
): { key: string; artistA: Artist | null; artistB: Artist | null }[] {
  const regionIndex = REGIONS.indexOf(region);
  return ROUND_1_SEED_MATCHUPS.map((_, i) => {
    const globalIndex = regionIndex * 8 + i;
    const [artistA, artistB] = getRound1Artists(artists, region, i);
    return {
      key: matchupKey(1, globalIndex),
      artistA,
      artistB,
    };
  });
}

/**
 * Given a matchup in round N at index I, determine the parent matchup key
 * in round N-1 that feeds into it.
 * Each matchup in round N is fed by two matchups in round N-1:
 *   parentA = round (N-1), index (I * 2)
 *   parentB = round (N-1), index (I * 2 + 1)
 */
export function getParentMatchupKeys(
  round: number,
  matchupIndex: number
): [string, string] | null {
  if (round <= 1) return null;
  return [
    matchupKey(round - 1, matchupIndex * 2),
    matchupKey(round - 1, matchupIndex * 2 + 1),
  ];
}

/**
 * Given a matchup, determine the child matchup key (the next round matchup
 * this feeds into).
 */
export function getChildMatchupKey(
  round: number,
  matchupIndex: number
): string | null {
  if (round >= 6) return null;
  return matchupKey(round + 1, Math.floor(matchupIndex / 2));
}

/**
 * Determine whether a given artist is artist A or B in the child matchup.
 * Even matchup indices feed into position A, odd into position B.
 */
export function getPositionInChild(matchupIndex: number): 'A' | 'B' {
  return matchupIndex % 2 === 0 ? 'A' : 'B';
}

/**
 * Get the two artists for any matchup (round >= 2) based on current picks.
 * For round 1, use getRound1Artists instead.
 * For later rounds, the artists are the winners of the two parent matchups.
 */
export function getMatchupArtists(
  round: number,
  matchupIndex: number,
  picks: Record<string, Pick>,
  artists: Artist[]
): [Artist | null, Artist | null] {
  if (round === 1) {
    const region = regionForMatchup(matchupIndex);
    const regionMatchupIndex = matchupIndex % 8;
    return getRound1Artists(artists, region, regionMatchupIndex);
  }

  const parentKeys = getParentMatchupKeys(round, matchupIndex);
  if (!parentKeys) return [null, null];

  const [parentKeyA, parentKeyB] = parentKeys;
  const pickA = picks[parentKeyA];
  const pickB = picks[parentKeyB];

  const artistA = pickA ? artists.find((a) => a.id === pickA.winnerId) ?? null : null;
  const artistB = pickB ? artists.find((a) => a.id === pickB.winnerId) ?? null : null;

  return [artistA, artistB];
}

/**
 * When a pick is changed, cascade the change: clear all downstream picks
 * that depended on the previous winner.
 * Returns the updated picks object and a list of cleared matchup keys.
 */
export function cascadePicks(
  picks: Record<string, Pick>,
  changedRound: number,
  changedMatchupIndex: number,
  previousWinnerId: string | null
): { updatedPicks: Record<string, Pick>; clearedKeys: string[] } {
  if (!previousWinnerId) {
    return { updatedPicks: { ...picks }, clearedKeys: [] };
  }

  const updatedPicks = { ...picks };
  const clearedKeys: string[] = [];

  // Walk forward through rounds, clearing any pick that contains the old winner
  let currentRound = changedRound + 1;
  let currentMatchupIndex = Math.floor(changedMatchupIndex / 2);

  while (currentRound <= 6) {
    const key = matchupKey(currentRound, currentMatchupIndex);
    const pick = updatedPicks[key];

    if (pick && pick.winnerId === previousWinnerId) {
      delete updatedPicks[key];
      clearedKeys.push(key);
    }

    currentRound++;
    currentMatchupIndex = Math.floor(currentMatchupIndex / 2);
  }

  return { updatedPicks, clearedKeys };
}

/**
 * Generate all matchup keys for a given round.
 */
export function allKeysForRound(round: number): string[] {
  const count = matchupsInRound(round);
  return Array.from({ length: count }, (_, i) => matchupKey(round, i));
}

/**
 * Generate all 63 matchup keys across all 6 rounds.
 */
export function allMatchupKeys(): string[] {
  const keys: string[] = [];
  for (let round = 1; round <= 6; round++) {
    keys.push(...allKeysForRound(round));
  }
  return keys;
}

/**
 * Count how many picks have been made.
 */
export function countPicks(picks: Record<string, Pick>): number {
  return Object.keys(picks).length;
}

/**
 * Check if the bracket is complete (all 63 picks made).
 */
export function isBracketComplete(picks: Record<string, Pick>): boolean {
  return countPicks(picks) === 63;
}

/**
 * Count how many picks have been made within a single region (rounds 1-4).
 * Max = 15 (8 + 4 + 2 + 1).
 */
export function getRegionPickCount(
  picks: Record<string, Pick>,
  regionIndex: number
): number {
  let count = 0;
  for (let i = 0; i < 8; i++) {
    if (picks[matchupKey(1, regionIndex * 8 + i)]) count++;
  }
  for (let i = 0; i < 4; i++) {
    if (picks[matchupKey(2, regionIndex * 4 + i)]) count++;
  }
  for (let i = 0; i < 2; i++) {
    if (picks[matchupKey(3, regionIndex * 2 + i)]) count++;
  }
  if (picks[matchupKey(4, regionIndex)]) count++;
  return count;
}

/**
 * Get the artist who won a region's Elite 8 matchup (round 4).
 * Returns null if not yet picked.
 */
export function getRegionWinner(
  picks: Record<string, Pick>,
  artists: Artist[],
  regionIndex: number
): Artist | null {
  const pick = picks[matchupKey(4, regionIndex)];
  if (!pick) return null;
  return artists.find((a) => a.id === pick.winnerId) ?? null;
}

/**
 * Get the region for a matchup at any round.
 * Rounds 1-4 are within regions. Round 5 (Final Four) and 6 (Championship) are cross-region.
 */
export function getRegionForMatchup(round: number, matchupIndex: number): Region | null {
  if (round >= 5) return null; // Final Four and Championship are cross-region
  // In rounds 1-4, trace back to round 1 to determine region
  let idx = matchupIndex;
  for (let r = round; r > 1; r--) {
    idx = idx * 2;
  }
  return regionForMatchup(idx);
}
