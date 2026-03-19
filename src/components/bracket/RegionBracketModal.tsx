'use client';

import { createPortal } from 'react-dom';
import type { ThreatActor, Pick } from '@/lib/types';
import { REGIONS, REGION_LABELS, REGION_SUBTITLES, REGION_COLORS } from '@/lib/constants';
import { RegionBracket } from './RegionBracket';

interface RegionBracketModalProps {
  regionIndex: number;
  actors: ThreatActor[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
  onOpenActorBio?: (actor: ThreatActor, matchupKey: string) => void;
  onClose: () => void;
}

export function RegionBracketModal({
  regionIndex,
  actors,
  picks,
  onPickWinner,
  onOpenPreview,
  onOpenActorBio,
  onClose,
}: RegionBracketModalProps) {
  const region = REGIONS[regionIndex];
  const colors = REGION_COLORS[region];

  const modalContent = (
    <div
      className="bracket-matrix dark fixed inset-0 z-[45] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#050a12]/90 backdrop-blur-md" />

      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1400px] max-h-[92vh] overflow-y-auto mx-4 rounded-xl shadow-2xl"
        style={{
          background: 'rgba(5, 10, 18, 0.95)',
          border: `1px solid rgba(52, 177, 228, 0.15)`,
          boxShadow: '0 0 40px rgba(52, 177, 228, 0.08)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between"
          style={{
            background: 'rgba(5, 10, 18, 0.95)',
            borderColor: 'rgba(52, 177, 228, 0.12)',
          }}
        >
          <div>
            <h2
              className="font-display text-2xl font-bold tracking-wider uppercase"
              style={{ color: colors.light }}
            >
              {REGION_LABELS[region]}
            </h2>
            <p
              className="text-xs font-mono tracking-widest uppercase"
              style={{ color: colors.light, opacity: 0.4 }}
            >
              {REGION_SUBTITLES[region]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-accent-light/40 hover:text-accent-light hover:bg-accent-light/10 transition-colors"
            aria-label="Close region bracket"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Bracket content */}
        <div className="p-6">
          <RegionBracket
            region={region}
            regionIndex={regionIndex}
            actors={actors}
            picks={picks}
            onPickWinner={onPickWinner}
            onOpenPreview={onOpenPreview}
            onOpenActorBio={onOpenActorBio}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
