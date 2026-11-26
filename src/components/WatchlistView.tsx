import React, { useMemo, useState } from 'react';
import { Bookmark, Play, Trash2 } from 'lucide-react';
import { MediaItem, WatchlistEntry, WatchlistStatus } from '../types/media';
import { PosterImage } from './PosterImage';

interface WatchlistViewProps {
  entries: WatchlistEntry[];
  catalog: MediaItem[];
  recommendations: MediaItem[];
  onOpenTitle: (item: MediaItem) => void;
  onPlayTitle: (item: MediaItem) => void;
  onUpdateStatus: (item: MediaItem, status: WatchlistStatus | null) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  entries,
  catalog,
  recommendations,
  onOpenTitle,
  onPlayTitle,
  onUpdateStatus,
}) => {
  const [shelfFilter, setShelfFilter] = useState<'all' | WatchlistStatus>('all');

  const resolvedEntries = useMemo(() => {
    return entries
      .map((entry) => ({
        entry,
        item: catalog.find((c) => c.id === entry.mediaId),
      }))
      .filter((x): x is { entry: WatchlistEntry; item: MediaItem } => Boolean(x.item))
      .filter((x) => (shelfFilter === 'all' ? true : x.entry.status === shelfFilter));
  }, [entries, catalog, shelfFilter]);

  return (
    <section className="space-y-8 pb-8">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end" style={{ borderColor: 'var(--border-hairline)' }}>
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Personal Queue &amp; Continue Watching
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            My Watchlist
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Track movies, web series, and anime across Plan to Watch, Watching, and Completed shelves.
          </p>
        </div>

        <div className="inline-flex self-start rounded-lg p-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          {(
            [
              ['all', `All (${entries.length})`],
              ['watching', 'Watching'],
              ['plan', 'Plan to Watch'],
              ['completed', 'Completed'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setShelfFilter(id)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap"
              style={{
                backgroundColor: shelfFilter === id ? 'var(--accent)' : 'transparent',
                color: shelfFilter === id ? 'var(--accent-fg)' : 'var(--text-secondary)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {resolvedEntries.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border px-6 py-14 text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <Bookmark className="mb-3 h-7 w-7 opacity-45" />
          <p className="font-display text-base font-semibold">Your shelf is empty</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Tap Watchlist on any movie, web series, or anime to save it here and unlock personalized recommendations.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resolvedEntries.map(({ entry, item }) => {
            const pct =
              entry.durationSec > 0
                ? Math.min(100, Math.round((entry.progressSec / entry.durationSec) * 100))
                : 0;
            return (
              <div
                key={item.id}
                className="flex gap-3.5 rounded-xl border p-3.5"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <button
                  type="button"
                  onClick={() => onOpenTitle(item)}
                  className="w-20 shrink-0 overflow-hidden rounded-lg"
                >
                  <PosterImage src={item.posterUrl} alt={item.title} title={item.title} />
                </button>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => onOpenTitle(item)}
                      className="font-display line-clamp-1 text-left text-sm font-semibold hover:underline"
                    >
                      {item.title}
                    </button>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {item.category === 'webseries' ? 'Web Series' : item.category === 'anime' ? 'Anime' : 'Movie'} ·{' '}
                      {item.year} · {entry.status === 'plan' ? 'Plan to Watch' : entry.status === 'watching' ? 'Watching' : 'Completed'}
                    </p>

                    {pct > 0 && (
                      <div className="mt-2">
                        <div
                          className="h-1.5 w-full overflow-hidden rounded-full"
                          style={{ backgroundColor: 'var(--bg-elevated)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: 'var(--accent)' }}
                          />
                        </div>
                        <p className="font-mono-tabular mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {pct}% watched
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPlayTitle(item)}
                      className="flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{pct > 0 ? 'Resume' : 'Watch'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(item, null)}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border"
                      style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
                      aria-label={`Remove ${item.title} from watchlist`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tailored Picks based on Watchlist */}
      {recommendations.length > 0 && (
        <div className="space-y-4 border-t pt-6" style={{ borderColor: 'var(--border-hairline)' }}>
          <div>
            <h2 className="font-display text-lg font-semibold">Picked From Your Watchlist</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Matched to your saved genres with low-data AV1 availability.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {recommendations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenTitle(item)}
                className="group overflow-hidden rounded-xl border text-left"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <PosterImage
                  src={item.posterUrl}
                  alt={item.title}
                  title={item.title}
                  className="group-hover:scale-[1.03]"
                />
                <div className="p-3">
                  <p className="font-display line-clamp-1 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.genres[0]} · <span className="font-mono-tabular">{item.mbPerHourAv1} MB/hr</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
