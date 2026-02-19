'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tournament, MasterBracket, TournamentStatus } from '@/lib/types';
import { ROUND_NAMES } from '@/lib/constants';

interface RevealControlsProps {
  tournament: Tournament;
  masterBracket: MasterBracket;
}

const STATUSES: TournamentStatus[] = ['setup', 'open', 'closed', 'revealing', 'complete'];

const STATUS_LABELS: Record<TournamentStatus, string> = {
  setup: 'Setup',
  open: 'Open for Submissions',
  closed: 'Submissions Closed',
  revealing: 'Revealing Results',
  complete: 'Complete',
};

export default function RevealControls({ tournament, masterBracket }: RevealControlsProps) {
  const router = useRouter();
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TournamentStatus>(tournament.status);

  const revealedThrough = masterBracket.revealed_through;

  async function handleRevealRound(round: number) {
    const roundName = ROUND_NAMES[round];
    const confirmed = window.confirm(
      `Are you sure you want to reveal ${roundName}?\n\nThis action is irreversible. Once revealed, participants will see the results for this round and their scores will be updated.`
    );

    if (!confirmed) return;

    setRevealing(true);
    setError('');

    try {
      const res = await fetch('/api/admin/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournament.id,
          round,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to reveal round');
        return;
      }

      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setRevealing(false);
    }
  }

  async function handleStatusChange(newStatus: TournamentStatus) {
    setStatusUpdating(true);
    setError('');

    try {
      const res = await fetch('/api/admin/tournament', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tournament.id,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update status');
        return;
      }

      setCurrentStatus(newStatus);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setStatusUpdating(false);
    }
  }

  function getRoundState(round: number): 'revealed' | 'next' | 'future' {
    if (round <= revealedThrough) return 'revealed';
    if (round === revealedThrough + 1) return 'next';
    return 'future';
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-accent tracking-wide">
          Reveal Controls
        </h1>
        <p className="text-muted text-sm mt-1">
          Progressively reveal tournament results round by round.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Tournament Status Card */}
      <div className="bg-surface-hover border border-accent/20 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">
          Tournament Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-muted mb-1.5">
              Tournament Name
            </label>
            <p className="text-zinc-200 font-medium">{tournament.name}</p>
          </div>

          <div>
            <label
              htmlFor="tournament-status"
              className="block text-sm text-muted mb-1.5"
            >
              Status
            </label>
            <div className="flex items-center gap-3">
              <select
                id="tournament-status"
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as TournamentStatus)}
                disabled={statusUpdating}
                className="flex-1 px-3 py-2 rounded bg-background border border-subtle text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              {statusUpdating && (
                <span className="text-xs text-dim animate-pulse">
                  Updating...
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">
              Revealed Through
            </label>
            <p className="text-zinc-200 font-medium">
              {revealedThrough === 0
                ? 'No rounds revealed'
                : `${ROUND_NAMES[revealedThrough]} (Round ${revealedThrough} of 6)`}
            </p>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">
              Master Bracket Picks
            </label>
            <p className="text-zinc-200 font-medium">
              {Object.keys(masterBracket.picks).length} picks recorded
            </p>
          </div>
        </div>
      </div>

      {/* Round Reveal Buttons */}
      <div className="bg-surface-hover border border-accent/20 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-zinc-200 mb-2">
          Round Reveals
        </h2>
        <p className="text-sm text-dim mb-6">
          Reveal rounds sequentially. Each reveal is irreversible and will update participant scores.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((round) => {
            const state = getRoundState(round);
            const roundName = ROUND_NAMES[round];

            if (state === 'revealed') {
              return (
                <div
                  key={round}
                  className="relative border border-accent/40 bg-accent/10 rounded-lg p-5 text-center"
                >
                  {/* Checkmark badge */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-wider text-accent/70 mb-1">
                    Round {round}
                  </p>
                  <p className="text-accent font-semibold text-lg">
                    {roundName}
                  </p>
                  <p className="text-xs text-accent/60 mt-2">Revealed</p>
                </div>
              );
            }

            if (state === 'next') {
              return (
                <div
                  key={round}
                  className="border-2 border-accent rounded-lg p-5 text-center bg-accent/5"
                >
                  <p className="text-xs uppercase tracking-wider text-muted mb-1">
                    Round {round}
                  </p>
                  <p className="text-foreground font-semibold text-lg mb-4">
                    {roundName}
                  </p>
                  <button
                    onClick={() => handleRevealRound(round)}
                    disabled={revealing}
                    className="w-full py-2.5 px-4 rounded font-semibold bg-accent text-white hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm"
                  >
                    {revealing ? 'Revealing...' : `Reveal ${roundName}`}
                  </button>
                </div>
              );
            }

            // future
            return (
              <div
                key={round}
                className="border border-subtle/50 rounded-lg p-5 text-center opacity-50"
              >
                <p className="text-xs uppercase tracking-wider text-zinc-600 mb-1">
                  Round {round}
                </p>
                <p className="text-dim font-semibold text-lg">
                  {roundName}
                </p>
                <p className="text-xs text-zinc-600 mt-2">Pending</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-surface-hover border border-accent/20 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">
          Reveal Progress
        </h2>
        <div className="w-full bg-charcoal rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(revealedThrough / 6) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-dim">
            {revealedThrough} of 6 rounds revealed
          </span>
          <span className="text-xs text-dim">
            {revealedThrough === 6
              ? 'Tournament complete!'
              : `Next: ${ROUND_NAMES[revealedThrough + 1]}`}
          </span>
        </div>
      </div>
    </div>
  );
}
