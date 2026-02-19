'use client';

import { createPortal } from 'react-dom';
import type { Artist } from '@/lib/types';
import { ArtistCard } from './ArtistCard';

interface ArtistBioModalProps {
  artist: Artist;
  matchupKey: string;
  winnerId: string | null;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onClose: () => void;
}

export function ArtistBioModal({
  artist,
  matchupKey,
  winnerId,
  onPickWinner,
  onClose,
}: ArtistBioModalProps) {
  const isAlreadyPicked = winnerId === artist.id;

  function handlePickWinner() {
    onPickWinner(matchupKey, artist.id);
    onClose();
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div
      className="
        fixed inset-0 z-[48]
        flex items-end md:items-center justify-center
        bg-black/70 backdrop-blur-sm
        animate-in fade-in duration-200
      "
      onClick={handleBackdropClick}
    >
      <div
        className="
          relative w-full max-w-md mx-4 mb-0 md:mb-0
          bg-surface-hover border border-accent/30 rounded-t-2xl md:rounded-2xl
          shadow-[0_0_40px_rgba(11,61,145,0.15)]
          max-h-[85vh] overflow-y-auto
          animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300
        "
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="
            absolute top-3 right-3 z-10
            w-8 h-8 rounded-full
            flex items-center justify-center
            text-dim hover:text-foreground hover:bg-foreground/10
            transition-colors
          "
          aria-label="Close"
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

        {/* Artist detail card */}
        <div className="p-5 pb-0">
          <ArtistCard artist={artist} variant="detail" />
        </div>

        {/* Bio section */}
        {artist.bio && (
          <div className="px-5 pt-4">
            <p className="text-sm text-muted leading-relaxed">{artist.bio}</p>
          </div>
        )}

        {/* Pick as Winner button */}
        <div className="p-5 pt-4">
          <button
            onClick={handlePickWinner}
            className={`
              w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200
              ${isAlreadyPicked
                ? 'bg-accent text-background cursor-default'
                : 'bg-accent/20 text-accent border border-accent/50 hover:bg-accent hover:text-background'
              }
            `}
          >
            {isAlreadyPicked ? `${artist.name} Selected` : `Pick ${artist.name} as Winner`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
