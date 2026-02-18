'use client';

import { useState, useMemo } from 'react';
import type { Artist, Region, Pick } from '@/lib/types';
import {
  REGIONS,
  REGION_LABELS,
  ROUND_NAMES,
} from '@/lib/constants';
import {
  matchupKey,
  getRegionRound1Matchups,
  getMatchupArtists,
} from '@/lib/bracket-utils';
import { Matchup } from '@/components/bracket/Matchup';

interface MobileRoundFlowProps {
  artists: Artist[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
  className?: string;
}

type TabId = Region | 'finalfour';

const TABS: { id: TabId; label: string }[] = [
  { id: 'vocalists', label: 'Vocalists' },
  { id: 'bandleaders', label: 'Band Leaders' },
  { id: 'composers', label: 'Composers' },
  { id: 'soloists', label: 'Soloists' },
  { id: 'finalfour', label: 'Final Four' },
];

/**
 * Build all matchup data for a single region across rounds 1-4.
 */
function useRegionMatchupData(
  region: Region,
  artists: Artist[],
  picks: Record<string, Pick>
) {
  const regionIndex = REGIONS.indexOf(region);

  return useMemo(() => {
    // Round 1: 8 matchups
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
    const [elite8A, elite8B] = getMatchupArtists(
      4,
      elite8GlobalIndex,
      picks,
      artists
    );
    const round4 = [{ key: elite8Key, artistA: elite8A, artistB: elite8B }];

    return [
      { round: 1, name: ROUND_NAMES[1], matchups: round1 },
      { round: 2, name: ROUND_NAMES[2], matchups: round2 },
      { round: 3, name: ROUND_NAMES[3], matchups: round3 },
      { round: 4, name: ROUND_NAMES[4], matchups: round4 },
    ];
  }, [region, regionIndex, artists, picks]);
}

/**
 * Build Final Four + Championship matchup data.
 */
function useFinalFourData(
  artists: Artist[],
  picks: Record<string, Pick>
) {
  return useMemo(() => {
    // Final Four: round 5, matchups 0 and 1
    const ff0Key = matchupKey(5, 0);
    const [ff0A, ff0B] = getMatchupArtists(5, 0, picks, artists);

    const ff1Key = matchupKey(5, 1);
    const [ff1A, ff1B] = getMatchupArtists(5, 1, picks, artists);

    // Championship: round 6, matchup 0
    const champKey = matchupKey(6, 0);
    const [champA, champB] = getMatchupArtists(6, 0, picks, artists);

    return [
      {
        round: 5,
        name: ROUND_NAMES[5],
        matchups: [
          { key: ff0Key, artistA: ff0A, artistB: ff0B },
          { key: ff1Key, artistA: ff1A, artistB: ff1B },
        ],
      },
      {
        round: 6,
        name: ROUND_NAMES[6],
        matchups: [
          { key: champKey, artistA: champA, artistB: champB },
        ],
      },
    ];
  }, [artists, picks]);
}

/**
 * Region tab content: renders rounds 1-4 for a given region.
 */
function RegionTabContent({
  region,
  artists,
  picks,
  onPickWinner,
  onOpenPreview,
}: {
  region: Region;
  artists: Artist[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
}) {
  const roundsData = useRegionMatchupData(region, artists, picks);

  return (
    <div className="space-y-6">
      {roundsData.map(({ round, name, matchups }) => (
        <div key={round}>
          {/* Round header */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="h-[1px] flex-1"
              style={{
                background:
                  'linear-gradient(to right, rgba(212, 168, 67, 0.3), transparent)',
              }}
            />
            <h3 className="text-xs uppercase tracking-widest text-[#D4A843] font-semibold whitespace-nowrap">
              {name}
            </h3>
            <div
              className="h-[1px] flex-1"
              style={{
                background:
                  'linear-gradient(to left, rgba(212, 168, 67, 0.3), transparent)',
              }}
            />
          </div>

          {/* Matchups */}
          <div className="space-y-3">
            {matchups.map((m) => (
              <Matchup
                key={m.key}
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Final Four tab content: renders Final Four (round 5) + Championship (round 6).
 */
function FinalFourTabContent({
  artists,
  picks,
  onPickWinner,
  onOpenPreview,
}: {
  artists: Artist[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
}) {
  const roundsData = useFinalFourData(artists, picks);

  return (
    <div className="space-y-6">
      {roundsData.map(({ round, name, matchups }) => (
        <div key={round}>
          {/* Round header */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="h-[1px] flex-1"
              style={{
                background:
                  'linear-gradient(to right, rgba(212, 168, 67, 0.3), transparent)',
              }}
            />
            <h3 className="text-xs uppercase tracking-widest text-[#D4A843] font-semibold whitespace-nowrap">
              {name}
            </h3>
            <div
              className="h-[1px] flex-1"
              style={{
                background:
                  'linear-gradient(to left, rgba(212, 168, 67, 0.3), transparent)',
              }}
            />
          </div>

          {/* Matchups */}
          <div className="space-y-3">
            {matchups.map((m) => (
              <Matchup
                key={m.key}
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MobileRoundFlow({
  artists,
  picks,
  onPickWinner,
  onOpenPreview,
  className = '',
}: MobileRoundFlowProps) {
  const [activeTab, setActiveTab] = useState<TabId>('vocalists');

  return (
    <div className={`mobile-round-flow ${className}`}>
      {/* Tab bar */}
      <div
        className="sticky top-0 z-10 overflow-x-auto scrollbar-hide"
        style={{ backgroundColor: '#0A0A0A' }}
      >
        <div className="flex min-w-max border-b border-zinc-800">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium whitespace-nowrap
                  transition-colors duration-200 relative
                  ${
                    isActive
                      ? 'text-[#D4A843]'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }
                `}
                aria-selected={isActive}
                role="tab"
              >
                {tab.label}
                {/* Gold underline for active tab */}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ backgroundColor: '#D4A843' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="pt-4 px-2">
        {activeTab === 'finalfour' ? (
          <FinalFourTabContent
            artists={artists}
            picks={picks}
            onPickWinner={onPickWinner}
            onOpenPreview={onOpenPreview}
          />
        ) : (
          <RegionTabContent
            region={activeTab}
            artists={artists}
            picks={picks}
            onPickWinner={onPickWinner}
            onOpenPreview={onOpenPreview}
          />
        )}
      </div>
    </div>
  );
}

export default MobileRoundFlow;
