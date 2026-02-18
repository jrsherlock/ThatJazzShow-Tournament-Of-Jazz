'use client';

import { useState, useCallback } from 'react';
import { Artist, Region } from '@/lib/types';
import { REGIONS, REGION_LABELS } from '@/lib/constants';

interface ArtistFormData {
  name: string;
  seed: number | '';
  region: Region | '';
  bio: string;
  instrument: string;
  era: string;
  featured_track_url: string;
  featured_track_title: string;
}

const emptyForm: ArtistFormData = {
  name: '',
  seed: '',
  region: '',
  bio: '',
  instrument: '',
  era: '',
  featured_track_url: '',
  featured_track_title: '',
};

interface ArtistManagerProps {
  initialArtists: Artist[];
}

export default function ArtistManager({ initialArtists }: ArtistManagerProps) {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [collapsedRegions, setCollapsedRegions] = useState<Record<string, boolean>>({});
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [addingToRegion, setAddingToRegion] = useState<Region | null>(null);
  const [formData, setFormData] = useState<ArtistFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArtists = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/artists');
      if (!res.ok) throw new Error('Failed to fetch artists');
      const data = await res.json();
      setArtists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch artists');
    }
  }, []);

  const toggleRegion = (region: Region) => {
    setCollapsedRegions((prev) => ({ ...prev, [region]: !prev[region] }));
  };

  const artistsByRegion = (region: Region) =>
    artists.filter((a) => a.region === region).sort((a, b) => a.seed - b.seed);

  const startAdd = (region: Region) => {
    setEditingArtist(null);
    setAddingToRegion(region);
    setFormData({ ...emptyForm, region });
    setError(null);
  };

  const startEdit = (artist: Artist) => {
    setAddingToRegion(null);
    setEditingArtist(artist);
    setFormData({
      name: artist.name,
      seed: artist.seed,
      region: artist.region,
      bio: artist.bio || '',
      instrument: artist.instrument || '',
      era: artist.era || '',
      featured_track_url: artist.featured_track_url || '',
      featured_track_title: artist.featured_track_title || '',
    });
    setError(null);
  };

  const cancelForm = () => {
    setEditingArtist(null);
    setAddingToRegion(null);
    setFormData(emptyForm);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingArtist) {
        const res = await fetch('/api/admin/artists', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingArtist.id, ...formData }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update artist');
        }
      } else {
        const res = await fetch('/api/admin/artists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create artist');
        }
      }

      cancelForm();
      await fetchArtists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (artist: Artist) => {
    if (!confirm(`Are you sure you want to delete "${artist.name}"?`)) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/artists?id=${artist.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete artist');
      }
      await fetchArtists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ArtistFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormOpen = editingArtist !== null || addingToRegion !== null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#D4A843]">Artist Management</h1>
          <p className="text-gray-400 mt-1">
            Manage the 64 artists across all four regions of the bracket.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-400 hover:text-red-200 underline text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Form modal */}
        {isFormOpen && (
          <div className="mb-8 p-6 bg-[#111111] border border-[#D4A843]/20 rounded-lg">
            <h2 className="text-xl font-semibold text-[#D4A843] mb-4">
              {editingArtist ? `Edit: ${editingArtist.name}` : 'Add New Artist'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#D4A843]/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A843]/60"
                    placeholder="e.g. Ella Fitzgerald"
                  />
                </div>

                {/* Seed */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Seed <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={16}
                    value={formData.seed}
                    onChange={(e) =>
                      updateField('seed', e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#D4A843]/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A843]/60"
                    placeholder="1-16"
                  />
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Region <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.region}
                    onChange={(e) => updateField('region', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#D4A843]/20 rounded-md text-white focus:outline-none focus:border-[#D4A843]/60"
                  >
                    <option value="">Select region</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {REGION_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instrument */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Instrument
                  </label>
                  <input
                    type="text"
                    value={formData.instrument}
                    onChange={(e) => updateField('instrument', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#D4A843]/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A843]/60"
                    placeholder="e.g. Vocals, Trumpet, Piano"
                  />
                </div>

                {/* Era */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Era</label>
                  <input
                    type="text"
                    value={formData.era}
                    onChange={(e) => updateField('era', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#D4A843]/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A843]/60"
                    placeholder="e.g. 1930s-1960s"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Featured Track URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Featured Track URL
                  </label>
                  <input
                    type="text"
                    value={formData.featured_track_url}
                    onChange={(e) => updateField('featured_track_url', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#D4A843]/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A843]/60"
                    placeholder="https://..."
                  />
                </div>

                {/* Featured Track Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Featured Track Title
                  </label>
                  <input
                    type="text"
                    value={formData.featured_track_title}
                    onChange={(e) => updateField('featured_track_title', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#D4A843]/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A843]/60"
                    placeholder="e.g. A-Tisket, A-Tasket"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#D4A843]/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A843]/60 resize-y"
                  placeholder="Brief biography of the artist..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#D4A843] text-black font-semibold rounded-md hover:bg-[#C49A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading
                    ? 'Saving...'
                    : editingArtist
                    ? 'Update Artist'
                    : 'Create Artist'}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-5 py-2 border border-gray-600 text-gray-300 rounded-md hover:border-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Regions */}
        <div className="space-y-4">
          {REGIONS.map((region) => {
            const regionArtists = artistsByRegion(region);
            const isCollapsed = collapsedRegions[region] ?? false;

            return (
              <div
                key={region}
                className="bg-[#111111] border border-[#D4A843]/20 rounded-lg overflow-hidden"
              >
                {/* Region header */}
                <button
                  onClick={() => toggleRegion(region)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#1A1A1A] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 text-[#D4A843] transition-transform ${
                        isCollapsed ? '' : 'rotate-90'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <h2 className="text-lg font-semibold text-[#D4A843]">
                      {REGION_LABELS[region]}
                    </h2>
                    <span className="text-sm text-gray-500">
                      ({regionArtists.length}/16 artists)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startAdd(region);
                    }}
                    className="px-3 py-1 text-sm bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/30 rounded-md hover:bg-[#D4A843]/20 transition-colors"
                  >
                    + Add Artist
                  </button>
                </button>

                {/* Artist list */}
                {!isCollapsed && (
                  <div className="border-t border-[#D4A843]/10">
                    {regionArtists.length === 0 ? (
                      <div className="px-6 py-8 text-center text-gray-500">
                        No artists in this region yet. Click &quot;Add Artist&quot; to get started.
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-[#D4A843]/10">
                            <th className="px-6 py-3 w-16">Seed</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3 hidden md:table-cell">Instrument</th>
                            <th className="px-6 py-3 hidden md:table-cell">Era</th>
                            <th className="px-6 py-3 w-32 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regionArtists.map((artist) => (
                            <tr
                              key={artist.id}
                              className="border-b border-[#D4A843]/5 hover:bg-[#1A1A1A] transition-colors"
                            >
                              <td className="px-6 py-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#D4A843]/10 text-[#D4A843] text-sm font-bold">
                                  {artist.seed}
                                </span>
                              </td>
                              <td className="px-6 py-3 font-medium">{artist.name}</td>
                              <td className="px-6 py-3 text-gray-400 hidden md:table-cell">
                                {artist.instrument || '--'}
                              </td>
                              <td className="px-6 py-3 text-gray-400 hidden md:table-cell">
                                {artist.era || '--'}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => startEdit(artist)}
                                    className="px-3 py-1 text-xs text-[#D4A843] border border-[#D4A843]/30 rounded hover:bg-[#D4A843]/10 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(artist)}
                                    disabled={loading}
                                    className="px-3 py-1 text-xs text-red-400 border border-red-400/30 rounded hover:bg-red-400/10 disabled:opacity-50 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          {artists.length} / 64 artists configured
        </div>
      </div>
    </div>
  );
}
