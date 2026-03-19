'use client';

import { useState, useMemo } from 'react';
import type { ThreatActor, Region, Pick } from '@/lib/types';
import {
  REGIONS,
  REGION_LABELS,
  REGION_COLORS,
  ROUND_NAMES,
} from '@/lib/constants';
import {
  matchupKey,
  getRegionRound1Matchups,
  getMatchupActors,
} from '@/lib/bracket-utils';
import { Matchup } from '@/components/bracket/Matchup';

interface MobileRoundFlowProps {
  actors: ThreatActor[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
  onOpenActorBio?: (actor: ThreatActor, matchupKey: string) => void;
  className?: string;
}

type TabId = Region | 'finalfour';

const TABS: { id: TabId; label: string }[] = [
  { id: 'state_superpowers', label: 'State Powers' },
  { id: 'infrastructure_hunters', label: 'Infra Hunters' },
  { id: 'cybercriminal_cartels', label: 'Cyber Cartels' },
  { id: 'shadow_market', label: 'Shadow Mkt' },
  { id: 'finalfour', label: 'Final Four' },
];

/**
 * Build all matchup data for a single region across rounds 1-3.
 */
function useRegionMatchupData(
  region: Region,
  actors: ThreatActor[],
  picks: Record<string, Pick>
) {
  const regionIndex = REGIONS.indexOf(region);

  return useMemo(() => {
    // Round 1: 4 matchups
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

    return [
      { round: 1, name: ROUND_NAMES[1], matchups: round1 },
      { round: 2, name: ROUND_NAMES[2], matchups: round2 },
      { round: 3, name: ROUND_NAMES[3], matchups: round3 },
    ];
  }, [region, regionIndex, actors, picks]);
}

/**
 * Build Final Four + Championship matchup data.
 */
function useFinalFourData(
  actors: ThreatActor[],
  picks: Record<string, Pick>
) {
  return useMemo(() => {
    // Final Four: round 4, matchups 0 and 1
    const ff0Key = matchupKey(4, 0);
    const [ff0A, ff0B] = getMatchupActors(4, 0, picks, actors);

    const ff1Key = matchupKey(4, 1);
    const [ff1A, ff1B] = getMatchupActors(4, 1, picks, actors);

    // Championship: round 5, matchup 0
    const champKey = matchupKey(5, 0);
    const [champA, champB] = getMatchupActors(5, 0, picks, actors);

    return [
      {
        round: 4,
        name: ROUND_NAMES[4],
        matchups: [
          { key: ff0Key, actorA: ff0A, actorB: ff0B },
          { key: ff1Key, actorA: ff1A, actorB: ff1B },
        ],
      },
      {
        round: 5,
        name: ROUND_NAMES[5],
        matchups: [
          { key: champKey, actorA: champA, actorB: champB },
        ],
      },
    ];
  }, [actors, picks]);
}

/**
 * Region tab content: renders rounds 1-4 for a given region.
 */
function RegionTabContent({
  region,
  actors,
  picks,
  onPickWinner,
  onOpenPreview,
  onOpenActorBio,
}: {
  region: Region;
  actors: ThreatActor[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
  onOpenActorBio?: (actor: ThreatActor, matchupKey: string) => void;
}) {
  const roundsData = useRegionMatchupData(region, actors, picks);
  const colors = REGION_COLORS[region];

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
                  `linear-gradient(to right, rgba(52, 177, 228, 0.2), transparent)`,
              }}
            />
            <h3 className="round-label inline-block text-[10px] uppercase tracking-widest text-accent-light/60 font-mono px-3 py-1 rounded whitespace-nowrap">
              {name}
            </h3>
            <div
              className="h-[1px] flex-1"
              style={{
                background:
                  `linear-gradient(to left, rgba(52, 177, 228, 0.2), transparent)`,
              }}
            />
          </div>

          {/* Matchups */}
          <div className="space-y-3">
            {matchups.map((m) => (
              <Matchup
                key={m.key}
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
  actors,
  picks,
  onPickWinner,
  onOpenPreview,
  onOpenActorBio,
}: {
  actors: ThreatActor[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
  onOpenActorBio?: (actor: ThreatActor, matchupKey: string) => void;
}) {
  const roundsData = useFinalFourData(actors, picks);

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
                  'linear-gradient(to right, rgba(52, 177, 228, 0.2), transparent)',
              }}
            />
            <h3 className="round-label inline-block text-[10px] uppercase tracking-widest text-accent-light/60 font-mono px-3 py-1 rounded whitespace-nowrap">
              {name}
            </h3>
            <div
              className="h-[1px] flex-1"
              style={{
                background:
                  'linear-gradient(to left, rgba(52, 177, 228, 0.2), transparent)',
              }}
            />
          </div>

          {/* Matchups */}
          <div className="space-y-3">
            {matchups.map((m) => (
              <Matchup
                key={m.key}
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MobileRoundFlow({
  actors,
  picks,
  onPickWinner,
  onOpenPreview,
  onOpenActorBio,
  className = '',
}: MobileRoundFlowProps) {
  const [activeTab, setActiveTab] = useState<TabId>('state_superpowers');

  return (
    <div className={`mobile-round-flow ${className}`}>
      {/* Tab bar */}
      <div
        className="sticky top-0 z-10 overflow-x-auto scrollbar-hide backdrop-blur-md"
        style={{ background: 'rgba(5, 10, 18, 0.9)' }}
      >
        <div className="flex min-w-max" style={{ borderBottom: '1px solid rgba(52, 177, 228, 0.12)' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const regionColor = tab.id !== 'finalfour' ? REGION_COLORS[tab.id as Region]?.light : undefined;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-xs font-mono uppercase tracking-widest whitespace-nowrap
                  transition-colors duration-200 relative
                  ${
                    isActive
                      ? ''
                      : 'text-accent-light/30 hover:text-accent-light/60'
                  }
                `}
                style={{ color: isActive ? (regionColor ?? 'var(--color-accent-light)') : undefined }}
                aria-selected={isActive}
                role="tab"
              >
                {tab.label}
                {/* Region-colored underline for active tab */}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{
                      backgroundColor: regionColor ?? 'var(--color-accent-light)',
                      boxShadow: `0 0 6px ${regionColor ?? 'rgba(52, 177, 228, 0.4)'}`,
                    }}
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
            actors={actors}
            picks={picks}
            onPickWinner={onPickWinner}
            onOpenPreview={onOpenPreview}
            onOpenActorBio={onOpenActorBio}
          />
        ) : (
          <RegionTabContent
            region={activeTab}
            actors={actors}
            picks={picks}
            onPickWinner={onPickWinner}
            onOpenPreview={onOpenPreview}
            onOpenActorBio={onOpenActorBio}
          />
        )}
      </div>
    </div>
  );
}

export default MobileRoundFlow;
