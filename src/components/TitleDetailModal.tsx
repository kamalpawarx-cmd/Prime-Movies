import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  Bookmark,
  Check,
  Download,
  ExternalLink,
  Play,
  Share2,
  Star,
  X,
} from 'lucide-react';
import { QUALITY_PROFILES } from '../data/catalog';
import {
  DownloadItem,
  Episode,
  LinkedSite,
  MediaItem,
  QualityTierId,
  UserRating,
  WatchlistEntry,
  WatchlistStatus,
} from '../types/media';
import { PosterImage } from './PosterImage';

interface TitleDetailModalProps {
  item: MediaItem;
  watchlistEntry?: WatchlistEntry;
  downloads: DownloadItem[];
  userRating?: UserRating;
  defaultQuality: QualityTierId;
  linkedSites: LinkedSite[];
  onClose: () => void;
  onPlay: (item: MediaItem, episode?: Episode, offlineKey?: string) => void;
  onUpdateWatchlist: (item: MediaItem, status: WatchlistStatus | null) => void;
  onToggleEpisodeAlerts: (item: MediaItem) => void;
  onDownload: (item: MediaItem, qualityId: QualityTierId, episode?: Episode) => void;
  onSubmitRating: (item: MediaItem, stars: number, review: string) => void;
  onShare: (item: MediaItem) => void;
}

export const TitleDetailModal: React.FC<TitleDetailModalProps> = ({
  item,
  watchlistEntry,
  downloads,
  userRating,
  defaultQuality,
  linkedSites,
  onClose,
  onPlay,
  onUpdateWatchlist,
  onToggleEpisodeAlerts,
  onDownload,
  onSubmitRating,
  onShare,
}) => {
  const [downloadQuality, setDownloadQuality] = useState<QualityTierId>(defaultQuality);
  const [stars, setStars] = useState<number>(userRating?.stars ?? 0);
  const [review, setReview] = useState<string>(userRating?.review ?? '');
  const [savedReviewNotice, setSavedReviewNotice] = useState<boolean>(false);

  const selectedProfile =
    QUALITY_PROFILES.find((q) => q.id === downloadQuality) ?? QUALITY_PROFILES[1];
  const estMovieMb = Math.max(
    18,
    Math.round((item.durationMin / 60) * selectedProfile.mbPerHour)
  );

  const movieDownload = downloads.find((d) => d.id === item.id);
  const activeLinkedSites = linkedSites.filter((s) => s.linked);

  const handleSaveRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1) return;
    onSubmitRating(item, stars, review.trim());
    setSavedReviewNotice(true);
    setTimeout(() => setSavedReviewNotice(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border sm:rounded-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: 'var(--border-strong)' }} />
        </div>

        {/* Header Backdrop */}
        <div className="relative h-52 w-full overflow-hidden sm:h-64">
          <PosterImage
            src={item.backdropUrl || item.posterUrl}
            alt={item.title}
            title={item.title}
            aspectClass="h-full w-full"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/80"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute right-6 bottom-5 left-6">
            <p className="text-xs font-medium text-white/75">
              {item.category === 'movie'
                ? 'Movie'
                : item.category === 'webseries'
                  ? 'Web Series'
                  : 'Anime'}{' '}
              · {item.directorOrStudio}
              {item.sourceProviderName ? ` · ${item.sourceProviderName}` : ''}
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
              {item.title}
            </h2>
            <p className="mt-1.5 text-xs text-white/80">
              {item.year} · {item.genres.join(' / ')} · {item.durationLabel} ·{' '}
              <span className="font-mono-tabular">{item.rating.toFixed(1)}/10</span> ·{' '}
              <span className="font-mono-tabular">AV1 ~{item.mbPerHourAv1} MB/hr</span>
            </p>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {/* Primary Actions Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const firstEp = item.episodes?.[0];
                const offlineKey =
                  movieDownload?.status === 'completed' ? movieDownload.id : undefined;
                onPlay(item, firstEp, offlineKey);
              }}
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-opacity hover:opacity-95 whitespace-nowrap shrink-0"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-fg)',
              }}
            >
              <Play className="h-4 w-4 fill-current" />
              <span>
                {movieDownload?.status === 'completed'
                  ? 'Play Offline'
                  : watchlistEntry && watchlistEntry.progressSec > 10
                    ? 'Resume Watching'
                    : item.episodes
                      ? 'Play Episode 1'
                      : 'Watch Now'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdateWatchlist(item, watchlistEntry ? null : 'plan')
              }
              className="flex min-h-[44px] items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              style={{
                borderColor: 'var(--border-strong)',
                backgroundColor: watchlistEntry ? 'var(--accent-soft)' : 'transparent',
                color: 'var(--text-primary)',
              }}
            >
              {watchlistEntry ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              <span>{watchlistEntry ? 'In Watchlist' : 'Add to Watchlist'}</span>
            </button>

            {item.episodes && item.episodes.length > 0 && (
              <button
                type="button"
                onClick={() => onToggleEpisodeAlerts(item)}
                className="flex min-h-[44px] items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
                style={{
                  borderColor: 'var(--border-strong)',
                  backgroundColor: watchlistEntry?.notifyNewEpisodes
                    ? 'var(--accent-soft)'
                    : 'transparent',
                  color: 'var(--text-primary)',
                }}
              >
                {watchlistEntry?.notifyNewEpisodes ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
                <span>
                  {watchlistEntry?.notifyNewEpisodes ? 'Episode Alerts On' : 'Notify New Episodes'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onShare(item)}
              className="flex min-h-[44px] items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              style={{
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Watchlist Status Segmented Bar (when in watchlist) */}
          {watchlistEntry && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-y py-3" style={{ borderColor: 'var(--border-hairline)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Watchlist shelf
              </span>
              <div
                className="inline-flex rounded-lg p-1"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              >
                {(
                  [
                    ['plan', 'Plan to Watch'],
                    ['watching', 'Watching'],
                    ['completed', 'Completed'],
                  ] as const
                ).map(([st, label]) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onUpdateWatchlist(item, st)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap"
                    style={{
                      backgroundColor:
                        watchlistEntry.status === st ? 'var(--accent)' : 'transparent',
                      color:
                        watchlistEntry.status === st
                          ? 'var(--accent-fg)'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Synopsis & Audio/Subtitles Metadata */}
          <div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {item.synopsis}
            </p>
            <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              Audio: {item.audioLanguages.join(', ')} · Subtitles: {item.subtitles.join(', ')}
            </p>
          </div>

          {/* Low-Data Offline Download Box */}
          <div
            className="rounded-xl border p-4"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-display text-sm font-semibold">Offline Download</h3>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Watch without mobile data inside KinoLite. Estimated size:{' '}
                  <span className="font-mono-tabular font-medium" style={{ color: 'var(--text-primary)' }}>
                    ~{estMovieMb} MB
                  </span>{' '}
                  ({selectedProfile.codec})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={downloadQuality}
                  onChange={(e) => setDownloadQuality(e.target.value as QualityTierId)}
                  aria-label="Download quality"
                  className="min-h-[40px] rounded-lg border px-3 text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
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
                {!item.episodes && (
                  <button
                    type="button"
                    onClick={() => onDownload(item, downloadQuality)}
                    className="flex min-h-[40px] items-center gap-1.5 rounded-lg px-4 text-xs font-semibold whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-fg)',
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>
                      {movieDownload?.status === 'completed'
                        ? 'Saved Offline'
                        : movieDownload?.status === 'downloading'
                          ? `Downloading ${movieDownload.progress}%`
                          : 'Download Movie'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Episodes Section (Web Series & Anime) */}
          {item.episodes && item.episodes.length > 0 && (
            <div>
              <h3 className="font-display mb-3 text-base font-semibold">
                Episodes ({item.episodes.length})
              </h3>
              <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                {item.episodes.map((ep) => {
                  const dlKey = `${item.id}:${ep.id}`;
                  const epDownload = downloads.find((d) => d.id === dlKey);
                  const epEstMb = Math.max(
                    12,
                    Math.round((ep.durationMin / 60) * selectedProfile.mbPerHour)
                  );
                  return (
                    <div
                      key={ep.id}
                      className="flex items-start justify-between gap-3 py-3.5"
                      style={{ borderColor: 'var(--border-hairline)' }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onPlay(
                            item,
                            ep,
                            epDownload?.status === 'completed' ? epDownload.id : undefined
                          )
                        }
                        className="group min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className="font-mono-tabular text-xs" style={{ color: 'var(--accent)' }}>
                            E{ep.number.toString().padStart(2, '0')}
                          </span>
                          <span className="truncate group-hover:underline">{ep.title}</span>
                          {ep.isNew && (
                            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                              · New
                            </span>
                          )}
                        </div>
                        <p
                          className="mt-1 line-clamp-2 text-xs leading-relaxed"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {ep.synopsis}
                        </p>
                        <p className="font-mono-tabular mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {ep.durationMin} min · {ep.releaseDate} · ~{epEstMb} MB ({selectedProfile.resolution})
                        </p>
                      </button>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onPlay(
                              item,
                              ep,
                              epDownload?.status === 'completed' ? epDownload.id : undefined
                            )
                          }
                          className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border transition-colors"
                          style={{ borderColor: 'var(--border-strong)' }}
                          aria-label={`Play episode ${ep.number}`}
                        >
                          <Play className="h-4 w-4 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownload(item, downloadQuality, ep)}
                          className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border transition-colors"
                          style={{
                            borderColor: 'var(--border-strong)',
                            color:
                              epDownload?.status === 'completed'
                                ? 'var(--accent)'
                                : 'var(--text-primary)',
                          }}
                          aria-label={`Download episode ${ep.number}`}
                        >
                          {epDownload?.status === 'completed' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Linked Streaming Sites Quick Launch (e.g. Movie Box) */}
          {activeLinkedSites.length > 0 && (
            <div className="border-t pt-4" style={{ borderColor: 'var(--border-hairline)' }}>
              <h3 className="font-display mb-2 text-sm font-semibold">Linked Streaming Sources</h3>
              <div className="flex flex-wrap gap-2">
                {activeLinkedSites.map((site) => (
                  <a
                    key={site.id}
                    href={`${site.baseUrl.replace(/\/$/, '')}/search?q=${encodeURIComponent(item.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors"
                    style={{
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>Open on {site.name}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Rate & Share to Friends Activity */}
          <form
            onSubmit={handleSaveRating}
            className="border-t pt-5"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold">Your Rating &amp; Friend Note</h3>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStars(value)}
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md transition-transform hover:scale-110"
                    aria-label={`Rate ${value} out of 5`}
                  >
                    <Star
                      className="h-5 w-5"
                      style={{
                        color: value <= stars ? 'var(--accent)' : 'var(--text-muted)',
                        fill: value <= stars ? 'var(--accent)' : 'transparent',
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={2}
              placeholder="Write a short note for friends to see on the activity feed..."
              className="mt-2.5 w-full rounded-lg border px-3.5 py-2.5 text-sm"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {savedReviewNotice
                  ? 'Rating published to your Friends Activity feed.'
                  : 'Visible to friends when Social Activity sharing is enabled.'}
              </span>
              <button
                type="submit"
                disabled={stars < 1}
                className="min-h-[40px] rounded-lg px-4 text-xs font-semibold transition-opacity disabled:opacity-40 whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-fg)',
                }}
              >
                Save Rating
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
