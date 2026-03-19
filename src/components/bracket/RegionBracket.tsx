'use client';

import { useMemo } from 'react';
import type { ThreatActor, Region, Pick } from '@/lib/types';
import {
  REGION_LABELS,
  REGION_SUBTITLES,
  REGION_COLORS,
  ROUND_NAMES,
  REGIONS,
} from '@/lib/constants';
import {
  matchupKey,
  getRegionRound1Matchups,
  getMatchupActors,
} from '@/lib/bracket-utils';
import { Matchup } from '@/components/bracket/Matchup';

interface RegionBracketProps {
  region: Region;
  regionIndex: number; // 0-3 (state_superpowers=0, infrastructure_hunters=1, cybercriminal_cartels=2, shadow_market=3)
  actors: ThreatActor[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
  onOpenActorBio?: (actor: ThreatActor, matchupKey: string) => void;
  className?: string;
}

/**
 * Build matchup data for rounds 1-3 within this region.
 * Round 1: 4 matchups (seeded pairings)
 * Round 2: 2 matchups at global indices regionIndex*2 .. regionIndex*2+1
 * Round 3 (Region Final): 1 matchup at regionIndex
 */
function useRegionMatchups(
  regionIndex: number,
  actors: ThreatActor[],
  picks: Record<string, Pick>
) {
  return useMemo(() => {
    // Round 1: 4 matchups
    const region = REGIONS[regionIndex];
    const round1 = getRegionRound1Matchups(actors, region);

    // Round 2: 2 matchups
    const round2 = Array.from({ length: 2 }, (_, i) => {
      const globalIndex = regionIndex * 2 + i;
      const key = matchupKey(2, globalIndex);
      const [actorA, actorB] = getMatchupActors(2, globalIndex, picks, actors);
      return { key, actorA, actorB };
    });

    // Round 3 (Region Final): 1 matchup
    const regionFinalKey = matchupKey(3, regionIndex);
    const [regionFinalA, regionFinalB] = getMatchupActors(3, regionIndex, picks, actors);
    const round3 = [{ key: regionFinalKey, actorA: regionFinalA, actorB: regionFinalB }];

    return { round1, round2, round3 };
  }, [regionIndex, actors, picks]);
}

export function RegionBracket({
  region,
  regionIndex,
  actors,
  picks,
  onPickWinner,
  onOpenPreview,
  onOpenActorBio,
  className = '',
}: RegionBracketProps) {
  const colors = REGION_COLORS[region];
  const { round1, round2, round3 } = useRegionMatchups(
    regionIndex,
    actors,
    picks
  );

  const rounds = [
    { data: round1, round: 1, name: ROUND_NAMES[1] },
    { data: round2, round: 2, name: ROUND_NAMES[2] },
    { data: round3, round: 3, name: ROUND_NAMES[3] },
  ];

  return (
    <div className={`region-bracket ${className}`} style={{ '--region-color': colors.primary } as React.CSSProperties}>
      {/* Region Header */}
      <div className="region-header-badge mb-6 text-center py-3 px-4 rounded-lg mx-auto max-w-xs">
        <h2
          className="text-2xl md:text-3xl font-bold font-display tracking-wider uppercase"
          style={{ color: colors.light }}
        >
          {REGION_LABELS[region]}
        </h2>
        <p
          className="text-xs md:text-sm mt-1 font-mono tracking-widest uppercase"
          style={{ color: colors.light, opacity: 0.5 }}
        >
          {REGION_SUBTITLES[region]}
        </p>
      </div>

      {/* Bracket Grid */}
      <div className="region-bracket-grid">
        {rounds.map(({ data, round, name }, colIndex) => (
          <div
            key={round}
            className="region-bracket-column"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              position: 'relative',
            }}
          >
            {/* Round label */}
            <div className="text-center mb-3">
              <span className="round-label inline-block text-[10px] uppercase tracking-widest text-accent-light/60 font-mono px-3 py-1 rounded">
                {name}
              </span>
            </div>

            {/* Matchups with connectors */}
            <div
              className="flex flex-col justify-around flex-1"
              style={{ gap: colIndex === 0 ? '8px' : undefined }}
            >
              {data.map((m, matchupIdx) => (
                <div key={m.key} className="relative flex items-center">
                  {/* Matchup card */}
                  <div className="flex-1 min-w-0">
                    <Matchup
                      matchupKey={m.key}
                      actorA={m.actorA}
                      actorB={m.actorB}
                      winnerId={picks[m.key]?.winnerId ?? null}
                      commentary={picks[m.key]?.commentary}
                      onPickWinner={onPickWinner}
                      onOpenPreview={onOpenPreview}
                      onOpenActorBio={onOpenActorBio}
                      round={round}
                      className="w-full"
                    />
                  </div>

                  {/* Connector line to next round */}
                  {colIndex < rounds.length - 1 && (
                    <div
                      className="connector-line"
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        right: '-16px',
                        top: '50%',
                        width: '16px',
                        height: '1px',
                      }}
                    />
                  )}

                  {/* Vertical connector bracket lines */}
                  {colIndex < rounds.length - 1 && (
                    <div
                      className="connector-vertical"
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        right: '-16px',
                        top: matchupIdx % 2 === 0 ? '50%' : undefined,
                        bottom: matchupIdx % 2 === 1 ? '50%' : undefined,
                        width: '1px',
                        height: '50%',
                        // For even matchups draw down, for odd draw up
                        ...(matchupIdx % 2 === 0
                          ? { borderTop: 'none' }
                          : { borderBottom: 'none' }),
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Inline styles for the CSS Grid bracket layout */}
      <style jsx>{`
        .region-bracket-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(160px, 1fr));
          gap: 16px;
          align-items: stretch;
          min-height: 600px;
        }

        .region-bracket-column {
          position: relative;
        }

        /* Connector lines between rounds using pseudo-elements */
        .region-bracket-grid .region-bracket-column:not(:last-child)::after {
          content: '';
          position: absolute;
          right: -8px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(52, 177, 228, 0.2) 10%,
            rgba(52, 177, 228, 0.2) 90%,
            transparent 100%
          );
          box-shadow: 0 0 4px rgba(52, 177, 228, 0.1);
        }

        @media (max-width: 768px) {
          .region-bracket-grid {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .region-bracket-grid .region-bracket-column:not(:last-child)::after {
            display: none;
          }

          .connector-line,
          .connector-vertical {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default RegionBracket;
