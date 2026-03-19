import type { Region } from './types';

export const REGIONS: Region[] = ['state_superpowers', 'infrastructure_hunters', 'cybercriminal_cartels', 'shadow_market'];

export const REGION_LABELS: Record<Region, string> = {
  state_superpowers: 'State Superpowers',
  infrastructure_hunters: 'Infrastructure Hunters',
  cybercriminal_cartels: 'Cybercriminal Cartels',
  shadow_market: 'Shadow Market',
};

export const REGION_SUBTITLES: Record<Region, string> = {
  state_superpowers: 'The Nation-States',
  infrastructure_hunters: 'The Critical Threats',
  cybercriminal_cartels: 'The Profit Machines',
  shadow_market: 'The Hired Guns',
};

export const REGION_COLORS: Record<Region, { primary: string; light: string }> = {
  state_superpowers: { primary: '#B91C1C', light: '#EF4444' },
  infrastructure_hunters: { primary: '#B45309', light: '#F59E0B' },
  cybercriminal_cartels: { primary: '#6D28D9', light: '#A78BFA' },
  shadow_market: { primary: '#0F766E', light: '#2DD4BF' },
};

export const ROUND_NAMES: Record<number, string> = {
  1: 'Round of 32',
  2: 'Sweet 16',
  3: 'Elite 8',
  4: 'Final Four',
  5: 'Championship',
};

export const POINTS_PER_ROUND: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
};

export const GAMES_PER_ROUND: Record<number, number> = {
  1: 16,
  2: 8,
  3: 4,
  4: 2,
  5: 1,
};

export const MAX_POSSIBLE_SCORE = 80; // 16 points per round x 5 rounds

export const TOTAL_PICKS = 31; // 16 + 8 + 4 + 2 + 1

// Standard seeding matchups within an 8-team region
// Index = matchup index (0-3), value = [seedA, seedB]
export const ROUND_1_SEED_MATCHUPS: [number, number][] = [
  [1, 8],
  [4, 5],
  [3, 6],
  [2, 7],
];
