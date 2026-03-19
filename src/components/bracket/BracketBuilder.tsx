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

import type { ThreatActor, Tournament, MatchupPreview, Pick } from '@/lib/types';
import { TOTAL_PICKS, REGIONS } from '@/lib/constants';
import {
  countPicks,
  isBracketComplete,
  cascadePicks,
  parseMatchupKey,
  getMatchupActors,
  getChildMatchupKey,
} from '@/lib/bracket-utils';

import { ThreatActorCard } from '@/components/bracket/ThreatActorCard';
import { RegionCard } from '@/components/bracket/RegionCard';
import { RegionBracketModal } from '@/components/bracket/RegionBracketModal';
import { FinalFour } from '@/components/bracket/FinalFour';
import { MobileRoundFlow } from '@/components/bracket/MobileRoundFlow';
import { MatchupPreviewModal } from '@/components/bracket/MatchupPreviewModal';
import { ThreatActorBioModal } from '@/components/bracket/ThreatActorBioModal';
import { MatrixRain } from '@/components/bracket/MatrixRain';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BracketBuilderProps {
  actors: ThreatActor[];
  tournament: Tournament;
  previews: MatchupPreview[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BracketBuilder({
  actors,
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
  const [activeDragActor, setActiveDragActor] = useState<ThreatActor | null>(null);
  const [activeActorBio, setActiveActorBio] = useState<{
    actor: ThreatActor;
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
  const anyModalOpen = activePreviewKey !== null || activeRegion !== null || showSubmitModal || activeActorBio !== null;

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
      // Close in priority order: actor bio -> preview -> region -> submit
      if (activeActorBio) {
        setActiveActorBio(null);
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
  }, [activeActorBio, activePreviewKey, activeRegion, showSubmitModal]);

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

  const activePreviewActors = useMemo<
    [ThreatActor | null, ThreatActor | null]
  >(() => {
    if (!activePreviewKey) return [null, null];
    const { round, matchupIndex } = parseMatchupKey(activePreviewKey);
    return getMatchupActors(round, matchupIndex, picks, actors);
  }, [activePreviewKey, picks, actors]);

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

  const handleOpenActorBio = useCallback((actor: ThreatActor, matchupKey: string) => {
    setActiveActorBio({ actor, matchupKey });
  }, []);

  const handleCloseActorBio = useCallback(() => {
    setActiveActorBio(null);
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
    const actor = event.active.data.current?.actor as ThreatActor | undefined;
    setActiveDragActor(actor ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragActor(null);
      const { active, over } = event;
      if (!over) return;

      const targetKey = over.data.current?.matchupKey as string | undefined;
      const actorId = active.data.current?.actorId as string | undefined;
      const sourceKey = active.data.current?.matchupKey as string | undefined;
      if (!targetKey || !actorId || !sourceKey) return;

      // Case 1: Dropped on same matchup -- pick winner directly
      if (targetKey === sourceKey) {
        handlePickWinner(sourceKey, actorId);
        return;
      }

      // Case 2: Dropped on the next round's matchup -- pick winner in source matchup
      const { round: sourceRound, matchupIndex: sourceIndex } = parseMatchupKey(sourceKey);
      const childKey = getChildMatchupKey(sourceRound, sourceIndex);

      if (targetKey === childKey) {
        handlePickWinner(sourceKey, actorId);
      }
    },
    [handlePickWinner]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragActor(null);
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
            actors={actors}
            picks={picks}
            onOpen={handleOpenRegion}
          />
        ))}
      </div>

      {/* Final Four & Championship */}
      <FinalFour
        actors={actors}
        picks={picks}
        onPickWinner={handlePickWinner}
        onOpenPreview={handleOpenPreview}
        onOpenActorBio={handleOpenActorBio}
        className=""
      />
    </div>
  ) : (
    <MobileRoundFlow
      actors={actors}
      picks={picks}
      onPickWinner={handlePickWinner}
      onOpenPreview={handleOpenPreview}
      onOpenActorBio={handleOpenActorBio}
      className=""
    />
  );

  return (
    <div className="bracket-matrix dark min-h-screen" style={{ background: '#050a12' }}>
      <MatrixRain />

      {/* Header */}
      <header className="bracket-header sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-lg sm:text-xl font-semibold text-accent-light tracking-wider uppercase">
              {tournament.name}
            </h1>
            <span className="text-sm text-accent-light/50 font-mono tabular-nums">
              {pickCount} / {TOTAL_PICKS}
            </span>
          </div>

          {/* Progress bar */}
          <div className="progress-track w-full h-1.5 rounded-full overflow-hidden">
            <div
              className="progress-fill h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main bracket area */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-4 py-6">
        {isDesktop ? (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            {bracketContent}
            <DragOverlay dropAnimation={null}>
              {activeDragActor ? (
                <ThreatActorCard
                  actor={activeDragActor}
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
        <div
          className="backdrop-blur-md border-t"
          style={{
            background: 'rgba(5, 10, 18, 0.95)',
            borderColor: 'rgba(52, 177, 228, 0.2)',
          }}
        >
          <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-accent-light font-display tracking-wider uppercase">
                Bracket Complete!
              </p>
              <p className="text-xs text-accent-light/40 font-mono">
                All {TOTAL_PICKS} picks made. Ready to submit.
              </p>
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-2.5 bg-accent-light/20 text-accent-light border border-accent-light/40 hover:bg-accent-light/30 hover:shadow-[0_0_16px_rgba(52,177,228,0.3)] font-semibold rounded-lg transition-all duration-200 text-sm tracking-wider uppercase font-mono"
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
            actors={actors}
            picks={picks}
            onPickWinner={handlePickWinner}
            onOpenPreview={handleOpenPreview}
            onOpenActorBio={handleOpenActorBio}
            onClose={handleCloseRegion}
          />
          <DragOverlay dropAnimation={null}>
            {activeDragActor ? (
              <ThreatActorCard
                actor={activeDragActor}
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
          actorA={activePreviewActors[0]}
          actorB={activePreviewActors[1]}
          preview={activePreview}
          winnerId={picks[activePreviewKey]?.winnerId ?? null}
          commentary={picks[activePreviewKey]?.commentary ?? ''}
          onPickWinner={handlePickWinner}
          onCommentaryChange={handleCommentaryChange}
        />
      )}

      {/* Threat Actor Bio Modal */}
      {activeActorBio && (
        <ThreatActorBioModal
          actor={activeActorBio.actor}
          matchupKey={activeActorBio.matchupKey}
          winnerId={picks[activeActorBio.matchupKey]?.winnerId ?? null}
          onPickWinner={handlePickWinner}
          onClose={handleCloseActorBio}
        />
      )}

      {/* Submit Modal */}
      {showSubmitModal && !submissionResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(5, 10, 18, 0.85)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting)
              setShowSubmitModal(false);
          }}
        >
          <div
            className="matchup-card rounded-xl p-6 w-full max-w-md mx-4"
            style={{
              background: 'rgba(8, 16, 32, 0.95)',
              border: '1px solid rgba(52, 177, 228, 0.2)',
              boxShadow: '0 0 40px rgba(52, 177, 228, 0.08)',
            }}
          >
            <h2 className="font-display text-xl font-semibold text-accent-light mb-1 tracking-wider uppercase">
              Submit Your Bracket
            </h2>
            <p className="text-sm text-accent-light/40 mb-6 font-mono">
              Enter your name to lock in your picks.
            </p>

            <label className="block text-xs text-accent-light/50 mb-1.5 font-mono uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Agent X"
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-lg text-foreground transition-colors focus:outline-none"
              style={{
                background: 'rgba(5, 10, 18, 0.8)',
                border: '1px solid rgba(52, 177, 228, 0.2)',
                color: '#F8F9F9',
              }}
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
                className="flex-1 px-4 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50 text-accent-light/60 font-mono"
                style={{
                  background: 'rgba(52, 177, 228, 0.08)',
                  border: '1px solid rgba(52, 177, 228, 0.15)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !displayName.trim()}
                className="flex-1 px-4 py-2.5 bg-accent-light/20 text-accent-light border border-accent-light/40 hover:bg-accent-light/30 hover:shadow-[0_0_16px_rgba(52,177,228,0.3)] font-semibold rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed font-mono tracking-wider uppercase"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(5, 10, 18, 0.85)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="matchup-card rounded-xl p-6 w-full max-w-md mx-4 text-center"
            style={{
              background: 'rgba(8, 16, 32, 0.95)',
              border: '1px solid rgba(52, 177, 228, 0.2)',
              boxShadow: '0 0 40px rgba(52, 177, 228, 0.08)',
            }}
          >
            <div
              className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(52, 177, 228, 0.1)', border: '1px solid rgba(52, 177, 228, 0.2)' }}
            >
              <svg
                className="w-7 h-7 text-accent-light"
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

            <h2 className="font-display text-xl font-semibold text-accent-light mb-1 tracking-wider uppercase">
              Bracket Submitted!
            </h2>
            <p className="text-sm text-accent-light/40 mb-6 font-mono">
              Your picks have been locked in. Share your bracket link with
              friends to compare.
            </p>

            <div
              className="rounded-lg p-3 mb-6"
              style={{
                background: 'rgba(5, 10, 18, 0.7)',
                border: '1px solid rgba(52, 177, 228, 0.12)',
              }}
            >
              <p className="text-xs text-accent-light/40 mb-1 font-mono uppercase tracking-wider">Your bracket link</p>
              <p className="text-sm text-accent-light/70 break-all font-mono">
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
                className="flex-1 px-4 py-2.5 rounded-lg transition-all text-sm text-accent-light/60 font-mono"
                style={{
                  background: 'rgba(52, 177, 228, 0.08)',
                  border: '1px solid rgba(52, 177, 228, 0.15)',
                }}
              >
                Copy Link
              </button>
              <button
                onClick={handleViewBracket}
                className="flex-1 px-4 py-2.5 bg-accent-light/20 text-accent-light border border-accent-light/40 hover:bg-accent-light/30 hover:shadow-[0_0_16px_rgba(52,177,228,0.3)] font-semibold rounded-lg transition-all text-sm font-mono tracking-wider uppercase"
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
