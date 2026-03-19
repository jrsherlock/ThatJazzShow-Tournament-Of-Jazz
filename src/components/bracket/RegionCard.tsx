'use client';

import type { ThreatActor, Pick } from '@/lib/types';
import { REGIONS, REGION_LABELS, REGION_SUBTITLES, REGION_COLORS } from '@/lib/constants';
import { getRegionPickCount, getRegionWinner } from '@/lib/bracket-utils';

interface RegionCardProps {
  regionIndex: number;
  actors: ThreatActor[];
  picks: Record<string, Pick>;
  onOpen: (regionIndex: number) => void;
}

const REGION_PICK_MAX = 15; // 8 + 4 + 2 + 1

export function RegionCard({
  regionIndex,
  actors,
  picks,
  onOpen,
}: RegionCardProps) {
  const region = REGIONS[regionIndex];
  const colors = REGION_COLORS[region];
  const pickCount = getRegionPickCount(picks, regionIndex);
  const winner = getRegionWinner(picks, actors, regionIndex);
  const progressPercent = Math.round((pickCount / REGION_PICK_MAX) * 100);

  return (
    <button
      onClick={() => onOpen(regionIndex)}
      className="matchup-card group w-full text-left rounded-xl p-6 focus:outline-none focus:ring-2 focus:ring-accent-light/30 transition-all duration-300"
    >
      {/* Region name + subtitle */}
      <h3
        className="font-display text-2xl sm:text-3xl font-bold transition-colors tracking-wider uppercase"
        style={{ color: colors.light }}
      >
        {REGION_LABELS[region]}
      </h3>
      <p
        className="text-xs mt-0.5 font-mono tracking-widest uppercase"
        style={{ color: colors.light, opacity: 0.4 }}
      >
        {REGION_SUBTITLES[region]}
      </p>

      {/* Progress bar */}
      <div className="progress-track mt-4 w-full h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            background: `linear-gradient(to right, ${colors.primary}, ${colors.light})`,
            width: `${progressPercent}%`,
            boxShadow: `0 0 8px ${colors.primary}60`,
          }}
        />
      </div>

      {/* Pick count */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-accent-light/40 font-mono tabular-nums">
          {pickCount} / {REGION_PICK_MAX}
        </span>
        {winner ? (
          <span className="text-xs font-semibold text-champion truncate ml-2 tracking-wide">
            {winner.name}
          </span>
        ) : (
          <span className="text-xs text-accent-light/30 font-mono">
            Tap to fill bracket
          </span>
        )}
      </div>
    </button>
  );
}
