'use client';

import { createPortal } from 'react-dom';
import type { Artist, Pick } from '@/lib/types';
import { REGIONS, REGION_LABELS, REGION_SUBTITLES, REGION_COLORS } from '@/lib/constants';
import { RegionBracket } from './RegionBracket';

interface RegionBracketModalProps {
  regionIndex: number;
  artists: Artist[];
  picks: Record<string, Pick>;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onOpenPreview: (matchupKey: string) => void;
  onOpenArtistBio?: (artist: Artist, matchupKey: string) => void;
  onClose: () => void;
}

export function RegionBracketModal({
  regionIndex,
  artists,
  picks,
  onPickWinner,
  onOpenPreview,
  onOpenArtistBio,
  onClose,
}: RegionBracketModalProps) {
  const region = REGIONS[regionIndex];
  const colors = REGION_COLORS[region];

  const modalContent = (
    <div
      className="fixed inset-0 z-[45] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1400px] max-h-[92vh] overflow-y-auto mx-4 bg-background border rounded-xl shadow-2xl"
        style={{ borderColor: `${colors.primary}33` }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: `${colors.primary}33` }}>
          <div>
            <h2 className="font-display text-2xl font-bold" style={{ color: colors.primary }}>
              {REGION_LABELS[region]}
            </h2>
            <p className="text-sm text-muted italic font-display" style={{ color: colors.light }}>
              {REGION_SUBTITLES[region]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-foreground/10 transition-colors"
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
            artists={artists}
            picks={picks}
            onPickWinner={onPickWinner}
            onOpenPreview={onOpenPreview}
            onOpenArtistBio={onOpenArtistBio}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
