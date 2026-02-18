'use client';

import type { Artist } from '@/lib/types';
import { ArtistCard } from './ArtistCard';

interface MatchupProps {
  matchupKey: string;
  artistA: Artist | null;
  artistB: Artist | null;
  winnerId: string | null;
  commentary?: string;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview?: (matchupKey: string) => void;
  round: number;
  className?: string;
}

function TBDCard() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0A0A0A] border border-transparent">
      <span className="text-xs text-gray-600 font-mono min-w-[2rem]">(?)</span>
      <span className="text-sm text-gray-600 italic">TBD</span>
    </div>
  );
}

export function Matchup({
  matchupKey,
  artistA,
  artistB,
  winnerId,
  onPickWinner,
  onOpenPreview,
  className = '',
}: MatchupProps) {
  return (
    <div
      className={`
        relative rounded-lg bg-[#1A1A1A] border border-gold/20
        p-2.5 gold-glow
        ${className}
      `}
    >
      {/* Info button */}
      {onOpenPreview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreview(matchupKey);
          }}
          className="
            absolute top-2 right-2 z-10
            w-6 h-6 rounded-full
            flex items-center justify-center
            text-gray-500 hover:text-gold hover:bg-gold/10
            transition-colors text-xs font-bold
          "
          aria-label="Open matchup preview"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      )}

      {/* Artist A */}
      {artistA ? (
        <ArtistCard
          artist={artistA}
          variant="bracket"
          isWinner={winnerId === artistA.id}
          isEliminated={winnerId !== null && winnerId !== artistA.id}
          onSelect={() => onPickWinner(matchupKey, artistA.id)}
        />
      ) : (
        <TBDCard />
      )}

      {/* VS divider */}
      <div className="flex items-center gap-2 py-1 px-2">
        <div className="flex-1 h-px bg-gold/10" />
        <span className="text-[10px] font-bold text-gold/40 tracking-widest uppercase">
          vs
        </span>
        <div className="flex-1 h-px bg-gold/10" />
      </div>

      {/* Artist B */}
      {artistB ? (
        <ArtistCard
          artist={artistB}
          variant="bracket"
          isWinner={winnerId === artistB.id}
          isEliminated={winnerId !== null && winnerId !== artistB.id}
          onSelect={() => onPickWinner(matchupKey, artistB.id)}
        />
      ) : (
        <TBDCard />
      )}
    </div>
  );
}
