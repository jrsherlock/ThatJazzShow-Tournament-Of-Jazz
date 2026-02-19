'use client';

import { createPortal } from 'react-dom';
import type { Artist, MatchupPreview } from '@/lib/types';
import { ArtistCard } from './ArtistCard';
import { CommentaryInput } from './CommentaryInput';

interface MatchupPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchupKey: string;
  artistA: Artist | null;
  artistB: Artist | null;
  preview: MatchupPreview | null;
  winnerId: string | null;
  commentary: string;
  onPickWinner: (matchupKey: string, winnerId: string) => void;
  onCommentaryChange: (matchupKey: string, value: string) => void;
}

export function MatchupPreviewModal({
  isOpen,
  onClose,
  matchupKey,
  artistA,
  artistB,
  preview,
  winnerId,
  commentary,
  onPickWinner,
  onCommentaryChange,
}: MatchupPreviewModalProps) {
  if (!isOpen) return null;

  const hasBothArtists = artistA !== null && artistB !== null;

  // Auto-generate headline if none provided
  const headline =
    preview?.headline ??
    (hasBothArtists ? `${artistA.name} vs ${artistB.name}` : 'Matchup Preview');

  const modalContent = (
    <div
      className="fixed inset-0 z-50 modal-backdrop flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full md:max-w-[700px]
          max-h-[90vh] overflow-y-auto
          bg-surface-hover border border-accent/20
          md:rounded-xl
          rounded-t-2xl md:rounded-b-xl
          shadow-2xl
          transform transition-transform duration-300
          translate-y-0
          relative
        "
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4 z-10
            w-8 h-8 rounded-full
            flex items-center justify-center
            text-muted hover:text-foreground hover:bg-foreground/10
            transition-colors
          "
          aria-label="Close modal"
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

        <div className="p-6 md:p-8 space-y-6">
          {/* Headline */}
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground pr-10 leading-tight">
            {headline}
          </h2>

          {hasBothArtists ? (
            <>
              {/* Artist detail cards side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ArtistCard artist={artistA} variant="detail" />
                <ArtistCard artist={artistB} variant="detail" />
              </div>

              {/* Host preview text */}
              {preview?.preview_text && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-accent/80 uppercase tracking-wider">
                    Host Preview
                  </h3>
                  <div className="text-sm text-muted leading-relaxed whitespace-pre-line">
                    {preview.preview_text}
                  </div>
                </div>
              )}

              {/* Fun fact callout */}
              {preview?.fun_fact && (
                <div className="rounded-lg border border-accent/30 bg-accent/[0.05] p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-accent text-lg mt-0.5">&#9834;</span>
                    <div>
                      <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
                        Fun Fact
                      </h4>
                      <p className="text-sm text-muted leading-relaxed">
                        {preview.fun_fact}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pick buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onPickWinner(matchupKey, artistA.id)}
                  className={`
                    px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200
                    ${
                      winnerId === artistA.id
                        ? 'bg-accent text-white'
                        : 'border border-accent/40 text-accent hover:bg-accent/10'
                    }
                  `}
                >
                  Pick {artistA.name}
                </button>
                <button
                  onClick={() => onPickWinner(matchupKey, artistB.id)}
                  className={`
                    px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200
                    ${
                      winnerId === artistB.id
                        ? 'bg-accent text-white'
                        : 'border border-accent/40 text-accent hover:bg-accent/10'
                    }
                  `}
                >
                  Pick {artistB.name}
                </button>
              </div>

              {/* Commentary */}
              <CommentaryInput
                matchupKey={matchupKey}
                value={commentary}
                onChange={onCommentaryChange}
              />
            </>
          ) : (
            /* TBD state */
            <div className="flex flex-col items-center justify-center py-12 text-dim">
              <svg
                className="w-12 h-12 mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-display">Matchup not yet determined</p>
              <p className="text-sm mt-1 text-gray-600">
                Complete earlier rounds to reveal this matchup.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
