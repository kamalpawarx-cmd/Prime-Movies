import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { MediaCategory, MediaItem } from '../types/media';
import { PosterImage } from './PosterImage';

interface SearchOverlayProps {
  catalog: MediaItem[];
  recentSearches: string[];
  onSaveSearch: (term: string) => void;
  onClose: () => void;
  onOpenTitle: (item: MediaItem) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  catalog,
  recentSearches,
  onSaveSearch,
  onClose,
  onOpenTitle,
}) => {
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | MediaCategory | 'low-data' | 'uploads'>('all');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((item) => {
      if (catFilter === 'movie' && item.category !== 'movie') return false;
      if (catFilter === 'webseries' && item.category !== 'webseries') return false;
      if (catFilter === 'anime' && item.category !== 'anime') return false;
      if (catFilter === 'low-data' && item.mbPerHourAv1 > 170) return false;
      if (catFilter === 'uploads' && !item.isUserUpload) return false;

      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.genres.some((g) => g.toLowerCase().includes(q)) ||
        item.directorOrStudio.toLowerCase().includes(q) ||
        item.synopsis.toLowerCase().includes(q) ||
        item.audioLanguages.some((l) => l.toLowerCase().includes(q)) ||
        (item.sourceProviderName || '').toLowerCase().includes(q)
      );
    });
  }, [catalog, query, catFilter]);

  const handleSelectItem = (item: MediaItem) => {
    if (query.trim()) onSaveSearch(query.trim());
    onOpenTitle(item);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 pt-12 backdrop-blur-sm sm:pt-20"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search library"
    >
      <div
        className="flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Row */}
        <div className="flex items-center gap-3 border-b px-4 py-3.5" style={{ borderColor: 'var(--border-hairline)' }}>
          <Search className="h-5 w-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, web series, anime, genres, languages, or add-ons..."
            className="flex-1 bg-transparent text-sm outline-none sm:text-base"
            style={{ color: 'var(--text-primary)' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded-md px-2 py-1 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border"
            style={{ borderColor: 'var(--border-strong)' }}
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-2.5" style={{ borderColor: 'var(--border-hairline)' }}>
          {(
            [
              ['all', 'All'],
              ['movie', 'Movies'],
              ['webseries', 'Web Series'],
              ['anime', 'Anime'],
              ['low-data', 'Ultra Low Data (<=170 MB/hr)'],
              ['uploads', 'My Uploads'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCatFilter(id)}
              className="min-h-[34px] rounded-lg px-3 text-xs font-medium transition-colors whitespace-nowrap"
              style={{
                backgroundColor: catFilter === id ? 'var(--accent)' : 'var(--bg-elevated)',
                color: catFilter === id ? 'var(--accent-fg)' : 'var(--text-secondary)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5 text-xs" style={{ borderColor: 'var(--border-hairline)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Recent:</span>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="underline-offset-2 hover:underline"
                style={{ color: 'var(--text-secondary)' }}
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {results.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              No titles matched &ldquo;{query}&rdquo;. Try another title, genre, or enable more sources in Add-ons.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className="flex w-full items-center gap-3.5 py-3 text-left transition-opacity hover:opacity-85"
                >
                  <div className="w-12 shrink-0 overflow-hidden rounded-md">
                    <PosterImage src={item.posterUrl} alt={item.title} title={item.title} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {item.category === 'webseries' ? 'Web Series' : item.category === 'anime' ? 'Anime' : 'Movie'} ·{' '}
                      {item.year} · {item.genres.join(' / ')} ·{' '}
                      <span className="font-mono-tabular">{item.rating.toFixed(1)}/10</span>
                    </p>
                    <p className="font-mono-tabular mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      AV1 ~{item.mbPerHourAv1} MB/hr · {item.sourceProviderName || 'KinoLite Direct'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
