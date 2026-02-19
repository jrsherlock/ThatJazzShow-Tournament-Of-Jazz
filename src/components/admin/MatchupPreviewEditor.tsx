'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Artist, Tournament, MatchupPreview, Region } from '@/lib/types';
import { REGIONS, REGION_LABELS, ROUND_1_SEED_MATCHUPS } from '@/lib/constants';

interface Props {
  tournament: Tournament;
  artists: Artist[];
  existingPreviews: MatchupPreview[];
}

export function MatchupPreviewEditor({ tournament, artists, existingPreviews }: Props) {
  const router = useRouter();
  const [activeRegion, setActiveRegion] = useState<Region>('vocalists');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [headline, setHeadline] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [funFact, setFunFact] = useState('');

  const previewMap = new Map(existingPreviews.map((p) => [p.matchup_key, p]));

  function getRegionMatchups(region: Region) {
    const regionIndex = REGIONS.indexOf(region);
    return ROUND_1_SEED_MATCHUPS.map(([seedA, seedB], i) => {
      const globalIndex = regionIndex * 8 + i;
      const key = `1-${globalIndex}`;
      const artistA = artists.find((a) => a.region === region && a.seed === seedA);
      const artistB = artists.find((a) => a.region === region && a.seed === seedB);
      const preview = previewMap.get(key);
      return { key, seedA, seedB, artistA, artistB, preview };
    });
  }

  function startEdit(key: string, preview: MatchupPreview | undefined) {
    setEditingKey(key);
    setHeadline(preview?.headline ?? '');
    setPreviewText(preview?.preview_text ?? '');
    setFunFact(preview?.fun_fact ?? '');
  }

  function cancelEdit() {
    setEditingKey(null);
    setHeadline('');
    setPreviewText('');
    setFunFact('');
  }

  async function savePreview(key: string) {
    setSaving(true);
    const existing = previewMap.get(key);
    const body = {
      tournament_id: tournament.id,
      matchup_key: key,
      headline,
      preview_text: previewText,
      fun_fact: funFact || null,
    };

    const method = existing ? 'PUT' : 'POST';
    const payload = existing ? { ...body, id: existing.id } : body;

    await fetch('/api/admin/matchup-previews', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setEditingKey(null);
    router.refresh();
  }

  const matchups = getRegionMatchups(activeRegion);
  const totalPreviews = existingPreviews.length;

  return (
    <div>
      {/* Progress */}
      <div className="mb-6 p-4 bg-surface-hover rounded-lg border border-accent/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted">Previews Written</span>
          <span className="text-accent font-bold">{totalPreviews} / 32</span>
        </div>
        <div className="w-full bg-background rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all"
            style={{ width: `${(totalPreviews / 32) * 100}%` }}
          />
        </div>
      </div>

      {/* Region Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {REGIONS.map((region) => {
          const regionMatchups = getRegionMatchups(region);
          const written = regionMatchups.filter((m) => m.preview).length;
          return (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeRegion === region
                  ? 'bg-accent text-white'
                  : 'bg-surface-hover text-muted hover:text-foreground border border-accent/20'
              }`}
            >
              {REGION_LABELS[region]} ({written}/8)
            </button>
          );
        })}
      </div>

      {/* Matchup List */}
      <div className="space-y-4">
        {matchups.map(({ key, seedA, seedB, artistA, artistB, preview }) => (
          <div
            key={key}
            className="bg-surface-hover rounded-lg border border-accent/20 overflow-hidden"
          >
            {/* Matchup Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <span className="text-xs text-dim">#{seedA}</span>
                  <p className="text-foreground font-medium">{artistA?.name ?? 'TBD'}</p>
                  {artistA?.instrument && (
                    <p className="text-xs text-dim">{artistA.instrument}</p>
                  )}
                </div>
                <span className="text-accent font-bold text-lg">vs</span>
                <div className="text-center">
                  <span className="text-xs text-dim">#{seedB}</span>
                  <p className="text-foreground font-medium">{artistB?.name ?? 'TBD'}</p>
                  {artistB?.instrument && (
                    <p className="text-xs text-dim">{artistB.instrument}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {preview ? (
                  <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">
                    Written
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-gray-800 text-dim rounded">
                    Not written
                  </span>
                )}
                <button
                  onClick={() => startEdit(key, preview)}
                  className="px-3 py-1.5 text-sm bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
                >
                  {preview ? 'Edit' : 'Write'}
                </button>
              </div>
            </div>

            {/* Preview snippet */}
            {preview && editingKey !== key && (
              <div className="px-4 pb-4 border-t border-accent/10">
                <p className="text-sm text-accent font-medium mt-3">{preview.headline}</p>
                <p className="text-sm text-muted mt-1 line-clamp-2">{preview.preview_text}</p>
              </div>
            )}

            {/* Edit Form */}
            {editingKey === key && (
              <div className="p-4 border-t border-accent/20 bg-background/50 space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-1">
                    Headline <span className="text-gray-600">(e.g., &quot;The Queen of Scat vs. The Chairman of Swing&quot;)</span>
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full bg-surface-hover border border-accent/30 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent"
                    placeholder="Enter a catchy headline..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">
                    Preview Text <span className="text-gray-600">(your analysis of the matchup)</span>
                  </label>
                  <textarea
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    rows={5}
                    className="w-full bg-surface-hover border border-accent/30 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent resize-y"
                    placeholder="Write your matchup analysis..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">
                    Fun Fact <span className="text-gray-600">(optional trivia or stat)</span>
                  </label>
                  <input
                    type="text"
                    value={funFact}
                    onChange={(e) => setFunFact(e.target.value)}
                    className="w-full bg-surface-hover border border-accent/30 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent"
                    placeholder="e.g., Ella recorded over 200 albums"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => savePreview(key)}
                    disabled={saving || !previewText.trim()}
                    className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Preview'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-surface-hover text-muted rounded-lg hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
