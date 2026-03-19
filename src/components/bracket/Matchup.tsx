'use client';

import { useDroppable } from '@dnd-kit/core';
import type { ThreatActor } from '@/lib/types';
import { ThreatActorCard } from './ThreatActorCard';

interface MatchupProps {
  matchupKey: string;
  actorA: ThreatActor | null;
  actorB: ThreatActor | null;
  winnerId: string | null;
  commentary?: string;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview?: (matchupKey: string) => void;
  onOpenActorBio?: (actor: ThreatActor, matchupKey: string) => void;
  round: number;
  className?: string;
}

function TBDCard() {
  return (
    <div className="tbd-slot flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-transparent">
      <span className="text-xs text-accent-light/50 font-mono min-w-[2rem]">?</span>
      <span className="text-sm text-accent-light/30 italic font-mono">---</span>
    </div>
  );
}

export function Matchup({
  matchupKey,
  actorA,
  actorB,
  winnerId,
  onPickWinner,
  onOpenPreview,
  onOpenActorBio,
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
        matchup-card relative rounded-lg bg-surface-hover border border-accent/20
        p-2.5 transition-all duration-200
        ${isOver ? 'border-accent-light/60 shadow-[0_0_20px_rgba(52,177,228,0.25)] scale-[1.02]' : ''}
        ${onOpenPreview ? 'cursor-pointer hover:border-accent-light/40 hover:shadow-[0_0_14px_rgba(52,177,228,0.12)]' : ''}
        ${className}
      `}
    >
      {/* Actor A */}
      {actorA ? (
        <ThreatActorCard
          actor={actorA}
          variant="bracket"
          matchupKey={matchupKey}
          isWinner={winnerId === actorA.id}
          isEliminated={winnerId !== null && winnerId !== actorA.id}
          onSelect={() =>
            onOpenActorBio
              ? onOpenActorBio(actorA, matchupKey)
              : onPickWinner(matchupKey, actorA.id)
          }
        />
      ) : (
        <TBDCard />
      )}

      {/* VS divider */}
      {onOpenPreview ? (
        <div className="flex items-center gap-2 py-1 px-2">
          <div className="vs-line flex-1 h-px bg-accent/10" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenPreview(matchupKey);
            }}
            className="
              inline-flex items-center gap-1
              bg-accent-light/10 border border-accent-light/25 rounded-full px-3 py-0.5
              text-[10px] font-bold vs-divider text-accent-light/40 tracking-widest uppercase font-mono
              transition-all duration-200
              hover:text-accent-light hover:shadow-[0_0_8px_rgba(52,177,228,0.3)]
              hover:border-accent-light/50
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
          <div className="vs-line flex-1 h-px bg-accent/10" />
        </div>
      ) : (
        <div className="flex items-center gap-2 py-1 px-2">
          <div className="vs-line flex-1 h-px bg-accent-light/10" />
          <span className="vs-divider text-[10px] font-bold text-accent-light/40 tracking-widest uppercase font-mono">
            vs
          </span>
          <div className="vs-line flex-1 h-px bg-accent-light/10" />
        </div>
      )}

      {/* Actor B */}
      {actorB ? (
        <ThreatActorCard
          actor={actorB}
          variant="bracket"
          matchupKey={matchupKey}
          isWinner={winnerId === actorB.id}
          isEliminated={winnerId !== null && winnerId !== actorB.id}
          onSelect={() =>
            onOpenActorBio
              ? onOpenActorBio(actorB, matchupKey)
              : onPickWinner(matchupKey, actorB.id)
          }
        />
      ) : (
        <TBDCard />
      )}
    </div>
  );
}
