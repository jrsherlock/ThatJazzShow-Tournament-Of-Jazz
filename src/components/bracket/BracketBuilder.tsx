'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useRouter } from 'next/navigation';

import type { Artist, Tournament, MatchupPreview, Pick } from '@/lib/types';
import { TOTAL_PICKS, REGIONS } from '@/lib/constants';
import {
  countPicks,
  isBracketComplete,
  cascadePicks,
  parseMatchupKey,
  getMatchupArtists,
  getChildMatchupKey,
} from '@/lib/bracket-utils';

import { ArtistCard } from '@/components/bracket/ArtistCard';
import { RegionCard } from '@/components/bracket/RegionCard';
import { RegionBracketModal } from '@/components/bracket/RegionBracketModal';
import { FinalFour } from '@/components/bracket/FinalFour';
import { MobileRoundFlow } from '@/components/bracket/MobileRoundFlow';
import { MatchupPreviewModal } from '@/components/bracket/MatchupPreviewModal';
import { ArtistBioModal } from '@/components/bracket/ArtistBioModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BracketBuilderProps {
  artists: Artist[];
  tournament: Tournament;
  previews: MatchupPreview[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BracketBuilder({
  artists,
  tournament,
  previews,
}: BracketBuilderProps) {
  const router = useRouter();

  // ---- state --------------------------------------------------------------
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [activePreviewKey, setActivePreviewKey] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    id: string;
    accessToken: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeDragArtist, setActiveDragArtist] = useState<Artist | null>(null);
  const [activeArtistBio, setActiveArtistBio] = useState<{
    artist: Artist;
    matchupKey: string;
  } | null>(null);

  // ---- responsive detection -----------------------------------------------
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // ---- centralized modal management ----------------------------------------
  const anyModalOpen = activePreviewKey !== null || activeRegion !== null || showSubmitModal || activeArtistBio !== null;

  useEffect(() => {
    if (anyModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [anyModalOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Close in priority order: artist bio → preview → region → submit
      if (activeArtistBio) {
        setActiveArtistBio(null);
      } else if (activePreviewKey) {
        setActivePreviewKey(null);
      } else if (activeRegion !== null) {
        setActiveRegion(null);
      } else if (showSubmitModal) {
        setShowSubmitModal(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [activeArtistBio, activePreviewKey, activeRegion, showSubmitModal]);

  // ---- derived values -----------------------------------------------------
  const pickCount = useMemo(() => countPicks(picks), [picks]);
  const bracketComplete = useMemo(() => isBracketComplete(picks), [picks]);
  const progressPercent = useMemo(
    () => Math.round((pickCount / TOTAL_PICKS) * 100),
    [pickCount]
  );

  // ---- preview data lookup ------------------------------------------------
  const activePreview = useMemo(() => {
    if (!activePreviewKey) return null;
    return previews.find((p) => p.matchup_key === activePreviewKey) ?? null;
  }, [activePreviewKey, previews]);

  const activePreviewArtists = useMemo<
    [Artist | null, Artist | null]
  >(() => {
    if (!activePreviewKey) return [null, null];
    const { round, matchupIndex } = parseMatchupKey(activePreviewKey);
    return getMatchupArtists(round, matchupIndex, picks, artists);
  }, [activePreviewKey, picks, artists]);

  // ---- handlers -----------------------------------------------------------

  const handlePickWinner = useCallback(
    (matchupKey: string, winnerId: string) => {
      setPicks((prev) => {
        const existing = prev[matchupKey];

        // If same pick, do nothing
        if (existing && existing.winnerId === winnerId) return prev;

        const { round, matchupIndex } = parseMatchupKey(matchupKey);

        // Cascade: clear downstream picks that depended on the old winner
        const previousWinnerId = existing?.winnerId ?? null;
        const { updatedPicks } = cascadePicks(
          prev,
          round,
          matchupIndex,
          previousWinnerId
        );

        // Set the new pick, preserving existing commentary if winner unchanged
        updatedPicks[matchupKey] = {
          winnerId,
          commentary: existing?.commentary,
        };

        return updatedPicks;
      });
    },
    []
  );

  const handleCommentaryChange = useCallback(
    (matchupKey: string, value: string) => {
      setPicks((prev) => {
        const existing = prev[matchupKey];
        if (!existing) return prev;
        return {
          ...prev,
          [matchupKey]: { ...existing, commentary: value },
        };
      });
    },
    []
  );

  const handleOpenPreview = useCallback((matchupKey: string) => {
    setActivePreviewKey(matchupKey);
  }, []);

  const handleClosePreview = useCallback(() => {
    setActivePreviewKey(null);
  }, []);

  const handleOpenArtistBio = useCallback((artist: Artist, matchupKey: string) => {
    setActiveArtistBio({ artist, matchupKey });
  }, []);

  const handleCloseArtistBio = useCallback(() => {
    setActiveArtistBio(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!displayName.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournament.id,
          display_name: displayName.trim(),
          picks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || 'Failed to submit bracket');
        return;
      }

      setSubmissionResult({
        id: data.id,
        accessToken: data.access_token,
      });
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [displayName, picks, tournament.id]);

  const handleViewBracket = useCallback(() => {
    if (submissionResult) {
      router.push(`/bracket/${submissionResult.accessToken}`);
    }
  }, [submissionResult, router]);

  // ---- dnd-kit sensors (desktop only) -------------------------------------
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const artist = event.active.data.current?.artist as Artist | undefined;
    setActiveDragArtist(artist ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragArtist(null);
      const { active, over } = event;
      if (!over) return;

      const targetKey = over.data.current?.matchupKey as string | undefined;
      const artistId = active.data.current?.artistId as string | undefined;
      const sourceKey = active.data.current?.matchupKey as string | undefined;
      if (!targetKey || !artistId || !sourceKey) return;

      // Case 1: Dropped on same matchup — pick winner directly
      if (targetKey === sourceKey) {
        handlePickWinner(sourceKey, artistId);
        return;
      }

      // Case 2: Dropped on the next round's matchup — pick winner in source matchup
      const { round: sourceRound, matchupIndex: sourceIndex } = parseMatchupKey(sourceKey);
      const childKey = getChildMatchupKey(sourceRound, sourceIndex);

      if (targetKey === childKey) {
        handlePickWinner(sourceKey, artistId);
      }
    },
    [handlePickWinner]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragArtist(null);
  }, []);

  // ---- render -------------------------------------------------------------

  const handleOpenRegion = useCallback((regionIndex: number) => {
    setActiveRegion(regionIndex);
  }, []);

  const handleCloseRegion = useCallback(() => {
    setActiveRegion(null);
  }, []);

  const bracketContent = isDesktop ? (
    <div className="flex flex-col gap-8">
      {/* Region cards in 2x2 grid */}
      <div className="grid grid-cols-2 gap-6 xl:gap-8">
        {REGIONS.map((_region, idx) => (
          <RegionCard
            key={idx}
            regionIndex={idx}
            artists={artists}
            picks={picks}
            onOpen={handleOpenRegion}
          />
        ))}
      </div>

      {/* Final Four & Championship */}
      <FinalFour
        artists={artists}
        picks={picks}
        onPickWinner={handlePickWinner}
        onOpenPreview={handleOpenPreview}
        onOpenArtistBio={handleOpenArtistBio}
        className=""
      />
    </div>
  ) : (
    <MobileRoundFlow
      artists={artists}
      picks={picks}
      onPickWinner={handlePickWinner}
      onOpenPreview={handleOpenPreview}
      onOpenArtistBio={handleOpenArtistBio}
      className=""
    />
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-accent/20">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-lg sm:text-xl font-semibold text-accent">
              {tournament.name}
            </h1>
            <span className="text-sm text-muted">
              {pickCount} / {TOTAL_PICKS} picks
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main bracket area */}
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        {isDesktop ? (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            {bracketContent}
            <DragOverlay dropAnimation={null}>
              {activeDragArtist ? (
                <ArtistCard
                  artist={activeDragArtist}
                  variant="bracket"
                  className="shadow-2xl shadow-accent/30 border-accent/40 !opacity-100"
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          bracketContent
        )}
      </main>

      {/* Sticky submit bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
          bracketComplete ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-surface-hover/95 backdrop-blur-sm border-t border-accent/30">
          <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-accent font-display">
                Bracket Complete!
              </p>
              <p className="text-xs text-muted">
                All {TOTAL_PICKS} picks made. Ready to submit.
              </p>
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-2.5 bg-accent text-white hover:bg-accent-light font-semibold rounded-lg transition-colors duration-200 text-sm"
            >
              Submit Bracket
            </button>
          </div>
        </div>
      </div>

      {/* Region Bracket Modal */}
      {activeRegion !== null && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <RegionBracketModal
            regionIndex={activeRegion}
            artists={artists}
            picks={picks}
            onPickWinner={handlePickWinner}
            onOpenPreview={handleOpenPreview}
            onOpenArtistBio={handleOpenArtistBio}
            onClose={handleCloseRegion}
          />
          <DragOverlay dropAnimation={null}>
            {activeDragArtist ? (
              <ArtistCard
                artist={activeDragArtist}
                variant="bracket"
                className="shadow-2xl shadow-accent/30 border-accent/40 !opacity-100"
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Matchup Preview Modal */}
      {activePreviewKey && (
        <MatchupPreviewModal
          isOpen={!!activePreviewKey}
          onClose={handleClosePreview}
          matchupKey={activePreviewKey}
          artistA={activePreviewArtists[0]}
          artistB={activePreviewArtists[1]}
          preview={activePreview}
          winnerId={picks[activePreviewKey]?.winnerId ?? null}
          commentary={picks[activePreviewKey]?.commentary ?? ''}
          onPickWinner={handlePickWinner}
          onCommentaryChange={handleCommentaryChange}
        />
      )}

      {/* Artist Bio Modal */}
      {activeArtistBio && (
        <ArtistBioModal
          artist={activeArtistBio.artist}
          matchupKey={activeArtistBio.matchupKey}
          winnerId={picks[activeArtistBio.matchupKey]?.winnerId ?? null}
          onPickWinner={handlePickWinner}
          onClose={handleCloseArtistBio}
        />
      )}

      {/* Submit Modal */}
      {showSubmitModal && !submissionResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting)
              setShowSubmitModal(false);
          }}
        >
          <div className="bg-surface-hover border border-accent/30 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="font-display text-xl font-semibold text-accent mb-1">
              Submit Your Bracket
            </h2>
            <p className="text-sm text-muted mb-6">
              Enter your name to lock in your picks.
            </p>

            <label className="block text-sm text-foreground mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Miles D."
              maxLength={50}
              className="w-full px-4 py-2.5 bg-background border border-subtle rounded-lg text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && displayName.trim()) {
                  handleSubmit();
                }
              }}
            />

            {submitError && (
              <p className="mt-3 text-sm text-red-400">{submitError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-charcoal text-foreground hover:bg-zinc-700 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !displayName.trim()}
                className="flex-1 px-4 py-2.5 bg-accent text-white hover:bg-accent-light font-semibold rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Bracket'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {submissionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
          <div className="bg-surface-hover border border-accent/30 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="font-display text-xl font-semibold text-accent mb-1">
              Bracket Submitted!
            </h2>
            <p className="text-sm text-muted mb-6">
              Your picks have been locked in. Share your bracket link with
              friends to compare.
            </p>

            <div className="bg-background border border-subtle rounded-lg p-3 mb-6">
              <p className="text-xs text-dim mb-1">Your bracket link</p>
              <p className="text-sm text-zinc-200 break-all">
                {typeof window !== 'undefined'
                  ? `${window.location.origin}/bracket/${submissionResult.accessToken}`
                  : `/bracket/${submissionResult.accessToken}`}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const url =
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/bracket/${submissionResult.accessToken}`
                      : `/bracket/${submissionResult.accessToken}`;
                  navigator.clipboard.writeText(url);
                }}
                className="flex-1 px-4 py-2.5 bg-charcoal text-foreground hover:bg-zinc-700 rounded-lg transition-colors text-sm"
              >
                Copy Link
              </button>
              <button
                onClick={handleViewBracket}
                className="flex-1 px-4 py-2.5 bg-accent text-white hover:bg-accent-light font-semibold rounded-lg transition-colors text-sm"
              >
                View Bracket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
