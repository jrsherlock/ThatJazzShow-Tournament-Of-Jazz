'use client';

import { useMemo } from 'react';
import type { ThreatActor, Submission, MasterBracket, Tournament, ScoreResult, Region } from '@/lib/types';
import { REGIONS, REGION_LABELS, REGION_COLORS, ROUND_NAMES } from '@/lib/constants';
import {
  matchupKey,
  matchupsInRound,
  getMatchupActors,
  getRegionForMatchup,
} from '@/lib/bracket-utils';
import { scoreSubmission } from '@/lib/scoring';
import { ThreatActorCard } from '@/components/bracket/ThreatActorCard';
import { ScoreBreakdown } from '@/components/bracket/ScoreBreakdown';
import { ShareButtons } from '@/components/sharing/ShareButtons';
import { MatrixRain } from '@/components/bracket/MatrixRain';

interface BracketViewerProps {
  submission: Submission;
  actors: ThreatActor[];
  masterBracket: MasterBracket | null;
  tournament: Tournament;
  score?: ScoreResult | null;
  bracketUrl?: string;
}

type PickStatus = 'correct' | 'incorrect' | 'pending';

interface ResolvedMatchup {
  key: string;
  round: number;
  matchupIndex: number;
  actorA: ThreatActor | null;
  actorB: ThreatActor | null;
  winnerId: string | null;
  winnerActor: ThreatActor | null;
  commentary?: string;
  status: PickStatus;
  region: Region | null;
}

/**
 * Determine whether a pick is correct, incorrect, or pending based on master bracket.
 */
function getPickStatus(
  mKey: string,
  round: number,
  winnerId: string | null,
  masterBracket: MasterBracket | null
): PickStatus {
  if (!masterBracket || round > masterBracket.revealed_through) {
    return 'pending';
  }
  const masterPick = masterBracket.picks[mKey];
  if (!masterPick || !winnerId) return 'pending';
  return winnerId === masterPick.winnerId ? 'correct' : 'incorrect';
}

/**
 * Resolve all 31 matchups from the submission's picks into displayable data.
 */
function resolveMatchups(
  submission: Submission,
  actors: ThreatActor[],
  masterBracket: MasterBracket | null
): ResolvedMatchup[] {
  const resolved: ResolvedMatchup[] = [];

  for (let round = 1; round <= 5; round++) {
    const count = matchupsInRound(round);
    for (let i = 0; i < count; i++) {
      const key = matchupKey(round, i);
      const [actorA, actorB] = getMatchupActors(round, i, submission.picks, actors);
      const pick = submission.picks[key];
      const winnerId = pick?.winnerId ?? null;
      const winnerActor = winnerId
        ? actors.find((a) => a.id === winnerId) ?? null
        : null;
      const status = getPickStatus(key, round, winnerId, masterBracket);
      const region = getRegionForMatchup(round, i);

      resolved.push({
        key,
        round,
        matchupIndex: i,
        actorA,
        actorB,
        winnerId,
        winnerActor,
        commentary: pick?.commentary,
        status,
        region,
      });
    }
  }

  return resolved;
}

/**
 * CSS classes for the status indicator border on each matchup card.
 */
function statusClasses(status: PickStatus): string {
  switch (status) {
    case 'correct':
      return 'border-green-500/70 bg-green-500/[0.06]';
    case 'incorrect':
      return 'border-red-500/70 bg-red-500/[0.06]';
    case 'pending':
    default:
      return 'border-white/10 bg-foreground/[0.02]';
  }
}

function statusBadge(status: PickStatus): React.ReactNode {
  switch (status) {
    case 'correct':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Correct
        </span>
      );
    case 'incorrect':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Wrong
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center text-[10px] font-semibold text-dim bg-foreground/5 px-2 py-0.5 rounded-full">
          Pending
        </span>
      );
  }
}

/**
 * A single read-only matchup display card.
 */
function ViewerMatchup({ matchup }: { matchup: ResolvedMatchup }) {
  return (
    <div className={`matchup-card rounded-lg border p-3 ${statusClasses(matchup.status)}`}>
      {/* Header row: round badge + status */}
      <div className="flex items-center justify-between mb-2">
        <span className="round-label inline-block text-[10px] font-mono text-accent-light/50 uppercase tracking-widest px-2 py-0.5 rounded">
          {ROUND_NAMES[matchup.round]}
        </span>
        {statusBadge(matchup.status)}
      </div>

      {/* Actor A */}
      {matchup.actorA ? (
        <ThreatActorCard
          actor={matchup.actorA}
          variant="bracket"
          isWinner={matchup.winnerId === matchup.actorA.id}
          isEliminated={matchup.winnerId !== null && matchup.winnerId !== matchup.actorA.id}
        />
      ) : (
        <TBDSlot />
      )}

      {/* VS divider */}
      <div className="flex items-center gap-2 py-1 px-2">
        <div className="vs-line flex-1 h-px bg-accent-light/10" />
        <span className="vs-divider text-[10px] font-bold text-accent-light/40 tracking-widest uppercase font-mono">vs</span>
        <div className="vs-line flex-1 h-px bg-accent-light/10" />
      </div>

      {/* Actor B */}
      {matchup.actorB ? (
        <ThreatActorCard
          actor={matchup.actorB}
          variant="bracket"
          isWinner={matchup.winnerId === matchup.actorB.id}
          isEliminated={matchup.winnerId !== null && matchup.winnerId !== matchup.actorB.id}
        />
      ) : (
        <TBDSlot />
      )}

      {/* Commentary */}
      {matchup.commentary && (
        <div
          className="mt-2 px-2 py-1.5 rounded"
          style={{
            background: 'rgba(52, 177, 228, 0.04)',
            border: '1px solid rgba(52, 177, 228, 0.08)',
          }}
        >
          <p className="text-xs text-accent-light/50 italic leading-relaxed font-mono">
            &quot;{matchup.commentary}&quot;
          </p>
        </div>
      )}
    </div>
  );
}

function TBDSlot() {
  return (
    <div className="tbd-slot flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-transparent">
      <span className="text-xs text-accent-light/50 font-mono min-w-[2rem]">?</span>
      <span className="text-sm text-accent-light/30 italic font-mono">---</span>
    </div>
  );
}

/**
 * Region section: groups matchups by region for rounds 1-4, then shows
 * Final Four and Championship as a special cross-region section.
 */
function RegionSection({
  region,
  label,
  matchups,
}: {
  region: Region;
  label: string;
  matchups: ResolvedMatchup[];
}) {
  // Group matchups by round within this region
  const byRound: Record<number, ResolvedMatchup[]> = {};
  for (const m of matchups) {
    if (!byRound[m.round]) byRound[m.round] = [];
    byRound[m.round].push(m);
  }

  const colors = REGION_COLORS[region];

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-1 w-10 rounded-full" style={{ backgroundColor: colors.light, opacity: 0.6 }} />
        <h3 className="font-display text-lg font-bold tracking-wider uppercase" style={{ color: colors.light }}>
          {label}
        </h3>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${colors.light}30, transparent)` }} />
      </div>
      {[1, 2, 3].map((round) => {
        const roundMatchups = byRound[round];
        if (!roundMatchups || roundMatchups.length === 0) return null;
        return (
          <div key={`${region}-${round}`} className="mb-4">
            <h4 className="round-label inline-block text-[10px] font-mono text-accent-light/50 uppercase tracking-widest mb-2 px-2 py-0.5 rounded">
              {ROUND_NAMES[round]}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roundMatchups.map((m) => (
                <ViewerMatchup key={m.key} matchup={m} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/**
 * Cross-region section for Final Four and Championship.
 */
function CrossRegionSection({ matchups }: { matchups: ResolvedMatchup[] }) {
  const finalFour = matchups.filter((m) => m.round === 4);
  const championship = matchups.filter((m) => m.round === 5);

  if (finalFour.length === 0 && championship.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="region-header-badge inline-block py-2 px-4 rounded-lg mb-4">
        <h3 className="font-display text-lg font-bold text-accent-light tracking-wider uppercase">
          The Final Stage
        </h3>
      </div>

      {finalFour.length > 0 && (
        <div className="mb-4">
          <h4 className="round-label inline-block text-[10px] font-mono text-accent-light/50 uppercase tracking-widest mb-2 px-2 py-0.5 rounded">
            {ROUND_NAMES[4]}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {finalFour.map((m) => (
              <ViewerMatchup key={m.key} matchup={m} />
            ))}
          </div>
        </div>
      )}

      {championship.length > 0 && (
        <div className="mb-4">
          <h4 className="round-label inline-block text-[10px] font-mono text-champion/60 uppercase tracking-widest mb-2 px-2 py-0.5 rounded">
            {ROUND_NAMES[5]}
          </h4>
          <div className="grid grid-cols-1 max-w-md mx-auto gap-3">
            {championship.map((m) => (
              <ViewerMatchup key={m.key} matchup={m} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function BracketViewer({
  submission,
  actors,
  masterBracket,
  tournament,
  score: scoreProp,
  bracketUrl,
}: BracketViewerProps) {
  const resolvedBracketUrl = bracketUrl ?? `/bracket/${submission.access_token}`;

  const allMatchups = useMemo(
    () => resolveMatchups(submission, actors, masterBracket),
    [submission, actors, masterBracket]
  );

  const score = useMemo(() => {
    // Use server-computed score if provided
    if (scoreProp !== undefined) return scoreProp;
    if (!masterBracket) return null;
    return scoreSubmission(
      submission.picks,
      masterBracket.picks,
      masterBracket.revealed_through
    );
  }, [scoreProp, submission.picks, masterBracket]);

  // Group region matchups (rounds 1-4)
  const regionMatchups = useMemo(() => {
    const map: Record<Region, ResolvedMatchup[]> = {
      state_superpowers: [],
      infrastructure_hunters: [],
      cybercriminal_cartels: [],
      shadow_market: [],
    };
    for (const m of allMatchups) {
      if (m.region && m.round <= 3) {
        map[m.region].push(m);
      }
    }
    return map;
  }, [allMatchups]);

  // Cross-region matchups (rounds 4-5)
  const crossRegionMatchups = useMemo(
    () => allMatchups.filter((m) => m.round >= 4),
    [allMatchups]
  );

  const submissionDate = new Date(submission.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bracket-matrix dark min-h-screen" style={{ background: '#050a12' }}>
      <MatrixRain />

      {/* Header */}
      <header className="bracket-header sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-accent-light tracking-wider uppercase">
                {submission.display_name}&apos;s Bracket
              </h1>
              <p className="text-xs text-accent-light/40 mt-1 font-mono tracking-wide">
                {tournament.name} &middot; Submitted {submissionDate}
              </p>
            </div>

            {/* Quick score badge */}
            {score && masterBracket && masterBracket.revealed_through > 0 && (
              <div
                className="matchup-card flex items-center gap-3 rounded-lg px-4 py-2.5"
              >
                <div className="text-right">
                  <p className="text-xs text-accent-light/40 font-mono uppercase tracking-wider">Total Score</p>
                  <p className="font-display text-2xl font-bold text-accent-light leading-none">
                    {score.total}
                  </p>
                </div>
                <div className="w-px h-8" style={{ background: 'rgba(52, 177, 228, 0.15)' }} />
                <div>
                  <p className="text-xs text-accent-light/40 font-mono uppercase tracking-wider">Max Possible</p>
                  <p className="text-sm text-accent-light/60 font-semibold font-mono">
                    {score.maxPossible}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Score breakdown section */}
        {score && masterBracket && masterBracket.revealed_through > 0 && (
          <div className="mb-8 max-w-lg mx-auto lg:max-w-none">
            <ScoreBreakdown
              score={score}
              revealedThrough={masterBracket.revealed_through}
            />
          </div>
        )}

        {/* Share Buttons */}
        <div className="mb-8 max-w-lg mx-auto lg:max-w-none">
          <ShareButtons
            bracketUrl={resolvedBracketUrl}
            displayName={submission.display_name}
          />
        </div>

        {/* Desktop: 4-column region layout */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
          {REGIONS.map((region) => (
            <RegionSection
              key={region}
              region={region}
              label={REGION_LABELS[region]}
              matchups={regionMatchups[region]}
            />
          ))}
        </div>

        {/* Desktop: cross-region below the 4 columns */}
        <div className="hidden lg:block">
          <CrossRegionSection matchups={crossRegionMatchups} />
        </div>

        {/* Mobile: vertical list by region */}
        <div className="lg:hidden">
          {REGIONS.map((region) => (
            <RegionSection
              key={region}
              region={region}
              label={REGION_LABELS[region]}
              matchups={regionMatchups[region]}
            />
          ))}
          <CrossRegionSection matchups={crossRegionMatchups} />
        </div>
      </main>
    </div>
  );
}
