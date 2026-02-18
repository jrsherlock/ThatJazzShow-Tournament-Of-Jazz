'use client';

import { useMemo } from 'react';
import type { Artist, Region, Pick } from '@/lib/types';
import {
  REGION_LABELS,
  REGION_SUBTITLES,
  ROUND_NAMES,
  REGIONS,
} from '@/lib/constants';
import {
  matchupKey,
  getRegionRound1Matchups,
  getMatchupArtists,
} from '@/lib/bracket-utils';
import { Matchup } from '@/components/bracket/Matchup';

interface RegionBracketProps {
  region: Region;
  regionIndex: number; // 0-3 (vocalists=0, bandleaders=1, composers=2, soloists=3)
  artists: Artist[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
  className?: string;
}

/**
 * Build matchup data for rounds 2-4 within this region.
 * Round 2: 4 matchups at global indices regionIndex*4 .. regionIndex*4+3
 * Round 3 (Sweet 16): 2 matchups at regionIndex*2 .. regionIndex*2+1
 * Round 4 (Elite 8): 1 matchup at regionIndex
 */
function useRegionMatchups(
  regionIndex: number,
  artists: Artist[],
  picks: Record<string, Pick>
) {
  return useMemo(() => {
    // Round 1: 8 matchups
    const region = REGIONS[regionIndex];
    const round1 = getRegionRound1Matchups(artists, region);

    // Round 2: 4 matchups
    const round2 = Array.from({ length: 4 }, (_, i) => {
      const globalIndex = regionIndex * 4 + i;
      const key = matchupKey(2, globalIndex);
      const [artistA, artistB] = getMatchupArtists(2, globalIndex, picks, artists);
      return { key, artistA, artistB };
    });

    // Round 3 (Sweet 16): 2 matchups
    const round3 = Array.from({ length: 2 }, (_, i) => {
      const globalIndex = regionIndex * 2 + i;
      const key = matchupKey(3, globalIndex);
      const [artistA, artistB] = getMatchupArtists(3, globalIndex, picks, artists);
      return { key, artistA, artistB };
    });

    // Round 4 (Elite 8): 1 matchup
    const elite8GlobalIndex = regionIndex;
    const elite8Key = matchupKey(4, elite8GlobalIndex);
    const [elite8A, elite8B] = getMatchupArtists(4, elite8GlobalIndex, picks, artists);
    const round4 = [{ key: elite8Key, artistA: elite8A, artistB: elite8B }];

    return { round1, round2, round3, round4 };
  }, [regionIndex, artists, picks]);
}

export function RegionBracket({
  region,
  regionIndex,
  artists,
  picks,
  onPickWinner,
  onOpenPreview,
  className = '',
}: RegionBracketProps) {
  const { round1, round2, round3, round4 } = useRegionMatchups(
    regionIndex,
    artists,
    picks
  );

  const rounds = [
    { data: round1, round: 1, name: ROUND_NAMES[1] },
    { data: round2, round: 2, name: ROUND_NAMES[2] },
    { data: round3, round: 3, name: ROUND_NAMES[3] },
    { data: round4, round: 4, name: ROUND_NAMES[4] },
  ];

  return (
    <div className={`region-bracket ${className}`}>
      {/* Region Header */}
      <div className="mb-6 text-center">
        <h2
          className="text-2xl md:text-3xl font-bold text-[#D4A843]"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {REGION_LABELS[region]}
        </h2>
        <p
          className="text-sm md:text-base text-zinc-400 mt-1 italic"
          style={{ fontFamily: 'Playfair Display, serif' }}
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
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
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
                      artistA={m.artistA}
                      artistB={m.artistB}
                      winnerId={picks[m.key]?.winnerId ?? null}
                      commentary={picks[m.key]?.commentary}
                      onPickWinner={onPickWinner}
                      onOpenPreview={onOpenPreview}
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
                        backgroundColor: '#D4A843',
                        opacity: 0.4,
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
                        backgroundColor: '#D4A843',
                        opacity: 0.4,
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
          grid-template-columns: repeat(4, minmax(160px, 1fr));
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
            rgba(212, 168, 67, 0.15) 10%,
            rgba(212, 168, 67, 0.15) 90%,
            transparent 100%
          );
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
