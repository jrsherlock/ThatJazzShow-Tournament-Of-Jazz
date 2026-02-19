'use client';

import { useState, useCallback } from 'react';
import { Artist, Region, MediaLink } from '@/lib/types';
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
  media: MediaLink[];
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
  media: [],
};

const emptyMediaLink: MediaLink = {
  type: 'video',
  url: '',
  title: '',
  source: '',
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
      media: artist.media || [],
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

  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null);

  const handlePhotoUpload = async (artistId: string, file: File) => {
    setUploadingPhotoFor(artistId);
    setError(null);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('artistId', artistId);

      const res = await fetch('/api/admin/artists/photo', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      await fetchArtists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setUploadingPhotoFor(null);
    }
  };

  const handlePhotoRemove = async (artistId: string) => {
    if (!confirm('Remove this artist\'s photo?')) return;
    setUploadingPhotoFor(artistId);
    setError(null);

    try {
      const res = await fetch(`/api/admin/artists/photo?artistId=${artistId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove photo');
      }

      await fetchArtists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove photo');
    } finally {
      setUploadingPhotoFor(null);
    }
  };

  const isFormOpen = editingArtist !== null || addingToRegion !== null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent">Artist Management</h1>
          <p className="text-muted mt-1">
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
          <div className="mb-8 p-6 bg-surface border border-accent/20 rounded-lg">
            <h2 className="text-xl font-semibold text-accent mb-4">
              {editingArtist ? `Edit: ${editingArtist.name}` : 'Add New Artist'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground placeholder-dim focus:outline-none focus:border-accent/60"
                    placeholder="e.g. Ella Fitzgerald"
                  />
                </div>

                {/* Seed */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
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
                    className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground placeholder-dim focus:outline-none focus:border-accent/60"
                    placeholder="1-16"
                  />
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
                    Region <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.region}
                    onChange={(e) => updateField('region', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground focus:outline-none focus:border-accent/60"
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
                  <label className="block text-sm font-medium text-muted mb-1">
                    Instrument
                  </label>
                  <input
                    type="text"
                    value={formData.instrument}
                    onChange={(e) => updateField('instrument', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground placeholder-dim focus:outline-none focus:border-accent/60"
                    placeholder="e.g. Vocals, Trumpet, Piano"
                  />
                </div>

                {/* Era */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Era</label>
                  <input
                    type="text"
                    value={formData.era}
                    onChange={(e) => updateField('era', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground placeholder-dim focus:outline-none focus:border-accent/60"
                    placeholder="e.g. 1930s-1960s"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Featured Track URL */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
                    Featured Track URL
                  </label>
                  <input
                    type="text"
                    value={formData.featured_track_url}
                    onChange={(e) => updateField('featured_track_url', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground placeholder-dim focus:outline-none focus:border-accent/60"
                    placeholder="https://..."
                  />
                </div>

                {/* Featured Track Title */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
                    Featured Track Title
                  </label>
                  <input
                    type="text"
                    value={formData.featured_track_title}
                    onChange={(e) => updateField('featured_track_title', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground placeholder-dim focus:outline-none focus:border-accent/60"
                    placeholder="e.g. A-Tisket, A-Tasket"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground placeholder-dim focus:outline-none focus:border-accent/60 resize-y"
                  placeholder="Brief biography of the artist..."
                />
              </div>

              {/* Media Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-muted">
                    Media Links
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        media: [...prev.media, { ...emptyMediaLink }],
                      }))
                    }
                    className="px-2 py-1 text-xs bg-accent/10 text-accent border border-accent/30 rounded hover:bg-accent/20 transition-colors"
                  >
                    + Add Link
                  </button>
                </div>
                {formData.media.length === 0 && (
                  <p className="text-xs text-dim">No media links yet.</p>
                )}
                <div className="space-y-2">
                  {formData.media.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-3 bg-surface-hover border border-accent/10 rounded-md"
                    >
                      <select
                        value={link.type}
                        onChange={(e) => {
                          const updated = [...formData.media];
                          updated[idx] = { ...updated[idx], type: e.target.value as 'video' | 'audio' };
                          setFormData((prev) => ({ ...prev, media: updated }));
                        }}
                        className="px-2 py-1.5 bg-background border border-accent/20 rounded text-foreground text-xs focus:outline-none focus:border-accent/60 w-20"
                      >
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                      </select>
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...formData.media];
                          updated[idx] = { ...updated[idx], url: e.target.value };
                          setFormData((prev) => ({ ...prev, media: updated }));
                        }}
                        placeholder="URL"
                        className="flex-1 min-w-0 px-2 py-1.5 bg-background border border-accent/20 rounded text-foreground placeholder-dim text-xs focus:outline-none focus:border-accent/60"
                      />
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => {
                          const updated = [...formData.media];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setFormData((prev) => ({ ...prev, media: updated }));
                        }}
                        placeholder="Title"
                        className="w-40 px-2 py-1.5 bg-background border border-accent/20 rounded text-foreground placeholder-dim text-xs focus:outline-none focus:border-accent/60"
                      />
                      <input
                        type="text"
                        value={link.source}
                        onChange={(e) => {
                          const updated = [...formData.media];
                          updated[idx] = { ...updated[idx], source: e.target.value };
                          setFormData((prev) => ({ ...prev, media: updated }));
                        }}
                        placeholder="Source"
                        className="w-24 px-2 py-1.5 bg-background border border-accent/20 rounded text-foreground placeholder-dim text-xs focus:outline-none focus:border-accent/60"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            media: prev.media.filter((_, i) => i !== idx),
                          }));
                        }}
                        className="px-2 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors text-xs"
                        title="Remove"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-accent text-black font-semibold rounded-md hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  className="px-5 py-2 border border-gray-600 text-muted rounded-md hover:border-gray-400 hover:text-foreground transition-colors"
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
                className="bg-surface border border-accent/20 rounded-lg overflow-hidden"
              >
                {/* Region header */}
                <div
                  onClick={() => toggleRegion(region)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleRegion(region); }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 text-accent transition-transform ${
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
                    <h2 className="text-lg font-semibold text-accent">
                      {REGION_LABELS[region]}
                    </h2>
                    <span className="text-sm text-dim">
                      ({regionArtists.length}/16 artists)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startAdd(region);
                    }}
                    className="px-3 py-1 text-sm bg-accent/10 text-accent border border-accent/30 rounded-md hover:bg-accent/20 transition-colors"
                  >
                    + Add Artist
                  </button>
                </div>

                {/* Artist list */}
                {!isCollapsed && (
                  <div className="border-t border-accent/10">
                    {regionArtists.length === 0 ? (
                      <div className="px-6 py-8 text-center text-dim">
                        No artists in this region yet. Click &quot;Add Artist&quot; to get started.
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wider text-dim border-b border-accent/10">
                            <th className="px-6 py-3 w-16">Seed</th>
                            <th className="px-6 py-3 w-20">Photo</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3 hidden md:table-cell">Instrument</th>
                            <th className="px-6 py-3 hidden md:table-cell">Era</th>
                            <th className="px-6 py-3 hidden md:table-cell w-16">Media</th>
                            <th className="px-6 py-3 w-32 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regionArtists.map((artist) => (
                            <tr
                              key={artist.id}
                              className="border-b border-accent/5 hover:bg-surface-hover transition-colors"
                            >
                              <td className="px-6 py-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent text-sm font-bold">
                                  {artist.seed}
                                </span>
                              </td>
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                  {artist.photo_url ? (
                                    <div className="relative group/photo">
                                      <label className="cursor-pointer" title="Click to replace photo">
                                        <img
                                          src={artist.photo_url}
                                          alt={artist.name}
                                          className="w-10 h-10 rounded-full object-cover border border-accent/20 hover:opacity-70 transition-opacity"
                                        />
                                        <input
                                          type="file"
                                          accept="image/jpeg,image/png,image/webp"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handlePhotoUpload(artist.id, file);
                                            e.target.value = '';
                                          }}
                                        />
                                      </label>
                                      <button
                                        onClick={() => handlePhotoRemove(artist.id)}
                                        disabled={uploadingPhotoFor === artist.id}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                        title="Remove photo"
                                      >
                                        x
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="w-10 h-10 rounded-full bg-surface-hover border border-dashed border-accent/30 flex items-center justify-center cursor-pointer hover:border-accent/60 transition-colors">
                                      {uploadingPhotoFor === artist.id ? (
                                        <span className="text-[10px] text-dim">...</span>
                                      ) : (
                                        <svg className="w-4 h-4 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                      )}
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handlePhotoUpload(artist.id, file);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-3 font-medium">{artist.name}</td>
                              <td className="px-6 py-3 text-muted hidden md:table-cell">
                                {artist.instrument || '--'}
                              </td>
                              <td className="px-6 py-3 text-muted hidden md:table-cell">
                                {artist.era || '--'}
                              </td>
                              <td className="px-6 py-3 text-muted hidden md:table-cell">
                                {artist.media && artist.media.length > 0 ? (
                                  <span className="text-xs text-accent">{artist.media.length}</span>
                                ) : (
                                  <span className="text-dim">--</span>
                                )}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => startEdit(artist)}
                                    className="px-3 py-1 text-xs text-accent border border-accent/30 rounded hover:bg-accent/10 transition-colors"
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
        <div className="mt-8 text-center text-dim text-sm">
          {artists.length} / 64 artists configured
        </div>
      </div>
    </div>
  );
}
