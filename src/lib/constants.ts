import type { Region } from './types';

export const REGIONS: Region[] = ['vocalists', 'bandleaders', 'composers', 'soloists'];

export const REGION_LABELS: Record<Region, string> = {
  vocalists: 'The Vocalists',
  bandleaders: 'The Band Leaders',
  composers: 'The Composers',
  soloists: 'The Soloists',
};

export const REGION_SUBTITLES: Record<Region, string> = {
  vocalists: 'The Storytellers',
  bandleaders: 'The Architects',
  composers: 'The Authors',
  soloists: 'The Virtuosos',
};

export const ROUND_NAMES: Record<number, string> = {
  1: 'Round of 64',
  2: 'Round of 32',
  3: 'Sweet 16',
  4: 'Elite 8',
  5: 'Final Four',
  6: 'Championship',
};

export const POINTS_PER_ROUND: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
  6: 32,
};

export const GAMES_PER_ROUND: Record<number, number> = {
  1: 32,
  2: 16,
  3: 8,
  4: 4,
  5: 2,
  6: 1,
};

export const MAX_POSSIBLE_SCORE = 192; // 32 points per round x 6 rounds

export const TOTAL_PICKS = 63; // 32 + 16 + 8 + 4 + 2 + 1

// Standard March Madness seeding matchups within a 16-team region
// Index = matchup index (0-7), value = [seedA, seedB]
export const ROUND_1_SEED_MATCHUPS: [number, number][] = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
];
