'use client';

import type { Artist, Pick } from '@/lib/types';
import { REGIONS, REGION_LABELS, REGION_SUBTITLES, REGION_COLORS } from '@/lib/constants';
import { getRegionPickCount, getRegionWinner } from '@/lib/bracket-utils';

interface RegionCardProps {
  regionIndex: number;
  artists: Artist[];
  picks: Record<string, Pick>;
  onOpen: (regionIndex: number) => void;
}

const REGION_PICK_MAX = 15; // 8 + 4 + 2 + 1

export function RegionCard({
  regionIndex,
  artists,
  picks,
  onOpen,
}: RegionCardProps) {
  const region = REGIONS[regionIndex];
  const colors = REGION_COLORS[region];
  const pickCount = getRegionPickCount(picks, regionIndex);
  const winner = getRegionWinner(picks, artists, regionIndex);
  const progressPercent = Math.round((pickCount / REGION_PICK_MAX) * 100);

  return (
    <button
      onClick={() => onOpen(regionIndex)}
      className="group w-full text-left rounded-xl border border-subtle hover:border-accent/50 bg-surface hover:bg-surface-hover transition-all duration-300 p-6 accent-glow focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
      {/* Region name + subtitle */}
      <h3 className="font-display text-2xl sm:text-3xl font-bold transition-colors" style={{ color: colors.primary }}>
        {REGION_LABELS[region]}
      </h3>
      <p className="text-sm text-muted italic mt-0.5 font-display">
        {REGION_SUBTITLES[region]}
      </p>

      {/* Progress bar */}
      <div className="mt-4 w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.light})`, width: `${progressPercent}%` }}
        />
      </div>

      {/* Pick count */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-dim">
          {pickCount} / {REGION_PICK_MAX} picks
        </span>
        {winner ? (
          <span className="text-xs font-semibold text-champion truncate ml-2">
            {winner.name}
          </span>
        ) : (
          <span className="text-xs text-dim">
            Tap to fill bracket
          </span>
        )}
      </div>
    </button>
  );
}
