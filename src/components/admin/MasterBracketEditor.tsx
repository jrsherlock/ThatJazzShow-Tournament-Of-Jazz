'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Artist, Tournament, MasterBracket, Region } from '@/lib/types';
import { REGIONS, REGION_LABELS, ROUND_NAMES } from '@/lib/constants';
import {
  matchupKey,
  getMatchupArtists,
  matchupsInRound,
  getRegionForMatchup,
  cascadePicks,
} from '@/lib/bracket-utils';

interface Props {
  tournament: Tournament;
  artists: Artist[];
  existingBracket: MasterBracket | null;
}

export function MasterBracketEditor({ tournament, artists, existingBracket }: Props) {
  const router = useRouter();
  const [picks, setPicks] = useState<Record<string, { winnerId: string }>>(
    existingBracket?.picks ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [activeRound, setActiveRound] = useState(1);
  const [activeRegion, setActiveRegion] = useState<Region | 'all'>('all');

  const pickCount = Object.keys(picks).length;

  const handlePick = useCallback(
    (round: number, matchupIndex: number, winnerId: string) => {
      const key = matchupKey(round, matchupIndex);
      const previousWinnerId = picks[key]?.winnerId ?? null;

      if (previousWinnerId === winnerId) return; // Same pick, no change

      // Cascade: clear downstream picks that depended on the old winner
      const { updatedPicks } = cascadePicks(
        picks,
        round,
        matchupIndex,
        previousWinnerId
      );

      updatedPicks[key] = { winnerId };
      setPicks(updatedPicks);
    },
    [picks]
  );

  async function saveBracket() {
    setSaving(true);
    await fetch('/api/admin/master-bracket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tournament_id: tournament.id,
        picks,
      }),
    });
    setSaving(false);
    router.refresh();
  }

  function renderMatchup(round: number, idx: number) {
    const key = matchupKey(round, idx);
    const [artistA, artistB] = getMatchupArtists(round, idx, picks, artists);
    const currentPick = picks[key]?.winnerId;

    return (
      <div
        key={key}
        className="bg-surface-hover rounded-lg border border-accent/20 p-3"
      >
        <div className="text-xs text-dim mb-2">
          {ROUND_NAMES[round]} &middot; Game {idx + 1}
        </div>
        <div className="space-y-2">
          <button
            onClick={() => artistA && handlePick(round, idx, artistA.id)}
            disabled={!artistA}
            className={`w-full text-left px-3 py-2 rounded transition-colors ${
              currentPick === artistA?.id
                ? 'bg-accent/20 border border-accent text-accent'
                : artistA
                ? 'bg-background border border-transparent hover:border-accent/40 text-foreground'
                : 'bg-background border border-transparent text-gray-600 cursor-not-allowed'
            }`}
          >
            <span className="text-xs text-dim mr-2">
              {artistA ? `#${artistA.seed}` : ''}
            </span>
            {artistA?.name ?? 'TBD'}
          </button>
          <button
            onClick={() => artistB && handlePick(round, idx, artistB.id)}
            disabled={!artistB}
            className={`w-full text-left px-3 py-2 rounded transition-colors ${
              currentPick === artistB?.id
                ? 'bg-accent/20 border border-accent text-accent'
                : artistB
                ? 'bg-background border border-transparent hover:border-accent/40 text-foreground'
                : 'bg-background border border-transparent text-gray-600 cursor-not-allowed'
            }`}
          >
            <span className="text-xs text-dim mr-2">
              {artistB ? `#${artistB.seed}` : ''}
            </span>
            {artistB?.name ?? 'TBD'}
          </button>
        </div>
      </div>
    );
  }

  // Filter matchups for the active round and region
  const totalMatchups = matchupsInRound(activeRound);
  const matchupIndices = Array.from({ length: totalMatchups }, (_, i) => i).filter(
    (idx) => {
      if (activeRegion === 'all') return true;
      if (activeRound >= 5) return true; // Final Four+ is cross-region
      const region = getRegionForMatchup(activeRound, idx);
      return region === activeRegion;
    }
  );

  return (
    <div>
      {/* Progress + Save */}
      <div className="flex items-center justify-between mb-6 p-4 bg-surface-hover rounded-lg border border-accent/20">
        <div>
          <span className="text-muted">Picks Made: </span>
          <span className="text-accent font-bold">{pickCount} / 63</span>
        </div>
        <button
          onClick={saveBracket}
          disabled={saving}
          className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Master Bracket'}
        </button>
      </div>

      {/* Round Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[1, 2, 3, 4, 5, 6].map((round) => {
          const roundPicks = Array.from(
            { length: matchupsInRound(round) },
            (_, i) => picks[matchupKey(round, i)]
          ).filter(Boolean).length;
          const roundTotal = matchupsInRound(round);
          return (
            <button
              key={round}
              onClick={() => setActiveRound(round)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                activeRound === round
                  ? 'bg-accent text-white'
                  : 'bg-surface-hover text-muted hover:text-foreground border border-accent/20'
              }`}
            >
              {ROUND_NAMES[round]} ({roundPicks}/{roundTotal})
            </button>
          );
        })}
      </div>

      {/* Region Filter (for rounds 1-4) */}
      {activeRound <= 4 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveRegion('all')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeRegion === 'all'
                ? 'bg-accent/20 text-accent'
                : 'bg-background text-dim hover:text-muted'
            }`}
          >
            All Regions
          </button>
          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeRegion === region
                  ? 'bg-accent/20 text-accent'
                  : 'bg-background text-dim hover:text-muted'
              }`}
            >
              {REGION_LABELS[region]}
            </button>
          ))}
        </div>
      )}

      {/* Matchup Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {matchupIndices.map((idx) => renderMatchup(activeRound, idx))}
      </div>

      {matchupIndices.length === 0 && (
        <p className="text-center text-dim py-10">
          No matchups to show for this filter. Try selecting &quot;All Regions&quot;.
        </p>
      )}
    </div>
  );
}
