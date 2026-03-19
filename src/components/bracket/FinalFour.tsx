'use client';

import { useMemo } from 'react';
import type { ThreatActor, Pick } from '@/lib/types';
import { ROUND_NAMES, REGION_COLORS } from '@/lib/constants';
import { matchupKey, getMatchupActors } from '@/lib/bracket-utils';
import { Matchup } from '@/components/bracket/Matchup';

interface FinalFourProps {
  actors: ThreatActor[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
  onOpenActorBio?: (actor: ThreatActor, matchupKey: string) => void;
  className?: string;
}

/**
 * Trophy / crown SVG icon for the champion display.
 */
function TrophyIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2L14.09 8.26L20.18 8.63L15.54 12.74L16.91 19.02L12 15.77L7.09 19.02L8.46 12.74L3.82 8.63L9.91 8.26L12 2Z"
        fill="#D4A843"
        stroke="#D4A843"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FinalFour({
  actors,
  picks,
  onPickWinner,
  onOpenPreview,
  onOpenActorBio,
  className = '',
}: FinalFourProps) {
  const matchups = useMemo(() => {
    // Final Four: round 4, matchups 0 and 1
    // 4-0: winner of 3-0 (state_superpowers region) vs winner of 3-1 (infrastructure_hunters region)
    // 4-1: winner of 3-2 (cybercriminal_cartels region) vs winner of 3-3 (shadow_market region)
    const ff0Key = matchupKey(4, 0);
    const [ff0A, ff0B] = getMatchupActors(4, 0, picks, actors);

    const ff1Key = matchupKey(4, 1);
    const [ff1A, ff1B] = getMatchupActors(4, 1, picks, actors);

    // Championship: round 5, matchup 0
    // 5-0: winner of 4-0 vs winner of 4-1
    const champKey = matchupKey(5, 0);
    const [champA, champB] = getMatchupActors(5, 0, picks, actors);

    return {
      finalFour: [
        {
          key: ff0Key,
          actorA: ff0A,
          actorB: ff0B,
          label: (
            <>
              <span style={{ color: REGION_COLORS.state_superpowers.primary }}>State Superpowers</span>
              {' vs '}
              <span style={{ color: REGION_COLORS.infrastructure_hunters.primary }}>Infra Hunters</span>
            </>
          ) as React.ReactNode,
        },
        {
          key: ff1Key,
          actorA: ff1A,
          actorB: ff1B,
          label: (
            <>
              <span style={{ color: REGION_COLORS.cybercriminal_cartels.primary }}>Cyber Cartels</span>
              {' vs '}
              <span style={{ color: REGION_COLORS.shadow_market.primary }}>Shadow Market</span>
            </>
          ) as React.ReactNode,
        },
      ],
      championship: { key: champKey, actorA: champA, actorB: champB },
    };
  }, [picks, actors]);

  // Determine the champion (winner of the championship matchup)
  const championId = picks[matchups.championship.key]?.winnerId ?? null;
  const champion = championId
    ? actors.find((a) => a.id === championId) ?? null
    : null;

  return (
    <div className={`final-four-bracket ${className}`}>
      {/* Header */}
      <div className="region-header-badge text-center mb-8 py-4 px-6 rounded-lg mx-auto max-w-sm">
        <h2 className="text-3xl md:text-4xl font-bold text-champion font-display tracking-wider uppercase">
          The Final Four
        </h2>
        <div
          className="mt-2 w-24 h-[1px] mx-auto"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(52, 177, 228, 0.5), transparent)',
          }}
        />
      </div>

      {/* Final Four matchups - side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-8">
        {matchups.finalFour.map((m) => (
          <div key={m.key} className="flex flex-col items-center">
            <span className="round-label inline-block text-[10px] uppercase tracking-widest text-accent-light/60 font-mono px-3 py-1 rounded mb-2">
              {ROUND_NAMES[4]}
            </span>
            <p className="text-xs text-accent-light/40 mb-3 font-mono">{m.label}</p>
            <Matchup
              matchupKey={m.key}
              actorA={m.actorA}
              actorB={m.actorB}
              winnerId={picks[m.key]?.winnerId ?? null}
              commentary={picks[m.key]?.commentary}
              onPickWinner={onPickWinner}
              onOpenPreview={onOpenPreview}
              onOpenActorBio={onOpenActorBio}
              round={4}
              className="w-full max-w-sm"
            />
            {/* Connector line down to championship */}
            <div
              className="connector-vertical hidden md:block w-[1px] h-8 mx-auto mt-2"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      {/* Championship matchup */}
      <div className="flex flex-col items-center">
        <span className="round-label inline-block text-[10px] uppercase tracking-widest text-champion/70 font-mono px-3 py-1 rounded mb-2">
          {ROUND_NAMES[5]}
        </span>

        <div
          className="relative w-full max-w-md p-[1px] rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(52, 177, 228, 0.3), rgba(212, 168, 67, 0.3))',
          }}
        >
          <div className="rounded-lg bg-background/80 backdrop-blur-sm">
            <Matchup
              matchupKey={matchups.championship.key}
              actorA={matchups.championship.actorA}
              actorB={matchups.championship.actorB}
              winnerId={picks[matchups.championship.key]?.winnerId ?? null}
              commentary={picks[matchups.championship.key]?.commentary}
              onPickWinner={onPickWinner}
              onOpenPreview={onOpenPreview}
              onOpenActorBio={onOpenActorBio}
              round={5}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Champion display */}
      <div className="mt-8 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <TrophyIcon className="w-6 h-6" />
          <span
            className="text-sm uppercase tracking-widest text-champion font-semibold"
          >
            Champion
          </span>
          <TrophyIcon className="w-6 h-6" />
        </div>

        <div
          className="matchup-card w-full max-w-xs rounded-lg border p-4 text-center min-h-[60px] flex items-center justify-center"
          style={{
            borderColor: champion ? '#D4A843' : 'rgba(52, 177, 228, 0.15)',
            backgroundColor: champion
              ? 'rgba(212, 168, 67, 0.06)'
              : 'rgba(8, 16, 32, 0.7)',
            boxShadow: champion
              ? '0 0 20px rgba(212, 168, 67, 0.15)'
              : '0 0 8px rgba(52, 177, 228, 0.08)',
          }}
        >
          {champion ? (
            <div>
              <p className="text-lg font-bold text-champion tracking-wide">
                {champion.name}
              </p>
              {champion.affiliation && (
                <p className="text-xs text-accent-light/50 mt-1 font-mono">{champion.affiliation}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-accent-light/30 italic font-mono">
              Complete the bracket to crown a champion
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinalFour;
