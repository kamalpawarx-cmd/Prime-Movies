import React, { useState } from 'react';
import { Film, Image as ImageIcon, Upload, X } from 'lucide-react';
import { QUALITY_PROFILES } from '../data/catalog';
import { MediaCategory, MediaItem, QualityTierId } from '../types/media';
import { saveBlobToStore } from '../utils/mediaStorage';

interface UploadModalProps {
  onClose: () => void;
  onUploaded: (item: MediaItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUploaded }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MediaCategory>('movie');
  const [genre, setGenre] = useState('Drama');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [directorOrStudio, setDirectorOrStudio] = useState('Community Upload');
  const [synopsis, setSynopsis] = useState('');
  const [sourceMode, setSourceMode] = useState<'file' | 'url'>('file');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [directUrl, setDirectUrl] = useState('');
  const [posterDataUrl, setPosterDataUrl] = useState<string>('');
  const [targetQuality, setTargetQuality] = useState<QualityTierId>('720p-av1');
  const [audioLang, setAudioLang] = useState('English');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePosterPick = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPosterDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (sourceMode === 'file' && !videoFile) {
      setError('Please choose a video file (.mp4, .webm, .mov) to upload.');
      return;
    }
    if (sourceMode === 'url' && !directUrl.trim().startsWith('http')) {
      setError('Please enter a valid http:// or https:// video stream URL.');
      return;
    }

    setSaving(true);
    try {
      const id = `upload-${Date.now()}`;
      let streamUrl = directUrl.trim();
      let durationMin = 95;

      if (sourceMode === 'file' && videoFile) {
        await saveBlobToStore('uploads', id, videoFile);
        streamUrl = `idb-upload:${id}`;
        // Estimate duration gently from file size if not yet decoded
        durationMin = Math.max(1, Math.min(240, Math.round(videoFile.size / (1024 * 1024 * 2)) || 12));
      }

      const profile = QUALITY_PROFILES.find((q) => q.id === targetQuality) ?? QUALITY_PROFILES[1];

      const newItem: MediaItem = {
        id,
        title: title.trim(),
        category,
        year: Number(year) || new Date().getFullYear(),
        genres: [genre.trim() || 'Independent'],
        rating: 8.5,
        durationLabel:
          category === 'movie'
            ? `${durationMin}m · Uploaded`
            : `1 Episode · ${durationMin}m`,
        durationMin,
        synopsis:
          synopsis.trim() ||
          'Uploaded directly by user for private and friends-shared low-data playback.',
        directorOrStudio: directorOrStudio.trim() || 'Community Upload',
        posterUrl: posterDataUrl,
        backdropUrl: posterDataUrl || undefined,
        streamUrl,
        audioLanguages: [audioLang.trim() || 'Original'],
        subtitles: ['English', 'Hindi', 'Spanish', 'Japanese'],
        mbPerHourAv1: profile.mbPerHour,
        sourceProviderId: 'user-upload',
        sourceProviderName: 'My Uploads',
        isUserUpload: true,
        uploadedAt: new Date().toISOString(),
        episodes:
          category === 'movie'
            ? undefined
            : [
                {
                  id: `${id}-e1`,
                  season: 1,
                  number: 1,
                  title: 'Episode 1',
                  durationMin,
                  synopsis: synopsis.trim() || 'Uploaded episode ready for low-data playback.',
                  streamUrl,
                  releaseDate: new Date().toISOString().slice(0, 10),
                  isNew: true,
                },
              ],
      };

      onUploaded(newItem);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save uploaded video to local browser storage.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Upload movie or episode"
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border p-5 sm:rounded-2xl sm:p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-hairline)' }}>
          <div>
            <h2 className="font-display text-xl font-bold">Upload Movie or Episode</h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Upload a local video file to watch offline or link a direct stream URL.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border"
            style={{ borderColor: 'var(--border-strong)' }}
            aria-label="Close upload dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Source Mode Switch */}
          <div className="inline-flex rounded-lg p-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <button
              type="button"
              onClick={() => setSourceMode('file')}
              className="rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap"
              style={{
                backgroundColor: sourceMode === 'file' ? 'var(--accent)' : 'transparent',
                color: sourceMode === 'file' ? 'var(--accent-fg)' : 'var(--text-secondary)',
              }}
            >
              Upload Video File
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('url')}
              className="rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap"
              style={{
                backgroundColor: sourceMode === 'url' ? 'var(--accent)' : 'transparent',
                color: sourceMode === 'url' ? 'var(--accent-fg)' : 'var(--text-secondary)',
              }}
            >
              Direct Stream URL
            </button>
          </div>

          {sourceMode === 'file' ? (
            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors"
              style={{
                borderColor: 'var(--border-strong)',
                backgroundColor: 'var(--bg-canvas)',
              }}
            >
              <Upload className="mb-2 h-6 w-6" style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-medium">
                {videoFile ? videoFile.name : 'Choose a video file (.mp4, .webm, .mov)'}
              </span>
              <span className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                {videoFile
                  ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB · Stored locally in IndexedDB`
                  : 'Stored safely on your device for instant zero-data playback'}
              </span>
              <input
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setVideoFile(file);
                  if (file && !title) {
                    setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '));
                  }
                }}
              />
            </label>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Video Stream URL (.mp4 / .webm)
              </label>
              <input
                type="url"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="https://example.com/movies/film.mp4"
                className="min-h-[42px] w-full rounded-lg border px-3 text-sm"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          {/* Title & Category */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Express"
                className="min-h-[42px] w-full rounded-lg border px-3 text-sm"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Category Tab
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MediaCategory)}
                className="min-h-[42px] w-full rounded-lg border px-3 text-sm"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="movie">Movies</option>
                <option value="webseries">Web Series</option>
                <option value="anime">Anime</option>
              </select>
            </div>
          </div>

          {/* Genre, Year, Language */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="min-h-[42px] w-full rounded-lg border px-3 text-sm"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="font-mono-tabular min-h-[42px] w-full rounded-lg border px-3 text-sm"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Primary Language
              </label>
              <input
                type="text"
                value={audioLang}
                onChange={(e) => setAudioLang(e.target.value)}
                placeholder="English, Hindi, Japanese..."
                className="min-h-[42px] w-full rounded-lg border px-3 text-sm"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Creator & Compression Target */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Director / Studio
              </label>
              <input
                type="text"
                value={directorOrStudio}
                onChange={(e) => setDirectorOrStudio(e.target.value)}
                className="min-h-[42px] w-full rounded-lg border px-3 text-sm"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Data-Saver Profile
              </label>
              <select
                value={targetQuality}
                onChange={(e) => setTargetQuality(e.target.value as QualityTierId)}
                className="min-h-[42px] w-full rounded-lg border px-3 text-sm"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                {QUALITY_PROFILES.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label} ({q.mbPerHour} MB/hr)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Poster Upload */}
          <div className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-canvas)' }}>
            <div className="flex items-center gap-3">
              {posterDataUrl ? (
                <img
                  src={posterDataUrl}
                  alt="Poster preview"
                  className="h-12 w-9 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-9 items-center justify-center rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <ImageIcon className="h-4 w-4 opacity-60" />
                </div>
              )}
              <div>
                <p className="text-xs font-medium">Custom Poster Artwork (Optional)</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {posterDataUrl ? 'Poster selected' : 'Auto-styled cinema cover used if empty'}
                </p>
              </div>
            </div>
            <label className="cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap" style={{ borderColor: 'var(--border-strong)' }}>
              Choose Image
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handlePosterPick(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Synopsis */}
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Synopsis
            </label>
            <textarea
              rows={2}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Short description of your upload..."
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] rounded-lg border px-4 text-xs font-medium"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex min-h-[42px] items-center gap-1.5 rounded-lg px-5 text-xs font-semibold disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-fg)',
              }}
            >
              <Film className="h-4 w-4" />
              <span>{saving ? 'Saving to Library...' : 'Publish to Library'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
