'use client';

import { useState, useCallback } from 'react';
import { ThreatActor, Region, MediaLink } from '@/lib/types';
import { REGIONS, REGION_LABELS } from '@/lib/constants';

interface ThreatActorFormData {
  name: string;
  seed: number | '';
  region: Region | '';
  bio: string;
  affiliation: string;
  country_flag: string;
  intel_report_url: string;
  notable_operations: string;
  media: MediaLink[];
}

const emptyForm: ThreatActorFormData = {
  name: '',
  seed: '',
  region: '',
  bio: '',
  affiliation: '',
  country_flag: '',
  intel_report_url: '',
  notable_operations: '',
  media: [],
};

const emptyMediaLink: MediaLink = {
  type: 'video',
  url: '',
  title: '',
  source: '',
};

interface ThreatActorManagerProps {
  initialActors: ThreatActor[];
}

export default function ThreatActorManager({ initialActors }: ThreatActorManagerProps) {
  const [actors, setActors] = useState<ThreatActor[]>(initialActors);
  const [collapsedRegions, setCollapsedRegions] = useState<Record<string, boolean>>({});
  const [editingActor, setEditingActor] = useState<ThreatActor | null>(null);
  const [addingToRegion, setAddingToRegion] = useState<Region | null>(null);
  const [formData, setFormData] = useState<ThreatActorFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActors = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/threat-actors');
      if (!res.ok) throw new Error('Failed to fetch threat actors');
      const data = await res.json();
      setActors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch threat actors');
    }
  }, []);

  const toggleRegion = (region: Region) => {
    setCollapsedRegions((prev) => ({ ...prev, [region]: !prev[region] }));
  };

  const actorsByRegion = (region: Region) =>
    actors.filter((a) => a.region === region).sort((a, b) => a.seed - b.seed);

  const startAdd = (region: Region) => {
    setEditingActor(null);
    setAddingToRegion(region);
    setFormData({ ...emptyForm, region });
    setError(null);
  };

  const startEdit = (actor: ThreatActor) => {
    setAddingToRegion(null);
    setEditingActor(actor);
    setFormData({
      name: actor.name,
      seed: actor.seed,
      region: actor.region,
      bio: actor.bio || '',
      affiliation: actor.affiliation || '',
      country_flag: actor.country_flag || '',
      intel_report_url: actor.intel_report_url || '',
      notable_operations: actor.notable_operations || '',
      media: actor.media || [],
    });
    setError(null);
  };

  const cancelForm = () => {
    setEditingActor(null);
    setAddingToRegion(null);
    setFormData(emptyForm);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingActor) {
        const res = await fetch('/api/admin/threat-actors', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingActor.id, ...formData }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update threat actor');
        }
      } else {
        const res = await fetch('/api/admin/threat-actors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create threat actor');
        }
      }

      cancelForm();
      await fetchActors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (actor: ThreatActor) => {
    if (!confirm(`Are you sure you want to delete "${actor.name}"?`)) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/threat-actors?id=${actor.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete threat actor');
      }
      await fetchActors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ThreatActorFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null);

  const handlePhotoUpload = async (actorId: string, file: File) => {
    setUploadingPhotoFor(actorId);
    setError(null);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('actorId', actorId);

      const res = await fetch('/api/admin/threat-actors/photo', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      await fetchActors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setUploadingPhotoFor(null);
    }
  };

  const handlePhotoRemove = async (actorId: string) => {
    if (!confirm('Remove this threat actor\'s photo?')) return;
    setUploadingPhotoFor(actorId);
    setError(null);

    try {
      const res = await fetch(`/api/admin/threat-actors/photo?actorId=${actorId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove photo');
      }

      await fetchActors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove photo');
    } finally {
      setUploadingPhotoFor(null);
    }
  };

  const isFormOpen = editingActor !== null || addingToRegion !== null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent">Threat Actor Management</h1>
          <p className="text-muted mt-1">
            Manage the 64 threat actors across all four regions of the bracket.
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
              {editingActor ? `Edit: ${editingActor.name}` : 'Add New Threat Actor'}
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
                    placeholder="e.g. APT29 (Cozy Bear)"
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
                {/* Affiliation */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
                    Affiliation
                  </label>
                  <input
                    type="text"
                    value={formData.affiliation}
                    onChange={(e) => updateField('affiliation', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground placeholder-dim focus:outline-none focus:border-accent/60"
                    placeholder="e.g. Russia (SVR), PRC (MSS)"
                  />
                </div>

                {/* Country Flag */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Country Flag</label>
                  <input
                    type="text"
                    value={formData.country_flag}
                    onChange={(e) => updateField('country_flag', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground placeholder-dim focus:outline-none focus:border-accent/60"
                    placeholder="e.g. flag emoji or country code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Intel Report URL */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
                    Intel Report URL
                  </label>
                  <input
                    type="text"
                    value={formData.intel_report_url}
                    onChange={(e) => updateField('intel_report_url', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground placeholder-dim focus:outline-none focus:border-accent/60"
                    placeholder="https://..."
                  />
                </div>

                {/* Notable Operations */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
                    Notable Operations
                  </label>
                  <input
                    type="text"
                    value={formData.notable_operations}
                    onChange={(e) => updateField('notable_operations', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-hover border border-accent/20 rounded-md text-foreground placeholder-dim focus:outline-none focus:border-accent/60"
                    placeholder="e.g. SolarWinds, NotPetya"
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
                  placeholder="Brief description of the threat actor..."
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
                    : editingActor
                    ? 'Update Threat Actor'
                    : 'Create Threat Actor'}
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
            const regionActors = actorsByRegion(region);
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
                      ({regionActors.length}/16 threat actors)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startAdd(region);
                    }}
                    className="px-3 py-1 text-sm bg-accent/10 text-accent border border-accent/30 rounded-md hover:bg-accent/20 transition-colors"
                  >
                    + Add Threat Actor
                  </button>
                </div>

                {/* Threat actor list */}
                {!isCollapsed && (
                  <div className="border-t border-accent/10">
                    {regionActors.length === 0 ? (
                      <div className="px-6 py-8 text-center text-dim">
                        No threat actors in this region yet. Click &quot;Add Threat Actor&quot; to get started.
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wider text-dim border-b border-accent/10">
                            <th className="px-6 py-3 w-16">Seed</th>
                            <th className="px-6 py-3 w-20">Photo</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3 hidden md:table-cell">Affiliation</th>
                            <th className="px-6 py-3 hidden md:table-cell">Country</th>
                            <th className="px-6 py-3 hidden md:table-cell w-16">Media</th>
                            <th className="px-6 py-3 w-32 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regionActors.map((actor) => (
                            <tr
                              key={actor.id}
                              className="border-b border-accent/5 hover:bg-surface-hover transition-colors"
                            >
                              <td className="px-6 py-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent text-sm font-bold">
                                  {actor.seed}
                                </span>
                              </td>
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                  {actor.photo_url ? (
                                    <div className="relative group/photo">
                                      <label className="cursor-pointer" title="Click to replace photo">
                                        <img
                                          src={actor.photo_url}
                                          alt={actor.name}
                                          className="w-10 h-10 rounded-full object-cover border border-accent/20 hover:opacity-70 transition-opacity"
                                        />
                                        <input
                                          type="file"
                                          accept="image/jpeg,image/png,image/webp"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handlePhotoUpload(actor.id, file);
                                            e.target.value = '';
                                          }}
                                        />
                                      </label>
                                      <button
                                        onClick={() => handlePhotoRemove(actor.id)}
                                        disabled={uploadingPhotoFor === actor.id}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                        title="Remove photo"
                                      >
                                        x
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="w-10 h-10 rounded-full bg-surface-hover border border-dashed border-accent/30 flex items-center justify-center cursor-pointer hover:border-accent/60 transition-colors">
                                      {uploadingPhotoFor === actor.id ? (
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
                                          if (file) handlePhotoUpload(actor.id, file);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-3 font-medium">{actor.name}</td>
                              <td className="px-6 py-3 text-muted hidden md:table-cell">
                                {actor.affiliation || '--'}
                              </td>
                              <td className="px-6 py-3 text-muted hidden md:table-cell">
                                {actor.country_flag || '--'}
                              </td>
                              <td className="px-6 py-3 text-muted hidden md:table-cell">
                                {actor.media && actor.media.length > 0 ? (
                                  <span className="text-xs text-accent">{actor.media.length}</span>
                                ) : (
                                  <span className="text-dim">--</span>
                                )}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => startEdit(actor)}
                                    className="px-3 py-1 text-xs text-accent border border-accent/30 rounded hover:bg-accent/10 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(actor)}
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
          {actors.length} / 64 threat actors configured
        </div>
      </div>
    </div>
  );
}
