'use client';

import { useMemo } from 'react';
import type { Artist, Pick } from '@/lib/types';
import { ROUND_NAMES, REGION_COLORS } from '@/lib/constants';
import { matchupKey, getMatchupArtists } from '@/lib/bracket-utils';
import { Matchup } from '@/components/bracket/Matchup';

interface FinalFourProps {
  artists: Artist[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
  onOpenArtistBio?: (artist: Artist, matchupKey: string) => void;
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
  artists,
  picks,
  onPickWinner,
  onOpenPreview,
  onOpenArtistBio,
  className = '',
}: FinalFourProps) {
  const matchups = useMemo(() => {
    // Final Four: round 5, matchups 0 and 1
    // 5-0: winner of 4-0 (vocalists region) vs winner of 4-1 (bandleaders region)
    // 5-1: winner of 4-2 (composers region) vs winner of 4-3 (soloists region)
    const ff0Key = matchupKey(5, 0);
    const [ff0A, ff0B] = getMatchupArtists(5, 0, picks, artists);

    const ff1Key = matchupKey(5, 1);
    const [ff1A, ff1B] = getMatchupArtists(5, 1, picks, artists);

    // Championship: round 6, matchup 0
    // 6-0: winner of 5-0 vs winner of 5-1
    const champKey = matchupKey(6, 0);
    const [champA, champB] = getMatchupArtists(6, 0, picks, artists);

    return {
      finalFour: [
        {
          key: ff0Key,
          artistA: ff0A,
          artistB: ff0B,
          label: (
            <>
              <span style={{ color: REGION_COLORS.vocalists.primary }}>Vocalists</span>
              {' vs '}
              <span style={{ color: REGION_COLORS.bandleaders.primary }}>Band Leaders</span>
            </>
          ) as React.ReactNode,
        },
        {
          key: ff1Key,
          artistA: ff1A,
          artistB: ff1B,
          label: (
            <>
              <span style={{ color: REGION_COLORS.composers.primary }}>Composers</span>
              {' vs '}
              <span style={{ color: REGION_COLORS.soloists.primary }}>Soloists</span>
            </>
          ) as React.ReactNode,
        },
      ],
      championship: { key: champKey, artistA: champA, artistB: champB },
    };
  }, [picks, artists]);

  // Determine the champion (winner of the championship matchup)
  const championId = picks[matchups.championship.key]?.winnerId ?? null;
  const champion = championId
    ? artists.find((a) => a.id === championId) ?? null
    : null;

  return (
    <div className={`final-four-bracket ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2
          className="text-3xl md:text-4xl font-bold text-champion"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          The Final Four
        </h2>
        <div
          className="mt-2 w-24 h-[1px] mx-auto"
          style={{
            background: 'linear-gradient(to right, transparent, #D4A843, transparent)',
          }}
        />
      </div>

      {/* Final Four matchups - side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-8">
        {matchups.finalFour.map((m) => (
          <div key={m.key} className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-dim font-medium mb-2">
              {ROUND_NAMES[5]}
            </span>
            <p className="text-xs text-zinc-600 mb-3 italic">{m.label}</p>
            <Matchup
              matchupKey={m.key}
              artistA={m.artistA}
              artistB={m.artistB}
              winnerId={picks[m.key]?.winnerId ?? null}
              commentary={picks[m.key]?.commentary}
              onPickWinner={onPickWinner}
              onOpenPreview={onOpenPreview}
              onOpenArtistBio={onOpenArtistBio}
              round={5}
              className="w-full max-w-sm"
            />
            {/* Connector line down to championship */}
            <div
              className="hidden md:block w-[1px] h-8 mx-auto mt-2"
              style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      {/* Championship matchup */}
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase tracking-wider text-dim font-medium mb-2">
          {ROUND_NAMES[6]}
        </span>

        <div
          className="relative w-full max-w-md p-1 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 30%, transparent), color-mix(in srgb, #9A3D50 30%, transparent))',
          }}
        >
          <div className="rounded-lg bg-background">
            <Matchup
              matchupKey={matchups.championship.key}
              artistA={matchups.championship.artistA}
              artistB={matchups.championship.artistB}
              winnerId={picks[matchups.championship.key]?.winnerId ?? null}
              commentary={picks[matchups.championship.key]?.commentary}
              onPickWinner={onPickWinner}
              onOpenPreview={onOpenPreview}
              onOpenArtistBio={onOpenArtistBio}
              round={6}
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
          className="w-full max-w-xs rounded-lg border p-4 text-center min-h-[60px] flex items-center justify-center"
          style={{
            borderColor: champion ? '#D4A843' : 'color-mix(in srgb, var(--accent) 20%, transparent)',
            backgroundColor: champion
              ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
              : 'rgba(26, 26, 26, 0.5)',
          }}
        >
          {champion ? (
            <div>
              <p
                className="text-lg font-bold text-champion"
                  >
                {champion.name}
              </p>
              {champion.instrument && (
                <p className="text-xs text-muted mt-1">{champion.instrument}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-600 italic">
              Complete the bracket to crown a champion
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinalFour;
