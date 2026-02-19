'use client';

import { useDroppable } from '@dnd-kit/core';
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
  onOpenArtistBio?: (artist: Artist, matchupKey: string) => void;
  round: number;
  className?: string;
}

function TBDCard() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-transparent">
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
  onOpenArtistBio,
  className = '',
}: MatchupProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${matchupKey}`,
    data: { matchupKey },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        if (onOpenPreview && e.target === e.currentTarget) {
          onOpenPreview(matchupKey);
        }
      }}
      className={`
        relative rounded-lg bg-surface-hover border border-accent/20
        p-2.5 accent-glow transition-all duration-200
        ${isOver ? 'border-accent/60 shadow-[0_0_16px_rgba(11,61,145,0.3)] scale-[1.02]' : ''}
        ${onOpenPreview ? 'cursor-pointer hover:border-accent/40 hover:shadow-[0_0_12px_rgba(11,61,145,0.15)]' : ''}
        ${className}
      `}
    >
      {/* Artist A */}
      {artistA ? (
        <ArtistCard
          artist={artistA}
          variant="bracket"
          matchupKey={matchupKey}
          isWinner={winnerId === artistA.id}
          isEliminated={winnerId !== null && winnerId !== artistA.id}
          onSelect={() =>
            onOpenArtistBio
              ? onOpenArtistBio(artistA, matchupKey)
              : onPickWinner(matchupKey, artistA.id)
          }
        />
      ) : (
        <TBDCard />
      )}

      {/* VS divider */}
      {onOpenPreview ? (
        <div className="flex items-center gap-2 py-1 px-2">
          <div className="flex-1 h-px bg-accent/10" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenPreview(matchupKey);
            }}
            className="
              inline-flex items-center gap-1
              bg-accent/10 border border-accent/30 rounded-full px-3 py-0.5
              text-[10px] font-bold text-accent/40 tracking-widest uppercase
              transition-all duration-200
              hover:text-accent hover:shadow-[0_0_8px_rgba(11,61,145,0.4)]
            "
            aria-label="Open matchup preview"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            vs
          </button>
          <div className="flex-1 h-px bg-accent/10" />
        </div>
      ) : (
        <div className="flex items-center gap-2 py-1 px-2">
          <div className="flex-1 h-px bg-accent/10" />
          <span className="text-[10px] font-bold text-accent/40 tracking-widest uppercase">
            vs
          </span>
          <div className="flex-1 h-px bg-accent/10" />
        </div>
      )}

      {/* Artist B */}
      {artistB ? (
        <ArtistCard
          artist={artistB}
          variant="bracket"
          matchupKey={matchupKey}
          isWinner={winnerId === artistB.id}
          isEliminated={winnerId !== null && winnerId !== artistB.id}
          onSelect={() =>
            onOpenArtistBio
              ? onOpenArtistBio(artistB, matchupKey)
              : onPickWinner(matchupKey, artistB.id)
          }
        />
      ) : (
        <TBDCard />
      )}
    </div>
  );
}
