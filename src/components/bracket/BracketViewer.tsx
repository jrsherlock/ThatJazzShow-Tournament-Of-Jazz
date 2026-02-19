'use client';

import { useMemo } from 'react';
import type { Artist, Submission, MasterBracket, Tournament, ScoreResult, Region } from '@/lib/types';
import { REGIONS, REGION_LABELS, REGION_COLORS, ROUND_NAMES } from '@/lib/constants';
import {
  matchupKey,
  matchupsInRound,
  getMatchupArtists,
  getRegionForMatchup,
} from '@/lib/bracket-utils';
import { scoreSubmission } from '@/lib/scoring';
import { ArtistCard } from '@/components/bracket/ArtistCard';
import { ScoreBreakdown } from '@/components/bracket/ScoreBreakdown';
import { ShareButtons } from '@/components/sharing/ShareButtons';

interface BracketViewerProps {
  submission: Submission;
  artists: Artist[];
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
  artistA: Artist | null;
  artistB: Artist | null;
  winnerId: string | null;
  winnerArtist: Artist | null;
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
 * Resolve all 63 matchups from the submission's picks into displayable data.
 */
function resolveMatchups(
  submission: Submission,
  artists: Artist[],
  masterBracket: MasterBracket | null
): ResolvedMatchup[] {
  const resolved: ResolvedMatchup[] = [];

  for (let round = 1; round <= 6; round++) {
    const count = matchupsInRound(round);
    for (let i = 0; i < count; i++) {
      const key = matchupKey(round, i);
      const [artistA, artistB] = getMatchupArtists(round, i, submission.picks, artists);
      const pick = submission.picks[key];
      const winnerId = pick?.winnerId ?? null;
      const winnerArtist = winnerId
        ? artists.find((a) => a.id === winnerId) ?? null
        : null;
      const status = getPickStatus(key, round, winnerId, masterBracket);
      const region = getRegionForMatchup(round, i);

      resolved.push({
        key,
        round,
        matchupIndex: i,
        artistA,
        artistB,
        winnerId,
        winnerArtist,
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
    <div className={`rounded-lg border p-3 ${statusClasses(matchup.status)}`}>
      {/* Header row: round badge + status */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-dim uppercase tracking-wider">
          {ROUND_NAMES[matchup.round]}
        </span>
        {statusBadge(matchup.status)}
      </div>

      {/* Artist A */}
      {matchup.artistA ? (
        <ArtistCard
          artist={matchup.artistA}
          variant="bracket"
          isWinner={matchup.winnerId === matchup.artistA.id}
          isEliminated={matchup.winnerId !== null && matchup.winnerId !== matchup.artistA.id}
        />
      ) : (
        <TBDSlot />
      )}

      {/* VS divider */}
      <div className="flex items-center gap-2 py-1 px-2">
        <div className="flex-1 h-px bg-accent/10" />
        <span className="text-[10px] font-bold text-accent/40 tracking-widest uppercase">vs</span>
        <div className="flex-1 h-px bg-accent/10" />
      </div>

      {/* Artist B */}
      {matchup.artistB ? (
        <ArtistCard
          artist={matchup.artistB}
          variant="bracket"
          isWinner={matchup.winnerId === matchup.artistB.id}
          isEliminated={matchup.winnerId !== null && matchup.winnerId !== matchup.artistB.id}
        />
      ) : (
        <TBDSlot />
      )}

      {/* Commentary */}
      {matchup.commentary && (
        <div className="mt-2 px-2 py-1.5 rounded bg-accent/5 border border-accent/10">
          <p className="text-xs text-muted italic leading-relaxed">
            &quot;{matchup.commentary}&quot;
          </p>
        </div>
      )}
    </div>
  );
}

function TBDSlot() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-transparent">
      <span className="text-xs text-gray-600 font-mono min-w-[2rem]">(?)</span>
      <span className="text-sm text-gray-600 italic">TBD</span>
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
        <div className="h-1 w-10 rounded-full" style={{ backgroundColor: colors.primary }} />
        <h3 className="font-display text-lg font-bold" style={{ color: colors.primary }}>
          {label}
        </h3>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${colors.primary}40, transparent)` }} />
      </div>
      {[1, 2, 3, 4].map((round) => {
        const roundMatchups = byRound[round];
        if (!roundMatchups || roundMatchups.length === 0) return null;
        return (
          <div key={`${region}-${round}`} className="mb-4">
            <h4 className="text-xs font-semibold text-dim uppercase tracking-wider mb-2 px-1">
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
  const finalFour = matchups.filter((m) => m.round === 5);
  const championship = matchups.filter((m) => m.round === 6);

  if (finalFour.length === 0 && championship.length === 0) return null;

  return (
    <section className="mb-8">
      <h3 className="font-display text-lg font-bold text-accent mb-4 blue-note-divider">
        The Final Stage
      </h3>

      {finalFour.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-dim uppercase tracking-wider mb-2 px-1">
            {ROUND_NAMES[5]}
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
          <h4 className="text-xs font-semibold text-dim uppercase tracking-wider mb-2 px-1">
            {ROUND_NAMES[6]}
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
  artists,
  masterBracket,
  tournament,
  score: scoreProp,
  bracketUrl,
}: BracketViewerProps) {
  const resolvedBracketUrl = bracketUrl ?? `/bracket/${submission.access_token}`;

  const allMatchups = useMemo(
    () => resolveMatchups(submission, artists, masterBracket),
    [submission, artists, masterBracket]
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
      vocalists: [],
      bandleaders: [],
      composers: [],
      soloists: [],
    };
    for (const m of allMatchups) {
      if (m.region && m.round <= 4) {
        map[m.region].push(m);
      }
    }
    return map;
  }, [allMatchups]);

  // Cross-region matchups (rounds 5-6)
  const crossRegionMatchups = useMemo(
    () => allMatchups.filter((m) => m.round >= 5),
    [allMatchups]
  );

  const submissionDate = new Date(submission.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-accent/20 bg-surface-hover/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-accent">
                {submission.display_name}&apos;s Bracket
              </h1>
              <p className="text-sm text-muted mt-1">
                {tournament.name} &middot; Submitted {submissionDate}
              </p>
            </div>

            {/* Quick score badge */}
            {score && masterBracket && masterBracket.revealed_through > 0 && (
              <div className="flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-lg px-4 py-2.5">
                <div className="text-right">
                  <p className="text-xs text-muted">Total Score</p>
                  <p className="font-display text-2xl font-bold text-accent leading-none">
                    {score.total}
                  </p>
                </div>
                <div className="w-px h-8 bg-accent/20" />
                <div>
                  <p className="text-xs text-muted">Max Possible</p>
                  <p className="text-sm text-muted font-semibold">
                    {score.maxPossible}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
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
